import { useEffect } from 'react';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import { Banner } from '../Banners';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import { logUiError } from '~/utils/clientLog';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  useEffect(() => {
    if (hasStartupConfigError) {
      logUiError('startup-config-error', { details: startupConfigError });
    }
    if (error) {
      logUiError('auth-error', { error });
    }
  }, [error, hasStartupConfigError, startupConfigError]);

  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_invalid_reset_token')}</ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 font-[300] dark:bg-slate-950 dark:text-slate-100"
      style={{ fontFamily: 'Vazir, system-ui, -apple-system, sans-serif' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-ambient-layer absolute inset-0" aria-hidden="true" />
        <div className="auth-grid-overlay absolute inset-0 opacity-80 dark:opacity-70" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/80 to-slate-50/90 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-950" aria-hidden="true" />
      </div>
      <Banner />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pb-4 text-center">
        <div className="flex items-center gap-3">
          <BlinkAnimation active={isFetching}>
            <img
              src="/assets/logo3.gif"
              className="h-14 w-14 object-contain logo-float animate-float-y"
              alt="U,U^U_U^"
              loading="lazy"
            />
          </BlinkAnimation>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center px-4 pb-12 text-center">
        <div className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-[2px] hover:shadow-2xl hover:shadow-sky-200/50 dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/30 animate-auth-card input-focus-gleam">
          {!hasStartupConfigError && !isFetching && (
            <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white text-center" style={{ userSelect: 'none' }}>
              {header}
            </h1>
          )}
          <DisplayError />
          <div className="mt-2">{children}</div>
          {!pathname.includes('2fa') && pathname.includes('login') && (
            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-white/10">
              <SocialLoginRender startupConfig={startupConfig} />
            </div>
          )}
        </div>
        <div className="mt-6 w-full max-w-xl">
          <Footer startupConfig={startupConfig} />
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
