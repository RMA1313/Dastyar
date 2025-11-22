import { TStartupConfig } from 'librechat-data-provider';
const BaleIcon = () => (
  <img
    src="/assets/bale.png"
    alt="O"U,U�"
    className="h-8 w-8 drop-shadow-sm"
  />
);
const WebsiteIcon = () => (
  <img
    src="/assets/web.svg"
    alt="O"U,U�"
    className="h-8 w-8 drop-shadow-sm"
  />
);

function Footer({ startupConfig }: { startupConfig: TStartupConfig | null | undefined }) {
  const websiteLink = startupConfig?.appUrl || '/';

  const socials = [
    { href: 'https://ble.ir/futurists', label: 'O"U,U� O�O3U.UO', Icon: BaleIcon },
    { href: 'https://pardis.synappse.ir/', label: 'U^O"�?OO3OUOO� O�O3U.UO', Icon: WebsiteIcon },
  ];

  return (
    <div className="mt-4 flex items-center justify-center gap-6 rounded-2xl bg-white/70 p-4 text-center shadow-sm shadow-slate-200/60 backdrop-blur dark:bg-slate-900/70 dark:shadow-black/20 animate-auth-card">
      {socials.map(({ href, label, Icon }, index) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex flex-col items-center gap-2 text-xs font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-[2px] hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-100 animate-auth-card"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
        >
          <span className="rounded-full bg-white/80 p-2 shadow-sm shadow-slate-200/70 ring-1 ring-white/60 transition duration-300 group-hover:shadow-lg group-hover:ring-sky-200/80 dark:bg-slate-800/80 dark:ring-white/10">
            <Icon />
          </span>
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
}

export default Footer;
