import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SessionService,
  SessionValidationIndeterminateError,
} from '../SessionService';
import { EventBus } from '../../core/EventBus';
import { AuthUser } from '../../types';

describe('SessionService', () => {
  let sessionService: SessionService;
  let eventBus: EventBus;

  const user: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    roles: [],
    permissions: []
  };

  const config = {
    validateIntervalMs: 1000,
    validateOnFocus: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus = new EventBus({ channelName: 'test', debounceMs: 0, enableCrossTab: false });
    sessionService = new SessionService(eventBus, config);
  });

  afterEach(() => {
    sessionService.destroy();
    vi.useRealTimers();
  });

  it('starts a session', () => {
    const expiresAt = new Date(Date.now() + 3600000);
    const emitSpy = vi.spyOn(eventBus, 'emit');

    sessionService.startSession(user, 'session-1', expiresAt);

    const session = sessionService.getSession();
    expect(session).not.toBeNull();
    expect(session?.id).toBe('session-1');
    expect(session?.userId).toBe('user-1');
    expect(emitSpy).toHaveBeenCalledWith('auth:session_started', expect.anything());
  });

  it('validates session periodically', async () => {
    const validateFn = vi.fn().mockResolvedValue(true);
    sessionService.setValidationFn(validateFn);

    sessionService.startSession(user, 'session-1', new Date(Date.now() + 10000));

    vi.advanceTimersByTime(1100);
    expect(validateFn).toHaveBeenCalled();
  });

  it('handles session invalidation', async () => {
    const validateFn = vi.fn().mockResolvedValue(false);
    sessionService.setValidationFn(validateFn);
    const emitSpy = vi.spyOn(eventBus, 'emit');

    sessionService.startSession(user, 'session-1', new Date(Date.now() + 10000));

    await sessionService.validateSession();

    expect(emitSpy).toHaveBeenCalledWith('auth:session_expired', expect.objectContaining({
      reason: 'server_validation_failed'
    }));
  });

  it('keeps active session when validation is indeterminate and allowed', async () => {
    const validateFn = vi.fn().mockRejectedValue(
      new SessionValidationIndeterminateError('transient network')
    );
    sessionService.setValidationFn(validateFn);
    const emitSpy = vi.spyOn(eventBus, 'emit');

    sessionService.startSession(user, 'session-1', new Date(Date.now() + 10000));
    const isValid = await sessionService.validateSession({ allowIndeterminate: true });

    expect(isValid).toBe(true);
    expect(emitSpy).not.toHaveBeenCalledWith(
      'auth:session_expired',
      expect.anything()
    );
  });

  it('detects client-side expiry', () => {
    const expiresAt = new Date(Date.now() + 1000);
    sessionService.startSession(user, 'session-1', expiresAt);

    expect(sessionService.isSessionValid()).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(sessionService.isSessionValid()).toBe(false);
  });

  it('extends session', () => {
    const expiresAt = new Date(Date.now() + 1000);
    sessionService.startSession(user, 'session-1', expiresAt);

    const newExpiresAt = new Date(Date.now() + 5000);
    sessionService.extendSession(newExpiresAt);

    expect(sessionService.getSession()?.expiresAt).toEqual(newExpiresAt);
  });
});
