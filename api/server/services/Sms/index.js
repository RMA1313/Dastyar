const { logger } = require('@librechat/data-schemas');
const { sendVerifyLookup } = require('./kavenegar');

const sendOtpSms = async ({ phone, code }) => {
  try {
    return await sendVerifyLookup({ receptor: phone, token: code });
  } catch (error) {
    logger.error('[SmsService] OTP dispatch failed', error);
    throw error;
  }
};

module.exports = {
  sendOtpSms,
};
