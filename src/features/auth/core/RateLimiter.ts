interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
  backoffMultiplier: number;
  persistLockout: boolean;
}

interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
  consecutiveFailures: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private records = new Map<string, AttemptRecord>();
  private storageKey = 'auth_rate_limit';

  constructor(config: RateLimitConfig) {
    this.config = config;
    if (config.persistLockout) {
      this.loadFromStorage();
    }
  }

  canAttempt(key: string): boolean {
    const record = this.getRecord(key);

    // Check if locked out
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return false;
    }

    // Clear lockout if expired
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      this.reset(key);
      return true;
    }

    // Check window
    if (Date.now() - record.firstAttempt > this.config.windowMs) {
      this.reset(key);
      return true;
    }

    return record.attempts < this.config.maxAttempts;
  }

  recordAttempt(key: string, success: boolean): void {
    const record = this.getRecord(key);

    if (success) {
      this.reset(key);
      return;
    }

    record.attempts++;
    record.consecutiveFailures++;

    if (record.attempts >= this.config.maxAttempts) {
      // Calculate lockout with exponential backoff
      const backoffFactor = Math.pow(
        this.config.backoffMultiplier,
        Math.floor(record.consecutiveFailures / this.config.maxAttempts) - 1
      );
      record.lockedUntil = Date.now() + (this.config.lockoutMs * backoffFactor);
    }

    this.records.set(key, record);
    this.persistToStorage();
  }

  getRemainingAttempts(key: string): number {
    const record = this.getRecord(key);
    return Math.max(0, this.config.maxAttempts - record.attempts);
  }

  getLockoutEndTime(key: string): Date | null {
    const record = this.getRecord(key);
    return record.lockedUntil ? new Date(record.lockedUntil) : null;
  }

  reset(key: string): void {
    this.records.delete(key);
    this.persistToStorage();
  }

  private getRecord(key: string): AttemptRecord {
    return this.records.get(key) || {
      attempts: 0,
      firstAttempt: Date.now(),
      lockedUntil: null,
      consecutiveFailures: 0,
    };
  }

  private loadFromStorage(): void {
    try {
      const data = sessionStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.records = new Map(Object.entries(parsed));
      }
    } catch {}
  }

  private persistToStorage(): void {
    if (this.config.persistLockout) {
      const data = Object.fromEntries(this.records);
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }
}
