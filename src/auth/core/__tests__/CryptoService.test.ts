import { describe, it, expect } from 'vitest';
import { CryptoService } from '../CryptoService';

describe('CryptoService', () => {
  it('generates random strings of correct length', () => {
    // Hex string is 2 chars per byte
    // generateRandomString(32) -> 32 bytes -> 64 hex chars
    const str = CryptoService.generateRandomString(32);
    expect(str).toHaveLength(64);
    expect(str).toMatch(/^[0-9a-f]+$/);
  });

  it('hashes strings consistently', async () => {
    const data = 'test-data';
    const hash1 = await CryptoService.hashString(data);
    const hash2 = await CryptoService.hashString(data);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(data);
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('encodes and decodes base64', () => {
    const data = 'Hello World';
    const encoded = CryptoService.base64Encode(data);
    const decoded = CryptoService.base64Decode(encoded);

    expect(decoded).toBe(data);
    expect(encoded).not.toBe(data);
  });
});
