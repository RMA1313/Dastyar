import React from 'react';
import { render, screen } from '@testing-library/react';
import SharedView from '../ShareView';
import { useGetSharedMessages } from 'librechat-data-provider/react-query';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ shareId: 'abc123' }),
}));

jest.mock('librechat-data-provider', () => ({
  buildTree: ({ messages }: { messages: unknown[] }) => messages,
}));

jest.mock('librechat-data-provider/react-query', () => ({
  useGetSharedMessages: jest.fn(),
}));

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
  useDocumentTitle: jest.fn(),
}));

jest.mock('recoil', () => ({
  useRecoilState: () => ['fa-IR', jest.fn()],
}));

jest.mock('~/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({ data: {} }),
}));

jest.mock('~/Providers', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactMock = require('react');
  return {
    ShareContext: {
      Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
        <div data-testid="share-context" data-value={JSON.stringify(value)}>
          {children}
        </div>
      ),
    },
  };
});

jest.mock('~/store', () => ({
  lang: { key: 'lang' },
}));

jest.mock('~/components/Nav/SettingsTabs/General/General', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />,
  LangSelector: () => <div data-testid="lang-selector" />,
}));

jest.mock('@librechat/client', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactMock = require('react');
  return {
    Spinner: () => <div data-testid="spinner" />,
    Button: (props: Record<string, unknown>) => <button {...props} />,
    ThemeContext: ReactMock.createContext({ theme: 'light', setTheme: jest.fn() }),
    OGDialog: ({ children }: { children: unknown }) => <div>{children}</div>,
    OGDialogTitle: ({ children }: { children: unknown }) => <div>{children}</div>,
    OGDialogHeader: ({ children }: { children: unknown }) => <div>{children}</div>,
    OGDialogContent: ({ children }: { children: unknown }) => <div>{children}</div>,
    OGDialogTrigger: ({ children }: { children: unknown }) => <>{children}</>,
    useMediaQuery: () => false,
  };
});

jest.mock('../MessagesView', () => () => <div data-testid="share-messages" />);
jest.mock('../ShareArtifacts', () => ({
  ShareArtifactsContainer: ({ mainContent }: { mainContent: React.ReactNode }) => (
    <>{mainContent}</>
  ),
}));

describe('ShareView', () => {
  beforeEach(() => {
    (useGetSharedMessages as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        title: 'Shared conversation',
        conversationId: 'c1',
        createdAt: '2024-01-01T00:00:00.000Z',
        messages: [{ messageId: '1' }],
      },
    });
  });

  it('renders shared view without any visible footer', () => {
    const { queryByRole } = render(<SharedView />);

    expect(screen.getByTestId('share-view')).toBeInTheDocument();
    expect(screen.getByTestId('share-messages')).toBeInTheDocument();
    expect(queryByRole('contentinfo')).toBeNull();
  });
});
