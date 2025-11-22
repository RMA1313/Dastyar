import React, { useCallback, useMemo, memo } from 'react';
import { useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { type TMessage } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import MessageContent from '~/components/Chat/Messages/Content/MessageContent';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import { Plugin } from '~/components/Messages/Content';
import SubRow from '~/components/Chat/Messages/SubRow';
import { fontSizeAtom } from '~/store/fontSize';
import { MessageContext } from '~/Providers';
import { useMessageActions } from '~/hooks';
import { cn, logger } from '~/utils';
import store from '~/store';

type MessageRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

const MessageRender = memo(
  ({
    message: msg,
    isCard = false,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
    currentEditId,
    isMultiMessage = false,
    setCurrentEditId,
    isSubmittingFamily = false,
  }: MessageRenderProps) => {
    const {
      ask,
      edit,
      index,
      agent,
      assistant,
      enterEdit,
      conversation,
      messageLabel,
      isSubmitting,
      latestMessage,
      handleContinue,
      copyToClipboard,
      setLatestMessage,
      regenerateMessage,
      handleFeedback,
    } = useMessageActions({
      message: msg,
      currentEditId,
      isMultiMessage,
      setCurrentEditId,
    });
    const fontSize = useAtomValue(fontSizeAtom);
    const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);

    const handleRegenerateMessage = useCallback(() => regenerateMessage(), [regenerateMessage]);
    const hasNoChildren = !(msg?.children?.length ?? 0);
    const isLast = useMemo(
      () => hasNoChildren && (msg?.depth === latestMessage?.depth || msg?.depth === -1),
      [hasNoChildren, msg?.depth, latestMessage?.depth],
    );
    const isLatestMessage = msg?.messageId === latestMessage?.messageId;
    const showCardRender = isLast && !isSubmittingFamily && isCard;
    const isLatestCard = isCard && !isSubmittingFamily && isLatestMessage;

    /** Only pass isSubmitting to the latest message to prevent unnecessary re-renders */
    const effectiveIsSubmitting = isLatestMessage ? isSubmitting : false;

    const iconData: TMessageIcon = useMemo(
      () => ({
        endpoint: msg?.endpoint ?? conversation?.endpoint,
        model: msg?.model ?? conversation?.model,
        iconURL: msg?.iconURL,
        modelLabel: messageLabel,
        isCreatedByUser: msg?.isCreatedByUser,
      }),
      [
        messageLabel,
        conversation?.endpoint,
        conversation?.model,
        msg?.model,
        msg?.iconURL,
        msg?.endpoint,
        msg?.isCreatedByUser,
      ],
    );

    const clickHandler = useMemo(
      () =>
        showCardRender && !isLatestMessage
          ? () => {
              logger.log(
                'latest_message',
                `Message Card click: Setting ${msg?.messageId} as latest message`,
              );
              logger.dir(msg);
              setLatestMessage(msg!);
            }
          : undefined,
      [showCardRender, isLatestMessage, msg, setLatestMessage],
    );

    if (!msg) {
      return null;
    }

    const isUser = msg?.isCreatedByUser;

    const baseClasses = {
      common:
        'group flex w-full max-w-[78rem] items-start gap-3 px-2 py-1.5 transition-all duration-300 transform-gpu sm:gap-4 sm:px-4',
      card: 'relative w-full gap-2 rounded-[24px] border border-border-medium bg-surface-primary-alt p-3 md:w-1/2 md:gap-3 md:p-4',
      chat: maximizeChatSpace
        ? 'w-full max-w-full md:px-3 lg:px-2 xl:px-5'
        : 'md:max-w-[52rem] xl:max-w-[60rem]',
    };

    const conditionalClasses = {
      latestCard: isLatestCard ? 'bg-surface-secondary shadow-lg' : '',
      cardRender: showCardRender ? 'cursor-pointer transition-colors duration-300' : '',
      focus: 'focus:outline-none focus:ring-2 focus:ring-border-xheavy',
    };

    const bubbleClasses = isUser
      ? 'border-white/70 bg-gradient-to-l from-sky-50/90 via-white/95 to-indigo-50/85 shadow-[0_24px_60px_-48px_rgba(59,130,246,0.85)] dark:border-white/10 dark:from-slate-800/85 dark:via-slate-900/80 dark:to-indigo-900/75 dark:shadow-black/40'
      : 'border-white/70 bg-white/90 shadow-[0_24px_60px_-50px_rgba(99,102,241,0.8)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/45';

    const alignmentClasses = isUser
      ? 'flex-row-reverse justify-start text-right'
      : 'flex-row justify-start text-right';

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          baseClasses.common,
          isCard ? baseClasses.card : baseClasses.chat,
          conditionalClasses.latestCard,
          conditionalClasses.cardRender,
          conditionalClasses.focus,
          'message-render',
          alignmentClasses,
        )}
        dir="rtl"
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
        style={{ unicodeBidi: 'normal' }}
      >
        {isLatestCard && (
          <div className="absolute right-0 top-0 m-2 h-3 w-3 rounded-full bg-text-primary" />
        )}

        <div className="relative flex flex-shrink-0 flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[16px] border border-white/60 bg-white/90 shadow-md shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/30">
            <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
          </div>
        </div>

        <div
          className={cn(
            'relative flex max-w-[78%] flex-col text-right sm:max-w-[72%] lg:max-w-[68%]',
            isUser ? 'user-turn items-end self-end' : 'agent-turn items-start self-start',
          )}
          style={{ unicodeBidi: 'normal' }}
        >
          <div
            className={cn(
              'relative flex w-fit max-w-full flex-col gap-3 rounded-[24px] border px-4 py-3 shadow-lg backdrop-blur-xl transition-all duration-300 sm:px-6 sm:py-4',
              bubbleClasses,
            )}
            style={{ unicodeBidi: 'normal' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                className={cn(
                  'select-none text-sm font-semibold text-slate-800 dark:text-white',
                  fontSize,
                )}
              >
                {messageLabel}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex max-w-full flex-grow flex-col gap-1">
                <MessageContext.Provider
                  value={{
                    messageId: msg.messageId,
                    conversationId: conversation?.conversationId,
                    isExpanded: false,
                    isSubmitting: effectiveIsSubmitting,
                    isLatestMessage,
                  }}
                >
                  {msg.plugin && <Plugin plugin={msg.plugin} />}
                  <MessageContent
                    ask={ask}
                    edit={edit}
                    isLast={isLast}
                    text={msg.text || ''}
                    message={msg}
                    enterEdit={enterEdit}
                    error={!!(msg.error ?? false)}
                    isSubmitting={effectiveIsSubmitting}
                    unfinished={msg.unfinished ?? false}
                    isCreatedByUser={msg.isCreatedByUser ?? true}
                    siblingIdx={siblingIdx ?? 0}
                    setSiblingIdx={setSiblingIdx ?? (() => ({}))}
                  />
                </MessageContext.Provider>
              </div>

              {hasNoChildren && (isSubmittingFamily === true || effectiveIsSubmitting) ? (
                <PlaceholderRow isCard={isCard} />
              ) : (
                <SubRow classes="text-xs">
                  <SiblingSwitch
                    siblingIdx={siblingIdx}
                    siblingCount={siblingCount}
                    setSiblingIdx={setSiblingIdx}
                  />
                  <HoverButtons
                    index={index}
                    isEditing={edit}
                    message={msg}
                    enterEdit={enterEdit}
                    isSubmitting={isSubmitting}
                    conversation={conversation ?? null}
                    regenerate={handleRegenerateMessage}
                    copyToClipboard={copyToClipboard}
                    handleContinue={handleContinue}
                    latestMessage={latestMessage}
                    handleFeedback={handleFeedback}
                    isLast={isLast}
                  />
                </SubRow>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default MessageRender;
