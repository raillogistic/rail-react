import { tokenStorage } from "@/shared/api/auth/token-storage";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csrfResponseHeader: string | null = (import.meta as any).env?.VITE_CSRF_RESPONSE_HEADER ?? null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csrfResponseField: string | null = (import.meta as any).env?.VITE_CSRF_TOKEN_FIELD ?? null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csrfWriteCookie: boolean = (import.meta as any).env?.VITE_CSRF_WRITE_COOKIE === "true";

let bootstrapPromise: Promise<void> | null = null;

/**
 * Ensures the backend has set a CSRF cookie (e.g. `csrftoken`) for cookie-auth flows.
 *
 * This is a no-op unless `VITE_CSRF_ENDPOINT` is configured.
 */
export const ensureCsrfCookie = async (): Promise<void> => {
  if (tokenStorage.getCSRFToken()) {
    return;
  }

  const csrfBootstrapUrl = getRuntimeBackendConfig().csrfEndpoint;
  if (!csrfBootstrapUrl) {
    return;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const response = await fetch(csrfBootstrapUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      // Attempt to read CSRF token from response headers or JSON body.
      let token: string | null = null;

      if (csrfResponseHeader) {
        token = response.headers.get(csrfResponseHeader);
      } else {
        // Common CSRF header names (case-insensitive).
        token =
          response.headers.get("x-csrftoken") ||
          response.headers.get("x-csrf-token") ||
          response.headers.get("x-xsrf-token");
      }

      if (!token) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = await response.json();
            const field = csrfResponseField || "csrfToken";
            token =
              data?.[field] ??
              data?.csrfToken ??
              data?.csrf_token ??
              null;
          } catch {
            // ignore JSON parse errors
          }
        }
      }

      if (token) {
        tokenStorage.setCSRFToken(token, { persist: csrfWriteCookie });
      } else {
        // Refresh in-memory cache from cookie after bootstrap call.
        tokenStorage.getCSRFToken();
      }
    } catch (error) {
      // Don't block app flows; some backends set CSRF cookies elsewhere.
      console.warn("CSRF bootstrap request failed:", error);
    }
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
};
