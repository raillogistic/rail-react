import type { } from '@apollo/client/errors';
import type { } from '@apollo/client/link/error';
import { } from '@apollo/client';
import { isServerOfflineError, getEnhancedErrorMessage } from '@/shared/utils/legacy-utils/offline-detector';
import { tokenStorage } from './token-storage';

/**
 * Authentication error types for better error handling
 */
export enum AuthErrorType {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Authentication error class with enhanced error information
 */
export class AuthError extends Error {
  public readonly type: AuthErrorType;
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly userMessage: string;
  public readonly shouldLogout: boolean;
  public readonly shouldRetry: boolean;
  public readonly meta?: unknown;

  constructor(
    type: AuthErrorType,
    message: string,
    userMessage: string,
    options: {
      code?: string;
      statusCode?: number;
      shouldLogout?: boolean;
      shouldRetry?: boolean;
      cause?: Error;
      meta?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.userMessage = userMessage;
    this.shouldLogout = options.shouldLogout ?? false;
    this.shouldRetry = options.shouldRetry ?? false;
    this.cause = options.cause;
    this.meta = options.meta;
  }
}

/**
 * Maps GraphQL/Apollo errors to authentication errors
 */
export function mapGraphQLError(error: any): AuthError {
  // Check for network errors
  if (error.networkError) {
    const networkError = error.networkError as any;

    // Check for server offline scenarios
    if (isServerOfflineError(error)) {
      return new AuthError(
        AuthErrorType.NETWORK_ERROR,
        'Server connection failed',
        getEnhancedErrorMessage(error, 'login'),
        { shouldRetry: true, cause: error.networkError }
      );
    }

    if (networkError.statusCode === 401) {
      return new AuthError(
        AuthErrorType.UNAUTHORIZED,
        'Authentication required',
        'Your session has expired. Please log in again.',
        { statusCode: 401, shouldLogout: true }
      );
    }

    if (networkError.statusCode === 403) {
      return new AuthError(
        AuthErrorType.FORBIDDEN,
        'Access forbidden',
        'You do not have permission to access this resource.',
        { statusCode: 403 }
      );
    }

    if (networkError.statusCode >= 500) {
      return new AuthError(
        AuthErrorType.NETWORK_ERROR,
        'Server error',
        'A server error occurred. Please try again later.',
        { statusCode: networkError.statusCode, shouldRetry: true }
      );
    }

    // Generic network error
    return new AuthError(
      AuthErrorType.NETWORK_ERROR,
      'Network error',
      'Unable to connect to the server. Please check your internet connection.',
      { shouldLogout: false, cause: error.networkError instanceof Error ? error.networkError : undefined, meta: error.networkError }
    );
  }

  // Check for GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    const extensions = graphQLError.extensions;

    // Handle token-related errors
    if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'INVALID_TOKEN') {
      return new AuthError(
        AuthErrorType.TOKEN_INVALID,
        'Invalid token',
        'Your session is invalid. Please log in again.',
        { code: extensions.code as string, shouldLogout: true }
      );
    }

    if (extensions?.code === 'TOKEN_EXPIRED') {
      return new AuthError(
        AuthErrorType.TOKEN_EXPIRED,
        'Token expired',
        'Your session has expired. Attempting to refresh...',
        { code: extensions.code as string, shouldRetry: true }
      );
    }

    if (extensions?.code === 'FORBIDDEN') {
      return new AuthError(
        AuthErrorType.FORBIDDEN,
        'Access forbidden',
        'You do not have permission to perform this action.',
        { code: extensions.code as string }
      );
    }

    // Handle validation errors
    if (extensions?.code === 'BAD_USER_INPUT' || extensions?.code === 'VALIDATION_ERROR') {
      return new AuthError(
        AuthErrorType.VALIDATION_ERROR,
        graphQLError.message,
        'Please check your input and try again.',
        { code: extensions.code as string }
      );
    }

    return new AuthError(
      AuthErrorType.UNKNOWN_ERROR,
      graphQLError.message,
      'An unexpected error occurred. Please try again.',
      { code: extensions?.code as string }
    );
  }

  return new AuthError(
    AuthErrorType.UNKNOWN_ERROR,
    error.message,
    'An unexpected error occurred. Please try again.',
    { cause: error }
  );
}

/**
 * Handles authentication errors with appropriate actions
 */
export async function handleAuthError(
  error: AuthError,
  onLogout?: () => void,
  onRetry?: () => void
): Promise<void> {
  console.error('Authentication error:', {
    type: error.type,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode
  });

  // Clear tokens and logout if required
  if (error.shouldLogout) {
    await tokenStorage.clearAllTokens();
    onLogout?.();
    return;
  }

  // Attempt retry if applicable
  if (error.shouldRetry && onRetry) {
    // Add exponential backoff for retries
    setTimeout(() => {
      onRetry();
    }, 1000);
  }
}

/**
 * Creates user-friendly error messages for different error types
 */
export function getErrorMessage(error: AuthError): string {
  switch (error.type) {
    case AuthErrorType.TOKEN_EXPIRED:
      return 'Your session has expired. Please wait while we refresh your login...';

    case AuthErrorType.TOKEN_INVALID:
    case AuthErrorType.UNAUTHORIZED:
      return 'Your session is no longer valid. Please log in again.';

    case AuthErrorType.REFRESH_FAILED:
      return 'Unable to refresh your session. Please log in again.';

    case AuthErrorType.NETWORK_ERROR:
      return 'Connection error. Please check your internet connection and try again.';

    case AuthErrorType.FORBIDDEN:
      return 'You do not have permission to access this feature.';

    case AuthErrorType.SESSION_EXPIRED:
      return 'Your session has expired due to inactivity. Please log in again.';

    case AuthErrorType.VALIDATION_ERROR:
      return error.userMessage || 'Please check your input and try again.';

    default:
      return error.userMessage || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Checks if an error should trigger a logout
 */
export function shouldLogoutOnError(error: AuthError): boolean {
  return error.shouldLogout || [
    AuthErrorType.TOKEN_INVALID,
    AuthErrorType.UNAUTHORIZED,
    AuthErrorType.REFRESH_FAILED,
    AuthErrorType.SESSION_EXPIRED
  ].includes(error.type);
}

/**
 * Checks if an error should trigger a retry
 */
export function shouldRetryOnError(error: AuthError): boolean {
  return error.shouldRetry || [
    AuthErrorType.TOKEN_EXPIRED,
    AuthErrorType.NETWORK_ERROR
  ].includes(error.type);
}
