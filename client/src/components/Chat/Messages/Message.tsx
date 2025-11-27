import React, { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useMessageProcess } from '~/hooks';
import type { TMessageProps } from '~/common';
import MessageRender from './ui/MessageRender';
// eslint-disable-next-line import/no-cycle
import MultiMessage from './MultiMessage';
import { cn } from '~/utils';
import store from '~/store';

const MessageContainer = React.memo(
  ({
    handleScroll,
    children,
  }: {
    handleScroll: (event?: unknown) => void;
    children: React.ReactNode;
  }) => {
    return (
      <div
        className="text-token-text-primary w-full border-0 bg-transparent dark:border-0 dark:bg-transparent"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        {children}
      </div>
    );
  },
);

export default function Message(props: TMessageProps) {
  const {
    showSibling,
    conversation,
    handleScroll,
    siblingMessage,
    latestMultiMessage,
    isSubmittingFamily,
  } = useMessageProcess({ message: props.message });
  const { message, currentEditId, setCurrentEditId } = props;
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTL = (chatDirection ?? '').toString().toLowerCase() === 'rtl';

  if (!message || typeof message !== 'object') {
    return null;
  }

  const { children, messageId = null } = message;
  const isUser = message?.isCreatedByUser === true;
    const getAlignClass = useCallback(
      (fromUser?: boolean) =>
        fromUser
          ? isRTL
            ? 'justify-start'
            : 'justify-end'
          : isRTL
            ? 'justify-end'
            : 'justify-start',
      [isRTL],
    );
  const primaryAlign = getAlignClass(isUser);

  return (
    <>
      <MessageContainer handleScroll={handleScroll}>
        {showSibling ? (
          <div className="flex w-full flex-col gap-2">
            <div
              className={cn(
                'flex w-full flex-wrap justify-between gap-3 md:flex-nowrap md:gap-3',
                maximizeChatSpace ? 'w-full max-w-full' : 'max-w-full',
              )}
            >
              <div className={cn('flex w-full md:w-1/2', primaryAlign)}>
                <MessageRender
                  {...props}
                  message={message}
                  isSubmittingFamily={isSubmittingFamily}
                  isCard
                />
              </div>
              <div
                className={cn(
                  'flex w-full md:w-1/2',
                  getAlignClass((siblingMessage ?? latestMultiMessage ?? {})?.isCreatedByUser),
                )}
              >
                <MessageRender
                  {...props}
                  isMultiMessage
                  isCard
                  message={siblingMessage ?? latestMultiMessage ?? undefined}
                  isSubmittingFamily={isSubmittingFamily}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div className={cn('flex w-full', primaryAlign)}>
              <MessageRender {...props} />
            </div>
          </div>
        )}
      </MessageContainer>
      <MultiMessage
        key={messageId}
        messageId={messageId}
        conversation={conversation}
        messagesTree={children ?? []}
        currentEditId={currentEditId}
        setCurrentEditId={setCurrentEditId}
      />
    </>
  );
}
