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
    const rowAlignmentClasses = 'justify-end';
    const bubbleBase =
      'flex w-full flex-col gap-2 text-[15px] leading-[1.35] rounded-[12px] px-3 py-[5px] my-[6px] shadow-none transition-all duration-200 animate-[messageAppear_0.22s_ease-out_both]';
    const assistantTone =
      'max-w-[70%] bg-[rgba(255,255,255,0.60)] text-[#2C2F36] border border-[rgba(210,210,210,0.5)] backdrop-blur-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all';
    const userTone =
      'max-w-[52%] bg-[linear-gradient(135deg,#2196F3,#42A5F5)] text-[rgba(255,255,255,0.90)] shadow-[0_4px_14px_rgba(0,0,0,0.20)]';
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
        className={cn('message-render group mx-auto flex w-full items-start', rowAlignmentClasses)}
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
            'flex w-full items-start gap-3',
            wrapperDirection,
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <div className="flex w-full flex-col items-end gap-2">
            <div
              className={cn(
                bubbleBase,
                isUser ? userTone : assistantTone,
                'items-end text-right',
                isCard && showCardRender && 'cursor-pointer',
                'transition-all duration-200 ease-in-out',
                'dark:bg-[rgba(255,255,255,0.06)] dark:border-[rgba(255,255,255,0.06)] dark:text-[#E2E6EE] dark:backdrop-blur-[18px] dark:shadow-[0_4px_16px_rgba(0,0,0,0.30)]',
              )}
              dir={textDirection}
              style={{
                textAlign: 'justify',
                textJustify: 'inter-word',
                unicodeBidi: 'plaintext',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                flexShrink: 0,
              }}
            >
              <div className={cn('flex w-full items-center gap-3', wrapperDirection)}>
                {!isUser && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-text-primary shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-md">
                    <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
                  </div>
                )}
                <h2
                  className={cn(
                    'text-sm font-semibold uppercase tracking-wide text-text-primary dark:text-white/90',
                    fontSize,
                    !isUser && 'text-[15px]',
                    isUser && 'text-white/90',
                  )}
                >
                  {messageLabel}
                </h2>
              </div>

              <div className="flex w-full flex-col gap-4">
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
