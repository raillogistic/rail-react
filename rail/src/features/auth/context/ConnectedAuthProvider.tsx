import React, { useCallback, useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { AuthProvider } from "./AuthProvider";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
  VERIFY_MFA_LOGIN_MUTATION,
  GET_ACTIVE_SESSIONS,
  GET_CURRENT_USER,
} from "@/features/auth/api";
import { AuthUser, LoginCredentials, TokenPair } from "../types";
import { AUTH_SESSION_EVENT, tokenStorage } from "@/shared/api/auth/token-storage";
import { decodeToken } from "../utils/token";
import { SessionValidationIndeterminateError } from "../services/SessionService";
import {
  createFallbackSessionId,
  normalizeSessionIdClaim,
  selectSessionIdFromTokenPayload,
} from "./sessionIds";
import application from '@rail/application';

type RawAuthRole = {
  name?: unknown;
  permissions?: unknown;
};

type RawAuthUser = {
  id?: unknown;
  user_id?: unknown;
  userId?: unknown;
  sub?: unknown;
  email?: unknown;
  username?: unknown;
  first_name?: unknown;
  firstName?: unknown;
  last_name?: unknown;
  lastName?: unknown;
  is_staff?: unknown;
  isStaff?: unknown;
  is_superuser?: unknown;
  isSuperuser?: unknown;
  roles?: unknown;
  permissions?: unknown;
  settings?: unknown;
};

// Deduplicate refresh mutations across provider remounts (e.g. React StrictMode).
let refreshMutationInFlight: Promise<TokenPair> | null = null;

const toStringValue = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const toBooleanValue = (value: unknown): boolean => {
  return value === true;
};

/**
 * Normalizes optional refresh token values and drops invalid placeholders.
 */
const normalizeRefreshTokenCandidate = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const lowered = trimmed.toLowerCase();
  if (lowered === "null" || lowered === "undefined") {
    return null;
  }

  return trimmed;
};

/**
 * Builds a token payload while treating refresh token as optional (cookie-first flows).
 */
const buildTokenPair = (
  accessToken: string,
  refreshTokenCandidate: unknown,
): TokenPair => {
  const refreshToken = normalizeRefreshTokenCandidate(refreshTokenCandidate);
  const payload = decodeToken(accessToken);
  const accessTokenExpiresAt = new Date(
    typeof payload?.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : Date.now() + 15 * 60 * 1000,
  );
  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    accessToken,
    accessTokenExpiresAt,
    ...(refreshToken
      ? {
          refreshToken,
          refreshTokenExpiresAt,
        }
      : {}),
  };
};

export const isAbortLikeSessionValidationError = (error: unknown): boolean => {
  const visited = new Set<unknown>();

  const walk = (value: unknown): boolean => {
    if (!value) return false;
    if (value instanceof DOMException && value.name === "AbortError") {
      return true;
    }
    if (value instanceof Error) {
      const message = value.message.toLowerCase();
      if (value.name === "AbortError" || message.includes("abort")) {
        return true;
      }
    }
    if (typeof value !== "object") return false;
    if (visited.has(value)) return false;
    visited.add(value);

    const candidate = value as {
      name?: unknown;
      message?: unknown;
      cause?: unknown;
      networkError?: unknown;
      originalError?: unknown;
    };

    if (candidate.name === "AbortError") {
      return true;
    }
    if (
      typeof candidate.message === "string" &&
      candidate.message.toLowerCase().includes("abort")
    ) {
      return true;
    }

    return (
      walk(candidate.cause) ||
      walk(candidate.networkError) ||
      walk(candidate.originalError)
    );
  };

  return walk(error);
};

