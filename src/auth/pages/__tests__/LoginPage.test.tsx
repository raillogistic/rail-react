import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../LoginPage';
import * as AuthContext from '@/auth/context';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock offline detector
vi.mock('@/utils/offline-detector', () => ({
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
  // Icons used in routes/links.tsx which are imported by LoginPage indirectly
  LayoutDashboard: () => <span data-testid="dashboard-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  User: () => <span data-testid="user-icon" />,
  Smartphone: () => <span data-testid="smartphone-icon" />,
}));

// Mock MFAChallenge component to test integration without testing the component itself
vi.mock('@/auth/components', () => ({
  MFAChallenge: ({ onVerify, onCancel }: any) => (
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
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue(defaultAuthContext as any);
  });

  it('renders login form by default', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Wait for the connectivity check effect to settle
    await waitFor(() => {
      expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mfa-challenge')).not.toBeInTheDocument();
  });

  it('renders MFA challenge when status is mfa_required', async () => {
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
      ...defaultAuthContext,
      status: 'mfa_required',
    } as any);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Wait for the connectivity check effect to settle
    await waitFor(() => {
      expect(screen.getByTestId('mfa-challenge')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/nom d'utilisateur/i)).not.toBeInTheDocument();
    expect(screen.getByText('Double authentification')).toBeInTheDocument();
  });

  it('calls verifyMFA when code is submitted', async () => {
    vi.spyOn(AuthContext, 'useAuthContext').mockReturnValue({
      ...defaultAuthContext,
      status: 'mfa_required',
    } as any);

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
    } as any);

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
