import { memo, useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { Spinner } from '@librechat/client';
import { useParams } from 'react-router-dom';
import { Constants, buildTree } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import { useGetMessagesByConvoId } from '~/data-provider';
import MessagesView from './Messages/MessagesView';
import Presentation from './Presentation';
import ChatForm from './Input/ChatForm';
import Header from './Header';
import Footer from './Footer';
import store from '~/store';

function LoadingSpinner() {
  return (
    <div className="relative flex-1 overflow-hidden overflow-y-auto">
      <div className="flex h-full items-center justify-center">
        <div className="bg-transparent px-0 py-0">
          <Spinner className="text-[var(--brand-navy)]" />
        </div>
      </div>
    </div>
  );
}

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const rootSubmission = useRecoilValue(store.submissionByIndex(index));
  const addedSubmission = useRecoilValue(store.submissionByIndex(index + 1));
  const fileMap = useFileMapContext();
  const chatDirection = useRecoilValue(store.chatDirection);
  const isRTL = useMemo(
    () => (chatDirection ?? '').toString().toLowerCase() === 'rtl',
    [chatDirection],
  );

  const { data: messagesTree, isLoading } = useGetMessagesByConvoId<TMessage[] | null>(
    conversationId ?? '',
    {
      select: useCallback(
        (data: TMessage[]) => {
          const dataTree = buildTree({ messages: data, fileMap });
          return dataTree?.length === 0 ? null : (dataTree ?? null);
        },
        [fileMap],
      ),
      enabled: !!fileMap,
    },
  );

  const chatHelpers = useChatHelpers(index, conversationId);
  const addedChatHelpers = useAddedResponse({ rootIndex: index });
  const threadId = chatHelpers.conversation?.conversationId ?? conversationId ?? null;

  useSSE(rootSubmission, chatHelpers, false);
  useSSE(addedSubmission, addedChatHelpers, true);

  const methods = useForm<ChatFormValues>({
    defaultValues: { text: '' },
  });

  let content: JSX.Element | null | undefined;
  const isLandingPage = false;

  if (isLoading && conversationId !== Constants.NEW_CONVO) {
    content = <LoadingSpinner />;
  } else {
    content = (
      <MessagesView
        messagesTree={messagesTree}
        threadId={threadId}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <AddedChatContext.Provider value={addedChatHelpers}>
          <Presentation>
            <section
              data-testid="chat-shell"
              dir={isRTL ? 'rtl' : 'ltr'}
              className="flex h-full min-h-0 w-full overflow-hidden bg-transparent"
            >
              <div
                data-testid="chat-main"
                className="mx-auto flex h-full min-h-0 w-full flex-col gap-3 bg-transparent px-0 pb-0 pt-0 sm:px-0 sm:pb-0 sm:pt-0"
              >
                <div className="sticky top-0 z-20">
                  <Header />
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 bg-transparent">
                  <div data-testid="chat-messages-frame" className="min-h-0 flex-1 bg-transparent">
                    {content}
                  </div>
                  <ChatForm index={index} />
                  <Footer />
                </div>
              </div>
            </section>
          </Presentation>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
