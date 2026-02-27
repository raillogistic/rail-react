import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../context/AuthProvider';
import { AuthUser, TokenPair } from '../../types';
import { tokenStorage, AUTH_SESSION_EVENT } from '@/shared/api/auth/token-storage';

// Mock legacy token storage to avoid side effects and decoding errors
vi.mock('@/shared/api/auth/token-storage', () => ({
  tokenStorage: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setSessionActive: vi.fn(),
    clearAllTokens: vi.fn(),
    getAccessToken: vi.fn().mockReturnValue(null),
    getRefreshToken: vi.fn().mockReturnValue(null),
    hasValidSession: vi.fn().mockReturnValue(false),
  },
  AUTH_SESSION_EVENT: 'auth-session-change',
}));

describe('useAuth', () => {
  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    roles: [],
    permissions: []
  };

  const mockTokens: TokenPair = {
    // Valid JWT structure: header.payload.signature
    // Header: {"alg":"HS256","typ":"JWT"}
    // Payload: {"sub":"user-1","exp":9999999999}
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.signature',
    refreshToken: 'refresh',
    accessTokenExpiresAt: new Date(Date.now() + 3600000),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000),
  };

  const onLogin = vi.fn().mockResolvedValue({
    success: true,
    user: mockUser,
    tokens: mockTokens,
    sessionId: 'session-1'
  });

  const onLogout = vi.fn().mockResolvedValue(undefined);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider
      config={{ token: { storageType: 'memory' } }}
      onLogin={onLogin}
      onLogout={onLogout}
    >
      {children}
    </AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear(); // Clear storage to prevent RateLimiter lockout persistence
  });

  it('provides authentication state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state might be loading or already settled depending on timing
    // We mainly want to ensure it has the correct structure
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isLoading');

    // If we wait, it should definitely settle to unauthenticated (since no token)
    if (result.current.isLoading) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    }

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('performs login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: 'test', password: 'password' });
    });

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({
      username: 'test',
      password: 'password',
      deviceId: expect.any(String),
      deviceName: expect.any(String),
    }));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('performs logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: 'test', password: 'password' });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(tokenStorage.clearAllTokens).toHaveBeenCalled();
    expect(onLogout.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(tokenStorage.clearAllTokens).mock.invocationCallOrder[0],
    );
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('does not call remote logout on session invalidation events', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: 'test', password: 'password' });
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(AUTH_SESSION_EVENT, {
          detail: { isActive: false },
        }),
      );
      await Promise.resolve();
    });

    expect(onLogout).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('clears error', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Simulate an error state if possible, or just check the function exists
    expect(result.current.clearError).toBeDefined();

    act(() => {
      result.current.clearError();
    });

    // Since we can't easily inject an error into the manager from here without mocking internals,
    // we just verify it doesn't crash.
    // Ideally we would mock AuthenticationManager to verify clearError is called.
  });
});