const normalizeAuthUser = (
  rawUser: RawAuthUser | null | undefined,
  fallbackPermissions?: string[] | null,
): AuthUser => {
  const normalizePermissionValue = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (!value || typeof value !== "object") {
      return null;
    }

    const maybeObject = value as {
      codename?: unknown;
      name?: unknown;
      permission?: unknown;
    };

    if (
      typeof maybeObject.codename === "string" &&
      maybeObject.codename.trim().length > 0
    ) {
      return maybeObject.codename;
    }
    if (
      typeof maybeObject.name === "string" &&
      maybeObject.name.trim().length > 0
    ) {
      return maybeObject.name;
    }
    if (
      typeof maybeObject.permission === "string" &&
      maybeObject.permission.trim().length > 0
    ) {
      return maybeObject.permission;
    }
    return null;
  };

  const rawRoles = Array.isArray(rawUser?.roles) ? rawUser.roles : [];
  const roleNames = rawRoles
    .map((role) => {
      if (typeof role === "string") {
        return role;
      }
      if (role && typeof role === "object") {
        const roleObject = role as RawAuthRole;
        if (typeof roleObject.name === "string") {
          return roleObject.name;
        }
      }
      return null;
    })
    .filter((role): role is string => !!role);

  const directPermissions = Array.isArray(rawUser?.permissions)
    ? rawUser.permissions
    : Array.isArray(fallbackPermissions)
      ? fallbackPermissions
      : [];
  const rolePermissions = rawRoles.flatMap((role) => {
    if (!role || typeof role === "string") {
      return [];
    }
    const maybePermissions = (role as RawAuthRole).permissions;
    return Array.isArray(maybePermissions) ? maybePermissions : [];
  });
  const permissions = Array.from(
    new Set(
      [...directPermissions, ...rolePermissions]
        .map(normalizePermissionValue)
        .filter((permission): permission is string => !!permission),
    ),
  );

  const resolvedId =
    rawUser?.id ?? rawUser?.user_id ?? rawUser?.userId ?? rawUser?.sub ?? "";

  const user: AuthUser = {
    id: String(resolvedId),
    email: toStringValue(rawUser?.email),
    username: toStringValue(rawUser?.username),
    first_name: toStringValue(rawUser?.first_name ?? rawUser?.firstName),
    last_name: toStringValue(rawUser?.last_name ?? rawUser?.lastName),
    is_staff: toBooleanValue(rawUser?.is_staff ?? rawUser?.isStaff),
    is_superuser: toBooleanValue(rawUser?.is_superuser ?? rawUser?.isSuperuser),
    settings:
      rawUser?.settings && typeof rawUser.settings === "object"
        ? (rawUser.settings as AuthUser["settings"])
        : undefined,
    roles: Array.from(new Set(roleNames)),
    permissions: Array.from(new Set(permissions)),
  };
  return application.auth?.extendUser?.(user, rawUser as Record<string, unknown> ?? {}) ?? user;
};

const extractSessionIdFromToken = (
  token: string | null | undefined,
): string | null => {
  if (!token) {
    return null;
  }

  const decoded = decodeToken(token) as Record<string, unknown> | null;
  if (!decoded) {
    return null;
  }

  return selectSessionIdFromTokenPayload(decoded);
};

const isExpectedLogoutAuthError = (error: unknown): boolean => {
  const maybeError = error as
    | {
        message?: string;
        graphQLErrors?: Array<{
          message?: string;
          extensions?: Record<string, unknown>;
        }>;
        networkError?: {
          statusCode?: number;
        };
      }
    | undefined;

  if (!maybeError) {
    return false;
  }

  const message = String(maybeError.message ?? "").toLowerCase();
  const hasAuthMessage =
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("unauthenticated");
  const hasAuthGraphQLError = Array.isArray(maybeError.graphQLErrors)
    ? maybeError.graphQLErrors.some((graphQLError) => {
        const code = String(graphQLError?.extensions?.code ?? "").toUpperCase();
        const graphQLMessage = String(
          graphQLError?.message ?? "",
        ).toLowerCase();
        return (
          code === "UNAUTHENTICATED" ||
          code === "FORBIDDEN" ||
          graphQLMessage.includes("authentication") ||
          graphQLMessage.includes("unauthorized")
        );
      })
    : false;
  const statusCode = maybeError.networkError?.statusCode;

  return (
    hasAuthMessage ||
    hasAuthGraphQLError ||
    statusCode === 401 ||
    statusCode === 403
  );
};

/** Load the configured profile after sign-in, including optional application extensions. */
export async function resolveSignedInUser(client: Pick<ReturnType<typeof useApolloClient>, "query">, accessToken: string) {
  const { data } = await client.query({
    query: application.auth?.currentUserQuery ?? GET_CURRENT_USER,
    fetchPolicy: "network-only",
    context: { headers: { authorization: `Bearer ${accessToken}` }, skipAuthRefresh: true, skipAuthErrorHandling: true },
  });
  if (!data?.me) throw new Error("Impossible de charger votre profil.");
  return normalizeAuthUser(data.me, data.me.permissions);
}

