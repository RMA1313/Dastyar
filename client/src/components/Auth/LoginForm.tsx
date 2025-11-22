import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { ThemeContext, Spinner, Button, isDark } from '@librechat/client';
import type { TStartupConfig } from 'librechat-data-provider';
import type { TAuthContext, TResError } from '~/common';
import { useRequestOtpMutation } from '~/data-provider';
import { logOtpEvent, logUiError } from '~/utils/clientLog';

type LoginFormInputs = {
  phone: string;
};

type TLoginFormProps = {
  startupConfig: TStartupConfig;
  error?: Pick<TAuthContext, 'error'>['error'];
  setError: Pick<TAuthContext, 'setError'>['setError'];
};

const OTP_TTL_MS = 120000;
const normalizePhone = (value = '') => value.replace(/\D/g, '');

const LoginForm: React.FC<TLoginFormProps> = ({ startupConfig, error, setError }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    defaultValues: { phone: '' },
  });
  const phoneValue = watch('phone');

  const validTheme = isDark(theme) ? 'dark' : 'light';
  const requireCaptcha = Boolean(startupConfig.turnstile?.siteKey);

  useEffect(() => {
    if (error) {
      setTurnstileToken(null);
    }
  }, [error]);

  const requestOtp = useRequestOtpMutation({
    onSuccess: (data, variables) => {
      const expiresAt = Date.now() + (data?.expiresInMs ?? OTP_TTL_MS);
      logOtpEvent('otp-request-success', {
        flow: 'login',
        phone: normalizePhone(variables.phone),
        expiresAt,
      });
      navigate('/otp', {
        replace: false,
        state: {
          phone: normalizePhone(variables.phone),
          flow: 'login',
          expiresAt,
        },
      });
      setError(undefined);
    },
    onError: (err, variables) => {
      const resError = err as TResError;
      const message =
        resError?.response?.data?.message || resError?.message || 'ارسال کد تایید انجام نشد';
      logUiError('otp-request-error', {
        flow: 'login',
        status: resError?.response?.status,
        message,
      });
      if (
        resError?.response?.status === 404 &&
        (resError as { response?: { data?: { redirect?: string } } })?.response?.data?.redirect ===
          'register'
      ) {
        navigate('/register', {
          state: { phone: variables?.phone ? normalizePhone(variables.phone) : undefined },
          replace: true,
        });
        return;
      }
      setError(message);
    },
  });

  const renderError = (fieldName: keyof LoginFormInputs) => {
    const errorMessage = errors[fieldName]?.message;
    return errorMessage ? (
      <span role="alert" className="mt-1 block text-sm text-red-500 dark:text-red-300">
        {String(errorMessage)}
      </span>
    ) : null;
  };

  const onSubmit = (values: LoginFormInputs) => {
    const normalizedPhone = normalizePhone(values.phone);
    if (requireCaptcha && !turnstileToken) {
      logUiError('captcha-missing', { flow: 'login' });
      return setError('برای ادامه، تصویر امنیتی را تکمیل کنید.');
    }
    setError(undefined);
    logOtpEvent('otp-request-start', { flow: 'login', phone: normalizedPhone });
    requestOtp.mutate({ phone: normalizedPhone, flow: 'login' });
  };

  if (!startupConfig) {
    return null;
  }

  return (
    <form
      className="mt-6 space-y-7 animate-auth-card text-center"
      aria-label="فرم ورود"
      method="POST"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <label
          htmlFor="phone"
          className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-100"
        >
          شماره تلفن همراه
        </label>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-[0_20px_60px_-32px_rgba(0,40,190,0.45)] backdrop-blur transition-all duration-300 focus-within:-translate-y-[1px] focus-within:border-sky-400 focus-within:shadow-[0_25px_80px_-40px_rgba(0,140,196,0.65)] focus-within:ring-2 focus-within:ring-sky-300/60 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/25">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-sky-50/50 via-transparent to-indigo-50/50 opacity-70 dark:from-slate-800/50 dark:to-slate-900/40" />
          <input
            type="tel"
            id="phone"
            autoComplete="tel"
            dir="ltr"
            inputMode="tel"
            aria-label="شماره تلفن"
            {...register('phone', {
              required: 'وارد کردن شماره تلفن همراه الزامی است.',
              pattern: {
                value: /^\d{11}$/,
                message: 'شماره باید ۱۱ رقم و با ۰۹ شروع شود.',
              },
            })}
            aria-invalid={!!errors.phone}
            className="webkit-dark-styles relative block w-full rounded-2xl bg-transparent px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 transition-all duration-300 dark:text-white"
            style={{ textAlign: phoneValue ? 'left' : 'right' }}
            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
          />
        </div>
        {renderError('phone')}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
          لطفا شماره موبایل خود را دقیق و بدون فاصله وارد کنید تا کد تایید برای شما ارسال شود. اطلاعات
          شما محرمانه باقی می‌ماند.
        </p>
      </div>

      {requireCaptcha && (
        <div className="flex w-full justify-center rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70">
          <Turnstile
            siteKey={startupConfig.turnstile!.siteKey}
            options={{
              ...startupConfig.turnstile!.options,
              theme: validTheme,
            }}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        </div>
      )}

      <Button
        aria-label="دریافت کد تایید"
        data-testid="login-button"
        type="submit"
        disabled={(requireCaptcha && !turnstileToken) || requestOtp.isLoading || isSubmitting}
        variant="submit"
        className="h-12 w-full rounded-2xl bg-gradient-to-l from-sky-500 via-indigo-600 to-sky-400 text-white shadow-lg shadow-sky-200/50 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-2xl hover:shadow-sky-200/70 active:scale-[0.99] disabled:opacity-70"
      >
        {requestOtp.isLoading || isSubmitting ? <Spinner /> : 'دریافت کد تایید'}
      </Button>
    </form>
  );
};

export default LoginForm;
