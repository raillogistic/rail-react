import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuditService } from '../AuditService';
import { EventBus } from '../../core/EventBus';

describe('AuditService', () => {
  let auditService: AuditService;
  let eventBus: EventBus;
  const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('fetch', fetchMock);
    eventBus = new EventBus({ channelName: 'test', debounceMs: 0, enableCrossTab: false });
    auditService = new AuditService(eventBus);
    consoleSpy.mockClear();
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('logs login success events', () => {
    const payload = { user: { id: '1', email: 'test@example.com' } as any, sessionId: 's1' };
    eventBus.emitLocal('auth:login_success', payload);

    expect(consoleSpy).toHaveBeenCalledWith('[Auth Audit]', expect.objectContaining({
      event: 'auth:login_success',
      payload,
    }));
  });

  it('logs login failure events', () => {
    const payload = { error: { code: 'INVALID_CREDENTIALS' } as any, username: 'test' };
    eventBus.emitLocal('auth:login_failed', payload);

    expect(consoleSpy).toHaveBeenCalledWith('[Auth Audit]', expect.objectContaining({
      event: 'auth:login_failed',
      payload,
    }));
  });

  it('logs security violations', () => {
    const payload = { type: 'suspicious_activity', details: 'test' };
    eventBus.emitLocal('auth:security_violation', payload);

    expect(consoleSpy).toHaveBeenCalledWith('[Auth Audit]', expect.objectContaining({
      event: 'auth:security_violation',
      payload,
    }));
  });

  it('sends events to backend', async () => {
    const payload = { user: { id: '1' } as any, sessionId: 's1' };

    eventBus.emitLocal('auth:login_success', payload);

    // Allow promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/audit/'), expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: expect.stringContaining('"event":"auth:login_success"'),
    }));
  });
});
