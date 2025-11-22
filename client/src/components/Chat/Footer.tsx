import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import TagManager from 'react-gtm-module';
import { Constants } from 'librechat-data-provider';
import { useGetStartupConfig } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function Footer({ className }: { className?: string }) {
  const { data: config } = useGetStartupConfig();
  const localize = useLocalize();

  const privacyPolicy = config?.interface?.privacyPolicy;
  const termsOfService = config?.interface?.termsOfService;

  const privacyPolicyRender = privacyPolicy?.externalUrl != null && (
    <a
      className="font-semibold text-sky-700 underline decoration-2 decoration-sky-400 underline-offset-4 transition-colors hover:text-indigo-700 dark:text-sky-300 dark:hover:text-indigo-200"
      href={privacyPolicy.externalUrl}
      target={privacyPolicy.openNewTab === true ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_privacy_policy')}
    </a>
  );

  const termsOfServiceRender = termsOfService?.externalUrl != null && (
    <a
      className="font-semibold text-sky-700 underline decoration-2 decoration-sky-400 underline-offset-4 transition-colors hover:text-indigo-700 dark:text-sky-300 dark:hover:text-indigo-200"
      href={termsOfService.externalUrl}
      target={termsOfService.openNewTab === true ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_terms_of_service')}
    </a>
  );

  const mainContentParts = (
    typeof config?.customFooter === 'string'
      ? config.customFooter
      : '[LibreChat ' +
        Constants.VERSION +
        '](https://librechat.ai) - ' +
        localize('com_ui_latest_footer')
  ).split('|');

  useEffect(() => {
    if (config?.analyticsGtmId != null && typeof window.google_tag_manager === 'undefined') {
      const tagManagerArgs = {
        gtmId: config.analyticsGtmId,
      };
      TagManager.initialize(tagManagerArgs);
    }
  }, [config?.analyticsGtmId]);

  const mainContentRender = mainContentParts.map((text, index) => (
    <React.Fragment key={`main-content-part-${index}`}>
      <ReactMarkdown
        components={{
          a: ({ node: _n, href, children, ...otherProps }) => {
            return (
              <a
                className="font-semibold text-sky-700 underline decoration-2 decoration-sky-400 underline-offset-4 transition-colors hover:text-indigo-700 dark:text-sky-300 dark:hover:text-indigo-200"
                href={href}
                target="_blank"
                rel="noreferrer"
                {...otherProps}
              >
                {children}
              </a>
            );
          },

          p: ({ node: _n, ...props }) => <span {...props} />,
        }}
      >
        {text.trim()}
      </ReactMarkdown>
    </React.Fragment>
  ));

  const footerElements = [...mainContentRender, privacyPolicyRender, termsOfServiceRender].filter(
    Boolean,
  );

  return (
    <div
      className="relative hidden w-full"
      dir="rtl"
      style={{ fontFamily: 'Vazir, system-ui, -apple-system, sans-serif' }}
    >
      <div
        className={
          className ??
          'absolute inset-x-0 bottom-4 hidden justify-end px-4 py-2 text-center text-xs sm:flex md:px-[60px]'
        }
        role="contentinfo"
      >
        <div className="relative flex min-w-[280px] max-w-5xl items-center justify-center gap-3 rounded-[22px] border border-white/60 bg-white/90 px-4 py-3 text-[13px] font-semibold text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:shadow-2xl hover:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-black/30">
          <div
            className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-l from-sky-50/80 via-white/60 to-indigo-100/70 opacity-90 dark:from-slate-800/55 dark:via-slate-900/45 dark:to-slate-800/55"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {footerElements.map((contentRender, index) => {
              const isLastElement = index === footerElements.length - 1;
              return (
                <React.Fragment key={`footer-element-${index}`}>
                  <span className="leading-tight text-slate-700 transition-colors dark:text-slate-100">
                    {contentRender}
                  </span>
                  {!isLastElement && (
                    <span
                      key={`separator-${index}`}
                      className="mx-1 h-6 w-[1px] bg-gradient-to-b from-sky-300 via-indigo-300 to-sky-400 opacity-80 dark:from-sky-500 dark:via-indigo-400 dark:to-sky-500"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
