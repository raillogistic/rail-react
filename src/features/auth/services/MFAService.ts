import { StorageAdapter } from '../core/StorageAdapter';
import { EventBus } from '../core/EventBus';
import type { MFAChallenge, MFAMethod } from '../types/mfa';

export class MFAService {
  private storage: StorageAdapter;
  private eventBus: EventBus;
  private readonly EPHEMERAL_TOKEN_KEY = 'mfa_ephemeral_token';

  constructor(storage: StorageAdapter, eventBus: EventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
  }

  setEphemeralToken(token: string): void {
    // Store temporarily in memory/session for the verification step
    this.storage.set(this.EPHEMERAL_TOKEN_KEY, token);
  }

  getEphemeralToken(): string | null {
    return this.storage.get(this.EPHEMERAL_TOKEN_KEY);
  }

  clearEphemeralToken(): void {
    this.storage.remove(this.EPHEMERAL_TOKEN_KEY);
  }

  // In a real app, this might verify the code locally if using something like TOTP client-side (unlikely)
  // or just facilitate the process.
  // Mostly this service acts as a state holder for the intermediate MFA stage.
}
