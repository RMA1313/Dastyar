import { Button } from '@librechat/client';
import { useNavigate } from 'react-router-dom';

const AuthWelcome = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-8 text-center animate-auth-card">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-44 w-44 sm:h-52 sm:w-52">
          <div className="relative dark:ring-white/10">
            <img
              src="/assets/logo3.gif"
              className="h-full w-full object-contain logo-float"
              alt="U,U^U_U^"
              loading="lazy"
            />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">O_O3O�UOOO� U�U^O'U.U+O_ O�UOU+O_U� U_U~U^U�UO</h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          O�UOU+O_U� U+O'U. OU+O_OO� U�U^O'U.U+O_ OUOO�OU+
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="submit"
          className="h-12 w-full rounded-2xl bg-gradient-to-l from-sky-500 via-indigo-600 to-sky-400 text-white shadow-lg transition duration-200 hover:-translate-y-[2px] hover:shadow-xl"
          onClick={() => navigate('/login/phone')}
        >
          U^O�U^O_
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/85 text-slate-800 ring-1 ring-transparent transition duration-200 hover:-translate-y-[1px] hover:ring-slate-300 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:ring-white/20"
          onClick={() => navigate('/register')}
        >
          OUOO�OO_ O-O3OO" O�O_UOO_
        </Button>
      </div>
    </div>
  );
};

export default AuthWelcome;
