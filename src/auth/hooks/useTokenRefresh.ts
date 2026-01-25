/**
 * Token refresh hook for automatic silent token renewal
 * 
 * Purpose: Monitors token expiry and automatically refreshes tokens
 * Args: None (hook usage)
 * Returns: Token refresh utilities and status
 * Raises: None (handles errors internally)
 * Example: const { isRefreshing } = useTokenRefresh()
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { tokenStorage, shouldRefreshToken } from '../utils/token-storage';
import { getUserFromToken, isTokenValid } from '../utils/token';
import {
  REFRESH_TOKEN_MUTATION_RESOLVED,
  type RefreshTokenResponse,
  type RefreshTokenVariables
} from '@/graphql/mutations';
import client from '@/graphql/apollo-client';

interface UseTokenRefreshReturn {
  isRefreshing: boolean;
  refreshToken: () => Promise<boolean>;
  scheduleRefresh: () => void;
  clearRefreshTimer: () => void;
}

/**
 * Hook for automatic token refresh management
 */
export const useTokenRefresh = (
  onTokenRefreshed?: (user: ReturnType<typeof getUserFromToken>) => void | Promise<void>,
  onRefreshFailed?: () => void
): UseTokenRefreshReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshTokenRef = useRef<(() => Promise<boolean>) | null>(null);

  // GraphQL mutation for token refresh
  const [refreshTokenMutation] = useMutation<RefreshTokenResponse, RefreshTokenVariables>(
    REFRESH_TOKEN_MUTATION_RESOLVED,
    { client }
  );

  /**
   * Clear any existing refresh timer
   */
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Schedule automatic token refresh based on token expiry
   */
  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer();

    const token = tokenStorage.getAccessToken();
    if (!token || !isTokenValid(token)) {
      return;
    }

    const timeLeftMs = tokenStorage.getAccessTokenTimeToExpiry();
    if (timeLeftMs <= 0) {
      return;
    }

    // Trigger refresh once we enter the refresh window.
    const refreshWindowMs = 5 * 60 * 1000;
    const refreshDelayMs = Math.max(0, timeLeftMs - refreshWindowMs);

    refreshTimerRef.current = setTimeout(() => {
      if (tokenStorage.hasValidSession()) {
        void refreshTokenRef.current?.();
      }
    }, refreshDelayMs);
  }, [clearRefreshTimer]);

  /**
   * Perform token refresh using GraphQL mutation
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      console.log('🔄 Token refresh already in progress, skipping...');
      return false;
    }

    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      const storedRefreshToken = tokenStorage.getRefreshToken();
      console.log('🔄 Starting token refresh...');
      console.log(
        '  - Refresh token available:',
        storedRefreshToken ? 'YES (legacy/fallback)' : 'NO (cookie-based)'
      );

      console.log('🔄 Calling refresh token mutation...');
      const { data } = await refreshTokenMutation({
        // Prefer cookie-based refresh; fall back to a stored refresh token when present.
        variables: { refresh_token: storedRefreshToken ?? null },
      });

      console.log('🔄 Refresh mutation response:', data ? 'SUCCESS' : 'NO_DATA');

      if (!data?.refresh_token?.ok || !data.refresh_token.token) {
        console.warn('❌ Token refresh failed - no data received');
        onRefreshFailed?.();
        return false;
      }

      const { token, refresh_token: newRefreshToken } = data.refresh_token;
      console.log('✅ New tokens received, updating storage...');

      // Update stored tokens securely
      tokenStorage.setAccessToken(token);
      if (newRefreshToken) {
        tokenStorage.setRefreshToken(newRefreshToken);
      }
      tokenStorage.setSessionActive(true);

      // Notify parent component of successful refresh
      if (onTokenRefreshed) {
        const user = getUserFromToken(token);
        await Promise.resolve(onTokenRefreshed(user));
      }

      // Schedule the next refresh based on the newly issued token.
      scheduleRefresh();

      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      onRefreshFailed?.();
      return false;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refreshTokenMutation, onTokenRefreshed, onRefreshFailed, scheduleRefresh]);

  refreshTokenRef.current = refreshToken;

  /**
   * Monitor token expiry and schedule refresh
   */
  useEffect(() => {
    const checkTokenStatus = () => {
      const hasSession = tokenStorage.hasValidSession();

      if (!hasSession) {
        clearRefreshTimer();
        return;
      }

      if (shouldRefreshToken()) {
        // Token needs refresh soon
        void refreshToken();
        return;
      }

      // Schedule refresh for later
      scheduleRefresh();
    };

    // Check immediately
    checkTokenStatus();

    // Set up periodic checks every 5 minutes (more frequent for longer-lived tokens)
    const intervalId = setInterval(checkTokenStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, refreshToken, scheduleRefresh]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearRefreshTimer();
      isRefreshingRef.current = false;
    };
  }, [clearRefreshTimer]);

  return {
    isRefreshing,
    refreshToken,
    scheduleRefresh,
    clearRefreshTimer,
  };
};
