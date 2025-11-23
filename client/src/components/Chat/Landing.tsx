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
  'relative flex items-center justify-center rounded-xl border border-border-light bg-surface-secondary text-text-primary shadow-sm transition-colors';

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
      className={`relative flex h-full w-full transform-gpu flex-col items-center justify-center px-4 pb-8 pt-4 transition-all duration-300 sm:px-8 ${centerFormOnLanding ? 'max-h-full sm:max-h-0' : 'max-h-full'} ${getDynamicMargin}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        ref={contentRef}
        className="relative flex w-full max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border-light bg-surface-primary px-8 py-9 text-center shadow-md transition-all duration-300 sm:px-10"
      >
        <div className="relative flex flex-col items-center gap-0">
          <div
            className={`flex ${textHasMultipleLines ? 'flex-col' : 'flex-col md:flex-row'} items-center justify-center gap-3`}
          >
            <div
              className={`relative size-16 justify-center rounded-2xl border border-border-light bg-surface-secondary p-2 shadow-sm ${textHasMultipleLines ? 'mb-2' : ''}`}
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
              <div className="flex flex-col items-center gap-0 p-2">
                <SplitText
                  key={`split-text-${name}`}
                  text={name}
                  className={`${getTextSizeClass(name)} font-bold text-text-primary`}
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
            <div className="relative mt-4 max-w-md animate-fadeIn rounded-xl border border-border-light bg-surface-secondary px-5 py-4 text-center text-sm font-medium text-text-secondary shadow-sm">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
