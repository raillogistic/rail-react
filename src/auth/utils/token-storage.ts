/**
 * Secure token storage utilities with graceful fallback to in-memory/session storage.
 *
 * Tokens are primarily delivered by HttpOnly cookies from the backend. To support
 * environments where cookies are blocked or delayed, we also keep a short-lived
 * in-memory/session copy so Authorization headers can be sent immediately.
 */

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// CSRF token storage
const CSRF_TOKEN_KEY = 'csrftoken';
const SESSION_STATUS_KEY = 'rail_session_active';

// Fallback storage keys for non-HttpOnly copies (session scoped)
const ACCESS_TOKEN_KEY = 'rail_access_token';
const REFRESH_TOKEN_KEY = 'rail_refresh_token';
const ACCESS_TOKEN_EXPIRY_KEY = 'rail_access_token_exp';

const allowInsecureAccessTokenStorage =
  // Vite injects `import.meta.env` in the browser build.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ALLOW_INSECURE_ACCESS_TOKEN_STORAGE === 'true') ||
  false;

const allowInsecureRefreshTokenStorage =
  // Vite injects `import.meta.env` in the browser build.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ALLOW_INSECURE_REFRESH_TOKEN_STORAGE === 'true') ||
  false;

let hasWarnedInsecureRefreshTokenStorage = false;

// In-memory cache for the current page lifetime
let csrfToken: string | null = null;
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryAccessTokenExpiry: number | null = null;

const isBrowserEnvironment = () =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

// Best-effort cleanup of any previously persisted token copies.
// Keeping tokens out of Web Storage reduces the XSS blast radius.
(() => {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    const storage = window.sessionStorage;
    if (!allowInsecureAccessTokenStorage) {
      storage.removeItem(ACCESS_TOKEN_KEY);
      storage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    }
    if (!allowInsecureRefreshTokenStorage) {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
})();

const persistSessionFlag = (isActive: boolean): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    const storage = window.sessionStorage;
    if (isActive) {
      storage.setItem(SESSION_STATUS_KEY, 'true');
    } else {
      storage.removeItem(SESSION_STATUS_KEY);
    }
  } catch (error) {
    console.warn('Unable to persist session flag', error);
  }
};

const readSessionFlag = (): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(SESSION_STATUS_KEY) === 'true';
  } catch (error) {
    console.warn('Unable to read session flag', error);
    return false;
  }
};

