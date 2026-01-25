import { ApolloClient, ApolloLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client/link/utils';
import { createUploadLink } from 'apollo-upload-client';
import { tokenStorage, getSecureHeaders } from '../auth/utils/token-storage';
import { ensureCsrfCookie } from '../auth/utils/csrf';
import { AuthError, AuthErrorType, handleAuthError } from '../auth/utils/error-handler';
import { isCamelCaseSchema } from './schema-naming';

// Prefer environment configuration; fall back to local dev.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiGraphqlUri: string =
  ((import.meta as any).env?.VITE_API_ENDPOINT as string | undefined) ??
  'http://localhost:8000/graphql/';
const authGraphqlUri: string =
  ((import.meta as any).env?.VITE_AUTH_ENDPOINT as string | undefined) ??
  apiGraphqlUri;

const apiUploadLink = createUploadLink({
  uri: apiGraphqlUri,
  credentials: 'include',
  // Use GET for queries to leverage browser/proxy HTTP caching and avoid unnecessary POSTs
  // useGETForQueries: true,
});

const authUploadLink = createUploadLink({
  uri: authGraphqlUri,
  credentials: 'include',
  // Use GET for queries to leverage browser/proxy HTTP caching and avoid unnecessary POSTs
  // useGETForQueries: true,
});

let refreshInFlight: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      await ensureCsrfCookie();

      const secureHeaders = getSecureHeaders();
      const mutation = isCamelCaseSchema()
        ? `
          mutation RefreshToken($refresh_token: String) {
            refresh_token: refreshToken(refreshToken: $refresh_token) {
              ok
              token
              refresh_token: refreshToken
            }
          }
        `
        : `
          mutation RefreshToken($refresh_token: String) {
            refresh_token(refresh_token: $refresh_token) {
              ok
              token
              refresh_token
            }
          }
        `;

      const response = await fetch(authGraphqlUri, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...secureHeaders,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { refresh_token: null },
        }),
      });

      if (!response.ok) {
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = await response.json();
      const token: string | undefined = payload?.data?.refresh_token?.token;
      const ok: boolean | undefined = payload?.data?.refresh_token?.ok;
      const refreshToken: string | undefined = payload?.data?.refresh_token?.refresh_token;

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
      console.warn('Silent refresh failed:', error);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

/**
 * Create authentication link that adds authorization headers
 */
const createAuthLink = () => {
  return setContext(async (operation, { headers }) => {
    // If the backend enforces CSRF for cookie-auth flows, prime a CSRF cookie before
    // sending requests. (No-op unless VITE_CSRF_ENDPOINT is configured.)
    try {
      await ensureCsrfCookie();
    } catch {
      // ignore
    }

    const token = tokenStorage.getAccessToken();
    const secureHeaders = getSecureHeaders();

    return {
      headers: {
        ...headers,
        ...(token && { authorization: `Bearer ${token}` }),
        ...secureHeaders,
      },
    };
  });
};

/**
 * Create error link for handling authentication and network errors
 */
const createErrorLink = () => {
  return onError(({ graphQLErrors, networkError, operation, forward }) => {
    const context = operation.getContext() as {
      skipAuthRefresh?: boolean;
      skipAuthRedirect?: boolean;
    } | undefined;
    const skipAuthRefresh = context?.skipAuthRefresh === true;

    // Handle GraphQL errors
    if (graphQLErrors) {
      const hasUnauthenticated = graphQLErrors.some(({ message, extensions }) =>
        extensions?.code === 'UNAUTHENTICATED' || (typeof message === 'string' && message.toLowerCase().includes('authentication'))
      );

      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        );

        // Handle authentication errors
        if (!hasUnauthenticated) {
          return;
        }
      });

      // Attempt silent refresh + retry once, per docs.
      if (hasUnauthenticated && !skipAuthRefresh && operation.operationName !== 'RefreshToken') {
        operation.setContext({ ...context, skipAuthRefresh: true });
        return fromPromise(refreshAccessToken()).flatMap((refreshed) => {
          if (refreshed) {
            return forward(operation);
          }

          const authError = new AuthError(
            AuthErrorType.SESSION_EXPIRED,
            'Authentication failed',
            'Your session has expired. Please log in again.',
            { shouldLogout: true, meta: { graphQLErrors } }
          );

          void handleAuthError(authError, () => {
            tokenStorage.clearAllTokens();
          });

          return forward(operation);
        });
      }
    }

    // Handle network errors
    if (networkError) {
      console.error(`Network error: ${networkError}`);

      // Handle specific network error cases
      if ('statusCode' in networkError) {
        const statusCode = networkError.statusCode;

        if ((statusCode === 401 || statusCode === 403) && !skipAuthRefresh) {
          // Only redirect to login for definitive authentication errors
          // Check if this is during app initialization to avoid aggressive redirects
          const isInitializing = !tokenStorage.getAccessToken() || window.location.pathname === '/login';

          if (!isInitializing) {
            operation.setContext({ ...context, skipAuthRefresh: true });
            return fromPromise(refreshAccessToken()).flatMap((refreshed) => {
              if (refreshed) {
                return forward(operation);
              }

              const authError = new AuthError(
                AuthErrorType.TOKEN_EXPIRED,
                'Unauthorized access',
                'Your session has expired. Please log in again.',
                { shouldLogout: true, meta: networkError }
              );

              void handleAuthError(authError, () => {
                tokenStorage.clearAllTokens();
              });

              return forward(operation);
            });
          }
        } else if (statusCode >= 500 || !statusCode) {
          // Server error or network connectivity issue
          // Trigger offline alert instead of auth error
          const event = new CustomEvent('backend-offline', {
            detail: {
              message: statusCode >= 500
                ? 'Server is experiencing issues. Please try again later.'
                : 'Unable to connect to the server. Please check your connection.'
            }
          });
          window.dispatchEvent(event);
        }
      } else {
        // Handle network errors without status codes (server offline, connection refused, etc.)
        const event = new CustomEvent('backend-offline', {
          detail: {
            message: 'Unable to connect to the server. Please check your connection and ensure the server is running.'
          }
        });
        window.dispatchEvent(event);
      }
    }
  });
};

const authOperationNames = new Set<string>([
  'Login',
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
