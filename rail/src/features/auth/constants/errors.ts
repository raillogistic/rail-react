import { AuthError, AuthErrorCode } from '../types/auth';

export class AuthErrorImpl extends Error implements AuthError {
  code: AuthErrorCode;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;

  constructor(
    code: AuthErrorCode,
    message: string,
    options: {
      details?: Record<string, unknown>;
      recoverable?: boolean;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = options.details;
    this.timestamp = new Date();
    this.recoverable = options.recoverable ?? true;
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  static fromError(error: unknown, fallbackCode: AuthErrorCode = 'UNKNOWN_ERROR'): AuthErrorImpl {
    if (error instanceof AuthErrorImpl) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new AuthErrorImpl(fallbackCode, message, { cause: error });
  }
}

export const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'The username or password you entered is incorrect.',
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed attempts.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token.',
  TOKEN_EXPIRED: 'Authentication token has expired.',
  REFRESH_FAILED: 'Failed to refresh authentication session.',
  MFA_REQUIRED: 'Multi-factor authentication is required.',
  MFA_INVALID: 'Invalid multi-factor authentication code.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  SERVER_ERROR: 'An internal server error occurred.',
  PERMISSION_DENIED: 'You do not have permission to access this resource.',
  CSRF_INVALID: 'Invalid security token.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

export function createAuthError(
  code: AuthErrorCode,
  details?: Record<string, unknown>
): AuthErrorImpl {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  const recoverable = code !== 'ACCOUNT_DISABLED' && code !== 'ACCOUNT_LOCKED';

  return new AuthErrorImpl(code, message, {
    details,
    recoverable,
  });
}
