import React from 'react';
import { render, screen } from '@testing-library/react';
import Conversation from '../Convo';

jest.mock('@librechat/client', () => ({
  useToastContext: () => ({ showToast: jest.fn() }),
  useMediaQuery: () => false,
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ conversationId: 'c1' }),
}));
jest.mock('~/data-provider', () => ({
  useUpdateConversationMutation: () => ({ mutateAsync: jest.fn() }),
  useGetEndpointsQuery: () => ({ data: null }),
}));
jest.mock('~/hooks', () => ({
  useNavigateToConvo: () => ({ navigateToConvo: jest.fn() }),
  useLocalize: () => (key: string) => key,
}));
jest.mock('recoil', () => ({
  useRecoilValue: () => [],
}));
jest.mock('~/store', () => ({
  allConversationsSelector: {},
  chatDirection: {},
}));
jest.mock('../ConvoOptions', () => ({
  ConvoOptions: () => <div data-testid="convo-options" />,
}));
jest.mock('../RenameForm', () => () => <div data-testid="rename-form" />);
jest.mock('~/components/Endpoints/EndpointIcon', () => () => <div data-testid="endpoint-icon" />);

describe('Conversation layout RTL alignment', () => {
  it('keeps text right-aligned while anchoring icons on the left with consistent padding', () => {
    const conversation = {
      conversationId: 'c1',
      title: 'فرمول‌های جبر خطی',
      endpoint: 'openai',
    } as any;

    render(<Conversation conversation={conversation} retainView={jest.fn()} toggleNav={jest.fn()} />);

    const item = screen.getByTestId('convo-item');
    expect(item).toHaveAttribute('dir', 'rtl');
    expect(item.className).toContain('px-3');

    const link = screen.getByTestId('convo-link');
    expect(link.getAttribute('dir')).toBe('ltr');
    expect(screen.getByText(conversation.title)).toHaveAttribute('dir', 'rtl');

    const optionsWrapper = screen.getByTestId('convo-options').parentElement;
    expect(optionsWrapper?.className).toContain('ml-2');
  });
});
