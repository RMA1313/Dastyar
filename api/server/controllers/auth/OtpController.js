const bcrypt = require('bcryptjs');
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const { setAuthTokens } = require('~/server/services/AuthService');
const { findUser, updateUser, createUser, countUsers } = require('~/models');
const { getAppConfig } = require('~/server/services/Config');
const { generate2FATempToken } = require('~/server/services/twoFactorService');
const { sendOtpSms } = require('~/server/services/Sms');
const {
  validateReferralCode,
  recordReferralUsage,
  ensureReferralCodesSeeded,
  normalizeCode,
} = require('~/server/services/ReferralCodeService');
const OtpRequest = require('~/server/models/OtpRequest');

const OTP_TTL_MS = 2 * 60 * 1000;

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');
const isValidPhone = (phone) => /^\d{11}$/.test(phone);
const generateOtp = () => Math.floor(10000 + Math.random() * 90000).toString();
const generateReferralCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

const buildOtpResponse = (message = 'OTP sent') => ({
  message,
  expiresInMs: OTP_TTL_MS,
});

const upsertOtpRequest = async ({ phone, purpose, referralCode }) => {
  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const update = {
    codeHash: otpHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    consumed: false,
    attempts: 0,
    lastSentAt: new Date(),
  };

  if (referralCode) {
    update.referralCode = normalizeCode(referralCode);
  }

  const record = await OtpRequest.findOneAndUpdate(
    { phone, purpose },
    { $set: update, $inc: { resendCount: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { otp, record };
};

const requestOtpController = async (req, res) => {
  const flow = req.body?.flow === 'register' ? 'register' : 'login';

  try {
    const normalizedPhone = normalizePhone(req.body?.phone);
    const referralCode = req.body?.referralCode ? normalizeCode(req.body.referralCode) : null;

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'شماره موبایل باید ۱۱ رقمی و درست باشد.' });
    }

    if (flow === 'register') {
      if (!referralCode) {
        return res.status(400).json({ message: 'Referral code is required' });
      }
      await ensureReferralCodesSeeded();
      const referral = await validateReferralCode(referralCode);
      if (!referral) {
        return res.status(400).json({ message: 'Referral code is invalid or inactive' });
      }

      const alreadyRegistered = await findUser({ phone: normalizedPhone }, '_id');
      if (alreadyRegistered) {
        return res.status(409).json({
          message: 'This mobile number is already registered. Please log in instead.',
        });
      }
    } else {
      const user = await findUser({ phone: normalizedPhone }, '+twoFactorEnabled');
      if (!user) {
        return res
          .status(404)
          .json({ message: 'Account not found. Please register first.', redirect: 'register' });
      }
    }

    const { otp, record } = await upsertOtpRequest({
      phone: normalizedPhone,
      purpose: flow,
      referralCode,
    });

    try {
      await sendOtpSms({ phone: normalizedPhone, code: otp });
    } catch (error) {
      logger.error('[requestOtpController] SMS provider failed', error);
      return res
        .status(503)
        .json({ message: 'Unable to send verification code. Try again shortly.' });
    }

    logger.info(
      `[requestOtpController] OTP dispatched for ${normalizedPhone} (${flow}) [resendCount=${record?.resendCount}]`,
    );
    return res.status(200).json(buildOtpResponse());
  } catch (err) {
    logger.error('[requestOtpController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const verifyOtpController = async (req, res) => {
  const flow = req.body?.flow === 'register' ? 'register' : 'login';

  try {
    const normalizedPhone = normalizePhone(req.body?.phone);
    const otp = req.body?.otp;

    if (!normalizedPhone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'شماره موبایل باید ۱۱ رقمی باشد.' });
    }

    if (!/^\d{5}$/.test(String(otp))) {
      return res.status(400).json({ message: 'کد فعال‌سازی معتبر نیست.' });
    }

    const otpRequest = await OtpRequest.findOne({
      phone: normalizedPhone,
      purpose: flow,
    })
      .select('+codeHash')
      .lean();

    if (!otpRequest) {
      return res.status(404).json({ message: 'No OTP request found. Please request a code.' });
    }

    if (otpRequest.consumed) {
      return res.status(400).json({ message: 'OTP already used. Request a new code.' });
    }

    if (!otpRequest.expiresAt || new Date(otpRequest.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    const isValidOtp = await bcrypt.compare(String(otp), otpRequest.codeHash);
    if (!isValidOtp) {
      await OtpRequest.updateOne(
        { phone: normalizedPhone, purpose: flow },
        { $inc: { attempts: 1 } },
      );
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    await OtpRequest.deleteMany({ phone: normalizedPhone, purpose: flow });

    const appConfig = await getAppConfig();

    if (flow === 'login') {
      const user = await findUser({ phone: normalizedPhone }, '+twoFactorEnabled');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = {
        phone: normalizedPhone,
        phoneVerified: true,
      };

      const updatedUser = (await updateUser(user._id.toString(), updates)) || user;
      if (updatedUser.twoFactorEnabled) {
        const tempToken = generate2FATempToken(updatedUser._id);
        return res.status(200).json({ twoFAPending: true, tempToken });
      }
      const { password: _p, totpSecret: _t, __v, otp: _o, ...safeUser } = updatedUser;
      safeUser.id = updatedUser._id.toString();
      const token = await setAuthTokens(updatedUser._id, res);

      return res.status(200).send({ token, user: safeUser });
    }

    // Registration flow
    const referralRecord = otpRequest.referralCode
      ? await validateReferralCode(otpRequest.referralCode)
      : null;
    if (!referralRecord) {
      return res.status(400).json({ message: 'Referral code is invalid or inactive' });
    }

    const isFirstUser = (await countUsers()) === 0;
    const newUser =
      (await createUser(
        {
          phone: normalizedPhone,
          username: normalizedPhone,
          provider: 'phone',
          role: isFirstUser ? SystemRoles.ADMIN : SystemRoles.USER,
          phoneVerified: true,
          referralCodeUsed: referralRecord.code,
        },
        appConfig?.balance,
        true,
        true,
      )) || undefined;

    const userId =
      (newUser?._id && newUser._id.toString()) ||
      (newUser?.id && newUser.id.toString()) ||
      newUser?.toString();

    if (!userId) {
      logger.error('[verifyOtpController] Failed to resolve user id after registration');
      return res.status(500).json({ message: 'Unable to finalize registration' });
    }

    await recordReferralUsage(referralRecord.code);

    const updatedUser =
      (await updateUser(userId, {
        phoneVerified: true,
        ...(newUser?.referralCode ? {} : { referralCode: generateReferralCode() }),
      })) || newUser;

    if (updatedUser.twoFactorEnabled) {
      const tempToken = generate2FATempToken(updatedUser._id);
      return res.status(200).json({ twoFAPending: true, tempToken });
    }

    const { password: _p, totpSecret: _t, __v, otp: _o, ...safeUser } = updatedUser;
    safeUser.id = updatedUser._id.toString();
    const token = await setAuthTokens(updatedUser._id, res);

    return res.status(200).send({ token, user: safeUser });
  } catch (err) {
    logger.error('[verifyOtpController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  requestOtpController,
  verifyOtpController,
};
