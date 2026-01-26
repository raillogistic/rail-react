export class CryptoService {
  /**
   * Generates a cryptographically strong random string
   */
  static generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hashes a string using SHA-256
   */
  static async hashString(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Simple base64 encoding (for non-sensitive data)
   */
  static base64Encode(data: string): string {
    return btoa(data);
  }

  /**
   * Simple base64 decoding
   */
  static base64Decode(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }
}