const readSessionStorage = (key: string): string | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read session storage key ${key}`, error);
    return null;
  }
};

const writeSessionStorage = (key: string, value: string | null): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    const storage = window.sessionStorage;
    if (value === null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`Unable to write session storage key ${key}`, error);
  }
};

const decodeExpiryMs = (token: string): number | null => {
  try {
    const decoded: { exp?: number } = jwtDecode(token);
    if (typeof decoded.exp === 'number') {
      return decoded.exp * 1000;
    }
  } catch (error) {
    console.warn('Unable to decode token expiry', error);
  }
  return null;
};

/**
 * Cookie configuration for secure cookies
 */
const getSecureCookieOptions = () => ({
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'strict' as const,
});

/**
 * Token storage interface for secure authentication
 */
export interface TokenStorage {
  setAccessToken: (token: string) => void;
  getAccessToken: () => string | null;
  clearAccessToken: () => void;
  isAccessTokenExpired: () => boolean;
  setRefreshToken: (token: string) => void;
  getRefreshToken: () => string | null;
  clearRefreshToken: () => void;
  getCSRFToken: () => string | null;
  setCSRFToken: (token: string) => void;
  clearAllTokens: () => void;
  hasValidSession: () => boolean;
  getAccessTokenTimeToExpiry: () => number;
  setSessionActive: (isActive: boolean) => void;
}

/**
 * Token storage implementation
 */
export const tokenStorage: TokenStorage = {
  setAccessToken: (token: string): void => {
    memoryAccessToken = token;
    memoryAccessTokenExpiry = decodeExpiryMs(token);

    if (allowInsecureAccessTokenStorage) {
      writeSessionStorage(ACCESS_TOKEN_KEY, token);
      writeSessionStorage(
        ACCESS_TOKEN_EXPIRY_KEY,
        memoryAccessTokenExpiry ? memoryAccessTokenExpiry.toString() : null
      );
    }
  },

  getAccessToken: (): string | null => {
    if (memoryAccessToken) {
      return memoryAccessToken;
    }

    if (!allowInsecureAccessTokenStorage) {
      return null;
    }

    const stored = readSessionStorage(ACCESS_TOKEN_KEY);
    if (stored) {
      memoryAccessToken = stored;
      const expiryStr = readSessionStorage(ACCESS_TOKEN_EXPIRY_KEY);
      memoryAccessTokenExpiry = expiryStr ? Number(expiryStr) : null;
    }

    return memoryAccessToken;
  },

  clearAccessToken: (): void => {
    memoryAccessToken = null;
    memoryAccessTokenExpiry = null;
    writeSessionStorage(ACCESS_TOKEN_KEY, null);
    writeSessionStorage(ACCESS_TOKEN_EXPIRY_KEY, null);
  },

  isAccessTokenExpired: (): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      return true;
    }

    if (memoryAccessTokenExpiry === null) {
      // No expiry info, assume valid and rely on backend errors.
      return false;
    }

    return Date.now() >= memoryAccessTokenExpiry;
  },

  setRefreshToken: (token: string): void => {
    if (!allowInsecureRefreshTokenStorage) {
      if (!hasWarnedInsecureRefreshTokenStorage) {
        hasWarnedInsecureRefreshTokenStorage = true;
        console.warn(
          'Ignoring refresh token provided to the client. Store refresh tokens in HttpOnly cookies instead. ' +
            'To allow insecure sessionStorage fallback (dev only), set VITE_ALLOW_INSECURE_REFRESH_TOKEN_STORAGE=true.'
        );
      }
      return;
    }

    memoryRefreshToken = token;
    writeSessionStorage(REFRESH_TOKEN_KEY, token);
  },

  getRefreshToken: (): string | null => {
    if (!allowInsecureRefreshTokenStorage) {
      return null;
    }

    if (memoryRefreshToken) {
      return memoryRefreshToken;
    }

    const stored = readSessionStorage(REFRESH_TOKEN_KEY);
    if (stored) {
      memoryRefreshToken = stored;
    }

    return memoryRefreshToken;
  },

  clearRefreshToken: (): void => {
    memoryRefreshToken = null;
    writeSessionStorage(REFRESH_TOKEN_KEY, null);
  },

  getCSRFToken: (): string | null => {
    if (!csrfToken) {
      csrfToken = Cookies.get(CSRF_TOKEN_KEY) || null;
    }
    return csrfToken;
  },

  setCSRFToken: (token: string): void => {
    csrfToken = token;
    Cookies.set(CSRF_TOKEN_KEY, token, getSecureCookieOptions());
  },

  clearAllTokens: (): void => {
    csrfToken = null;
    Cookies.remove(CSRF_TOKEN_KEY);
    tokenStorage.clearAccessToken();
    tokenStorage.clearRefreshToken();
    persistSessionFlag(false);
  },

  hasValidSession: (): boolean => {
    return readSessionFlag();
  },

  setSessionActive: (isActive: boolean): void => {
    persistSessionFlag(isActive);
  },

  getAccessTokenTimeToExpiry: (): number => {
    if (!memoryAccessToken) {
      return 0;
    }

    if (!memoryAccessTokenExpiry) {
      return 0;
    }

    return Math.max(0, memoryAccessTokenExpiry - Date.now());
  },
};

/**
 * Get authorization header if a non-HttpOnly token is available
 */
export const getAuthorizationHeader = (): string | null => {
  const token = tokenStorage.getAccessToken();
  return token ? `Bearer ${token}` : null;
};

/**
 * Check if token should be refreshed based on expiry window
 */
export const shouldRefreshToken = (): boolean => {
  if (!tokenStorage.getAccessToken()) {
    return false;
  }

  const timeLeft = tokenStorage.getAccessTokenTimeToExpiry();
  // Refresh when less than 5 minutes remain
  return timeLeft > 0 && timeLeft < 5 * 60 * 1000;
};

/**
 * Get headers with CSRF protection for requests
 */
export const getSecureHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  const csrf = tokenStorage.getCSRFToken();
  if (csrf) {
    headers['X-CSRFToken'] = csrf;
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  return headers;
};
