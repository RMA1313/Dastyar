import { useContext, useEffect, useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeContext, isDark } from '@librechat/client';
import { logThemeEvent } from '~/utils/clientLog';
import { safeStorage } from '~/utils/safeStorage';

const STORAGE_KEY = 'color-theme';

const ThemeToggle = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const dark = useMemo(() => isDark(theme), [theme]);

  useEffect(() => {
    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored && stored !== theme) {
      setTheme(stored);
    }
  }, [setTheme, theme]);

  const handleToggle = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    safeStorage.setItem(STORAGE_KEY, next);
    logThemeEvent('theme-toggled', { next });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-gradient-to-br from-white/65 via-sky-200/80 to-indigo-100/70 text-slate-800 shadow-[0_24px_70px_-32px_rgba(59,130,246,0.85)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-[2px] hover:shadow-[0_32px_95px_-44px_rgba(79,70,229,0.78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 dark:border-white/20 dark:from-slate-800/90 dark:via-slate-900/82 dark:to-slate-950/78 dark:text-slate-100"
    >
      <span className="absolute inset-0 bg-white/60 opacity-0 transition-opacity duration-500 group-hover:opacity-40 dark:bg-slate-800/60" />
      <span className="absolute inset-0 bg-gradient-to-br from-sky-400/25 via-indigo-500/25 to-sky-300/20 opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md transition-all duration-500 group-active:scale-95 group-hover:scale-105">
        {dark ? (
          <Moon size={18} className="transition-transform duration-500 group-hover:rotate-6" />
        ) : (
          <Sun size={18} className="transition-transform duration-500 group-hover:rotate-6" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
