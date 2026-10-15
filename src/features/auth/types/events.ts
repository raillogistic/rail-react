import { AuthUser, AuthError, LogoutReason } from './auth';

export type AuthEventType =
  | 'auth:login_started' | 'auth:login_success' | 'auth:login_failed'
  | 'auth:logout' | 'auth:logout_everywhere'
  | 'auth:token_refreshed' | 'auth:token_expired' | 'auth:token_invalid' | 'auth:token_expiring'
  | 'auth:session_started' | 'auth:session_expired' | 'auth:session_extended' | 'auth:session_validated'
  | 'auth:activity_detected' | 'auth:idle_warning' | 'auth:idle_timeout'
  | 'auth:mfa_required' | 'auth:mfa_success' | 'auth:mfa_failed'
  | 'auth:rate_limited' | 'auth:security_violation' | 'auth:permission_changed'
  | 'auth:device_registered' | 'auth:device_trusted' | 'auth:device_revoked';

export interface AuthEventPayloads {
  'auth:login_started': { username: string };
  'auth:login_success': { user: AuthUser; sessionId: string };
  'auth:login_failed': { error: AuthError; username: string };
  'auth:logout': { reason: LogoutReason; userId?: string };
  'auth:logout_everywhere': { userId: string; reason: LogoutReason };
  'auth:token_refreshed': { expiresAt: Date };
  'auth:token_expired': { expiredAt: Date };
  'auth:token_invalid': { reason: string };
  'auth:token_expiring': { expiresAt: Date };
  'auth:session_started': { sessionId: string; expiresAt: Date };
  'auth:session_expired': { sessionId: string; reason: string };
  'auth:session_extended': { newExpiresAt: Date };
  'auth:session_validated': { valid: boolean };
  'auth:activity_detected': { timestamp: Date };
  'auth:idle_warning': { timeoutIn: number };
  'auth:idle_timeout': { lastActivity: Date };
  'auth:rate_limited': { retryAfter: number; key: string };
  'auth:security_violation': { type: string; details: unknown };
  'auth:permission_changed': { userId: string; newPermissions: string[] };
  'auth:mfa_required': { method: string; methods?: string[]; challengeId?: string };
  'auth:mfa_success': { method: string };
  'auth:mfa_failed': { error: AuthError };
  'auth:device_registered': { deviceId: string; deviceName: string };
  'auth:device_trusted': { deviceId: string };
  'auth:device_revoked': { deviceId: string };
}

export type AuthEventHandler<T extends AuthEventType> = (
  payload: AuthEventPayloads[T]
) => void;

export type Unsubscribe = () => void;
