import { AuthError } from './auth';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface TokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  iat: number;
  exp: number;
  jti?: string;
  sessionId?: string;
  deviceId?: string;
}

export interface TokenStorageConfig {
  storageType: 'memory' | 'session' | 'local' | 'cookie';
  encryptionKey?: string;
  prefix: string;
  secure: boolean;
}

export interface TokenRefreshConfig {
  refreshThresholdSeconds: number;
  maxRetries: number;
  retryDelayMs: number;
  onRefreshError?: (error: AuthError) => void;
}
