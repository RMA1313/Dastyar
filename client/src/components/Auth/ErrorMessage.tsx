export const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
  <div
    role="alert"
    aria-live="assertive"
    className="relative mt-6 rounded-2xl border border-red-500/20 bg-red-50/70 px-5 py-4 text-red-700 shadow-lg ring-1 ring-red-100 backdrop-blur transition-all dark:bg-red-950/40 dark:text-red-100"
  >
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-base font-bold text-red-600 ring-1 ring-red-200 dark:bg-red-900/50 dark:text-red-200">
        !
      </span>
      <div className="space-y-1 text-sm leading-6">
        <p className="font-semibold">مشکلی پیش آمد</p>
        <div>{children}</div>
      </div>
    </div>
  </div>
);
