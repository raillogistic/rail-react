const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const BACKEND_OVERRIDE_STORAGE_KEY = "rail.backend.baseUrlOverride";
const BACKEND_CONFIG_CHANGED_EVENT = "backend-config-changed";

const DEFAULT_API_PATH = "/graphql/gql/";
const DEFAULT_AUTH_PATH = "/graphql/auth/";
const DEFAULT_EXPORT_PATH = "/api/v1/export/";
const DEFAULT_CSRF_PATH = "/csrf/";
const FALLBACK_BACKEND_URL = "http://localhost:8000";

/**
 * Runtime backend endpoint values resolved from environment defaults and user override.
 */
export type BackendRuntimeConfig = {
  backendUrl: string;
  apiEndpoint: string;
  authEndpoint: string;
  exportEndpoint: string;
  csrfEndpoint: string | null;
};

/**
 * Reads a Vite environment variable.
 */
const readEnvValue = (key: string): string | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env as Record<string, unknown> | undefined;
  const value = env?.[key];
  return typeof value === "string" ? value : undefined;
};

/**
 * Returns true when browser storage APIs are available.
 */
const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

/**
 * Normalizes a backend base URL to protocol + host (+port), with no trailing slash.
 */
const normalizeBaseUrl = (rawValue: string | null | undefined): string | null => {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return null;

  const value = ABSOLUTE_URL_PATTERN.test(trimmed) ? trimmed : `http://${trimmed}`;

  try {
    const parsed = new URL(value);
    if (!parsed.hostname) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

/**
 * Converts an endpoint value into a path/search/hash segment.
 */
const resolveEndpointPath = (endpoint: string | undefined, fallbackPath: string): string => {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return fallbackPath;

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallbackPath;
    } catch {
      return fallbackPath;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

/**
 * Builds an absolute endpoint URL from base URL and endpoint path.
 */
const buildEndpoint = (baseUrl: string, endpointPath: string): string => {
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return new URL(normalizedPath, `${baseUrl}/`).toString();
};

/**
 * Resolves the configured backend default from env values.
 */
const resolveDefaultBackendBaseUrl = (): string => {
  const fromBackendEnv = normalizeBaseUrl(readEnvValue("VITE_BACKEND_URL"));
  if (fromBackendEnv) return fromBackendEnv;

  const apiEndpoint = readEnvValue("VITE_API_ENDPOINT");
  const authEndpoint = readEnvValue("VITE_AUTH_ENDPOINT");
  const candidate = apiEndpoint || authEndpoint;
  if (candidate) {
    try {
      if (ABSOLUTE_URL_PATTERN.test(candidate)) {
        const parsed = new URL(candidate);
        return `${parsed.protocol}//${parsed.host}`;
      }
      if (isBrowser()) {
        return new URL(candidate, window.location.origin).origin;
      }
    } catch {
      // Keep fallback resolution below.
    }
  }

  if (isBrowser()) {
    return window.location.origin;
  }

  return FALLBACK_BACKEND_URL;
};

/**
 * Reads the saved user backend override from local storage.
 */
export const getBackendBaseOverride = (): string | null => {
  if (!isBrowser()) return null;
  const stored = window.localStorage.getItem(BACKEND_OVERRIDE_STORAGE_KEY);
  const normalized = normalizeBaseUrl(stored);
  if (!normalized && stored) {
    window.localStorage.removeItem(BACKEND_OVERRIDE_STORAGE_KEY);
  }
  return normalized;
};

/**
 * Persists a backend host/port override.
 */
export const setBackendBaseOverride = (value: string): string => {
  if (!isBrowser()) {
    throw new Error("Browser storage is unavailable.");
  }

  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    throw new Error("URL backend invalide.");
  }

  window.localStorage.setItem(BACKEND_OVERRIDE_STORAGE_KEY, normalized);
  window.dispatchEvent(
    new CustomEvent(BACKEND_CONFIG_CHANGED_EVENT, {
      detail: { backendUrl: normalized },
    }),
  );
  return normalized;
};

/**
 * Clears any persisted backend override.
 */
export const clearBackendBaseOverride = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(BACKEND_OVERRIDE_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(BACKEND_CONFIG_CHANGED_EVENT, {
      detail: { backendUrl: null },
    }),
  );
};

/**
 * Resolves the runtime backend configuration.
 */
export const getRuntimeBackendConfig = (): BackendRuntimeConfig => {
  const backendUrl = getBackendBaseOverride() ?? resolveDefaultBackendBaseUrl();
  const apiEndpoint = buildEndpoint(
    backendUrl,
    resolveEndpointPath(readEnvValue("VITE_API_ENDPOINT"), DEFAULT_API_PATH),
  );
  const authEndpoint = buildEndpoint(
    backendUrl,
    resolveEndpointPath(readEnvValue("VITE_AUTH_ENDPOINT"), DEFAULT_AUTH_PATH),
  );
  const exportEndpoint = buildEndpoint(
    backendUrl,
    resolveEndpointPath(readEnvValue("VITE_API_EXPORTING"), DEFAULT_EXPORT_PATH),
  );

  const csrfEnvValue = readEnvValue("VITE_CSRF_ENDPOINT");
  const csrfEndpoint = csrfEnvValue
    ? buildEndpoint(backendUrl, resolveEndpointPath(csrfEnvValue, DEFAULT_CSRF_PATH))
    : null;

  return {
    backendUrl,
    apiEndpoint,
    authEndpoint,
    exportEndpoint,
    csrfEndpoint,
  };
};

