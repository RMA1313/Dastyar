import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthLayout from '../AuthLayout';

jest.mock('~/components/Banners', () => ({
  Banner: () => <div data-testid="banner" />,
}));

jest.mock('../SocialLoginRender', () => () => <div data-testid="social-login" />);

jest.mock('../BlinkAnimation', () => ({
  BlinkAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../ThemeToggle', () => () => <div data-testid="theme-toggle" />);

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

jest.mock('~/utils/clientLog', () => ({
  logUiError: jest.fn(),
}));

describe('AuthLayout', () => {
  it('centers the auth card and omits footer links', () => {
    const { container } = render(
      <AuthLayout
        header="Welcome"
        isFetching={false}
        startupConfig={null}
        startupConfigError={null}
        pathname="/login"
        error={null}
      >
        <div>Content</div>
      </AuthLayout>,
    );

    const main = screen.getByTestId('auth-main');
    const card = screen.getByTestId('auth-card');

    expect(main).toHaveClass('flex-1', 'justify-center');
    expect(card).toHaveClass('max-w-2xl');
    expect(container.querySelector('a[href="https://ble.ir/futurists"]')).toBeNull();
  });
});
