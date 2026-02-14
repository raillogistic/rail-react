import {
  GraphQLResponse,
  INTEGRATION_LOGIN_MUTATION,
  IntegrationLoginPayload,
} from "@/graphql/integrationAuth";

import {
  clearWorkerSession,
  getWorkerSession,
  setWorkerSessionToken,
  trackWorkerRequest,
} from "./authSession";
import { IntegrationAuthConfig } from "./authConfig";

interface LoginResponse {
  login: IntegrationLoginPayload;
}

export interface GraphQLAuthClientOptions {
  fetchImpl?: typeof fetch;
  workerId?: string;
  allowMockFetch?: boolean;
}

export interface GraphQLAuthClient {
  ensureToken: () => Promise<string>;
  execute: <TData = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ) => Promise<GraphQLResponse<TData>>;
  resetSession: () => void;
}

const isMockedFetch = (candidate: typeof fetch): boolean => {
  const maybeMock = candidate as typeof fetch & { mock?: unknown };
  return (
    typeof maybeMock.mock !== "undefined" ||
    candidate.name.toLowerCase().includes("mock")
  );
};

export const assertRealEndpointGuard = (
  config: IntegrationAuthConfig,
  fetchImpl: typeof fetch,
  allowMockFetch = false
): void => {
  const endpoint = config.endpoint.trim().toLowerCase();
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    throw new Error("VITE_TEST_GRAPHQL_ENDPOINT must be an absolute HTTP(S) URL");
  }
  if (endpoint.includes("example.com") || endpoint.includes("mock")) {
    throw new Error("Integration endpoint appears mocked or placeholder");
  }
  if (!allowMockFetch && isMockedFetch(fetchImpl)) {
    throw new Error("Integration tests must run against a real endpoint without mocked fetch");
  }
};

const isAuthFailure = <TData>(response: GraphQLResponse<TData>, status: number): boolean => {
  if (status === 401 || status === 403) {
    return true;
  }
  const errors = response.errors ?? [];
  return errors.some((entry) => {
    const code = (entry.extensions?.code ?? "").toLowerCase();
    const message = (entry.message ?? "").toLowerCase();
    return (
      code.includes("auth") ||
      code.includes("unauth") ||
      message.includes("auth") ||
      message.includes("token")
    );
  });
};

const postGraphQL = async <TData>(
  fetchImpl: typeof fetch,
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<{ status: number; payload: GraphQLResponse<TData> }> => {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  const payload = (await response.json()) as GraphQLResponse<TData>;
  return { status: response.status, payload };
};

export const createGraphQLAuthClient = (
  config: IntegrationAuthConfig,
  options: GraphQLAuthClientOptions = {}
): GraphQLAuthClient => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const workerId = options.workerId;
  assertRealEndpointGuard(config, fetchImpl, options.allowMockFetch ?? false);
  const safeDebugMeta = {
    endpointHost: new URL(config.endpoint).host,
    worker: workerId ?? "default",
    username: `${config.username.slice(0, 2)}***`,
  };

  const login = async (): Promise<string> => {
    const { status, payload } = await postGraphQL<LoginResponse>(
      fetchImpl,
      config.endpoint,
      INTEGRATION_LOGIN_MUTATION,
      {
        username: config.username,
        password: config.password,
      }
    );
    const loginPayload = payload.data?.login;
    const token = loginPayload?.token ?? "";
    if (status >= 400 || !loginPayload?.ok || !token) {
      throw new Error(
        `Integration login failed (${JSON.stringify(safeDebugMeta)})`
      );
    }
    const previous = getWorkerSession(workerId);
    setWorkerSessionToken(token, workerId, previous);
    return token;
  };

  const ensureToken = async (): Promise<string> => {
    const cached = getWorkerSession(workerId);
    if (cached?.token) {
      return cached.token;
    }
    return login();
  };

  const executeWithToken = async <TData>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<TData>> => {
    const hadCachedToken = Boolean(getWorkerSession(workerId)?.token);
    const token = await ensureToken();
    const firstAttempt = await postGraphQL<TData>(
      fetchImpl,
      config.endpoint,
      query,
      variables,
      token
    );
    trackWorkerRequest(hadCachedToken, workerId);
    if (!isAuthFailure(firstAttempt.payload, firstAttempt.status)) {
      return firstAttempt.payload;
    }

    // Exactly one re-login + one retry on auth failures.
    clearWorkerSession(workerId);
    const refreshedToken = await login();
    const secondAttempt = await postGraphQL<TData>(
      fetchImpl,
      config.endpoint,
      query,
      variables,
      refreshedToken
    );
    trackWorkerRequest(false, workerId);
    if (isAuthFailure(secondAttempt.payload, secondAttempt.status)) {
      clearWorkerSession(workerId);
      throw new Error(
        `Integration GraphQL request failed after single retry (${JSON.stringify(safeDebugMeta)})`
      );
    }
    return secondAttempt.payload;
  };

  return {
    ensureToken,
    execute: executeWithToken,
    resetSession: () => clearWorkerSession(workerId),
  };
};
