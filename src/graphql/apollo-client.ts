import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';
import { tokenStorage, getSecureHeaders } from '../auth/utils/token-storage';
import { AuthError, AuthErrorType, handleAuthError } from '../auth/utils/error-handler';

// Prefer environment configuration; fall back to local dev.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const graphqlUri: string = ((import.meta as any).env?.VITE_API_ENDPOINT as string | undefined) ?? 'http://localhost:8000/graphql/';

const uploadLink = createUploadLink({
  uri: graphqlUri,
  credentials: 'include',
  // Use GET for queries to leverage browser/proxy HTTP caching and avoid unnecessary POSTs
  // useGETForQueries: true,
});

/**
 * Create authentication link that adds authorization headers
 */
const createAuthLink = () => {
  return setContext(async (_, { headers }) => {
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
  return onError(({ graphQLErrors, networkError }) => {
    // Handle GraphQL errors
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        );

        // Handle authentication errors
        if (extensions?.code === 'UNAUTHENTICATED' || message.includes('Authentication')) {
          const authError = new AuthError(
            AuthErrorType.TOKEN_EXPIRED,
            'Authentication failed',
            'Your session has expired. Please log in again.',
            { shouldLogout: true, meta: { message, locations, path, code: extensions?.code } }
          );

          // Handle the error (this will trigger logout if needed)
          void handleAuthError(authError, () => {
            // Clear tokens and redirect to login
            tokenStorage.clearAllTokens();
            window.location.href = '/login';
          });
        }
      });
    }

    // Handle network errors
    if (networkError) {
      console.error(`Network error: ${networkError}`);

      // Handle specific network error cases
      if ('statusCode' in networkError) {
        const statusCode = networkError.statusCode;

        if (statusCode === 401 || statusCode === 403) {
          // Only redirect to login for definitive authentication errors
          // Check if this is during app initialization to avoid aggressive redirects
          const isInitializing = !tokenStorage.getAccessToken() || window.location.pathname === '/login';

          if (!isInitializing) {
            const authError = new AuthError(
              AuthErrorType.TOKEN_EXPIRED,
              'Unauthorized access',
              'Your session has expired. Please log in again.',
              { shouldLogout: true, meta: networkError }
            );

            void handleAuthError(authError, () => {
              tokenStorage.clearAllTokens();
              window.location.href = '/login';
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

// Create Apollo Client instance
const client = new ApolloClient({
  link: from([
    createErrorLink(),
    createAuthLink(),
    uploadLink,
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
