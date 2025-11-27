import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import OtpVerification from '../OtpVerification';

const mockNavigate = jest.fn();
let mockLocationState: Record<string, unknown> | undefined;

jest.mock('@dastyar/client', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Spinner: () => <div data-testid="spinner" />,
}));

const mockMutate = jest.fn();
jest.mock('~/data-provider', () => ({
  useRequestOtpMutation: jest.fn(() => ({ mutate: mockMutate, isLoading: false })),
}));

const mockLogin = jest.fn();
const mockSetError = jest.fn();
jest.mock('~/hooks/AuthContext', () => ({
  useAuthContext: jest.fn(() => ({
    login: mockLogin,
    error: undefined,
    setError: mockSetError,
  })),
}));

jest.mock('~/utils/clientLog', () => ({
  logOtpEvent: jest.fn(),
  logUiError: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

describe('OtpVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = undefined;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('redirects to login when no phone is provided', async () => {
    mockLocationState = {};

    render(<OtpVerification />);
    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits OTP with normalized phone and referral code', () => {
    const expiresAt = Date.now() + 1_000;
    mockLocationState = {
      phone: '+1 (234) 567-8901',
      flow: 'register',
      referralCode: 'ref-123',
      expiresAt,
    };

    const { container } = render(<OtpVerification />);
    const inputs = screen.getAllByRole('textbox');

    inputs.forEach((input, idx) => {
      fireEvent.change(input, { target: { value: String(idx + 1) } });
    });

    const form = container.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    expect(mockLogin).toHaveBeenCalledWith({
      phone: '12345678901',
      otp: '12345',
      flow: 'register',
      referralCode: 'ref-123',
    });
  });

  it('requests a new OTP when resend is tapped after expiry', () => {
    mockLocationState = {
      phone: '12345678901',
      flow: 'login',
      referralCode: 'CODE123',
      expiresAt: Date.now() - 1_000,
    };

    const { container } = render(<OtpVerification />);
    const resendButton = container.querySelector('button[type="button"]') as HTMLButtonElement;

    fireEvent.click(resendButton);

    expect(mockMutate).toHaveBeenCalledWith({
      phone: '12345678901',
      flow: 'login',
      referralCode: 'CODE123',
    });
    expect(mockSetError).toHaveBeenCalledWith(undefined);
  });
});
