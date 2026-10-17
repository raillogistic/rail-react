import { ApolloClient, ApolloLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client/link/utils';
import { createUploadLink } from 'apollo-upload-client';
import { AUTH_SESSION_EVENT, tokenStorage, getSecureHeaders } from '@/shared/api/auth/token-storage';
import { ensureCsrfCookie } from '@/shared/api/auth/csrf';
import { AuthError, AuthErrorType, handleAuthError } from '@/shared/api/auth/error-handler';
import { ROUTES } from "@/shared/routing/routes";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";
import { hasExplicitAuthorizationHeader } from './authHeaders';

const apiUploadLink = createUploadLink({
  uri: () => getRuntimeBackendConfig().apiEndpoint,
  // Cookie-auth is authoritative; include credentials on API requests.
  credentials: 'include',
  // Use GET for queries to leverage browser/proxy HTTP caching and avoid unnecessary POSTs
  // useGETForQueries: true,
});

const authUploadLink = createUploadLink({
  uri: () => getRuntimeBackendConfig().authEndpoint,
  // Cookie-auth is authoritative; include credentials on auth requests.
  credentials: 'include',
  // Use GET for queries to leverage browser/proxy HTTP caching and avoid unnecessary POSTs
  // useGETForQueries: true,
});

let refreshInFlight: Promise<boolean> | null = null;
let refreshCredential: string | null = null;

type RefreshTokenMutationPayload = {
  data?: {
    refresh_token?: {
      ok?: boolean;
      token?: string;
      refresh_token?: string;
    };
  };
};

const refreshAccessToken = async (): Promise<boolean> => {
  const credential = tokenStorage.getAccessToken();
  if (refreshInFlight && refreshCredential === credential) {
    return refreshInFlight;
  }

  let invalidated = false;
  /** Reject a response after logout or a credential replacement. */
  const assertCurrentSession = () => {
    if (invalidated || tokenStorage.getAccessToken() !== credential) {
      throw new DOMException('Authentication changed during refresh', 'AbortError');
    }
  };
  /** Cancel this refresh on logout, including a cookie-only bootstrap. */
  const onSessionChange = (event: Event) => {
    if ((event as CustomEvent<{ isActive?: boolean }>).detail?.isActive === false) {
      invalidated = true;
      if (refreshInFlight === pending) refreshInFlight = null;
    }
  };
  window.addEventListener(AUTH_SESSION_EVENT, onSessionChange);
  const pending = (async () => {
    try {
      await ensureCsrfCookie();
      assertCurrentSession();
      const { authEndpoint } = getRuntimeBackendConfig();
      // Refresh tokens are backend-managed HttpOnly cookies; the variable remains optional
      // for backward compatibility with deployments still accepting header-only flows.
      const currentRefreshToken = tokenStorage.getRefreshToken();

      const secureHeaders = getSecureHeaders();
      const mutation = `
        mutation RefreshToken($refresh_token: String) {
          refresh_token: refreshToken(refreshToken: $refresh_token) {
            ok
            token
            refresh_token: refreshToken
          }
        }
      `;

      const response = await fetch(authEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...secureHeaders,
        },
        body: JSON.stringify({
          query: mutation,
          variables: currentRefreshToken
            ? { refresh_token: currentRefreshToken }
            : {},
        }),
      });
      assertCurrentSession();

      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as RefreshTokenMutationPayload;
      const token: string | undefined = payload?.data?.refresh_token?.token;
      const ok: boolean | undefined = payload?.data?.refresh_token?.ok;
      const refreshToken: string | undefined = payload?.data?.refresh_token?.refresh_token;

      assertCurrentSession();

      if (!ok || !token) {
        return false;
      }

      tokenStorage.setAccessToken(token);
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }
      tokenStorage.setSessionActive(true);

      return true;
    } catch (error) {
      assertCurrentSession();
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.warn('Silent refresh failed:', error);
      return false;
    }
  })();
  refreshInFlight = pending;
  refreshCredential = credential;
  try {
    return await pending;
  } finally {
    window.removeEventListener(AUTH_SESSION_EVENT, onSessionChange);
    if (refreshInFlight === pending) refreshInFlight = null;
  }
};

/**
 * Create authentication link that adds authorization headers
 */
const createAuthLink = () => {
  return setContext(async (_, { headers, railAuthorization }) => {
    // If the backend enforces CSRF for cookie-auth flows, prime a CSRF cookie before
    // sending requests. (No-op unless VITE_CSRF_ENDPOINT is configured.)
    try {
      await ensureCsrfCookie();
    } catch {
      // ignore
    }

    const token = tokenStorage.getAccessToken();
    const secureHeaders = getSecureHeaders();
    const normalizedHeaders = { ...headers } as Record<string, unknown>;
    // Replace only our own header on retries; caller-supplied credentials remain explicit.
    if (railAuthorization && normalizedHeaders.authorization === railAuthorization) {
      delete normalizedHeaders.authorization;
    }
    const shouldAttachAuthorization =
      !hasExplicitAuthorizationHeader(normalizedHeaders) && !!token;

    return {
      railAuthorization: shouldAttachAuthorization ? `Bearer ${token}` : null,
      headers: {
        ...normalizedHeaders,
        ...(shouldAttachAuthorization
          ? { authorization: `Bearer ${token}` }
          : {}),
        ...secureHeaders,
      },
    };
  });
};

const hasAbortMessage = (message?: string): boolean => {
  if (!message) return false;
  return message.toLowerCase().includes('abort');
};

