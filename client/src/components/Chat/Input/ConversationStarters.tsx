import { useMemo, useCallback } from 'react';
import { EModelEndpoint, Constants } from 'librechat-data-provider';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetAssistantDocsQuery, useGetEndpointsQuery } from '~/data-provider';
import { getIconEndpoint, getEntity } from '~/utils';
import { useSubmitMessage } from '~/hooks';

const ConversationStarters = () => {
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantMap = useAssistantsMapContext();
  const { data: endpointsConfig } = useGetEndpointsQuery();

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

  const { data: documentsMap = new Map() } = useGetAssistantDocsQuery(endpointType, {
    select: (data) => new Map(data.map((dbA) => [dbA.assistant_id, dbA])),
  });

  const { entity, isAgent } = getEntity({
    endpoint: endpointType,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  const conversation_starters = useMemo(() => {
    if (entity?.conversation_starters?.length) {
      return entity.conversation_starters;
    }

    if (isAgent) {
      return [];
    }

    return documentsMap.get(entity?.id ?? '')?.conversation_starters ?? [];
  }, [documentsMap, isAgent, entity]);

  const { submitMessage } = useSubmitMessage();
  const sendConversationStarter = useCallback(
    (text: string) => submitMessage({ text }),
    [submitMessage],
  );

  if (!conversation_starters.length) {
    return null;
  }

  return (
    <div
      className="mt-8 flex flex-wrap justify-center gap-3 px-4"
      dir="rtl"
      style={{ fontFamily: 'Vazir, system-ui, -apple-system, sans-serif' }}
    >
      {conversation_starters
        .slice(0, Constants.MAX_CONVO_STARTERS)
        .map((text: string, index: number) => (
          <button
            key={index}
            onClick={() => sendConversationStarter(text)}
            className="relative flex w-40 cursor-pointer flex-col gap-2 rounded-2xl border border-white/70 bg-white/85 px-3 pb-4 pt-3 text-start align-top text-[15px] text-slate-800 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 ease-in-out hover:-translate-y-[1px] hover:border-sky-200 hover:bg-white/95 hover:shadow-2xl hover:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-black/30 dark:hover:border-sky-400/50 dark:hover:bg-slate-900/90 fade-in"
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-l from-sky-50/60 via-white/30 to-indigo-50/60 opacity-90 dark:from-slate-800/55 dark:via-slate-900/45 dark:to-slate-800/55"
              aria-hidden="true"
            />
            <p className="relative break-word line-clamp-3 overflow-hidden text-balance break-all text-slate-700 dark:text-slate-200">
              {text}
            </p>
          </button>
        ))}
    </div>
  );
};

export default ConversationStarters;
