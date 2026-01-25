/**
 * Authentication hook for managing user authentication state
 * 
 * Purpose: Provides authentication context and methods to components
 * Args: None (hook usage)
 * Returns: Authentication state and methods (login, logout, user info)
 * Raises: AuthenticationError when authentication operations fail
 * Example: const { user, login, logout, isLoading } = useAuth()
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import {
  getUserFromToken,
  isTokenValid,
  type DecodedToken
} from '../utils/token';
import { AuthenticationError } from '../utils/authGuard';
import { tokenStorage } from '../utils/token-storage';
import { useTokenRefresh } from './useTokenRefresh';
import { useSessionValidation } from './useSessionValidation';
import { AuthError, AuthErrorType, mapGraphQLError, handleAuthError } from '../utils/error-handler';
import { performLogoutCleanupWithRetry } from '../utils/apollo-cleanup';
import { LOGIN_MUTATION, LoginResponse, LoginVariables, REFRESH_TOKEN_MUTATION, RefreshTokenResponse, RefreshTokenVariables, LOGOUT_MUTATION, LogoutResponse } from '@/graphql/mutations';
import client from '@/graphql/apollo-client';
import { DEFAULT_APP_ROUTE, ROUTES } from "@/routes/links";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshAuth: () => void;
  isRefreshing: boolean;
  isValidating: boolean;
}

export type UseAuthReturn = AuthState & AuthActions;

const normalizePermissions = (permissions: unknown): string[] => {
  if (!permissions) {
    return [];
  }
  if (Array.isArray(permissions)) {
    return permissions.filter((perm): perm is string => typeof perm === 'string');
  }
  return [];
};

const normalizeUser = (
  user: Partial<DecodedToken> | null | undefined
): DecodedToken | null => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    permissions: normalizePermissions(user.permissions),
  } as DecodedToken;
};

/**
 * Custom hook for authentication management
 */
