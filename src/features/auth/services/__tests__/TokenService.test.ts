import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenService } from '../TokenService';
import { StorageAdapter } from '../../core/StorageAdapter';
import { EventBus } from '../../core/EventBus';
import { TokenPair } from '../../types';

// Mock legacy token storage to avoid side effects and decoding errors
vi.mock('@/shared/api/auth/token-storage', () => ({
  tokenStorage: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setSessionActive: vi.fn(),
    clearAllTokens: vi.fn(),
  }
}));

describe('TokenService', () => {
  let tokenService: TokenService;
  let storage: StorageAdapter;
  let eventBus: EventBus;

  const config = {
    refreshThresholdSeconds: 300,
    maxRetries: 3,
    retryDelayMs: 0, // No delay for tests
  };

  const mockTokens: TokenPair = {
    // Valid JWT structure
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.signature',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: new Date(Date.now() + 3600000), // 1h
    refreshTokenExpiresAt: new Date(Date.now() + 86400000), // 24h
  };

  beforeEach(() => {
    vi.useFakeTimers();
    storage = new StorageAdapter({ type: 'memory', prefix: 'test_' });
    eventBus = new EventBus({ channelName: 'test', debounceMs: 0, enableCrossTab: false });
    tokenService = new TokenService(storage, eventBus, config);
  });

  afterEach(() => {
    tokenService.destroy();
    vi.useRealTimers();
  });

  it('stores and retrieves tokens', () => {
    tokenService.setTokens(mockTokens);

    expect(tokenService.getAccessToken()).toBe(mockTokens.accessToken);
    expect(tokenService.getRefreshToken()).toBe(mockTokens.refreshToken);
    expect(storage.get('access_expires')).toBe(mockTokens.accessTokenExpiresAt.toISOString());
  });

  it('clears tokens', () => {
    tokenService.setTokens(mockTokens);
    tokenService.clearTokens();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it('checks if token is expiring', () => {
    // Expires in 10 minutes (600s). Threshold is 300s.
    const expiresAt = new Date(Date.now() + 600000);
    const tokens = { ...mockTokens, accessTokenExpiresAt: expiresAt };
    tokenService.setTokens(tokens);

    expect(tokenService.isAccessTokenExpiring()).toBe(false);

    // Advance time by 6 minutes (now 4 minutes remaining, which is < 5 min threshold)
    vi.advanceTimersByTime(360000);
    expect(tokenService.isAccessTokenExpiring()).toBe(true);
  });

  it('schedules automatic refresh warning', () => {
    const emitSpy = vi.spyOn(eventBus, 'emitLocal');
    const expiresAt = new Date(Date.now() + 600000); // 10 mins
    const tokens = { ...mockTokens, accessTokenExpiresAt: expiresAt };

    tokenService.setTokens(tokens);

    // Should warn 5 mins before expiry (at T+5min)
    vi.advanceTimersByTime(299000);
    expect(emitSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000); // Cross the threshold
    expect(emitSpy).toHaveBeenCalledWith('auth:token_expiring', { expiresAt });
  });

  it('refreshes tokens successfully', async () => {
    tokenService.setTokens(mockTokens);
    const newTokens = { ...mockTokens, accessToken: 'new-access' };
    const refreshFn = vi.fn().mockResolvedValue(newTokens);
    const emitSpy = vi.spyOn(eventBus, 'emit');

    const result = await tokenService.refreshTokens(refreshFn);

    expect(result).toEqual(newTokens);
    expect(tokenService.getAccessToken()).toBe('new-access');
    expect(emitSpy).toHaveBeenCalledWith('auth:token_refreshed', expect.anything());
  });

  it('deduplicates concurrent refresh calls', async () => {
    tokenService.setTokens(mockTokens);
    const newTokens = { ...mockTokens, accessToken: 'new-access' };

    let resolveRefresh: (val: TokenPair) => void;
    const refreshPromise = new Promise<TokenPair>(resolve => {
      resolveRefresh = resolve;
    });
    const refreshFn = vi.fn().mockReturnValue(refreshPromise);

    const p1 = tokenService.refreshTokens(refreshFn);
    const p2 = tokenService.refreshTokens(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(1);

    // @ts-ignore
    resolveRefresh(newTokens);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(r2);
  });

  it('supports cookie-based refresh when no refresh token is stored', async () => {
    const newTokens = { ...mockTokens, accessToken: 'cookie-refresh-access' };
    const refreshFn = vi.fn().mockResolvedValue(newTokens);

    const result = await tokenService.refreshTokens(refreshFn);

    expect(result.accessToken).toBe('cookie-refresh-access');
    expect(refreshFn).toHaveBeenCalledWith(null);
  });

  it('retries on failure', async () => {
    // Mock delay to resolve immediately to avoid timer issues with fake timers
    vi.spyOn(tokenService as any, 'delay').mockResolvedValue(undefined);

    tokenService.setTokens(mockTokens);
    const newTokens = { ...mockTokens, accessToken: 'retry-success' };

    const refreshFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue(newTokens);

    const result = await tokenService.refreshTokens(refreshFn);
    expect(result.accessToken).toBe('retry-success');
    expect(refreshFn).toHaveBeenCalledTimes(3);
  });
});
