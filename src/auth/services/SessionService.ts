import { EventBus } from '../core/EventBus';
import type { AuthUser } from '../types';

interface SessionConfig {
  validateIntervalMs: number;
  validateOnFocus: boolean;
}

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    ip?: string;
  };
}

export class SessionService {
  private eventBus: EventBus;
  private config: SessionConfig;
  private currentSession: Session | null = null;
  private validationInterval: NodeJS.Timeout | null = null;
  private validateFn: (() => Promise<boolean>) | null = null;

  constructor(eventBus: EventBus, config: SessionConfig) {
    this.eventBus = eventBus;
    this.config = config;

    if (config.validateOnFocus && typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleFocus.bind(this));
    }
  }

  // Start a new session
  startSession(user: AuthUser, sessionId: string, expiresAt: Date): void {
    this.currentSession = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date(),
      expiresAt,
      lastActivity: new Date(),
      deviceInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    };

    this.eventBus.emit('auth:session_started', { sessionId, expiresAt });
    this.startValidationInterval();
  }

  // Update last activity
  recordActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      this.eventBus.emitLocal('auth:activity_detected', {
        timestamp: this.currentSession.lastActivity
      });
    }
  }

  // Get current session
  getSession(): Session | null {
    return this.currentSession;
  }

  // Check if session is valid
  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    return Date.now() < this.currentSession.expiresAt.getTime();
  }

  // Set validation function
  setValidationFn(fn: () => Promise<boolean>): void {
    this.validateFn = fn;
  }

  // Validate session with server
  async validateSession(): Promise<boolean> {
    if (!this.validateFn) return this.isSessionValid();

    try {
      const isValid = await this.validateFn();
      this.eventBus.emitLocal('auth:session_validated', { valid: isValid });

      if (!isValid && this.currentSession) {
        this.eventBus.emit('auth:session_expired', {
          sessionId: this.currentSession.id,
          reason: 'server_validation_failed',
        });
      }

      return isValid;
    } catch {
      return false;
    }
  }

  // Extend session
  extendSession(newExpiresAt: Date): void {
    if (this.currentSession) {
      this.currentSession.expiresAt = newExpiresAt;
      this.eventBus.emit('auth:session_extended', { newExpiresAt });
    }
  }

  // End current session
  endSession(reason: string): void {
    if (this.currentSession) {
      this.eventBus.emit('auth:session_expired', {
        sessionId: this.currentSession.id,
        reason,
      });
    }
    this.currentSession = null;
    this.stopValidationInterval();
  }

  private startValidationInterval(): void {
    this.stopValidationInterval();
    this.validationInterval = setInterval(
      () => this.validateSession(),
      this.config.validateIntervalMs
    );
  }

  private stopValidationInterval(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  private handleFocus(): void {
    if (this.currentSession) {
      this.validateSession();
    }
  }

  destroy(): void {
    this.stopValidationInterval();
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleFocus.bind(this));
    }
  }
}
