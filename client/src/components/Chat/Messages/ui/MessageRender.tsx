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
import { cn, logger, detectTextDirection } from '~/utils';
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
    const chatDirection = useRecoilValue(store.chatDirection);
    const isRTLLayout = useMemo(
      () => (chatDirection ?? '').toString().toLowerCase() === 'rtl',
      [chatDirection],
    );

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

    const textDirection = useMemo(() => detectTextDirection(msg?.text ?? ''), [msg?.text]);
    const isRTLMessage = textDirection === 'rtl';
    const textAlign = isRTLMessage ? 'right' : 'left';

    if (!msg) {
      return null;
    }

    const isUser = msg?.isCreatedByUser;
    const rowAlignmentClasses = isUser
      ? isRTLLayout
        ? 'justify-start'
        : 'justify-end'
      : isRTLLayout
        ? 'justify-end'
        : 'justify-start';
    const bubbleBase =
      'flex w-full flex-col gap-3 text-sm leading-8 bg-white/70 dark:bg-gray-800/70 text-text-primary dark:text-gray-100 border border-white/30 dark:border-gray-700 shadow-sm rounded-3xl p-6 backdrop-blur-xl';
    const bubbleWidth = isCard ? 'max-w-full' : 'w-full max-w-[780px] mx-auto';
    const bubbleTone = '';
    const bubbleBorder = '';
    const cardTone = '';
    const wrapperDirection = useMemo(() => {
      if (isRTLLayout) {
        return isUser ? 'flex-row' : 'flex-row-reverse';
      }
      return isUser ? 'flex-row-reverse' : 'flex-row';
    }, [isRTLLayout, isUser]);

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          'message-render group flex w-full',
          isCard ? 'md:max-w-[48%]' : maximizeChatSpace ? 'max-w-full' : 'md:max-w-5xl',
          rowAlignmentClasses,
        )}
        dir={isRTLLayout ? 'rtl' : 'ltr'}
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
        style={{ unicodeBidi: 'plaintext', whiteSpace: 'normal', wordBreak: 'break-word' }}
      >
        <div
          className={cn(
            'flex w-full items-start gap-2',
            wrapperDirection,
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <div className={cn('flex w-full flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                bubbleBase,
                bubbleWidth,
                bubbleTone,
                bubbleBorder,
                cardTone,
                isUser || isRTLMessage ? 'items-end text-right' : 'items-start text-left',
                isCard && showCardRender && 'cursor-pointer',
              )}
              dir={textDirection}
              style={{ textAlign, unicodeBidi: 'plaintext', wordBreak: 'break-word' }}
            >
              <div className={cn('flex w-full items-center gap-3', wrapperDirection)}>
                {!isUser && (
                  <div className="flex h-8 w-8 items-center justify-center bg-transparent text-text-primary">
                    <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
                  </div>
                )}
                <h2 className={cn('text-sm font-semibold text-text-primary', fontSize)}>
                  {messageLabel}
                </h2>
              </div>

              <div className="flex w-full flex-col gap-3">
                <div className="flex w-full max-w-full flex-grow flex-col gap-1">
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
                  <SubRow classes="text-xs w-full justify-between">
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
      </div>
    );
  },
);

export default MessageRender;
