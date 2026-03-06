import { EventBus } from '../core/EventBus';
import type { AuthEventType } from '../types';
import {
  getAuthorizationHeader,
  getSecureHeaders,
} from '@/shared/api/auth/token-storage';
import { getRuntimeBackendConfig } from '@/shared/config/backend-endpoint';

const AUDIT_EVENTS: AuthEventType[] = [
  'auth:login_success',
  'auth:login_failed',
  'auth:logout',
  'auth:mfa_success',
  'auth:mfa_failed',
  'auth:device_trusted',
  'auth:device_revoked',
  'auth:session_expired',
  'auth:security_violation'
];

const AUDIT_ENDPOINT_PATH = '/api/v1/audit/';

const getAuditEndpoint = (): string => {
  const { backendUrl } = getRuntimeBackendConfig();
  return new URL(AUDIT_ENDPOINT_PATH, `${backendUrl}/`).toString();
};

export class AuditService {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    AUDIT_EVENTS.forEach(event => {
      this.eventBus.on(event, (payload) => {
        this.logEvent(event, payload);
      });
    });
  }

  private logEvent(event: AuthEventType, payload: any): void {
    // In a real application, this would send data to a backend audit endpoint
    // or a logging service like Sentry/Datadog

    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      payload,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // For now, we'll just log to console in development or test
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.debug('[Auth Audit]', auditEntry);
    }

    // Placeholder for sending to backend
    this.sendToBackend(auditEntry);
  }

  private async sendToBackend(entry: any): Promise<void> {
    try {
      const authorizationHeader = getAuthorizationHeader();
      await fetch(getAuditEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
          ...getSecureHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(entry)
      });
    } catch (e) {
      // Fail silently to not disrupt the user flow, but log error
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send audit log', e);
      }
    }
  }
}
