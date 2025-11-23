import React from 'react';
import { motion } from 'framer-motion';
import { TooltipAnchor } from '@librechat/client';
import { MessageCircleDashed } from 'lucide-react';
import { useRecoilState, useRecoilCallback, useRecoilValue } from 'recoil';
import { useChatContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

export function TemporaryChat() {
  const localize = useLocalize();
  const [isTemporary, setIsTemporary] = useRecoilState(store.isTemporary);
  const { conversation, isSubmitting } = useChatContext();
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTL = (chatDirection ?? '').toString().toLowerCase() === 'rtl';

  const temporaryBadge = {
    id: 'temporary',
    icon: MessageCircleDashed,
    label: 'com_ui_temporary' as const,
    atom: store.isTemporary,
    isAvailable: true,
  };

  const handleBadgeToggle = useRecoilCallback(
    () => () => {
      setIsTemporary(!isTemporary);
    },
    [isTemporary],
  );

  if (
    (Array.isArray(conversation?.messages) && conversation.messages.length >= 1) ||
    isSubmitting
  ) {
    return null;
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <TooltipAnchor
        description={localize(temporaryBadge.label)}
        render={
          <button
            onClick={handleBadgeToggle}
            aria-label={localize(temporaryBadge.label)}
            className={cn(
              'inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-surface-secondary text-text-primary shadow-sm transition-colors duration-200 hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isTemporary
                ? 'ring-2 ring-primary/70 ring-offset-2 ring-offset-surface-primary dark:ring-primary/70'
                : '',
              'active:scale-[0.99]',
            )}
          >
            {temporaryBadge.icon && (
              <temporaryBadge.icon
                className={cn(
                  'relative h-5 w-5 text-text-secondary transition-colors md:h-4 md:w-4',
                  !temporaryBadge.label && 'mx-auto',
                )}
              />
            )}
          </button>
        }
      />
    </div>
  );
}
