import { PlusCircle } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { isAssistantsEndpoint } from 'librechat-data-provider';
import type { TConversation } from 'librechat-data-provider';
import { useChatContext, useAddedChatContext } from '~/Providers';
import { mainTextareaId } from '~/common';
import { useLocalize } from '~/hooks';

function AddMultiConvo() {
  const { conversation } = useChatContext();
  const { setConversation: setAddedConvo } = useAddedChatContext();
  const localize = useLocalize();

  const clickHandler = () => {
    const { title: _t, ...convo } = conversation ?? ({} as TConversation);
    setAddedConvo({
      ...convo,
      title: '',
    });

    const textarea = document.getElementById(mainTextareaId);
    if (textarea) {
      textarea.focus();
    }
  };

  if (!conversation) {
    return null;
  }

  if (isAssistantsEndpoint(conversation.endpoint)) {
    return null;
  }

  return (
    <TooltipAnchor
      id="add-multi-conversation-button"
      aria-label={localize('com_ui_add_multi_conversation')}
      description={localize('com_ui_add_multi_conversation')}
      tabIndex={0}
      role="button"
      onClick={clickHandler}
      data-testid="parameters-button"
      className="inline-flex size-11 flex-shrink-0 items-center justify-center rounded-[18px] border border-white/60 bg-gradient-to-br from-sky-50/85 via-white/95 to-indigo-50/80 text-slate-800 shadow-[0_16px_40px_-24px_rgba(59,130,246,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:border-sky-200 hover:bg-white/95 hover:shadow-[0_22px_55px_-24px_rgba(99,102,241,0.7)] disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:shadow-black/30 dark:hover:border-sky-400/50 dark:hover:bg-slate-900/90"
    >
      <PlusCircle
        size={16}
        aria-label="Plus Icon"
        className="text-sky-700 transition-colors dark:text-sky-300"
      />
    </TooltipAnchor>
  );
}

export default AddMultiConvo;
