/**
 * Authentication guard utilities for verifying user authentication status
 * 
 * Purpose: Centralized authentication verification and route protection logic
 * Args: Token and route information for validation
 * Returns: Boolean authentication status or redirect information
 * Raises: AuthenticationError when authentication fails
 * Example: const canAccess = checkAuthStatus()
 */

import { isTokenValid, getUserFromToken, hasPermission } from './token';
import { tokenStorage } from './token-storage';
import { DEFAULT_APP_ROUTE, isProtectedRoute } from "@/routes/links";

export class AuthenticationError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface AuthGuardResult {
  isAuthenticated: boolean;
  shouldRedirect: boolean;
  redirectTo?: string;
  user?: any;
  error?: string;
}

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  return isTokenValid();
};

/**
 * Get current authenticated user information
 */
export const getCurrentUser = () => {
  return getUserFromToken();
};

/**
 * Check authentication status and determine routing action
 */
export const checkAuthStatus = (currentPath: string): AuthGuardResult => {
  const token = tokenStorage.getAccessToken();
  const isValidToken = isTokenValid(token);
  const requiresAuth = isProtectedRoute(currentPath);

  // If route requires auth but user is not authenticated
  if (requiresAuth && !isValidToken) {
    return {
      isAuthenticated: false,
      shouldRedirect: true,
      redirectTo: '/login',
      error: 'Authentication required',
    };
  }

  // If user is authenticated but trying to access login page
  if (isValidToken && currentPath === '/login') {
    return {
      isAuthenticated: true,
      shouldRedirect: true,
      redirectTo: DEFAULT_APP_ROUTE,
      user: getUserFromToken(token),
    };
  }

  // Normal authenticated access
  if (isValidToken) {
    return {
      isAuthenticated: true,
      shouldRedirect: false,
      user: getUserFromToken(token),
    };
  }

  // Public route access (no auth required)
  return {
    isAuthenticated: false,
    shouldRedirect: false,
  };
};

/**
 * Verify user has required permission for a resource
 */
export const checkPermission = (permission: string): boolean => {
  if (!isAuthenticated()) {
    throw new AuthenticationError('User not authenticated', 'NOT_AUTHENTICATED');
  }

  return hasPermission(permission);
};

/**
 * Require authentication - throws error if not authenticated
 */
export const requireAuth = (): void => {
  if (!isAuthenticated()) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }
};

/**
 * Require specific permission - throws error if not authorized
 */
export const requirePermission = (permission: string): void => {
  requireAuth();

  if (!checkPermission(permission)) {
    throw new AuthenticationError(
      `Permission '${permission}' required`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
};

/**
 * Check if current session is about to expire (within 5 minutes)
 */
export const isSessionExpiringSoon = (): boolean => {
  const token = tokenStorage.getAccessToken();
  if (!token || !isTokenValid(token)) return false;

  const user = getUserFromToken(token);
  if (!user) return false;

  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = user.exp - currentTime;

  // Return true if token expires within 5 minutes (300 seconds)
  return timeUntilExpiry <= 300 && timeUntilExpiry > 0;
};
