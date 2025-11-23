import { TMessage } from 'librechat-data-provider';
import { cn, TextDirection } from '~/utils';
import Files from './Files';

const Container = ({
  children,
  message,
  direction = 'auto',
  style,
}: {
  children: React.ReactNode;
  message?: TMessage;
  direction?: TextDirection | 'auto';
  style?: React.CSSProperties;
}) => (
  <div
    className={cn(
      'text-message flex min-h-[20px] w-full flex-col gap-3 overflow-visible leading-relaxed [.text-message+&]:mt-5',
      direction === 'rtl' ? 'items-end text-right' : 'items-start text-left',
    )}
    dir={direction}
    style={style}
  >
    {message?.isCreatedByUser === true && <Files message={message} />}
    {children}
  </div>
);

export default Container;
