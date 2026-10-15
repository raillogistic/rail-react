import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageAdapter } from '../StorageAdapter';

describe('StorageAdapter', () => {
  const prefix = 'test_';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('uses memory storage', () => {
    const storage = new StorageAdapter({ type: 'memory', prefix });
    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('uses session storage', () => {
    const storage = new StorageAdapter({ type: 'session', prefix });
    storage.set('key', 'value');
    expect(sessionStorage.getItem(prefix + 'key')).toBe('value');
    expect(storage.get('key')).toBe('value');
    storage.remove('key');
    expect(sessionStorage.getItem(prefix + 'key')).toBeNull();
  });

  it('uses local storage', () => {
    const storage = new StorageAdapter({ type: 'local', prefix });
    storage.set('key', 'value');
    expect(localStorage.getItem(prefix + 'key')).toBe('value');
    expect(storage.get('key')).toBe('value');
  });

  it('uses cookie storage', () => {
    const storage = new StorageAdapter({ type: 'cookie', prefix });
    storage.set('key', 'value');
    expect(document.cookie).toContain(encodeURIComponent(prefix + 'key'));
    expect(storage.get('key')).toBe('value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('encrypts and decrypts values', () => {
    const storage = new StorageAdapter({
      type: 'memory',
      prefix,
      encrypt: true
    });

    const plainValue = 'secret-value';
    storage.set('secret', plainValue);

    // Access directly to verify encryption (using the private memoryStore if possible, or mocking)
    // Since memoryStore is private, we can check basic retrieval works
    expect(storage.get('secret')).toBe(plainValue);

    // To verify it's stored encrypted, we can use sessionStorage test
    const sessionStore = new StorageAdapter({
      type: 'session',
      prefix,
      encrypt: true
    });
    sessionStore.set('secret', plainValue);
    const rawStored = sessionStorage.getItem(prefix + 'secret');
    expect(rawStored).not.toBe(plainValue); // Should be encrypted (base64 in our simple impl)
    expect(rawStored).toBe(btoa(plainValue));
    expect(sessionStore.get('secret')).toBe(plainValue);
  });

  it('clears all prefixed items', () => {
    const storage = new StorageAdapter({ type: 'local', prefix });

    storage.set('item1', '1');
    storage.set('item2', '2');
    localStorage.setItem('other_item', '3'); // Should not be cleared

    storage.clear();

    expect(storage.get('item1')).toBeNull();
    expect(storage.get('item2')).toBeNull();
    expect(localStorage.getItem('other_item')).toBe('3');
  });
});
