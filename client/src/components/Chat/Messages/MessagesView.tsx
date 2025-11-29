import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { CSSTransition } from 'react-transition-group';
import type { TMessage } from 'librechat-data-provider';
import { Spinner } from '@librechat/client';
import { useScreenshot, useMessageScrolling, useLocalize } from '~/hooks';
import ScrollToBottom from '~/components/Messages/ScrollToBottom';
import { MessagesViewProvider } from '~/Providers';
import { fontSizeAtom } from '~/store/fontSize';
import MultiMessage from './MultiMessage';
import { cn } from '~/utils';
import store from '~/store';

function MessagesViewContent({
  messagesTree: _messagesTree,
  threadId,
  isLoading,
}: {
  messagesTree?: TMessage[] | null;
  threadId?: string | null;
  isLoading?: boolean;
}) {
  const localize = useLocalize();
  const fontSize = useAtomValue(fontSizeAtom);
  const { screenshotTargetRef } = useScreenshot();
  const scrollButtonPreference = useRecoilValue(store.showScrollButton);
  const [currentEditId, setCurrentEditId] = useState<number | string | null>(-1);

  const {
    conversation,
    scrollableRef,
    messagesEndRef,
    showScrollButton,
    handleSmoothToRef,
    debouncedHandleScroll,
  } = useMessageScrolling(_messagesTree);

  const { conversationId } = conversation ?? {};
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTL = (chatDirection ?? '').toString().toLowerCase() === 'rtl';

  const activeThreadId = threadId ?? conversationId;
  const hasActiveThread = Boolean(activeThreadId);
  const awaitingMessages =
    hasActiveThread && (isLoading === true || _messagesTree === undefined);
  const emptyThread =
    hasActiveThread &&
    !awaitingMessages &&
    (_messagesTree === null || (_messagesTree?.length ?? 0) === 0);

  if (!hasActiveThread) {
    return null;
  }

  return (
    <>
      <div
        data-testid="messages-view"
        className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden animate-themeTransition"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <div
            data-testid="messages-scroll-area"
            className="flex flex-1 flex-col overflow-y-auto px-5 pb-[110px] pt-4 text-[16px] leading-7 text-[#2C2F36] transition-all duration-300 scrollbar-thin dark:text-slate-100 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-thumb:hover]:bg-black/30 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 dark:[&::-webkit-scrollbar-thumb:hover]:bg-white/35"
            onScroll={debouncedHandleScroll}
            ref={scrollableRef}
            style={{ width: '100%', scrollbarWidth: 'thin' }}
          >
            <div
              className={cn(
                'chat-column flex min-h-0 w-full max-w-[880px] flex-col items-stretch gap-[6px] items-start mx-auto px-4',
                isRTL ? 'text-right' : 'text-left',
              )}
              dir="rtl"
            >
              {awaitingMessages ? (
                <div
                  className={cn(
                    'flex w-full justify-center bg-transparent border-0 shadow-none px-0 py-0 text-center text-text-secondary',
                    fontSize,
                  )}
                >
                  <Spinner className="text-[var(--brand-navy)]" />
                </div>
              ) : emptyThread ? (
                <div
                  className={cn(
                    'flex w-full justify-center bg-transparent border-0 shadow-none px-0 py-0 text-center text-text-secondary',
                    fontSize,
                  )}
                >
                  {localize('com_ui_nothing_found')}
                </div>
              ) : (
                <>
                  <div ref={screenshotTargetRef} className="w-full">
                    <MultiMessage
                      key={conversationId}
                      messagesTree={_messagesTree}
                      messageId={conversationId ?? null}
                      setCurrentEditId={setCurrentEditId}
                      currentEditId={currentEditId ?? null}
                    />
                  </div>
                </>
              )}
              <div
                id="messages-end"
                className="group h-0 w-full flex-shrink-0"
                ref={messagesEndRef}
              />
            </div>
          </div>

          <CSSTransition
            in={showScrollButton && scrollButtonPreference}
            timeout={{
              enter: 550,
              exit: 700,
            }}
            classNames="scroll-animation"
            unmountOnExit={true}
            appear={true}
          >
            <ScrollToBottom scrollHandler={handleSmoothToRef} />
          </CSSTransition>
        </div>
      </div>
    </>
  );
}

export default function MessagesView({
  messagesTree,
  threadId,
  isLoading,
}: {
  messagesTree?: TMessage[] | null;
  threadId?: string | null;
  isLoading?: boolean;
}) {
  return (
    <MessagesViewProvider>
      <MessagesViewContent
        messagesTree={messagesTree}
        threadId={threadId}
        isLoading={isLoading}
      />
    </MessagesViewProvider>
  );
}
