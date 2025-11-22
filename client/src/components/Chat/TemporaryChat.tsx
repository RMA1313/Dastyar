import React from 'react';
import { motion } from 'framer-motion';
import { TooltipAnchor } from '@librechat/client';
import { MessageCircleDashed } from 'lucide-react';
import { useRecoilState, useRecoilCallback } from 'recoil';
import { useChatContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

export function TemporaryChat() {
  const localize = useLocalize();
  const [isTemporary, setIsTemporary] = useRecoilState(store.isTemporary);
  const { conversation, isSubmitting } = useChatContext();

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
    <div className="relative flex flex-wrap items-center gap-2" dir="rtl">
      <TooltipAnchor
        description={localize(temporaryBadge.label)}
        render={
          <button
            onClick={handleBadgeToggle}
            aria-label={localize(temporaryBadge.label)}
            className={cn(
              'inline-flex size-11 flex-shrink-0 items-center justify-center rounded-[18px] border border-white/60 bg-gradient-to-br from-sky-50/85 via-white/95 to-indigo-50/80 text-slate-800 shadow-[0_16px_40px_-24px_rgba(59,130,246,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_22px_55px_-24px_rgba(99,102,241,0.7)] dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:shadow-black/30',
              isTemporary
                ? 'ring-2 ring-sky-300/80 ring-offset-2 ring-offset-white dark:ring-sky-500/70 dark:ring-offset-slate-900'
                : 'hover:border-sky-200 hover:bg-white/95 dark:hover:border-sky-400/50 dark:hover:bg-slate-900/90',
              'active:scale-[0.99]',
            )}
          >
            {temporaryBadge.icon && (
              <temporaryBadge.icon
                className={cn(
                  'relative h-5 w-5 text-sky-700 transition-colors dark:text-sky-300 md:h-4 md:w-4',
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
