import { StorageAdapter } from '../core/StorageAdapter';
import { EventBus } from '../core/EventBus';

export class DeviceService {
  private storage: StorageAdapter;
  private eventBus: EventBus;
  private readonly DEVICE_ID_KEY = 'device_id';

  constructor(storage: StorageAdapter, eventBus: EventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
  }

  getDeviceId(): string {
    let deviceId = this.storage.get(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      // Store device ID persistently (local storage usually)
      // Note: StorageAdapter configuration determines persistence
      this.storage.set(this.DEVICE_ID_KEY, deviceId);
      this.eventBus.emitLocal('auth:device_registered', { deviceId });
    }
    return deviceId;
  }

  getDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    // Simple heuristic for device name - in a real app, use UAParser
    if (/mobile/i.test(ua)) return 'Mobile Device';
    if (/tablet/i.test(ua)) return 'Tablet';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/Android/i.test(ua)) return 'Android Device';
    return 'Desktop';
  }

  private generateDeviceId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
