import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MFAChallenge } from '../MFAChallenge';

describe('MFAChallenge', () => {
  const onVerifyMock = vi.fn();
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillCode = (value = '123456') => {
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    value.split('').forEach((digit, idx) => {
      fireEvent.change(inputs[idx], { target: { value: digit } });
    });
  };

  it('renders TOTP method correctly', () => {
    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByRole('heading', { name: /double sécurité/i })).toBeInTheDocument();
    expect(
      screen.getByText(/application d'authentification/i)
    ).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: /double sécurité/i })).toBeInTheDocument();
    expect(screen.getByText(/envoyé à votre mobile/i)).toBeInTheDocument();
  });

  it('handles input and submission', async () => {
    onVerifyMock.mockResolvedValue(undefined);

    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    fillCode('123456');

    const submitBtn = screen.getByRole('button', { name: /valider l.?acc.s/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onVerifyMock).toHaveBeenCalledWith('123456');
    });
  });

  it('disables submit when empty', () => {
    render(
      <MFAChallenge
        method="totp"
        onVerify={onVerifyMock}
        onCancel={onCancelMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /valider l.?acc.s/i });
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

    const [submitBtn] = screen.getAllByRole('button');
    expect(submitBtn).toBeDisabled();
    screen.getAllByRole('textbox').forEach((input) => {
      expect(input).toBeDisabled();
    });
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
