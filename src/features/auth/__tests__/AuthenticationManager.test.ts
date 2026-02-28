import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthenticationManager } from '../AuthenticationManager';
import { LoginCredentials, AuthUser, TokenPair } from '../types';
import { SessionValidationIndeterminateError } from '../services/SessionService';

// Mock legacy token storage
vi.mock('@/shared/api/auth/token-storage', () => ({
  tokenStorage: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setSessionActive: vi.fn(),
    clearAllTokens: vi.fn(),
    getAccessToken: vi.fn().mockReturnValue(null),
    getRefreshToken: vi.fn().mockReturnValue(null),
  }
}));

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['profile:read']
  };

  const mockTokens: TokenPair = {
    // Valid JWT structure
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.signature',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: new Date(Date.now() + 3600),
    refreshTokenExpiresAt: new Date(Date.now() + 7200),
  };

  const loginFn = vi.fn().mockResolvedValue({
    success: true,
    user: mockUser,
    tokens: mockTokens,
    sessionId: 'session-1'
  });

  beforeEach(() => {
    // Clear storage
    sessionStorage.clear();

    // Mock token decoding
    // We need to mock TokenService.decodeToken or ensure the token string is valid enough to be decoded by atob
    // A simple mock of atob might be needed if running in environment without it, but vitest/jsdom has it.
    // However, the real TokenService tries to decode.
    // "access.payload.sig" -> split('.') -> payload is b64 encoded.
    // Let's make a valid-ish JWT structure
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: mockUser.id,
      email: mockUser.email,
      roles: mockUser.roles,
      permissions: mockUser.permissions,
      exp: Date.now() / 1000 + 3600
    }));
    mockTokens.accessToken = `${header}.${payload}.sig`;

    authManager = new AuthenticationManager({
      token: { storageType: 'memory' },
      rateLimit: { persistLockout: false },
      eventBus: {
        channelName: 'auth-events-test',
        debounceMs: 0,
        enableCrossTab: false,
      },
    });
  });

  afterEach(() => {
    authManager.destroy();
  });

  it('starts in idle state', () => {
    expect(authManager.getState().status).toBe('idle');
  });

  it('handles successful login', async () => {
    const credentials: LoginCredentials = { username: 'test', password: 'password' };

    const result = await authManager.login(credentials, loginFn);

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);

    const state = authManager.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe('authenticated');

    expect(authManager.hasPermission('profile:read')).toBe(true);
  });

  it('handles login failure', async () => {
    const error = new Error('Invalid creds');
    const failLoginFn = vi.fn().mockRejectedValue(error);

    const result = await authManager.login(
      { username: 'test', password: 'wrong' },
      failLoginFn
    );

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    expect(authManager.getState().isAuthenticated).toBe(false);
  });

  it('correctly maps specific errors', async () => {
    // Network Error
    let error = new Error('Network Error');
    let failLoginFn = vi.fn().mockRejectedValue(error);
    let result = await authManager.login({ username: 'test', password: 'p' }, failLoginFn);
    expect(result.error?.code).toBe('NETWORK_ERROR');

    // Rate Limit Error
    error = new Error('Rate limit exceeded');
    failLoginFn = vi.fn().mockRejectedValue(error);
    result = await authManager.login({ username: 'test', password: 'p' }, failLoginFn);
    expect(result.error?.code).toBe('RATE_LIMITED');

    // Server Error
    error = new Error('Internal Server Error');
    failLoginFn = vi.fn().mockRejectedValue(error);
    result = await authManager.login({ username: 'test', password: 'p' }, failLoginFn);
    expect(result.error?.code).toBe('SERVER_ERROR');

    // Account Locked
    error = new Error('Account is locked');
    failLoginFn = vi.fn().mockRejectedValue(error);
    result = await authManager.login({ username: 'test', password: 'p' }, failLoginFn);
    expect(result.error?.code).toBe('ACCOUNT_LOCKED');
    expect(result.error?.recoverable).toBe(false);
  });

  it('handles null user from verifyFn gracefully', async () => {
    // Setup MFA state
    authManager.mfaService.setEphemeralToken('temp-token');

    // Mock verifyFn returning null user (simulating backend issue)
    const badVerifyFn = vi.fn().mockResolvedValue({
      success: true,
      user: null, // This causes the manual throw
      tokens: mockTokens,
      sessionId: 'session-1'
    });

    const result = await authManager.verifyMFA('123456', badVerifyFn as any);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SERVER_ERROR');
    expect(result.error?.message).toContain('no user data returned');
  });

  it('reports useful error message when login returns success but no user', async () => {
    // Mock loginFn returning success but null user
    const badLoginFn = vi.fn().mockResolvedValue({
      success: true,
      user: null,
      tokens: mockTokens,
      sessionId: 'session-1'
    });

    const result = await authManager.login({ username: 'u', password: 'p' }, badLoginFn as any);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SERVER_ERROR');
    expect(result.error?.message).toContain("no user data returned");
  });

  it('enforces rate limiting', async () => {
    const creds = { username: 'spammer', password: 'pwd' };
    const failLoginFn = vi.fn().mockRejectedValue(new Error('fail'));

    // Fail 5 times (default limit)
    for (let i = 0; i < 5; i++) {
      await authManager.login(creds, failLoginFn);
    }

    // 6th attempt should be blocked by manager before calling loginFn
    const result = await authManager.login(creds, failLoginFn);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RATE_LIMITED');
    // loginFn called 5 times, not 6
    expect(failLoginFn).toHaveBeenCalledTimes(5);
  });

  it('initializes from storage', async () => {
    // Setup storage with valid token
    authManager.tokenService.setTokens(mockTokens);

    // Mock session validation
    authManager.sessionService.setValidationFn(async () => true);

    await authManager.initialize();

    expect(authManager.getState().isAuthenticated).toBe(true);
    expect(authManager.getState().user?.id).toBe(mockUser.id);
    expect(authManager.sessionService.getSession()?.userId).toBe(mockUser.id);
    expect(authManager.hasPermission('profile:read')).toBe(true);
  });

  it('does not authenticate expired tokens during bootstrap validation', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        permissions: mockUser.permissions,
        exp: Math.floor(Date.now() / 1000) - 60,
      })
    );
    const expiredAccessToken = `${header}.${payload}.sig`;

    authManager.tokenService.setTokens({
      ...mockTokens,
      accessToken: expiredAccessToken,
      accessTokenExpiresAt: new Date(Date.now() - 60_000),
    });
    authManager.sessionService.setValidationFn(async () => true);

    await authManager.initialize();

    expect(authManager.getState().isAuthenticated).toBe(false);
    expect(authManager.getState().status).toBe('unauthenticated');
    expect(authManager.tokenService.getAccessToken()).toBeNull();
  });

  it('keeps session active during bootstrap when validation is indeterminate', async () => {
    authManager.tokenService.setTokens(mockTokens);
    authManager.sessionService.setValidationFn(async () => {
      throw new SessionValidationIndeterminateError('transient network issue');
    });

    await authManager.initialize();

    expect(authManager.getState().isAuthenticated).toBe(true);
    expect(authManager.getState().status).toBe('authenticated');
    expect(authManager.tokenService.getAccessToken()).toBe(mockTokens.accessToken);
  });

  it('logs out', async () => {
    await authManager.login({ username: 'u', password: 'p' }, loginFn);
    expect(authManager.getState().isAuthenticated).toBe(true);

    await authManager.logout();

    expect(authManager.getState().isAuthenticated).toBe(false);
    expect(authManager.getState().user).toBeNull();
    expect(authManager.tokenService.getAccessToken()).toBeNull();
  });

  it('transitions to unauthenticated when session expires', async () => {
    await authManager.login({ username: 'u', password: 'p' }, loginFn);
    expect(authManager.getState().isAuthenticated).toBe(true);

    authManager.sessionService.endSession('server_validation_failed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(authManager.getState().isAuthenticated).toBe(false);
    expect(authManager.getState().status).toBe('unauthenticated');
  });

  it('does not persist remember-me token artifacts in local storage', async () => {
    const result = await authManager.login({ username: 'u', password: 'p', rememberMe: true }, loginFn);

    expect(result.success).toBe(true);
    expect(localStorage.getItem('auth_access_token')).toBeNull();
    expect(localStorage.getItem('auth_refresh_token')).toBeNull();
    expect(localStorage.getItem('auth_remember_me')).toBeNull();
  });
});
