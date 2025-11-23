import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { useAuthContext, useLocalize } from '~/hooks';
import type { TMessageProps, TMessageIcon } from '~/common';
import MinimalHoverButtons from '~/components/Chat/Messages/MinimalHoverButtons';
import Icon from '~/components/Chat/Messages/MessageIcon';
import SearchContent from './Content/SearchContent';
import { fontSizeAtom } from '~/store/fontSize';
import SearchButtons from './SearchButtons';
import SubRow from './SubRow';
import { cn } from '~/utils';
import store from '~/store';

const MessageAvatar = ({ iconData }: { iconData: TMessageIcon }) => (
  <div className="relative flex flex-shrink-0 flex-col items-center">
    <div className="pt-0.5">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/80 shadow-md shadow-black/5 backdrop-blur-md dark:bg-white/10 dark:shadow-black/25">
        <Icon iconData={iconData} />
      </div>
    </div>
  </div>
);

const MessageBody = ({ message, messageLabel, fontSize }) => (
  <div
    className={cn(
      'relative flex w-auto max-w-[80%] flex-col text-right sm:max-w-[70%]',
      message.isCreatedByUser ? 'items-end' : 'items-end',
    )}
    style={{ unicodeBidi: 'plaintext', whiteSpace: 'normal', wordBreak: 'break-word' }}
  >
    <div className={cn('select-none text-sm font-semibold', fontSize)}>{messageLabel}</div>
    <div className="mt-1 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-right shadow-md shadow-black/5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:shadow-black/25">
      <SearchContent message={message} />
    </div>
    <SubRow classes="text-xs justify-end">
      <MinimalHoverButtons message={message} />
      <SearchButtons message={message} />
    </SubRow>
  </div>
);

export default function SearchMessage({ message }: Pick<TMessageProps, 'message'>) {
  const fontSize = useAtomValue(fontSizeAtom);
  const UsernameDisplay = useRecoilValue<boolean>(store.UsernameDisplay);
  const { user } = useAuthContext();
  const localize = useLocalize();

  const iconData: TMessageIcon = useMemo(
    () => ({
      endpoint: message?.endpoint ?? '',
      model: message?.model ?? '',
      iconURL: message?.iconURL ?? '',
      isCreatedByUser: message?.isCreatedByUser ?? false,
    }),
    [message?.endpoint, message?.model, message?.iconURL, message?.isCreatedByUser],
  );

  const messageLabel = useMemo(() => {
    if (message?.isCreatedByUser) {
      return UsernameDisplay
        ? (user?.name ?? '') || (user?.username ?? '')
        : localize('com_user_message');
    }
    return message?.sender ?? '';
  }, [
    message?.isCreatedByUser,
    message?.sender,
    UsernameDisplay,
    user?.name,
    user?.username,
    localize,
  ]);

  if (!message) {
    return null;
  }

  return (
    <div className="text-token-text-primary w-full bg-transparent" dir="rtl">
      <div className="p-2 md:gap-6">
        <div className="final-completion group mr-0 ml-auto flex flex-1 flex-row-reverse items-start gap-3 md:max-w-3xl md:px-3 lg:max-w-[40rem] lg:px-2 xl:max-w-[48rem] xl:px-3">
          <MessageAvatar iconData={iconData} />
          <MessageBody message={message} messageLabel={messageLabel} fontSize={fontSize} />
        </div>
      </div>
    </div>
  );
}
