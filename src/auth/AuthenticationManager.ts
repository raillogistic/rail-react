import { EventBus } from './core/EventBus';
import { StorageAdapter } from './core/StorageAdapter';
import { RateLimiter } from './core/RateLimiter';
import { TokenService } from './services/TokenService';
import { SessionService } from './services/SessionService';
import { PermissionService } from './services/PermissionService';
import { DeviceService } from './services/DeviceService';
import { MFAService } from './services/MFAService';
import { AuditService } from './services/AuditService';
import type {
  AuthConfig, AuthState, AuthUser, LoginCredentials,
  AuthResult, LogoutOptions, TokenPair, TokenPayload
} from './types';
import { DEFAULT_AUTH_CONFIG, mergeConfig } from './constants/config';

export class AuthenticationManager {
  private config: AuthConfig;
  private eventBus: EventBus;
  private storage: StorageAdapter;
  private rateLimiter: RateLimiter;
  public tokenService: TokenService;
  public sessionService: SessionService;
  private permissionService: PermissionService;
  public deviceService: DeviceService;
  public mfaService: MFAService;
  private auditService: AuditService;

  private state: AuthState = {
    status: 'idle',
    user: null,
    error: null,
    isAuthenticated: false,
    isLoading: false,
    lastActivity: null,
    sessionExpiresAt: null,
  };

  private stateListeners = new Set<(state: AuthState) => void>();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = mergeConfig(config);

    // Initialize core services
    this.eventBus = new EventBus(this.config.eventBus);
    this.storage = new StorageAdapter({
      type: this.config.token.storageType,
      prefix: this.config.token.storagePrefix,
      encrypt: this.config.token.encryptTokens,
    });
    // Device storage should be persistent (localStorage)
    const deviceStorage = new StorageAdapter({
      type: 'local',
      prefix: 'device_',
      encrypt: false, // Device ID usually doesn't need encryption, but could be added
    });

    this.rateLimiter = new RateLimiter(this.config.rateLimit);

    // Initialize application services
    this.tokenService = new TokenService(this.storage, this.eventBus, {
      refreshThresholdSeconds: this.config.token.refreshThresholdSeconds,
      maxRetries: 3,
      retryDelayMs: 1000,
    });
    this.sessionService = new SessionService(this.eventBus, {
      validateIntervalMs: this.config.session.validateIntervalMs,
      validateOnFocus: this.config.session.validateOnFocus,
    });
    this.permissionService = new PermissionService();
    this.deviceService = new DeviceService(deviceStorage, this.eventBus);
    this.mfaService = new MFAService(this.storage, this.eventBus);
    this.auditService = new AuditService(this.eventBus);

