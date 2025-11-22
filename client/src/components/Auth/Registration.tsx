import { useForm } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Spinner } from '@librechat/client';
import type { TResError, TLoginLayoutContext } from '~/common';
import { useRequestOtpMutation } from '~/data-provider';
import { ErrorMessage } from './ErrorMessage';
import { logOtpEvent, logReferralEvent, logUiError } from '~/utils/clientLog';

type TRegisterForm = {
  phone: string;
  referralCode: string;
};

const OTP_TTL_MS = 120000;
const normalizePhone = (value = '') => value.replace(/\D/g, '');
const REFERRAL_LOCK_KEY = 'dastyar-referral-lock';

type ReferralStatus = 'invalid' | 'expired' | 'used' | 'other-user' | 'valid';

const referralStatusCopy: Record<
  ReferralStatus,
  { title: string; description: string; tone: string }
> = {
  invalid: {
    title: 'کد معرف معتبر نیست',
    description: 'کد وارد شده یافت نشد. لطفا املای کد را بررسی کرده و دوباره تلاش کنید.',
    tone: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700/40 dark:bg-red-950/30 dark:text-red-100',
  },
  expired: {
    title: 'مهلت استفاده از کد به پایان رسیده است',
    description: 'این کد دیگر فعال نیست. لطفا کد جدیدی دریافت کنید یا بدون کد ادامه دهید.',
    tone: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-600/40 dark:bg-amber-900/30 dark:text-amber-100',
  },
  used: {
    title: 'کد قبلا مصرف شده است',
    description: 'کد معرف فقط یک بار قابل استفاده است. از کد دیگری استفاده کنید.',
    tone: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-950/30 dark:text-blue-100',
  },
  'other-user': {
    title: 'این کد برای شماره دیگری قفل شده است',
    description: 'برای حفظ امنیت، هر کد به یک شماره متصل می‌شود. لطفا با شماره درست ادامه دهید.',
    tone: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700/50 dark:bg-red-950/40 dark:text-red-100',
  },
  valid: {
    title: 'کد معرف تایید شد',
    description: 'هدیه عضویت شما فعال شد. ادامه دهید.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-100',
  },
};

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startupConfig, startupConfigError, isFetching, setError, error } =
    useOutletContext<TLoginLayoutContext>();
  const {
    register,
    handleSubmit,
    setError: setFormError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TRegisterForm>({ mode: 'onChange', defaultValues: { phone: '', referralCode: '' } });
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null);
  const watchPhone = watch('phone');
  const watchReferral = watch('referralCode');

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    const state = (location.state || {}) as { phone?: string };
    if (state?.phone) {
      setValue('phone', state.phone);
    }
  }, [location.state, setValue]);

  const readReferralLock = () => {
    try {
      const raw = localStorage.getItem(REFERRAL_LOCK_KEY);
      return raw ? (JSON.parse(raw) as { code: string; phone: string; lockedAt: number }) : null;
    } catch {
      return null;
    }
  };

  const persistReferralLock = (code: string, phone: string) => {
    const payload = { code, phone, lockedAt: Date.now() };
    localStorage.setItem(REFERRAL_LOCK_KEY, JSON.stringify(payload));
    logReferralEvent('referral-lock-set', payload);
  };

  const deriveReferralStatus = (message?: string): ReferralStatus | null => {
    if (!message) return null;
    const lower = message.toLowerCase();
    if (lower.includes('expire')) return 'expired';
    if (lower.includes('invalid')) return 'invalid';
    if (lower.includes('used')) return 'used';
    if (lower.includes('another') || lower.includes('belong')) return 'other-user';
    return null;
  };

  useEffect(() => {
    if (!watchReferral) {
      setReferralStatus(null);
      return;
    }

    const normalizedCode = watchReferral.trim().toUpperCase();
    const normalizedPhone = normalizePhone(watchPhone);
    const lock = readReferralLock();

    if (lock && lock.code === normalizedCode && lock.phone !== normalizedPhone) {
      setReferralStatus('other-user');
      setFormError('referralCode', { message: 'این کد برای شماره دیگری ثبت شده است.' });
      logReferralEvent('referral-blocked-local', {
        code: normalizedCode,
        phone: normalizedPhone,
        lockedTo: lock.phone,
      });
    } else if (lock && lock.code === normalizedCode && lock.phone === normalizedPhone) {
      setReferralStatus('valid');
    } else {
      setReferralStatus(null);
    }
  }, [watchPhone, watchReferral, setFormError]);

  const requestOtp = useRequestOtpMutation({
    onSuccess: (data, variables) => {
      const expiresAt = Date.now() + (data?.expiresInMs ?? OTP_TTL_MS);
      const normalizedCode = variables.referralCode?.trim().toUpperCase();
      const normalizedPhone = normalizePhone(variables.phone);
      if (normalizedCode) {
        persistReferralLock(normalizedCode, normalizedPhone);
        setReferralStatus('valid');
        logReferralEvent('referral-accepted', { code: normalizedCode, phone: normalizedPhone });
      }
      logOtpEvent('otp-request-success', {
        flow: 'register',
        phone: normalizedPhone,
        referralCode: normalizedCode,
        expiresAt,
      });
      navigate('/otp', {
        state: {
          phone: normalizedPhone,
          referralCode: normalizedCode,
          flow: 'register',
          expiresAt,
        },
      });
    },
    onError: (err, variables) => {
      const resError = err as TResError;
      const message =
        resError?.response?.data?.message || resError?.message || 'ارسال کد فعال‌سازی انجام نشد';
      const status = deriveReferralStatus(message);
      setError(message);
      if (status) {
        setReferralStatus(status);
      }
      logUiError('otp-request-error', {
        flow: 'register',
        phone: variables?.phone,
        referralCode: variables?.referralCode,
        status: resError?.response?.status,
        message,
      });
      logReferralEvent('referral-error', {
        status,
        phone: variables?.phone,
        referralCode: variables?.referralCode,
        message,
      });
      if (message.toLowerCase().includes('referral')) {
        setFormError('referralCode', { message });
      }
      if (message.toLowerCase().includes('mobile') || message.toLowerCase().includes('phone')) {
        setFormError('phone', { message });
      }
      if (variables?.phone) {
        navigate('/register', { replace: true });
      }
    },
  });

  const onSubmit = (values: TRegisterForm) => {
    const normalizedPhone = normalizePhone(values.phone);
    const normalizedReferral = values.referralCode.trim().toUpperCase();
    const lock = readReferralLock();

    if (normalizedReferral && lock && lock.code === normalizedReferral && lock.phone !== normalizedPhone) {
      setReferralStatus('other-user');
      setFormError('referralCode', { message: 'این کد برای شماره دیگری ثبت شده است.' });
      logReferralEvent('referral-blocked-local', {
        code: normalizedReferral,
        phone: normalizedPhone,
        lockedTo: lock.phone,
      });
      return;
    }

    setError(null as unknown as string);
    setReferralStatus(null);
    logReferralEvent('referral-submit', { phone: normalizedPhone, referralCode: normalizedReferral });
    logOtpEvent('otp-request-start', { flow: 'register', phone: normalizedPhone, referralCode: normalizedReferral });
    requestOtp.mutate({
      phone: normalizedPhone,
      referralCode: normalizedReferral,
      flow: 'register',
    });
  };

  if (!startupConfig || startupConfigError || isFetching) {
    return null;
  }

  const referralCopy = referralStatus ? referralStatusCopy[referralStatus] : null;

  return (
    <>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <form
        className="mt-6 space-y-6 animate-auth-card text-center"
        aria-label="فرم ثبت‌نام"
        method="POST"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-label="شماره تلفن همراه"
              dir="ltr"
              {...register('phone', {
                required: 'شماره تلفن همراه الزامی است.',
                pattern: {
                  value: /^\d{11}$/,
                  message: 'شماره باید ۱۱ رقم و با ۰۹ شروع شود.',
                },
              })}
              aria-invalid={!!errors.phone}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-[#008dc4]/30 bg-white/80 px-3.5 pb-2.5 pt-3 text-text-primary shadow-[0_15px_45px_-30px_rgba(0,40,190,0.45)] duration-200 focus:-translate-y-[1px] focus:border-[#0028be] focus:bg-white focus:shadow-lg focus:outline-none dark:bg-slate-900/70"
              style={{ textAlign: watchPhone ? 'left' : 'right' }}
              placeholder=" "
              data-testid="phone"
            />
            <label
              htmlFor="phone"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-[#0028be] dark:peer-focus:text-[#8ed5ff] rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              شماره تلفن همراه
            </label>
          </div>
          {errors.phone && (
            <span role="alert" className="mt-1 block text-sm text-red-500">
              {String(errors.phone.message) ?? ''}
            </span>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              id="referralCode"
              type="text"
              autoComplete="off"
              aria-label="کد معرف"
              {...register('referralCode', {
                required: 'کد معرف الزامی است.',
                pattern: {
                  value: /^[A-Z0-9]{3,20}$/,
                  message: 'کد معرف باید ۳ تا ۲۰ کاراکتر لاتین یا عددی باشد.',
                },
              })}
              aria-invalid={!!errors.referralCode}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-[#008dc4]/30 bg-white/80 px-3.5 pb-2.5 pt-3 uppercase text-text-primary shadow-[0_15px_45px_-30px_rgba(0,40,190,0.45)] duration-200 focus:-translate-y-[1px] focus:border-[#0028be] focus:bg-white focus:shadow-lg focus:outline-none dark:bg-slate-900/70"
              placeholder=" "
              data-testid="referralCode"
            />
            <label
              htmlFor="referralCode"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-[#0028be] dark:peer-focus:text-[#8ed5ff] rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              کد معرف
            </label>
          </div>
          {errors.referralCode && (
            <span role="alert" className="mt-1 block text-sm text-red-500">
              {String(errors.referralCode.message) ?? ''}
            </span>
          )}
          {referralCopy && (
            <div
              className={`mt-3 flex items-start gap-3 rounded-2xl border p-3 text-sm shadow-sm backdrop-blur ${referralCopy.tone} text-center`}
            >
              <span className="text-lg">!</span>
              <div className="space-y-1 text-center">
                <p className="text-sm font-semibold">{referralCopy.title}</p>
                <p className="text-xs leading-relaxed">{referralCopy.description}</p>
              </div>
            </div>
          )}
        </div>

        <Button
          disabled={Object.keys(errors).length > 0 || isSubmitting || requestOtp.isLoading}
          type="submit"
          aria-label="ارسال کد فعال‌سازی"
          variant="submit"
          className="h-12 w-full rounded-2xl bg-gradient-to-l from-[#008dc4] via-[#0028be] to-[#8ed5ff] text-white shadow-lg transition duration-300 hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-70"
        >
          {requestOtp.isLoading || isSubmitting ? <Spinner /> : 'دریافت کد فعال‌سازی'}
        </Button>
      </form>
      <p className="my-4 text-center text-sm font-light text-gray-700 dark:text-white">
        قبلا ثبت‌نام کرده‌اید؟{' '}
        <button
          type="button"
          aria-label="ورود"
          onClick={() => navigate('/login/phone')}
          className="inline-flex p-1 text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          ورود
        </button>
      </p>
    </>
  );
};

export default Registration;
