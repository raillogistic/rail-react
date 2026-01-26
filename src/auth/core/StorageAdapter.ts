type StorageType = 'memory' | 'session' | 'local' | 'cookie';

interface StorageAdapterConfig {
  type: StorageType;
  prefix: string;
  encrypt?: boolean;
  encryptionKey?: string;
}

export class StorageAdapter {
  private config: StorageAdapterConfig;
  private memoryStore = new Map<string, string>();

  constructor(config: StorageAdapterConfig) {
    this.config = config;
  }

  updateConfig(partial: Partial<StorageAdapterConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  get(key: string): string | null {
    const fullKey = this.config.prefix + key;
    let value: string | null = null;

    switch (this.config.type) {
      case 'memory':
        value = this.memoryStore.get(fullKey) || null;
        break;
      case 'session':
        value = sessionStorage.getItem(fullKey);
        break;
      case 'local':
        value = localStorage.getItem(fullKey);
        break;
      case 'cookie':
        value = this.getCookie(fullKey);
        break;
    }

    if (value && this.config.encrypt) {
      value = this.decrypt(value);
    }

    return value;
  }

  set(key: string, value: string, options?: { expires?: Date }): void {
    const fullKey = this.config.prefix + key;
    let storedValue = value;

    if (this.config.encrypt) {
      storedValue = this.encrypt(value);
    }

    switch (this.config.type) {
      case 'memory':
        this.memoryStore.set(fullKey, storedValue);
        break;
      case 'session':
        sessionStorage.setItem(fullKey, storedValue);
        break;
      case 'local':
        localStorage.setItem(fullKey, storedValue);
        break;
      case 'cookie':
        this.setCookie(fullKey, storedValue, options?.expires);
        break;
    }
  }

  remove(key: string): void {
    const fullKey = this.config.prefix + key;

    switch (this.config.type) {
      case 'memory':
        this.memoryStore.delete(fullKey);
        break;
      case 'session':
        sessionStorage.removeItem(fullKey);
        break;
      case 'local':
        localStorage.removeItem(fullKey);
        break;
      case 'cookie':
        this.deleteCookie(fullKey);
        break;
    }
  }

  clear(): void {
    switch (this.config.type) {
      case 'memory':
        this.memoryStore.clear();
        break;
      default:
        // Clear only prefixed keys
        this.getAllKeys().forEach(key => this.remove(key));
    }
  }

  private encrypt(value: string): string {
    // Simple base64 for demo; use Web Crypto API in production
    return btoa(value);
  }

  private decrypt(value: string): string {
    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, expires?: Date): void {
    let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
    if (expires) {
      cookie += `; expires=${expires.toUTCString()}`;
    }
    if (location.protocol === 'https:') {
      cookie += '; Secure';
    }
    document.cookie = cookie;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  private getAllKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.config.prefix;

    switch (this.config.type) {
      case 'memory':
        this.memoryStore.forEach((_, key) => {
          if (key.startsWith(prefix)) keys.push(key.slice(prefix.length));
        });
        break;
      case 'session':
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
        }
        break;
      case 'local':
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
        }
        break;
    }
    return keys;
  }
}
