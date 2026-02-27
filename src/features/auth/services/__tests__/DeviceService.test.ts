import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeviceService } from '../DeviceService';
import { StorageAdapter } from '../../core/StorageAdapter';
import { EventBus } from '../../core/EventBus';

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let storage: StorageAdapter;
  let eventBus: EventBus;

  beforeEach(() => {
    storage = new StorageAdapter({ type: 'memory', prefix: 'test_' });
    eventBus = new EventBus({ channelName: 'test', debounceMs: 0, enableCrossTab: false });
    deviceService = new DeviceService(storage, eventBus);
  });

  it('generates and stores a new device ID', () => {
    const emitSpy = vi.spyOn(eventBus, 'emitLocal');
    const deviceId = deviceService.getDeviceId();

    expect(deviceId).toBeDefined();
    expect(deviceId.length).toBeGreaterThan(0);
    expect(storage.get('device_id')).toBe(deviceId);
    expect(emitSpy).toHaveBeenCalledWith('auth:device_registered', {
      deviceId,
      deviceName: 'Desktop',
    });
  });

  it('retrieves existing device ID', () => {
    const existingId = 'existing-device-id';
    storage.set('device_id', existingId);

    const emitSpy = vi.spyOn(eventBus, 'emitLocal');
    const deviceId = deviceService.getDeviceId();

    expect(deviceId).toBe(existingId);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('detects device name (basic)', () => {
    // Mock userAgent if possible, but it's read-only on navigator usually.
    // We can rely on the fallback or default behavior in Node environment (vitest)
    // where navigator might be mocked or minimal.

    const name = deviceService.getDeviceName();
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });
});
