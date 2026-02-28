import { AuthError } from './auth';

export interface TokenPair {
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt?: Date | null;
}

export interface TokenPayload {
  sub?: string;
  user_id?: string | number;
  userId?: string | number;
  id?: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
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
