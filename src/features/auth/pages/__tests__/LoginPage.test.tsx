import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '@/pages/auth/LoginPage';
import * as AuthContext from '@/features/auth/context';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock offline detector
vi.mock('@/shared/utils/legacy-utils/offline-detector', () => ({
  isServerOfflineError: vi.fn(),
  onOfflineStatusChange: vi.fn(() => () => {}),
  testServerConnectivity: vi.fn().mockResolvedValue(true),
}));

// Mock icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  WifiOff: () => <span data-testid="wifi-off-icon" />,
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
  Loader2: () => <span data-testid="loader-2-icon" />,
  ShieldCheck: () => <span data-testid="shield-check-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
  CheckIcon: () => <span data-testid="check-icon" />,
  // Icons used in routes/links.tsx which are imported by LoginPage indirectly
  LayoutDashboard: () => <span data-testid="dashboard-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  User: () => <span data-testid="user-icon" />,
  Smartphone: () => <span data-testid="smartphone-icon" />,
}));

// Mock MFAChallenge component to test integration without testing the component itself
type MockMFAChallengeProps = {
  onVerify: (code: string) => void;
  onCancel: () => void;
};

vi.mock('@/features/auth/components', () => ({
  MFAChallenge: ({ onVerify, onCancel }: MockMFAChallengeProps) => (
    <div data-testid="mfa-challenge">
      <button onClick={() => onVerify('123456')}>Verify</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('LoginPage', () => {
  const loginMock = vi.fn();
  const verifyMFAMock = vi.fn();
  const logoutMock = vi.fn();
  const clearErrorMock = vi.fn();

  const defaultAuthContext = {
    login: loginMock,
    verifyMFA: verifyMFAMock,
    logout: logoutMock,
    isLoading: false,
    error: null,
    clearError: clearErrorMock,
    status: 'idle',
    mfaSetupRequired: false,
    ephemeralToken: null,
    user: null,
    isAuthenticated: false,
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    refreshSession: vi.fn(),
    lastActivity: null,
    sessionExpiresAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue(
      defaultAuthContext as ReturnType<typeof AuthContext.useAuthContext>,
    );
  });

  it('renders login form by default', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Wait for the connectivity check effect to settle
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e-mail ou nom d'utilisateur/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/saisissez votre code/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mfa-challenge')).not.toBeInTheDocument();
  });

  it('renders MFA challenge when status is mfa_required', async () => {
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
      ...defaultAuthContext,
      status: 'mfa_required',
    } as ReturnType<typeof AuthContext.useAuthContext>);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Wait for the connectivity check effect to settle
    await waitFor(() => {
      expect(screen.getByTestId('mfa-challenge')).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/e-mail ou nom d'utilisateur/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /s.curit/i })).toBeInTheDocument();
  });

  it('calls verifyMFA when code is submitted', async () => {
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
      ...defaultAuthContext,
      status: 'mfa_required',
    } as ReturnType<typeof AuthContext.useAuthContext>);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(verifyMFAMock).toHaveBeenCalledWith('123456');
    });
  });

  it('calls logout when MFA is cancelled', async () => {
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
      ...defaultAuthContext,
      status: 'mfa_required',
    } as ReturnType<typeof AuthContext.useAuthContext>);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
    });
  });
});
