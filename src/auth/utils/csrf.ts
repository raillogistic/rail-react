import { tokenStorage } from "./token-storage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const csrfBootstrapUrl: string | null = (import.meta as any).env?.VITE_CSRF_ENDPOINT ?? null;

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

  if (!csrfBootstrapUrl) {
    return;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      await fetch(csrfBootstrapUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      // Refresh in-memory cache from cookie after bootstrap call.
      tokenStorage.getCSRFToken();
    } catch (error) {
      // Don't block app flows; some backends set CSRF cookies elsewhere.
      console.warn("CSRF bootstrap request failed:", error);
    }
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
};

