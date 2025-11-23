import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatView from '../ChatView';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import { useGetMessagesByConvoId } from '~/data-provider';

jest.mock('~/hooks', () => ({
  useChatHelpers: jest.fn(),
  useAddedResponse: jest.fn(),
  useSSE: jest.fn(),
}));

jest.mock('../Messages/MessagesView', () => () => <div data-testid="messages-view" />);
jest.mock('../Input/ChatForm', () => () => <div data-testid="chat-form" />);
jest.mock('../Header', () => () => (
  <div data-testid="chat-header">
    <div data-testid="navbar">
      <div data-testid="theme-toggle" />
    </div>
  </div>
));
jest.mock('../Presentation', () => ({ children }: { children: React.ReactNode }) => (
  <div data-testid="presentation">{children}</div>
));
jest.mock('../Footer', () => () => null);
jest.mock('~/components/Auth/ThemeToggle', () => () => <div data-testid="theme-toggle" />);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ conversationId: 'test-convo' }),
}));

jest.mock('~/data-provider', () => ({
  useGetMessagesByConvoId: jest.fn(),
  useGetStartupConfig: () => ({ data: null }),
}));

describe('ChatView layout', () => {
  beforeEach(() => {
    (useChatHelpers as jest.Mock).mockReturnValue({
      conversation: { conversationId: 'test-convo', endpoint: 'test' },
    });
    (useAddedResponse as jest.Mock).mockReturnValue({});
    (useSSE as jest.Mock).mockImplementation(() => {});
    (useGetMessagesByConvoId as jest.Mock).mockReturnValue({
      data: [{ messageId: '1' }],
      isLoading: false,
    });
  });

  it('fills available width/height and omits visible footer content', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <MemoryRouter>{children}</MemoryRouter>
        </RecoilRoot>
      </QueryClientProvider>
    );

    const { queryByRole } = render(<ChatView />, { wrapper });

    const shell = screen.getByTestId('chat-shell');
    const main = screen.getByTestId('chat-main');
    const messagesFrame = screen.getByTestId('chat-messages-frame');

    expect(shell).toHaveClass('h-full', 'w-full', 'min-h-0');
    expect(main).toHaveClass('w-full', 'min-h-0');
    expect(messagesFrame).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden');
    expect(screen.getByTestId('messages-view')).toBeInTheDocument();
    expect(screen.getAllByTestId('theme-toggle').length).toBe(1);
    expect(screen.getByTestId('theme-toggle').closest('[data-testid="navbar"]')).not.toBeNull();
    const column = messagesFrame.parentElement;
    expect(column?.lastElementChild?.getAttribute('data-testid')).toBe('chat-form');
    expect(queryByRole('contentinfo')).toBeNull();
  });
});
