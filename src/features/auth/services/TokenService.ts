import { StorageAdapter } from '../core/StorageAdapter';
import { EventBus } from '../core/EventBus';
import type { TokenPair, TokenPayload, TokenRefreshConfig } from '../types';
import { tokenStorage } from '@/shared/api/auth/token-storage';
import { jwtDecode } from 'jwt-decode';

export class TokenService {
  private storage: StorageAdapter;
  private eventBus: EventBus;
  private config: TokenRefreshConfig;
  private refreshPromise: Promise<TokenPair> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(
    storage: StorageAdapter,
    eventBus: EventBus,
    config: TokenRefreshConfig
  ) {
    this.storage = storage;
    this.eventBus = eventBus;
    this.config = config;
  }

  // Store tokens securely
  setTokens(tokens: TokenPair): void {
    // Pass expiration for persistent storage types (like cookie)
    this.storage.set('access_token', tokens.accessToken, { expires: tokens.accessTokenExpiresAt });
    this.storage.set('refresh_token', tokens.refreshToken, { expires: tokens.refreshTokenExpiresAt });
    this.storage.set('access_expires', tokens.accessTokenExpiresAt.toISOString());
    this.storage.set('refresh_expires', tokens.refreshTokenExpiresAt.toISOString());

    // Sync with legacy tokenStorage for Apollo Client compatibility
    tokenStorage.setAccessToken(tokens.accessToken);
    tokenStorage.setRefreshToken(tokens.refreshToken);
    tokenStorage.setSessionActive(true);

    this.scheduleRefresh(tokens.accessTokenExpiresAt);
  }

  // Sync tokens from storage to legacy handler (for page reload)
  syncFromStorage(): void {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
      tokenStorage.setSessionActive(true);
    }
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.storage.get('access_token');
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return this.storage.get('refresh_token');
  }

  // Decode JWT without verification (client-side)
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  // Check if access token is expired or expiring soon
  isAccessTokenExpiring(): boolean {
    const expiresStr = this.storage.get('access_expires');
    if (!expiresStr) return true;

    const expiresAt = new Date(expiresStr);
    const thresholdMs = this.config.refreshThresholdSeconds * 1000;
    return Date.now() >= expiresAt.getTime() - thresholdMs;
  }

  // Refresh tokens (with deduplication)
  async refreshTokens(
    refreshFn: (refreshToken: string | null) => Promise<TokenPair>
  ): Promise<TokenPair> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();

    this.refreshPromise = this.executeRefresh(refreshFn, refreshToken);

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(
    refreshFn: (token: string | null) => Promise<TokenPair>,
    refreshToken: string | null
  ): Promise<TokenPair> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const tokens = await refreshFn(refreshToken);
        this.setTokens(tokens);
        this.eventBus.emit('auth:token_refreshed', {
          expiresAt: tokens.accessTokenExpiresAt
        });
        return tokens;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelayMs * (attempt + 1));
        }
      }
    }

    this.eventBus.emit('auth:token_expired', { expiredAt: new Date() });
    if (lastError) throw lastError;
    throw new Error('Token refresh failed');
  }

  // Schedule automatic refresh
  private scheduleRefresh(expiresAt: Date): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const refreshAt = expiresAt.getTime() - (this.config.refreshThresholdSeconds * 1000);
    const delay = Math.max(0, refreshAt - Date.now());

    this.refreshTimer = setTimeout(() => {
      this.eventBus.emitLocal('auth:token_expiring', { expiresAt });
    }, delay);
  }

  // Clear all tokens
  clearTokens(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.storage.remove('access_token');
    this.storage.remove('refresh_token');
    this.storage.remove('access_expires');
    this.storage.remove('refresh_expires');

    // Sync with legacy tokenStorage
    tokenStorage.clearAllTokens();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}
