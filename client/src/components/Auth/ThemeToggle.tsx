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
      aria-label={dark ? 'حالت تیره' : 'حالت روشن'}
      className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-gradient-to-br from-sky-200/60 via-white/70 to-indigo-100/60 text-slate-800 shadow-lg backdrop-blur transition-all duration-500 hover:-translate-y-[2px] hover:shadow-xl hover:shadow-sky-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-white/10 dark:from-slate-800/80 dark:via-slate-900/70 dark:to-slate-950/60 dark:text-slate-100"
    >
      <span className="absolute inset-0 bg-white/60 opacity-0 transition-opacity duration-500 group-hover:opacity-40 dark:bg-slate-800/60" />
      <span className="absolute inset-0 blur-xl bg-gradient-to-br from-sky-400/30 via-indigo-500/30 to-sky-300/20 opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md transition-all duration-500 group-active:scale-95 group-hover:scale-105">
        {dark ? <Moon size={18} className="transition-transform duration-500 group-hover:rotate-6" /> : <Sun size={18} className="transition-transform duration-500 group-hover:rotate-6" />}
      </span>
    </button>
  );
};

export default ThemeToggle;
