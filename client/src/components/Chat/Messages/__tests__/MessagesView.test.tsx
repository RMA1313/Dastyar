import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TMessage } from 'librechat-data-provider';
import MessagesView from '../MessagesView';
import { useMessageScrolling, useScreenshot, useLocalize } from '~/hooks';

const debouncedHandleScroll = jest.fn();
const smoothScroll = jest.fn();

jest.mock('~/hooks', () => ({
  useMessageScrolling: jest.fn(),
  useScreenshot: jest.fn(),
  useLocalize: jest.fn(),
}));

jest.mock('jotai', () => ({
  useAtomValue: () => '',
}));

jest.mock('recoil', () => ({
  useRecoilValue: () => false,
}));

jest.mock('~/Providers', () => ({
  MessagesViewProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('~/store/fontSize', () => ({
  fontSizeAtom: {},
}));

jest.mock('~/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

jest.mock('~/store', () => ({
  showScrollButton: { key: 'showScrollButton' },
}));

jest.mock('../MultiMessage', () => ({ messagesTree }: { messagesTree: TMessage[] }) => (
  <div data-testid="multi-message">{messagesTree.length} messages</div>
));

jest.mock('~/components/Messages/ScrollToBottom', () => ({ scrollHandler }: { scrollHandler: () => void }) => (
  <button data-testid="scroll-to-bottom" onClick={scrollHandler}>
    scroll
  </button>
));

jest.mock('react-transition-group', () => ({
  CSSTransition: ({ in: inProp, children }: { in: boolean; children: React.ReactElement }) =>
    inProp ? children : null,
}));

describe('MessagesView', () => {
  beforeEach(() => {
    (useMessageScrolling as jest.Mock).mockReturnValue({
      conversation: { conversationId: 'c1' },
      scrollableRef: { current: null },
      messagesEndRef: { current: null },
      showScrollButton: false,
      handleSmoothToRef: smoothScroll,
      debouncedHandleScroll,
    });
    (useScreenshot as jest.Mock).mockReturnValue({
      screenshotTargetRef: { current: null },
    });
    (useLocalize as jest.Mock).mockReturnValue((key: string) => key);
  });

  it('renders a scrollable stack with spacing and scroll handling', () => {
    const messages = [
      {
        messageId: '1',
        parentMessageId: null,
        conversationId: 'c1',
        depth: 0,
        content: [],
      } as TMessage,
    ];

    render(<MessagesView messagesTree={messages} />);

    const view = screen.getByTestId('messages-view');
    const scrollArea = screen.getByTestId('messages-scroll-area');
    expect(view).toBeInTheDocument();
    expect(scrollArea).toHaveStyle({ width: '100%' });

    fireEvent.scroll(scrollArea);
    expect(debouncedHandleScroll).toHaveBeenCalled();

    const stack = scrollArea.querySelector('div.flex');
    expect(stack?.className).toContain('gap-5');
    expect(stack?.className).toContain('pb-10');
    expect(screen.getByTestId('multi-message')).toHaveTextContent('1 messages');
  });
});
