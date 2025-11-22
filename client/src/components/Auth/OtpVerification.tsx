import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TLoginUser } from 'librechat-data-provider';
import { Button, Spinner } from '@librechat/client';
import { useRequestOtpMutation } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import { logOtpEvent, logUiError } from '~/utils/clientLog';

type OtpLocationState = {
  phone?: string;
  flow?: 'login' | 'register';
  referralCode?: string;
  expiresAt?: number;
};

const OTP_TTL_MS = 120000;
const OTP_LENGTH = 5;

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');
const toPersianDigits = (value: string | number) =>
  value
    .toString()
    .replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    .replace(/-/g, '−');

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return toPersianDigits(`${minutes}:${seconds}`);
};

const OtpVerification = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login, error, setError } = useAuthContext();
  const { phone, flow = 'login', referralCode, expiresAt } = (state || {}) as OtpLocationState;

  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, (expiresAt ?? Date.now() + OTP_TTL_MS) - Date.now()),
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    logOtpEvent('otp-screen-open', { flow, phone });
  }, [flow, phone]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error) {
      logUiError('otp-inline-error', { message: error });
    }
  }, [error]);

  const requestOtp = useRequestOtpMutation({
    onSuccess: (data) => {
      const nextExpiry = Date.now() + (data?.expiresInMs ?? OTP_TTL_MS);
      setTimeLeft(nextExpiry - Date.now());
      setOtpValues(Array(OTP_LENGTH).fill(''));
      setStatusMessage(data?.message || 'کد جدید ارسال شد.');
      setError(undefined);
      logOtpEvent('otp-resend-success', { phone, flow, expiresAt: nextExpiry });
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'ارسال دوباره کد ممکن نشد.';
      setError(message);
      logUiError('otp-resend-error', { phone, flow, message });
    },
  });

  const handleResend = () => {
    if (!phone) {
      return navigate('/login', { replace: true });
    }
    setStatusMessage(null);
    logOtpEvent('otp-resend-start', { phone, flow });
    requestOtp.mutate({ phone, flow, referralCode });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phone) {
      navigate('/login', { replace: true });
      return;
    }
    setStatusMessage(null);
    setError(undefined);
    const payload: TLoginUser = {
      phone: normalizePhone(phone),
      otp: otpValues.join(''),
      flow,
      referralCode,
    };
    logOtpEvent('otp-verify-submit', { phone: payload.phone, flow, referralCode });
    login(payload);
  };

  const otpDisabled = otpValues.join('').trim().length < OTP_LENGTH;
  const canResend = timeLeft <= 0 && !requestOtp.isLoading;

  const handleChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 1);
    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });
    if (sanitized && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      event.preventDefault();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    logOtpEvent('otp-paste', { phone, length: pasted.length });
    const filled = Array(OTP_LENGTH)
      .fill('')
      .map((_, idx) => pasted[idx] ?? '');
    setOtpValues(filled);
    const lastIndex = Math.min(pasted.length - 1, OTP_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  return (
    <div className="mt-4 space-y-6 animate-auth-card text-center">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900/80">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">کد تایید را وارد کنید</p>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
            {phone
              ? `کد پنج رقمی به شماره ${toPersianDigits(phone)} ارسال شد.`
              : 'برای ادامه، ابتدا شماره تلفن خود را ثبت کنید.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10">
          <span>زمان باقیمانده</span>
          <span className="font-bold">{formatCountdown(timeLeft)}</span>
        </div>
      </div>

      {error && <ErrorMessage>{error || ''}</ErrorMessage>}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-100">
          <span className="text-lg">✓</span>
          <span>{statusMessage}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900/80">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">کد پنج رقمی را وارد کنید</p>
          <div dir="ltr" className="grid w-full grid-cols-5 gap-3 sm:gap-4">
            {otpValues.map((value, index) => (
              <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={1}
                value={value}
                aria-label={`رقم ${toPersianDigits(index + 1)}`}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`aspect-square w-full rounded-2xl border-2 border-slate-200 bg-white/90 text-center text-xl font-bold tracking-[0.35em] text-slate-900 shadow-sm transition-all duration-200 focus:-translate-y-[1px] focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-500/30 ${value ? 'scale-105 ring-1 ring-sky-200/80 dark:ring-sky-400/30' : ''}`}
                style={{ textAlign: value ? 'left' : 'right' }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            aria-label="تایید و ورود"
            type="submit"
            disabled={otpDisabled}
            variant="submit"
            className="h-12 w-full rounded-2xl bg-gradient-to-l from-sky-500 via-indigo-600 to-sky-400 text-white shadow-lg transition duration-300 hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-60"
          >
            تایید و ورود
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canResend}
            onClick={handleResend}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white/80 text-slate-800 ring-1 ring-transparent transition duration-300 hover:-translate-y-[1px] hover:ring-slate-300 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:ring-white/20"
          >
            {requestOtp.isLoading ? <Spinner /> : 'ارسال دوباره کد'}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        اگر کد را دریافت نکرده‌اید، ارتباط شبکه خود را بررسی کنید. می‌توانید پس از پایان شمارش،
        دوباره درخواست کد دهید.
      </p>
    </div>
  );
};

export default OtpVerification;
