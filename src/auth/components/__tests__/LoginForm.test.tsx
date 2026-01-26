import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../LoginForm';
import * as useAuthHook from '../../hooks/useAuth';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const loginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthHook.useAuth as any).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: null,
    });
  });

  it('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits form with credentials', async () => {
    loginMock.mockResolvedValue({ success: true });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: 'test',
        password: 'password',
        rememberMe: false,
      });
    });
  });

  it('displays error message', () => {
    (useAuthHook.useAuth as any).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: { message: 'Invalid credentials' },
    });

    render(<LoginForm />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('handles rate limiting lockout', async () => {
    loginMock.mockResolvedValue({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        details: { retryAfter: 1000 },
      }
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      // Button should be disabled
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });
});
