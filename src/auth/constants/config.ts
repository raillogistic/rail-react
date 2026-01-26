export interface AuthConfig {
  token: {
    refreshThresholdSeconds: number;
    accessTokenTTLSeconds: number;
    refreshTokenTTLSeconds: number;
    storageType: 'memory' | 'session' | 'local' | 'cookie';
    storagePrefix: string;
    encryptTokens: boolean;
  };
  session: {
    idleTimeoutMs: number;
    idleWarningMs: number;
    validateOnFocus: boolean;
    validateIntervalMs: number;
  };
  rateLimit: {
    maxAttempts: number;
    windowMs: number;
    lockoutMs: number;
    backoffMultiplier: number;
    persistLockout: boolean;
  };
  features: {
    enableMFA: boolean;
    enableDeviceTrust: boolean;
    enableMultiTabSync: boolean;
    enableActivityTimeout: boolean;
    enableSessionValidation: boolean;
  };
  eventBus: {
    channelName: string;
    debounceMs: number;
    enableCrossTab: boolean;
  };
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  token: {
    refreshThresholdSeconds: 300,      // 5 min before expiry
    accessTokenTTLSeconds: 900,        // 15 min
    refreshTokenTTLSeconds: 604800,    // 7 days
    storageType: 'memory',
    storagePrefix: 'auth_',
    encryptTokens: false,
  },
  session: {
    idleTimeoutMs: 900_000,            // 15 min
    idleWarningMs: 120_000,            // 2 min warning
    validateOnFocus: true,
    validateIntervalMs: 60_000,        // 1 min
  },
  rateLimit: {
    maxAttempts: 5,
    windowMs: 300_000,                 // 5 min window
    lockoutMs: 900_000,                // 15 min lockout
    backoffMultiplier: 2,
    persistLockout: true,
  },
  features: {
    enableMFA: false,
    enableDeviceTrust: false,
    enableMultiTabSync: true,
    enableActivityTimeout: true,
    enableSessionValidation: true,
  },
  eventBus: {
    channelName: 'auth-events',
    debounceMs: 100,
    enableCrossTab: true,
  },
};

export function mergeConfig(partial: Partial<AuthConfig>): AuthConfig {
  return {
    token: { ...DEFAULT_AUTH_CONFIG.token, ...partial.token },
    session: { ...DEFAULT_AUTH_CONFIG.session, ...partial.session },
    rateLimit: { ...DEFAULT_AUTH_CONFIG.rateLimit, ...partial.rateLimit },
    features: { ...DEFAULT_AUTH_CONFIG.features, ...partial.features },
    eventBus: { ...DEFAULT_AUTH_CONFIG.eventBus, ...partial.eventBus },
  };
}
