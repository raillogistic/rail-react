/**
 * Token utility functions for JWT handling and authentication management
 *
 * Purpose: Centralized token operations including decode, validation, and storage
 * Args: Various token-related operations
 * Returns: Token information, validation status, or boolean results
 * Raises: Error when token operations fail
 * Example: const isValid = isTokenValid(token)
 */

import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "./token-storage";

export interface DecodedToken {
  user_id?: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  sub?: string;
  exp: number;
  iat: number;
  permissions?: string[];
  [key: string]: any;
}

// Legacy keys (older builds wrote tokens to localStorage).
const LEGACY_ACCESS_TOKEN_KEY = "access_token";
const LEGACY_REFRESH_TOKEN_KEY = "refresh_token";

const safeLocalStorageGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageRemove = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

/**
 * Store authentication token.
 *
 * NOTE: Prefer keeping the access token in memory/session storage (see tokenStorage).
 */
export const setToken = (token: string): void => {
  try {
    tokenStorage.setAccessToken(token);
    tokenStorage.setSessionActive(true);
  } catch (error) {
    console.error("Failed to store token:", error);
  }
};

/**
 * Retrieve authentication token.
 *
 * Prefers tokenStorage and migrates any legacy localStorage token away.
 */
export const getToken = (): string | null => {
  try {
    const current = tokenStorage.getAccessToken();
    if (current) return current;

    const legacy = safeLocalStorageGet(LEGACY_ACCESS_TOKEN_KEY);
    if (legacy) {
      // Migrate away from localStorage to reduce XSS blast radius.
      tokenStorage.setAccessToken(legacy);
      safeLocalStorageRemove(LEGACY_ACCESS_TOKEN_KEY);
      // Also clear any legacy refresh token stored in localStorage.
      safeLocalStorageRemove(LEGACY_REFRESH_TOKEN_KEY);
      return legacy;
    }

    return null;
  } catch (error) {
    console.error("Failed to retrieve token:", error);
    return null;
  }
};

/**
 * Remove authentication token.
 */
export const removeToken = (): void => {
  try {
    tokenStorage.clearAllTokens();
    // Defensive cleanup of legacy keys.
    safeLocalStorageRemove(LEGACY_ACCESS_TOKEN_KEY);
    safeLocalStorageRemove(LEGACY_REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
};

/**
 * Decode JWT token and return payload
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Check if token is valid (exists and not expired)
 */
export const isTokenValid = (token?: string | null): boolean => {
  const authToken = token || getToken();
  if (!authToken) return false;

  return !isTokenExpired(authToken);
};

/**
 * Get user information from token
 */
export const getUserFromToken = (
  token?: string | null
): DecodedToken | null => {
  const authToken = token || getToken();
  if (!authToken || !isTokenValid(authToken)) return null;

  return decodeToken(authToken);
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (
  permission: string,
  token?: string | null
): boolean => {
  const user = getUserFromToken(token);
  if (!user || !user.permissions) return false;

  return user.permissions.includes(permission);
};

/**
 * Get time until token expires (in seconds)
 */
export const getTokenExpiryTime = (token?: string | null): number => {
  const authToken = token || getToken();
  if (!authToken) return 0;

  const decoded = decodeToken(authToken);
  if (!decoded) return 0;

  const currentTime = Date.now() / 1000;
  return Math.max(0, decoded.exp - currentTime);
};
