import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { easings } from '@react-spring/web';
import { EModelEndpoint } from 'librechat-data-provider';
import { BirthdayIcon, TooltipAnchor, SplitText } from '@librechat/client';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import ConvoIcon from '~/components/Endpoints/ConvoIcon';
import { useLocalize, useAuthContext } from '~/hooks';
import { getIconEndpoint, getEntity } from '~/utils';

const containerClassName =
  'shadow-stroke relative flex h-full items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-black shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[2px] hover:shadow-2xl hover:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:shadow-black/30';

function getTextSizeClass(text: string | undefined | null) {
  if (!text) {
    return 'text-xl sm:text-2xl';
  }

  if (text.length < 40) {
    return 'text-2xl sm:text-4xl';
  }

  if (text.length < 70) {
    return 'text-xl sm:text-2xl';
  }

  return 'text-lg sm:text-md';
}

export default function Landing({ centerFormOnLanding }: { centerFormOnLanding: boolean }) {
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { user } = useAuthContext();
  const localize = useLocalize();

  const [textHasMultipleLines, setTextHasMultipleLines] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const endpointType = useMemo(() => {
    let ep = conversation?.endpoint ?? '';
    if (
      [
        EModelEndpoint.chatGPTBrowser,
        EModelEndpoint.azureOpenAI,
        EModelEndpoint.gptPlugins,
      ].includes(ep as EModelEndpoint)
    ) {
      ep = EModelEndpoint.openAI;
    }
    return getIconEndpoint({
      endpointsConfig,
      iconURL: conversation?.iconURL,
      endpoint: ep,
    });
  }, [conversation?.endpoint, conversation?.iconURL, endpointsConfig]);

  const { entity, isAgent, isAssistant } = getEntity({
    endpoint: endpointType,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  const name = entity?.name ?? '';
  const description = (entity?.description || conversation?.greeting) ?? '';

  const getGreeting = useCallback(() => {
    if (typeof startupConfig?.interface?.customWelcome === 'string') {
      const customWelcome = startupConfig.interface.customWelcome;
      // Replace {{user.name}} with actual user name if available
      if (user?.name && customWelcome.includes('{{user.name}}')) {
        return customWelcome.replace(/{{user.name}}/g, user.name);
      }
      return customWelcome;
    }

    const now = new Date();
    const hours = now.getHours();

    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Early morning (midnight to 4:59 AM)
    if (hours >= 0 && hours < 5) {
      return localize('com_ui_late_night');
    }
    // Morning (6 AM to 11:59 AM)
    else if (hours < 12) {
      if (isWeekend) {
        return localize('com_ui_weekend_morning');
      }
      return localize('com_ui_good_morning');
    }
    // Afternoon (12 PM to 4:59 PM)
    else if (hours < 17) {
      return localize('com_ui_good_afternoon');
    }
    // Evening (5 PM to 8:59 PM)
    else {
      return localize('com_ui_good_evening');
    }
  }, [localize, startupConfig?.interface?.customWelcome, user?.name]);

  const handleLineCountChange = useCallback((count: number) => {
    setTextHasMultipleLines(count > 1);
    setLineCount(count);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [lineCount, description]);

  const getDynamicMargin = useMemo(() => {
    let margin = 'mb-0';

    if (lineCount > 2 || (description && description.length > 100)) {
      margin = 'mb-10';
    } else if (lineCount > 1 || (description && description.length > 0)) {
      margin = 'mb-6';
    } else if (textHasMultipleLines) {
      margin = 'mb-4';
    }

    if (contentHeight > 200) {
      margin = 'mb-16';
    } else if (contentHeight > 150) {
      margin = 'mb-12';
    }

    return margin;
  }, [lineCount, description, textHasMultipleLines, contentHeight]);

  const greetingText =
    typeof startupConfig?.interface?.customWelcome === 'string'
      ? getGreeting()
      : getGreeting() + (user?.name ? ', ' + user.name : '');

  return (
    <div
      className={`relative flex h-full w-full transform-gpu flex-col items-end justify-center px-4 pb-10 pt-4 transition-all duration-300 sm:px-8 ${centerFormOnLanding ? 'max-h-full sm:max-h-0' : 'max-h-full'} ${getDynamicMargin}`}
      dir="rtl"
      style={{ fontFamily: 'Vazir, system-ui, -apple-system, sans-serif' }}
    >
      <div
        ref={contentRef}
        className="relative flex w-full max-w-3xl flex-col items-center gap-3 rounded-[32px] border border-white/60 bg-white/90 px-8 py-9 text-center shadow-[0_26px_80px_-50px_rgba(59,130,246,0.85)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-[2px] hover:shadow-[0_32px_105px_-58px_rgba(99,102,241,0.85)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/45 sm:px-11"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-l from-sky-50/80 via-white/60 to-indigo-100/70 opacity-95 dark:from-slate-800/65 dark:via-slate-900/55 dark:to-slate-800/60"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-0">
          <div
            className={`flex ${textHasMultipleLines ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-center gap-2`}
          >
            <div
              className={`relative size-16 justify-center rounded-3xl border border-white/70 bg-white/90 p-2 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:shadow-2xl hover:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/30 ${textHasMultipleLines ? 'mb-2' : ''}`}
            >
              <ConvoIcon
                agentsMap={agentsMap}
                assistantMap={assistantMap}
                conversation={conversation}
                endpointsConfig={endpointsConfig}
                containerClassName={containerClassName}
                context="landing"
                className="h-2/3 w-2/3 text-black dark:text-white"
                size={41}
              />
              {startupConfig?.showBirthdayIcon && (
                <TooltipAnchor
                  className="absolute bottom-[27px] right-2"
                  description={localize('com_ui_happy_birthday')}
                  aria-label={localize('com_ui_happy_birthday')}
                >
                  <BirthdayIcon />
                </TooltipAnchor>
              )}
            </div>
            {((isAgent || isAssistant) && name) || name ? (
              <div className="flex flex-col items-center gap-0 p-2">
                <SplitText
                  key={`split-text-${name}`}
                  text={name}
                  className={`${getTextSizeClass(name)} font-bold text-slate-900 dark:text-white`}
                  delay={50}
                  textAlign="center"
                  animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                  animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                  easing={easings.easeOutCubic}
                  threshold={0}
                  rootMargin="0px"
                  onLineCountChange={handleLineCountChange}
                />
              </div>
            ) : (
              <SplitText
                key={`split-text-${greetingText}${user?.name ? '-user' : ''}`}
                text={greetingText}
                className={`${getTextSizeClass(greetingText)} font-bold text-slate-900 drop-shadow-sm dark:text-white`}
                delay={50}
                textAlign="center"
                animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                easing={easings.easeOutCubic}
                threshold={0}
                rootMargin="0px"
                onLineCountChange={handleLineCountChange}
              />
            )}
          </div>
          {description && (
            <div className="relative mt-4 max-w-md animate-fadeIn rounded-3xl bg-white/80 px-5 py-4 text-center text-sm font-medium text-slate-700 shadow-lg shadow-slate-200/60 backdrop-blur dark:bg-slate-800/85 dark:text-slate-100 dark:shadow-black/30">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
