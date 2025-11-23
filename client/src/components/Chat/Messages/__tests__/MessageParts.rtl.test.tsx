import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageParts from '../MessageParts';
import type { TMessage } from 'librechat-data-provider';

jest.mock('~/hooks', () => ({
  useMessageHelpers: () => ({
    edit: false,
    index: 0,
    agent: null,
    isLast: true,
    enterEdit: jest.fn(),
    assistant: { name: 'GPT' },
    handleScroll: jest.fn(),
    conversation: { endpoint: 'openai', model: 'gpt', iconURL: '', conversationId: 'c1' },
    isSubmitting: false,
    latestMessage: null,
    handleContinue: jest.fn(),
    copyToClipboard: jest.fn(),
    regenerateMessage: jest.fn(),
  }),
  useLocalize: () => (key: string) => key,
  useAttachments: () => ({ attachments: [], searchResults: [] }),
}));

jest.mock('~/components/Chat/Messages/Content/ContentParts', () => () => (
  <div data-testid="content-parts">content</div>
));
jest.mock('../MessageIcon', () => () => <div data-testid="message-icon" />);
jest.mock('../SiblingSwitch', () => () => <div data-testid="sibling-switch" />);
jest.mock('../MultiMessage', () => () => null);
jest.mock('../HoverButtons', () => () => <div data-testid="hover-buttons" />);
jest.mock('../SubRow', () => ({ children }: { children: React.ReactNode }) => (
  <div data-testid="sub-row">{children}</div>
));
jest.mock('jotai', () => ({
  useAtomValue: () => 'text-sm',
}));

const mockUseRecoilValue = jest.fn();

jest.mock('recoil', () => ({
  useRecoilValue: (...args: unknown[]) => mockUseRecoilValue(...args),
}));

jest.mock('~/store/fontSize', () => ({
  fontSizeAtom: {},
}));

jest.mock('~/utils', () => {
  const direction = jest.requireActual('~/utils/direction');
  return {
    ...direction,
    cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  };
});

const storeMock = {
  chatDirection: { key: 'chatDirection' },
  maximizeChatSpace: { key: 'maximizeChatSpace' },
};

jest.mock('~/store', () => storeMock);

const baseMessage: TMessage = {
  messageId: 'm1',
  parentMessageId: null,
  conversationId: 'c1',
  depth: 0,
  content: [],
};

describe('MessageParts RTL', () => {
  beforeEach(() => {
    mockUseRecoilValue.mockImplementation((atom) => {
      if (atom === storeMock.chatDirection) {
        return 'rtl';
      }
      if (atom === storeMock.maximizeChatSpace) {
        return false;
      }
      return null;
    });
  });

  it('aligns assistant message RTL with bubble and icon on the right', () => {
    render(
      <MessageParts
        message={{ ...baseMessage, isCreatedByUser: false }}
        siblingIdx={0}
        siblingCount={0}
        setSiblingIdx={jest.fn()}
        currentEditId={null}
        setCurrentEditId={jest.fn()}
      />,
    );

    const wrapper = screen.getByTestId('message-wrapper');
    const bubble = screen.getByTestId('message-bubble');

    expect(wrapper).toHaveAttribute('dir', 'rtl');
    expect(bubble.className).toContain('text-right');
  });

  it('aligns user message RTL to the right', () => {
    render(
      <MessageParts
        message={{ ...baseMessage, isCreatedByUser: true }}
        siblingIdx={0}
        siblingCount={0}
        setSiblingIdx={jest.fn()}
        currentEditId={null}
        setCurrentEditId={jest.fn()}
      />,
    );

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble.className).toContain('text-right');
  });

  it('forces RTL direction when assistant text is Persian even if layout is LTR', () => {
    mockUseRecoilValue.mockImplementation((atom) => {
      if (atom === storeMock.chatDirection) {
        return 'ltr';
      }
      if (atom === storeMock.maximizeChatSpace) {
        return false;
      }
      return null;
    });

    render(
      <MessageParts
        message={{ ...baseMessage, isCreatedByUser: false, text: 'سلام دنیا' }}
        siblingIdx={0}
        siblingCount={0}
        setSiblingIdx={jest.fn()}
        currentEditId={null}
        setCurrentEditId={jest.fn()}
      />,
    );

    const wrapper = screen.getByTestId('message-wrapper');
    const bubble = screen.getByTestId('message-bubble');

    expect(wrapper).toHaveAttribute('dir', 'rtl');
    expect(bubble).toHaveStyle({ textAlign: 'right' });
    expect(bubble.className).toContain('text-right');
  });
});
