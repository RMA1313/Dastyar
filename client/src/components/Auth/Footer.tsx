import { TStartupConfig } from 'librechat-data-provider';

const BaleIcon = () => (
  <img src="/assets/bale.png" alt="بله" className="h-8 w-8 drop-shadow-sm" />
);

const WebsiteIcon = () => (
  <img src="/assets/pardis-logo.png" alt="وب‌سایت" className="h-8 w-8 drop-shadow-sm" />
);

function Footer({ startupConfig }: { startupConfig: TStartupConfig | null | undefined }) {
  const socials = [
    { href: 'https://ble.ir/futurists', label: 'بله', Icon: BaleIcon },
    { href: 'https://pardis.synappse.ir/', label: 'وب‌سایت', Icon: WebsiteIcon },
  ];

  return (
    <div className="mt-4 flex items-center justify-center gap-6 rounded-2xl bg-white/70 p-4 text-center shadow-sm backdrop-blur dark:bg-slate-900/70">
      {socials.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex flex-col items-center gap-2 text-xs font-semibold text-slate-700 hover:text-sky-700 dark:text-slate-100 transition">
          <span className="rounded-full bg-white/80 p-2 shadow-sm dark:bg-slate-800">
            <Icon />
          </span>
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
}

export default Footer;