    this.setupEventHandlers();
  }

  // Initialize and check existing session
  async initialize(): Promise<void> {
    this.updateState({ status: 'loading', isLoading: true });

    // Check default storage first
    let accessToken = this.tokenService.getAccessToken();

    // If not found, check LocalStorage (Handle "Remember Me" persistence)
    if (!accessToken) {
      this.storage.updateConfig({ type: 'local' });
      const localToken = this.tokenService.getAccessToken();

      if (localToken) {
        accessToken = localToken;
        // Keep config as 'local' to maintain "Remember Me" session
      } else {
        // Revert to default config
        this.storage.updateConfig({ type: this.config.token.storageType });
      }
    }

    if (!accessToken) {
      this.updateState({
        status: 'unauthenticated',
        isLoading: false
      });
      return;
    }

    // Ensure legacy token storage is hydrated for Apollo Client
    this.tokenService.syncFromStorage();

    // Validate existing session
    const isValid = await this.sessionService.validateSession();
    if (isValid) {
      const payload = this.tokenService.decodeToken(accessToken);
      if (payload) {
        this.updateState({
          status: 'authenticated',
          isAuthenticated: true,
          isLoading: false,
          user: this.extractUserFromPayload(payload),
        });
        return;
      }
    }

    // Session invalid, clear and set unauthenticated
    this.tokenService.clearTokens();
    this.updateState({
      status: 'unauthenticated',
      isLoading: false
    });
  }

  // Login
  async login(
    credentials: LoginCredentials,
    loginFn: (
      creds: LoginCredentials,
    ) => Promise<
      | { success: true; user: AuthUser; tokens: TokenPair; sessionId: string }
      | { success: false; requiresMFA: true; ephemeralToken: string }
    >,
  ): Promise<AuthResult> {
    const { username } = credentials;

    // Enhance credentials with device info
    const enhancedCredentials = {
      ...credentials,
      deviceId: credentials.deviceId || this.deviceService.getDeviceId(),
      deviceName: credentials.deviceName || this.deviceService.getDeviceName(),
    };

    // Check rate limit
    if (!this.rateLimiter.canAttempt(username)) {
      const lockoutEnd = this.rateLimiter.getLockoutEndTime(username);
      this.eventBus.emit('auth:rate_limited', {
        retryAfter: lockoutEnd ? lockoutEnd.getTime() - Date.now() : 0,
        key: username,
      });
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many login attempts. Please try again later.',
          timestamp: new Date(),
          recoverable: true,
        },
      };
    }

    this.updateState({ status: 'loading', isLoading: true });
    this.eventBus.emit('auth:login_started', { username });

    try {
      const result = await loginFn(enhancedCredentials);

      if (!result.success && result.requiresMFA) {
        this.mfaService.setEphemeralToken(result.ephemeralToken);
        this.updateState({ status: 'mfa_required', isLoading: false });
        this.eventBus.emit('auth:mfa_required', { method: 'totp' }); // Defaulting to TOTP for now
        return { success: false, requiresMFA: true };
      }

      if (result.success) {
        const { user, tokens, sessionId } = result;

        // Handle Remember Me - switch storage persistence if requested
        if (credentials.rememberMe) {
          this.storage.updateConfig({ type: 'local' });
        } else {
          // Revert to default config if not remember me (or ensure it's session/memory)
          this.storage.updateConfig({ type: this.config.token.storageType });
        }

        // Success
        this.rateLimiter.reset(username);
        this.tokenService.setTokens(tokens);
        this.sessionService.startSession(
          user,
          sessionId,
          tokens.accessTokenExpiresAt,
        );
        this.permissionService.setPermissions(user.permissions, user.roles);

        this.updateState({
          status: 'authenticated',
          isAuthenticated: true,
          isLoading: false,
          user,
          sessionExpiresAt: tokens.accessTokenExpiresAt,
          error: null,
        });

        this.eventBus.emit('auth:login_success', { user, sessionId });
        return { success: true, user };
      }

      throw new Error('Unexpected login result');

    } catch (error) {
      this.rateLimiter.recordAttempt(username, false);

      const authError = {
        code: 'INVALID_CREDENTIALS' as const,
        message: 'Invalid username or password',
        timestamp: new Date(),
        recoverable: true,
      };

      this.updateState({
        status: 'error',
        isLoading: false,
        error: authError,
      });

      this.eventBus.emit('auth:login_failed', { error: authError, username });
      return { success: false, error: authError };
    }
  }

  async verifyMFA(
    code: string,
    verifyFn: (code: string, ephemeralToken: string) => Promise<{ user: AuthUser; tokens: TokenPair; sessionId: string }>
  ): Promise<AuthResult> {
    const ephemeralToken = this.mfaService.getEphemeralToken();
    if (!ephemeralToken) {
      return {
        success: false,
        error: {
          code: 'MFA_INVALID',
          message: 'Session expired. Please log in again.',
          timestamp: new Date(),
          recoverable: false
        }
      };
    }

    this.updateState({ isLoading: true });

    try {
      const { user, tokens, sessionId } = await verifyFn(code, ephemeralToken);

      // Success
      this.mfaService.clearEphemeralToken();
      this.tokenService.setTokens(tokens);
      this.sessionService.startSession(user, sessionId, tokens.accessTokenExpiresAt);
      this.permissionService.setPermissions(user.permissions, user.roles);

      this.updateState({
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        user,
        sessionExpiresAt: tokens.accessTokenExpiresAt,
        error: null,
      });

      this.eventBus.emit('auth:login_success', { user, sessionId });
      return { success: true, user };

    } catch (error) {
      const authError = {
        code: 'MFA_INVALID' as const,
        message: 'Invalid verification code',
        timestamp: new Date(),
        recoverable: true,
      };

      this.updateState({
        status: 'mfa_required', // Stay in MFA state
        isLoading: false,
        error: authError,
      });

      return { success: false, error: authError };
    }
  }

  // Logout
  async logout(options: LogoutOptions = {}): Promise<void> {
    const userId = this.state.user?.id;
    const reason = options.reason || 'user_initiated';

    this.tokenService.clearTokens();
    this.sessionService.endSession(reason);
    this.permissionService.invalidate();

    this.updateState({
      status: 'unauthenticated',
      isAuthenticated: false,
      user: null,
      error: null,
      sessionExpiresAt: null,
    });

    if (!options.silent) {
      this.eventBus.emit('auth:logout', { reason, userId });
    }
  }

  // Clear error state
  clearError(): void {
    this.updateState({ error: null });
  }

  // Get current state
  getState(): AuthState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Permission checks
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  hasRole(role: string): boolean {
    return this.permissionService.hasRole(role);
  }

  // Event subscription
  on<T extends import('../types').AuthEventType>(
    event: T,
    handler: (payload: import('../types').AuthEventPayloads[T]) => void
  ): () => void {
    return this.eventBus.on(event, handler);
  }

  // Cleanup
  destroy(): void {
    this.eventBus.destroy();
    this.tokenService.destroy();
    this.sessionService.destroy();
  }

  private updateState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach(listener => listener(this.state));
  }

  private setupEventHandlers(): void {
    // Handle cross-tab logout
    this.eventBus.on('auth:logout', () => {
      if (this.state.isAuthenticated) {
        this.logout({ silent: true, reason: 'forced_logout' });
      }
    });

    // Handle token refresh
    this.eventBus.on('auth:token_refreshed', ({ expiresAt }) => {
      this.updateState({ sessionExpiresAt: expiresAt });
    });
  }

  private extractUserFromPayload(payload: TokenPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email || '',
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