export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();

  // GraphQL mutations
  const [loginMutation] = useMutation<LoginResponse, LoginVariables>(LOGIN_MUTATION, {
    client: client,
  });

  const [refreshTokenMutation] = useMutation<RefreshTokenResponse, RefreshTokenVariables>(
    REFRESH_TOKEN_MUTATION,
    { client }
  );
  const [logoutMutation] = useMutation<LogoutResponse>(LOGOUT_MUTATION, { client });

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Forward declaration for logout function to avoid initialization order issues
  const logoutRef = useRef<(() => Promise<void>) | null>(null);

  // Memoized callbacks for token refresh hook
  const onTokenRefreshed = useCallback((user: any) => {
    const normalizedUser = normalizeUser(user);
    tokenStorage.setSessionActive(true);
    // Update state when token is refreshed
    setState(prev => ({
      ...prev,
      user: normalizedUser,
      isAuthenticated: !!normalizedUser,
    }));
  }, []);

  const onRefreshFailed = useCallback(() => {
    // Handle refresh failure by logging out
    if (logoutRef.current) {
      logoutRef.current();
    }
  }, []);

  // Token refresh hook for automatic renewal
  const { isRefreshing, refreshToken: performTokenRefresh } = useTokenRefresh(
    onTokenRefreshed,
    onRefreshFailed
  );

  // Session validation hook for startup validation
  const { isValidating, validateSession, validationError, wasAborted } = useSessionValidation();


  /**
   * Initialize authentication state from stored token
   * Enhanced with synchronous state loading and asynchronous validation
   */
  const initializeAuth = useCallback(async () => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 150; // Minimum loading time to prevent flashing

    // Helper function to ensure minimum loading time
    const ensureMinimumLoadingTime = async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }
    };

    const hasStoredSession = tokenStorage.hasValidSession();

    if (!hasStoredSession) {
      await ensureMinimumLoadingTime();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      console.log('🔄 Starting authentication initialization (Cookie-based)...');

      // Validate session with backend (cookies are sent automatically)
      const userData = await validateSession();

      if (userData) {
        console.log('✅ Session validation successful');
        const normalizedUser = normalizeUser(userData);
        tokenStorage.setSessionActive(true);
        await ensureMinimumLoadingTime();
        setState({
          user: normalizedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Session validation failed - don't show error during initialization
        // This could be due to network issues, backend offline, or actual session expiry
        console.log('❌ Session validation failed (or no session)');

        await ensureMinimumLoadingTime();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null, 
        });
      }

    } catch (error: unknown) {
      console.error('Auth initialization error:', error);
      
      const authError = new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        (error as Error).message || 'Authentication initialization failed',
        'Failed to initialize authentication. Please try logging in again.',
        { shouldLogout: true, cause: error }
      );

      await ensureMinimumLoadingTime();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: authError,
      });
    }
  }, [validateSession]);

  /**
   * Logout user and clear authentication state with comprehensive cleanup
   */
  const logout = useCallback(async () => {
    console.log('Starting logout process...');

    try {
      await logoutMutation();
    } catch (mutationError) {
      console.warn('Backend logout failed', mutationError);
    } finally {
      tokenStorage.clearAllTokens();
    }

    try {
      const cleanupSuccess = await performLogoutCleanupWithRetry(3);

      if (!cleanupSuccess) {
        console.warn('Apollo cache cleanup may not have completed fully');
      }
    } catch (cleanupError) {
      console.warn('Apollo cache cleanup threw an error', cleanupError);
    }

    // Update authentication state
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    console.log('Logout completed successfully');
    navigate(ROUTES.LOGIN);
  }, [logoutMutation, navigate]);

  // Assign logout function to ref after definition
  logoutRef.current = logout;

  /**
   * Login user with credentials using GraphQL mutation
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data } = await loginMutation({
        variables: credentials,
      });
      if (!data?.login) {
        const error = new AuthError(
          AuthErrorType.VALIDATION_ERROR,
          'Login failed - no data received',
          'Login failed. Please check your credentials and try again.'
        );
        setState(prev => ({ ...prev, isLoading: false, error }));
        return;
      }

      const { ok, errors, token, refresh_token: refreshTokenValue, user: loginUser } = data.login;

      if (ok === false || !loginUser) {
        const error = new AuthError(
          AuthErrorType.VALIDATION_ERROR,
          errors?.[0] || 'Authentication failed',
          errors?.[0] || 'Login failed. Please check your credentials and try again.'
        );
        tokenStorage.clearAllTokens();
        tokenStorage.setSessionActive(false);
        setState(prev => ({ ...prev, isLoading: false, error }));
        return;
      }

      // Persist tokens (cookies from backend + client fallback for Authorization header)
      if (token) {
        tokenStorage.setAccessToken(token);
      }
      if (refreshTokenValue) {
        tokenStorage.setRefreshToken(refreshTokenValue);
      }

      tokenStorage.setSessionActive(true);
      let user = normalizeUser(loginUser); // Use user from login response directly

      try {
        // Immediately refresh the session from backend so settings (theme, layout, ...)
        // are available without waiting for a reload.
        const currentUser = await validateSession();
        if (currentUser) {
          user = normalizeUser(currentUser) || user;
        }
      } catch (sessionError) {
        console.warn('Unable to load user session after login:', sessionError);
      }

      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });

      navigate(DEFAULT_APP_ROUTE);

    } catch (error: unknown) {
      console.error('Login error:', error);

      const authError = (error instanceof Error && (error.hasOwnProperty('networkError') || error.hasOwnProperty('graphQLErrors')))
        ? mapGraphQLError(error)
        : new AuthError(
          AuthErrorType.UNKNOWN_ERROR,
          (error as Error).message || 'Login failed',
          'Login failed. Please check your credentials and try again.',
          { cause: error }
        );

      setState(prev => ({ ...prev, isLoading: false, error: authError }));

      // Handle error with appropriate actions
      await handleAuthError(authError, logout);
    }
  }, [loginMutation, navigate, logout, validateSession]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh authentication token using GraphQL mutation
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // We don't need to pass refresh_token explicitly if it's in a cookie
      const { data } = await refreshTokenMutation({
        variables: { refresh_token: null }, // Optional now
      });

      if (!data?.refresh_token) {
        return false;
      }

      // Cookies updated by backend

      // Update user state with new token info if needed (usually just validity)
      // The user object might be returned or we might need to re-fetch 'me'
      // But typically refresh just keeps the session alive.
      // If we want to update the user object, we should call validateSession or use returned user.
      const user = normalizeUser(data.refresh_token.user);
      tokenStorage.setSessionActive(true);
      
      setState(prev => ({
        ...prev,
        user: user || prev.user, // Update if returned, else keep
        isAuthenticated: true,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [refreshTokenMutation]);

  /**
   * Refresh authentication state (useful for manual token refresh)
   */
  const refreshAuth = useCallback(async () => {
    // Just try to validate session, if that fails, try refresh
    const user = await validateSession();
    if (user) {
      tokenStorage.setSessionActive(true);
      await initializeAuth();
    } else {
      // Try to refresh the token
      const refreshed = await performTokenRefresh();

      if (!refreshed) {
        // Refresh failed, logout user
        await logout();
      }
    }
  }, [initializeAuth, performTokenRefresh, logout, validateSession]);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    ...state,
    login,
    logout,
    clearError,
    refreshAuth,
    isRefreshing, // Expose refresh status
    isValidating,
  };
};
