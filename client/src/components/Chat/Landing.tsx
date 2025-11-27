import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { easings } from '@react-spring/web';
import { EModelEndpoint } from 'librechat-data-provider';
import { BirthdayIcon, TooltipAnchor, SplitText } from '@librechat/client';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import ConvoIcon from '~/components/Endpoints/ConvoIcon';
import { useLocalize, useAuthContext } from '~/hooks';
import { getIconEndpoint, getEntity } from '~/utils';
import store from '~/store';

const containerClassName =
  'relative flex items-center justify-center rounded-3xl border border-white/15 bg-white/20 text-text-primary shadow-[0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur-[28px] transition-colors dark:border-white/10 dark:bg-[#0f172a]/60';

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
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTL = (chatDirection ?? '').toString().toLowerCase() === 'rtl';

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

    if (hours >= 0 && hours < 5) {
      return localize('com_ui_late_night');
    } else if (hours < 12) {
      if (isWeekend) {
        return localize('com_ui_weekend_morning');
      }
      return localize('com_ui_good_morning');
    } else if (hours < 17) {
      return localize('com_ui_good_afternoon');
    }

    return localize('com_ui_good_evening');
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

  const greetingText = getGreeting();

  return (
    <div
      className={`relative flex h-full w-full transform-gpu flex-col items-center justify-center px-4 pb-10 pt-6 transition-all duration-300 sm:px-10 ${centerFormOnLanding ? 'max-h-full sm:max-h-0' : 'max-h-full'} ${getDynamicMargin}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,255,0.18),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(55,191,255,0.22),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(20,26,42,0.18),transparent_42%)]" />
      <div
        ref={contentRef}
        className="relative flex w-full max-w-4xl flex-col items-center gap-4 rounded-[30px] border border-white/15 bg-white/16 px-10 py-10 text-center shadow-[0_26px_65px_rgba(0,0,0,0.22)] backdrop-blur-[40px] transition-all duration-500 hover:shadow-[0_30px_80px_rgba(0,0,0,0.26)] dark:border-white/10 dark:bg-[#0f172a]/65"
      >
        <div className="relative flex flex-col items-center gap-0">
          <div
            className={`flex ${textHasMultipleLines ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-center gap-4 animate-fadeInUp`}
          >
            <div
              className={`relative size-20 justify-center rounded-[22px] border border-white/15 bg-white/25 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-[26px] ${textHasMultipleLines ? 'mb-2' : ''} dark:border-white/10 dark:bg-[#0f172a]/70`}
            >
              <ConvoIcon
                agentsMap={agentsMap}
                assistantMap={assistantMap}
                conversation={conversation}
                endpointsConfig={endpointsConfig}
                containerClassName={containerClassName}
                context="landing"
                className="h-2/3 w-2/3 text-text-primary"
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
              <div className="flex flex-col items-center gap-1 p-2">
                <SplitText
                  key={`split-text-${name}`}
                  text={name}
                  className={`${getTextSizeClass(name)} font-semibold leading-tight text-[#0b1020] drop-shadow-sm dark:text-white`}
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
                className={`${getTextSizeClass(greetingText)} font-bold text-text-primary drop-shadow-sm`}
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
            <div className="relative mt-4 max-w-2xl animate-fadeIn rounded-[18px] border border-white/15 bg-white/18 px-6 py-5 text-center text-base font-medium leading-8 text-text-secondary shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-[22px] dark:border-white/10 dark:bg-[#0f172a]/65 dark:text-gray-200">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
