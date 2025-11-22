import { useForm } from 'react-hook-form';
import { useState, ReactNode } from 'react';
import { Spinner, Button } from '@librechat/client';
import { useOutletContext } from 'react-router-dom';
import { useRequestPasswordResetMutation } from 'librechat-data-provider/react-query';
import type { TRequestPasswordReset, TRequestPasswordResetResponse } from 'librechat-data-provider';
import type { TLoginLayoutContext } from '~/common';
import type { FC } from 'react';

const BodyTextWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div
      className="relative mt-6 rounded-xl border border-green-500/20 bg-green-50/50 px-6 py-4 text-center text-green-700 shadow-sm transition-all dark:bg-green-950/30 dark:text-green-100"
      role="alert"
    >
      {children}
    </div>
  );
};

const ResetPasswordBodyText = () => {
  return (
    <div className="flex flex-col space-y-4">
      <p>اگر ایمیل ثبت شده‌ای وجود داشته باشد، لینک بازیابی برای شما ارسال می‌شود.</p>
      <a
        className="inline-flex text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        href="/login"
      >
        بازگشت به ورود
      </a>
    </div>
  );
};

function RequestPasswordReset() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TRequestPasswordReset>();
  const [bodyText, setBodyText] = useState<ReactNode | undefined>(undefined);
  const { startupConfig, setHeaderText } = useOutletContext<TLoginLayoutContext>();

  const requestPasswordReset = useRequestPasswordResetMutation();
  const { isLoading } = requestPasswordReset;

  const onSubmit = (data: TRequestPasswordReset) => {
    requestPasswordReset.mutate(data, {
      onSuccess: (data: TRequestPasswordResetResponse) => {
        if (data.link && !startupConfig?.emailEnabled) {
          setHeaderText('بازنشانی گذرواژه');
          setBodyText(
            <span>
              برای ادامه{' '}
              <a className="text-green-500 hover:underline" href={data.link}>
                اینجا
              </a>{' '}
              را لمس کنید.
            </span>,
          );
        } else {
          setHeaderText('لینک بازنشانی ارسال شد');
          setBodyText(<ResetPasswordBodyText />);
        }
      },
      onError: () => {
        setHeaderText('لینک بازنشانی ارسال شد');
        setBodyText(<ResetPasswordBodyText />);
      },
    });
  };

  if (bodyText) {
    return <BodyTextWrapper>{bodyText}</BodyTextWrapper>;
  }

  return (
    <form
      className="mt-8 space-y-6"
      aria-label="فرم بازیابی گذرواژه"
      method="POST"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2 text-center">
        <div className="relative">
          <input
            type="email"
            id="email"
            autoComplete="off"
            aria-label="ایمیل"
            {...register('email', {
              required: 'ایمیل الزامی است.',
              minLength: {
                value: 3,
                message: 'حداقل ۳ کاراکتر وارد کنید.',
              },
              maxLength: {
                value: 120,
                message: 'حداکثر ۱۲۰ کاراکتر مجاز است.',
              },
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'فرمت ایمیل صحیح نیست.',
              },
            })}
            aria-invalid={!!errors.email}
            className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
            placeholder=" "
          />
          <label
            htmlFor="email"
            className="absolute -top-2 left-2 z-10 bg-white px-2 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:text-green-600 dark:bg-gray-900 dark:text-gray-400 dark:peer-focus:text-green-500"
          >
            آدرس ایمیل
          </label>
        </div>
        {errors.email && (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-4">
        <Button
          aria-label="ادامه بازیابی گذرواژه"
          type="submit"
          disabled={!!errors.email || isLoading}
          variant="submit"
          className="h-12 w-full rounded-2xl"
        >
          {isLoading ? <Spinner /> : 'ادامه'}
        </Button>
        <a
          href="/login"
          className="block text-center text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          بازگشت به ورود
        </a>
      </div>
    </form>
  );
}

export default RequestPasswordReset;
