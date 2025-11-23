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
      className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-surface-secondary text-text-primary shadow-sm transition-colors duration-200 hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <PlusCircle
        size={16}
        aria-label="Plus Icon"
        className="text-text-secondary transition-colors"
      />
    </TooltipAnchor>
  );
}

export default AddMultiConvo;
