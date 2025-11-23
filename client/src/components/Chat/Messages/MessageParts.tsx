import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { ContentTypes } from 'librechat-data-provider';
import type { TMessageContentParts } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import { useMessageHelpers, useLocalize, useAttachments } from '~/hooks';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import ContentParts from './Content/ContentParts';
import { fontSizeAtom } from '~/store/fontSize';
import SiblingSwitch from './SiblingSwitch';
import MultiMessage from './MultiMessage';
import HoverButtons from './HoverButtons';
import SubRow from './SubRow';
import { cn, detectTextDirection } from '~/utils';
import store from '~/store';

export default function Message(props: TMessageProps) {
  const localize = useLocalize();
  const { message, siblingIdx, siblingCount, setSiblingIdx, currentEditId, setCurrentEditId } =
    props;
  const { attachments, searchResults } = useAttachments({
    messageId: message?.messageId,
    attachments: message?.attachments,
  });
  const {
    edit,
    index,
    agent,
    isLast,
    enterEdit,
    assistant,
    handleScroll,
    conversation,
    isSubmitting,
    latestMessage,
    handleContinue,
    copyToClipboard,
    regenerateMessage,
  } = useMessageHelpers(props);

  const fontSize = useAtomValue(fontSizeAtom);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const { children, messageId = null, isCreatedByUser } = message ?? {};
  const primaryText = useMemo(() => {
    if (typeof message?.text === 'string' && message.text.trim().length > 0) {
      return message.text;
    }

    const textPart = (message?.content as Array<TMessageContentParts | undefined> | undefined)?.find(
      (part) => {
        if (!part || part.type !== ContentTypes.TEXT) {
          return false;
        }
        const value =
          typeof part.text === 'string'
            ? part.text
            : typeof part.text?.value === 'string'
              ? part.text.value
              : '';
        return value.trim().length > 0;
      },
    );

    if (!textPart || textPart.type !== ContentTypes.TEXT) {
      return '';
    }

    const value =
      typeof textPart.text === 'string'
        ? textPart.text
        : typeof textPart.text?.value === 'string'
          ? textPart.text.value
          : '';

    return value;
  }, [message?.content, message?.text]);

  const name = useMemo(() => {
    let result = '';
    if (isCreatedByUser === true) {
      result = localize('com_user_message');
    } else if (assistant) {
      result = assistant.name ?? localize('com_ui_assistant');
    } else if (agent) {
      result = agent.name ?? localize('com_ui_agent');
    }

    return result;
  }, [assistant, agent, isCreatedByUser, localize]);

  const iconData: TMessageIcon = useMemo(
    () => ({
      endpoint: message?.endpoint ?? conversation?.endpoint,
      model: message?.model ?? conversation?.model,
      iconURL: message?.iconURL ?? conversation?.iconURL,
      modelLabel: name,
      isCreatedByUser: message?.isCreatedByUser,
    }),
    [
      name,
      conversation?.endpoint,
      conversation?.iconURL,
      conversation?.model,
      message?.model,
      message?.iconURL,
      message?.endpoint,
      message?.isCreatedByUser,
    ],
  );

  if (!message) {
    return null;
  }

  const baseClasses = {
    common: 'group flex w-full items-start gap-2 transition-all duration-200',
    chat: maximizeChatSpace ? 'max-w-full' : 'md:max-w-5xl',
  };
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTLLayout = (chatDirection ?? '').toString().toLowerCase() === 'rtl';
  const isUser = isCreatedByUser === true;
  const messageDirection = detectTextDirection(primaryText);
  const isRTLMessage = messageDirection === 'rtl';
  const wrapperDirection = useMemo(() => {
    if (isRTLLayout) {
      return 'flex-row-reverse';
    }
    return isUser ? 'flex-row-reverse' : 'flex-row';
  }, [isRTLLayout, isUser]);
  const rowAlignment = isRTLLayout
    ? 'justify-end'
    : isUser
      ? 'justify-end'
      : 'justify-start';
  const bubbleBase =
    'flex w-full flex-col gap-3 text-sm leading-8 bg-white/70 dark:bg-gray-800/70 text-text-primary dark:text-gray-100 border border-white/30 dark:border-gray-700 shadow-sm rounded-3xl p-6 backdrop-blur-xl';
  const bubbleWidth = 'w-full max-w-[780px] mx-auto';
  const bubbleTone = '';
  const bubbleBorder = '';
  const textAlign = isRTLMessage || isRTLLayout || isUser ? 'text-right' : 'text-left';
  const bubbleDir = isRTLMessage ? 'rtl' : isRTLLayout ? 'rtl' : 'ltr';
  const bubbleTextAlign = isRTLMessage || isRTLLayout || isUser ? 'right' : 'left';

  return (
    <>
      <div
        className="w-full border-0 bg-transparent dark:border-0 dark:bg-transparent"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        <div className={cn('flex w-full', rowAlignment)}>
          <div
            id={messageId ?? ''}
            aria-label={`message-${message.depth}-${messageId}`}
            className={cn(baseClasses.common, baseClasses.chat, 'message-render', wrapperDirection)}
            dir={bubbleDir}
            style={{ unicodeBidi: 'plaintext', whiteSpace: 'normal', wordBreak: 'break-word' }}
            data-testid="message-wrapper"
          >
            {!isUser && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-transparent">
                <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
              </div>
            )}
            <div
              className={cn(
                'flex w-full flex-col gap-2',
                isRTLLayout || isUser ? 'items-end' : 'items-start',
              )}
            >
              <h2
                className={cn(
                  'select-none text-sm font-semibold text-text-primary',
                  textAlign,
                  fontSize,
                )}
              >
                {name}
              </h2>
              <div
                className={cn(
                  bubbleBase,
                  bubbleWidth,
                  bubbleTone,
                  bubbleBorder,
                  isRTLMessage || isRTLLayout || isUser ? 'items-end text-right' : 'items-start text-left',
                )}
                style={{
                  textAlign: bubbleTextAlign,
                  unicodeBidi: 'plaintext',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
                data-testid="message-bubble"
              >
                <ContentParts
                  edit={edit}
                  isLast={isLast}
                  enterEdit={enterEdit}
                  siblingIdx={siblingIdx}
                  attachments={attachments}
                  isSubmitting={isSubmitting}
                  searchResults={searchResults}
                  messageId={message.messageId}
                  setSiblingIdx={setSiblingIdx}
                  isCreatedByUser={message.isCreatedByUser}
                  conversationId={conversation?.conversationId}
                  isLatestMessage={messageId === latestMessage?.messageId}
                  content={message.content as Array<TMessageContentParts | undefined>}
                />
              </div>
              {isLast && isSubmitting ? (
                <div className="mt-1 h-[27px] bg-transparent" />
              ) : (
                <SubRow classes={cn('text-xs w-full', isUser ? 'justify-end' : 'justify-between')}>
                  <SiblingSwitch
                    siblingIdx={siblingIdx}
                    siblingCount={siblingCount}
                    setSiblingIdx={setSiblingIdx}
                  />
                  <HoverButtons
                    index={index}
                    isEditing={edit}
                    message={message}
                    enterEdit={enterEdit}
                    isSubmitting={isSubmitting}
                    conversation={conversation ?? null}
                    regenerate={() => regenerateMessage()}
                    copyToClipboard={copyToClipboard}
                    handleContinue={handleContinue}
                    latestMessage={latestMessage}
                    isLast={isLast}
                  />
                </SubRow>
              )}
            </div>
          </div>
        </div>
      </div>
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