const isAbortLikeNetworkError = (error: unknown): boolean => {
  const visited = new Set<unknown>();
  const walk = (value: unknown): boolean => {
    if (!value) return false;
    if (value instanceof DOMException && value.name === 'AbortError') return true;
    if (value instanceof Error) {
      if (value.name === 'AbortError') return true;
      if (hasAbortMessage(value.message)) return true;
    }
    if (typeof value !== 'object') return false;
    if (visited.has(value)) return false;
    visited.add(value);
    const candidate = value as {
      name?: unknown;
      message?: unknown;
      cause?: unknown;
      networkError?: unknown;
      originalError?: unknown;
    };
    if (typeof candidate.name === 'string' && candidate.name === 'AbortError') {
      return true;
    }
    if (
      typeof candidate.message === 'string' &&
      hasAbortMessage(candidate.message)
    ) {
      return true;
    }
    return (
      walk(candidate.networkError) ||
      walk(candidate.cause) ||
      walk(candidate.originalError)
    );
  };
  return walk(error);
};

/**
 * Create error link for handling authentication and network errors
 */
const createErrorLink = () => {
  return onError(({ graphQLErrors, networkError, operation, forward }) => {
    const context = operation.getContext() as {
      skipAuthRefresh?: boolean;
      skipAuthErrorHandling?: boolean;
    } | undefined;
    const skipAuthRefresh = context?.skipAuthRefresh === true;
    const skipAuthErrorHandling =
      context?.skipAuthErrorHandling === true ||
      operation.operationName === 'Logout';

    // Handle GraphQL errors
    if (graphQLErrors) {
      const hasUnauthenticated = graphQLErrors.some(({ message, extensions }) =>
        extensions?.code === 'UNAUTHENTICATED' || (typeof message === 'string' && message.toLowerCase().includes('authentication'))
      );

      // Logout is best-effort and may legitimately receive unauthenticated responses.
      if (!(skipAuthErrorHandling && hasUnauthenticated)) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
          );

          // Handle authentication errors
          if (!hasUnauthenticated) {
            return;
          }
        });
      }

      // Attempt silent refresh + retry once, per docs.
      if (
        hasUnauthenticated &&
        !skipAuthRefresh &&
        !skipAuthErrorHandling &&
        operation.operationName !== 'RefreshToken'
      ) {
        operation.setContext({ ...context, skipAuthRefresh: true });
        return fromPromise(refreshAccessToken()).flatMap((refreshed) => {
          if (refreshed) {
            return forward(operation);
          }

          const authError = new AuthError(
            AuthErrorType.SESSION_EXPIRED,
            'Échec de l\'authentification',
            'Votre session a expiré. Veuillez vous reconnecter.',
            { shouldLogout: true, meta: { graphQLErrors } }
          );

          void handleAuthError(authError, () => {
            tokenStorage.clearAllTokens();
          });

          throw authError;
        });
      }
    }

    // Handle network errors
    if (networkError) {
      if (isAbortLikeNetworkError(networkError)) {
        return;
      }
      const statusCode =
        'statusCode' in networkError ? networkError.statusCode : undefined;
      if (
        skipAuthErrorHandling &&
        (statusCode === 401 || statusCode === 403)
      ) {
        return;
      }

      console.error(`Network error: ${networkError}`);

      // Handle specific network error cases
      if ('statusCode' in networkError) {
        const numericStatusCode =
          typeof statusCode === 'number' ? statusCode : undefined;

        if (
          numericStatusCode === 401 &&
          !skipAuthRefresh &&
          !skipAuthErrorHandling
        ) {
          // Only redirect to login for definitive authentication errors
          // Check if this is during app initialization to avoid aggressive redirects
          const isInitializing =
            !tokenStorage.getAccessToken() ||
            window.location.pathname === ROUTES.LOGIN;

          if (!isInitializing) {
            operation.setContext({ ...context, skipAuthRefresh: true });
            return fromPromise(refreshAccessToken()).flatMap((refreshed) => {
              if (refreshed) {
                return forward(operation);
              }

              const authError = new AuthError(
                AuthErrorType.TOKEN_EXPIRED,
                'Accès non autorisé',
                'Votre session a expiré. Veuillez vous reconnecter.',
                { shouldLogout: true, meta: networkError }
              );

              void handleAuthError(authError, () => {
                tokenStorage.clearAllTokens();
              });

              throw authError;
            });
          }
        } else if (
          numericStatusCode === undefined ||
          numericStatusCode >= 500
        ) {
          // Server error or network connectivity issue
          // Trigger offline alert instead of auth error
          const event = new CustomEvent('backend-offline', {
            detail: {
              message: numericStatusCode !== undefined && numericStatusCode >= 500
                ? 'Le serveur rencontre des problèmes. Veuillez réessayer plus tard.'
                : 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.'
            }
          });
          window.dispatchEvent(event);
        }
      } else {
        // Handle network errors without status codes (server offline, connection refused, etc.)
        const event = new CustomEvent('backend-offline', {
          detail: {
            message: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion et vous assurer que le serveur est en cours d\'exécution.'
          }
        });
        window.dispatchEvent(event);
      }
    }
  });
};

const authOperationNames = new Set<string>([
  'Login',
  'Logout',
  'RefreshToken',
  'SetupMFA',
  'VerifyMFASetup',
  'VerifyMFALogin',
]);

const createEndpointLink = () => {
  return ApolloLink.split(
    (operation) => {
      const context = operation.getContext() as { useAuthEndpoint?: boolean } | undefined;
      if (context?.useAuthEndpoint) {
        return true;
      }
      return authOperationNames.has(operation.operationName);
    },
    authUploadLink,
    apiUploadLink
  );
};

// Create Apollo Client instance
const client = new ApolloClient({
  link: from([
    createErrorLink(),
    createAuthLink(),
    createEndpointLink(),
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          roles: {
            merge: false, // Replace the array instead of merging
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      // Keep using cache results on variable changes unless explicitly refetched
      nextFetchPolicy: 'cache-first',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },

  },
});

export default client;


