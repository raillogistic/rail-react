import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MFAChallenge } from '../MFAChallenge';

describe('MFAChallenge', () => {
  const onVerifyMock = vi.fn();
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TOTP method correctly', () => {
    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByText('Authenticator App')).toBeInTheDocument();
    expect(screen.getByText(/enter the code from your authenticator app/i)).toBeInTheDocument();
  });

  it('renders SMS method correctly', () => {
    render(
      <MFAChallenge
        method="sms"
        hint="1234"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByText('SMS Verification')).toBeInTheDocument();
    expect(screen.getByText(/ending in 1234/i)).toBeInTheDocument();
  });

  it('handles input and submission', () => {
    onVerifyMock.mockResolvedValue(undefined);

    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    const input = screen.getByLabelText('Verification Code');
    fireEvent.change(input, { target: { value: '123456' } });

    const submitBtn = screen.getByRole('button', { name: 'Verify' });
    fireEvent.click(submitBtn);

    expect(onVerifyMock).toHaveBeenCalledWith('123456');
  });

  it('disables submit when empty', () => {
    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Verify' });
    expect(submitBtn).toBeDisabled();
  });

  it('shows loading state', () => {
    render(
      <MFAChallenge
        method="totp"
        isLoading={true}
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
    expect(screen.getByLabelText('Verification Code')).toBeDisabled();
  });

  it('shows error message', () => {
    render(
      <MFAChallenge
        method="totp"
        error="Invalid code"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });
});