export const ConnectedAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const client = useApolloClient();
  const resolvedCurrentUserRef = useRef<{ user: AuthUser; accessToken: string | null } | null>(null);

  useEffect(() => {
    /** Silent expiration and cross-tab logout must also discard user-specific data. */
    const clearSessionData = (event: Event) => {
      if ((event as CustomEvent<{ isActive?: boolean }>).detail?.isActive !== false) return;
      resolvedCurrentUserRef.current = null;
      void client.clearStore().catch(() => {});
    };
    window.addEventListener(AUTH_SESSION_EVENT, clearSessionData);
    return () => window.removeEventListener(AUTH_SESSION_EVENT, clearSessionData);
  }, [client]);

  const fetchCurrentSessionId = useCallback(
    async (accessToken: string): Promise<string | null> => {
      try {
        const { data } = await client.query({
          query: GET_ACTIVE_SESSIONS,
          fetchPolicy: "network-only",
          context: {
            headers: { authorization: `Bearer ${accessToken}` },
            skipAuthRefresh: true,
          },
        });

        const sessions = Array.isArray(data?.my_sessions)
          ? data.my_sessions
          : [];
        const currentSession = sessions.find(
          (session: { id?: string | number; is_current?: boolean }) =>
            session?.is_current === true,
        );
        return normalizeSessionIdClaim(currentSession?.id) ?? null;
      } catch {
        return null;
      }
    },
    [client],
  );

  const resolveSessionId = useCallback(
    async (
      accessToken: string,
      refreshToken?: string | null,
    ): Promise<string> => {
      const tokenSessionId =
        extractSessionIdFromToken(refreshToken) ??
        extractSessionIdFromToken(accessToken);
      if (tokenSessionId) {
        return tokenSessionId;
      }

      const backendSessionId = await fetchCurrentSessionId(accessToken);
      if (backendSessionId) {
        return backendSessionId;
      }

      return createFallbackSessionId();
    },
    [fetchCurrentSessionId],
  );

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          username: credentials.username,
          password: credentials.password,
          deviceId: credentials.deviceId,
          deviceName: credentials.deviceName,
        },
      });

      const { login } = data;

      if (login.mfa_required) {
        return {
          success: false as const,
          requiresMFA: true as const,
          ephemeralToken: login.ephemeral_token,
          mfaSetupRequired: login.mfa_setup_required,
        };
      }

      if (!login.ok) {
        throw new Error(login.errors?.[0] || "Login failed");
      }

      const normalizedUser = await resolveSignedInUser(client, login.token);
      resolvedCurrentUserRef.current = { user: normalizedUser, accessToken: login.token };
      const refreshToken = normalizeRefreshTokenCandidate(login.refresh_token);
      const sessionId = await resolveSessionId(
        login.token,
        refreshToken,
      );

      return {
        success: true as const,
        user: normalizedUser,
        tokens: buildTokenPair(login.token, refreshToken),
        sessionId,
      };
    },
    [client, resolveSessionId],
  );

  const handleVerifyMFA = useCallback(
    async (code: string, ephemeralToken: string) => {
      const { data } = await client.mutate({
        mutation: VERIFY_MFA_LOGIN_MUTATION,
        variables: { code, ephemeral_token: ephemeralToken },
      });

      const { verify_mfa_login } = data;

      if (!verify_mfa_login.ok) {
        throw new Error(verify_mfa_login.errors?.[0] || "Verification failed");
      }

      const normalizedUser = await resolveSignedInUser(client, verify_mfa_login.token);
      resolvedCurrentUserRef.current = { user: normalizedUser, accessToken: verify_mfa_login.token };
      const refreshToken = normalizeRefreshTokenCandidate(
        verify_mfa_login.refresh_token,
      );
      const sessionId = await resolveSessionId(
        verify_mfa_login.token,
        refreshToken,
      );

      return {
        user: normalizedUser,
        tokens: buildTokenPair(verify_mfa_login.token, refreshToken),
        sessionId,
      };
    },
    [client, resolveSessionId],
  );

  const handleLogout = useCallback(async () => {
    resolvedCurrentUserRef.current = null;
    try {
      await client.mutate({
        mutation: LOGOUT_MUTATION,
        context: {
          useAuthEndpoint: true,
          skipAuthRefresh: true,
          skipAuthErrorHandling: true,
        },
        errorPolicy: "ignore",
      });
    } catch (e) {
      if (!isExpectedLogoutAuthError(e)) {
        console.warn("Logout mutation failed", e);
      }
    }
  }, [client]);

  const handleRefresh = useCallback(
    async (refreshToken?: string | null): Promise<TokenPair> => {
      if (refreshMutationInFlight) {
        return refreshMutationInFlight;
      }

      const normalizedRefreshToken = normalizeRefreshTokenCandidate(refreshToken);
      refreshMutationInFlight = (async () => {
        const { data } = await client.mutate({
          mutation: REFRESH_TOKEN_MUTATION,
          variables: normalizedRefreshToken
            ? { refresh_token: normalizedRefreshToken }
            : {},
          context: { useAuthEndpoint: true },
        });

        const { refresh_token } = data;
        if (!refresh_token.ok) {
          throw new Error(refresh_token.errors?.[0] || "Refresh failed");
        }

        return buildTokenPair(refresh_token.token, refresh_token.refresh_token);
      })();

      try {
        return await refreshMutationInFlight;
      } finally {
        refreshMutationInFlight = null;
      }
    },
    [client],
  );

  const handleValidateSession = useCallback(async () => {
    const isAuthError = (errorLike: {
      extensions?: Record<string, unknown>;
      message?: string;
    }) => {
      const code = String(errorLike.extensions?.code ?? "").toUpperCase();
      const message = String(errorLike.message ?? "").toLowerCase();
      return (
        code === "UNAUTHENTICATED" ||
        code === "FORBIDDEN" ||
        message.includes("authentication") ||
        message.includes("unauthorized")
      );
    };

    try {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        resolvedCurrentUserRef.current = null;
        return false;
      }

      const decoded = decodeToken(accessToken);
      const expectedUserId =
        decoded?.user_id ?? decoded?.userId ?? decoded?.id ?? decoded?.sub;
      const accessTokenExpiryMs =
        typeof decoded?.exp === "number" ? decoded.exp * 1000 : null;
      if (
        expectedUserId == null ||
        accessTokenExpiryMs == null ||
        Date.now() >= accessTokenExpiryMs
      ) {
        resolvedCurrentUserRef.current = null;
        return false;
      }

      const { data, errors } = await client.query({
        query: application.auth?.currentUserQuery ?? GET_CURRENT_USER,
        fetchPolicy: "network-only",
        context: {
          skipAuthRefresh: true,
          skipAuthErrorHandling: true,
        },
      });

      if (tokenStorage.getAccessToken() !== accessToken) return false;

      if (Array.isArray(errors) && errors.some(isAuthError)) {
        resolvedCurrentUserRef.current = null;
        return false;
      }

      const currentUserId = data?.me?.id;
      if (!currentUserId) {
        resolvedCurrentUserRef.current = null;
        if (Array.isArray(errors) && errors.length > 0) {
          throw new SessionValidationIndeterminateError(
            "Unable to verify current session identity.",
          );
        }
        return false;
      }

      const isMatchingUser = String(currentUserId) === String(expectedUserId);
      resolvedCurrentUserRef.current = isMatchingUser
        ? { user: normalizeAuthUser(data?.me, data?.me?.permissions), accessToken }
        : null;
      if (!isMatchingUser) {
        console.error(
          "Auth identity mismatch detected during session validation.",
          {
            expectedUserId: String(expectedUserId),
            currentUserId: String(currentUserId),
          },
        );
      }

      return isMatchingUser;
    } catch (e) {
      if (e instanceof SessionValidationIndeterminateError) {
        throw e;
      }

      const maybeError = e as {
        message?: string;
        networkError?: unknown;
        graphQLErrors?: Array<{
          extensions?: Record<string, unknown>;
          message?: string;
        }>;
      };

      if (
        Array.isArray(maybeError.graphQLErrors) &&
        maybeError.graphQLErrors.some(isAuthError)
      ) {
        resolvedCurrentUserRef.current = null;
        return false;
      }

      const message = String(maybeError.message ?? "").toLowerCase();
      const isTransientNetworkError =
        isAbortLikeSessionValidationError(e) ||
        !!maybeError.networkError ||
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("offline") ||
        message.includes("timeout") ||
        message.includes("connection");

      if (isTransientNetworkError) {
        throw new SessionValidationIndeterminateError(
          "Transient network error during session validation.",
        );
      }

      return false;
    }
  }, [client]);

  const handleResolveCurrentUser = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (resolvedCurrentUserRef.current?.accessToken === accessToken) {
      return resolvedCurrentUserRef.current.user;
    }

    try {
      const { data } = await client.query({
        query: application.auth?.currentUserQuery ?? GET_CURRENT_USER,
        fetchPolicy: "network-only",
        context: {
          skipAuthRefresh: true,
          skipAuthErrorHandling: true,
        },
      });

      if (tokenStorage.getAccessToken() !== accessToken) return null;

      const normalizedUser = data?.me
        ? normalizeAuthUser(data.me, data.me.permissions)
        : null;
      resolvedCurrentUserRef.current = normalizedUser ? { user: normalizedUser, accessToken } : null;
      return normalizedUser;
    } catch {
      return null;
    }
  }, [client]);

  return (
    <AuthProvider
      onLogin={handleLogin}
      onVerifyMFA={handleVerifyMFA}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      onResolveCurrentUser={handleResolveCurrentUser}
      onValidateSession={handleValidateSession}
      config={{
        token: {
          refreshThresholdSeconds: 300,
          accessTokenTTLSeconds: 900,
          refreshTokenTTLSeconds: 604800,
          // Access token stays in-memory; refresh is sourced from HttpOnly backend cookies.
          storageType: "memory",
          storagePrefix: "auth_",
          encryptTokens: false,
        },
      }}
    >
      {children}
    </AuthProvider>
  );
};
