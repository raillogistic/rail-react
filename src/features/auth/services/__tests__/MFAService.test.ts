import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MFAService } from '../MFAService';
import { StorageAdapter } from '../../core/StorageAdapter';
import { EventBus } from '../../core/EventBus';

describe('MFAService', () => {
  let mfaService: MFAService;
  let storage: StorageAdapter;
  let eventBus: EventBus;

  beforeEach(() => {
    storage = new StorageAdapter({ type: 'memory', prefix: 'test_' });
    eventBus = new EventBus({ channelName: 'test', debounceMs: 0, enableCrossTab: false });
    mfaService = new MFAService(storage, eventBus);
  });

  it('stores and retrieves ephemeral token', () => {
    const token = 'temp-token-123';
    mfaService.setEphemeralToken(token);
    expect(mfaService.getEphemeralToken()).toBe(token);
  });

  it('clears ephemeral token', () => {
    const token = 'temp-token-123';
    mfaService.setEphemeralToken(token);
    mfaService.clearEphemeralToken();
    expect(mfaService.getEphemeralToken()).toBeNull();
  });
});
