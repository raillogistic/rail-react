export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  settings?: {
    theme?: string;
    mode?: string;
    layout?: string;
    sidebar_collapse_mode?: string;
    font_size?: string;
    font_family?: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
}

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'mfa_required'
  | 'session_expired'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: AuthError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: Date | null;
  sessionExpiresAt: Date | null;
  mfaSetupRequired?: boolean;
  ephemeralToken?: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceName?: string;
  deviceId?: string;
}

export interface MFAChallenge {
  challengeId: string;
  method: 'totp' | 'email' | 'sms' | 'webauthn';
  hint?: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  requiresMFA?: boolean;
  mfaSetupRequired?: boolean;
  mfaChallenge?: MFAChallenge;
  error?: AuthError;
}

export interface LogoutOptions {
  everywhere?: boolean;
  reason?: LogoutReason;
  silent?: boolean;
}

export type LogoutReason =
  | 'user_initiated'
  | 'session_expired'
  | 'idle_timeout'
  | 'security_violation'
  | 'account_disabled'
  | 'password_changed'
  | 'forced_logout';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DISABLED'
  | 'SESSION_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'REFRESH_FAILED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'PERMISSION_DENIED'
  | 'CSRF_INVALID'
  | 'UNKNOWN_ERROR';
