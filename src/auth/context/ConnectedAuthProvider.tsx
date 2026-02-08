import React, { useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { AuthProvider } from "./AuthProvider";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
  VERIFY_MFA_LOGIN_MUTATION,
} from "@/graphql/mutations";
import { GET_CURRENT_USER } from "@/graphql/queries";
import { AuthUser, LoginCredentials, TokenPair } from "../types";
import { tokenStorage } from "../utils/token-storage";
import { decodeToken } from "../utils/token";

const normalizeAuthUser = (
  rawUser: Record<string, any> | null | undefined,
  fallbackPermissions?: string[] | null,
): AuthUser => {
  const rawRoles = Array.isArray(rawUser?.roles) ? rawUser.roles : [];
  const roleNames = rawRoles
    .map((role) => {
      if (typeof role === "string") {
        return role;
      }
      if (role && typeof role.name === "string") {
        return role.name;
      }
      return null;
    })
    .filter((role): role is string => !!role);

  const permissions = Array.isArray(rawUser?.permissions)
    ? rawUser.permissions
    : Array.isArray(fallbackPermissions)
      ? fallbackPermissions
      : [];

  const resolvedId =
    rawUser?.id ?? rawUser?.user_id ?? rawUser?.userId ?? rawUser?.sub ?? "";

  return {
    id: String(resolvedId),
    email: rawUser?.email || "",
    username: rawUser?.username || "",
    first_name: rawUser?.first_name ?? rawUser?.firstName ?? "",
    last_name: rawUser?.last_name ?? rawUser?.lastName ?? "",
    is_staff: rawUser?.is_staff ?? rawUser?.isStaff ?? false,
    is_superuser: rawUser?.is_superuser ?? rawUser?.isSuperuser ?? false,
    settings: rawUser?.settings,
    roles: roleNames,
    permissions,
  };
};

export const ConnectedAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const client = useApolloClient();

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

      const normalizedUser = normalizeAuthUser(login.user, login.permissions);

      return {
        success: true as const,
        user: normalizedUser,
        tokens: {
          accessToken: login.token,
          refreshToken: login.refresh_token,
          accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // Approximate if not returned
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        sessionId: "session-" + Date.now(), // Backend should ideally return session ID
      };
    },
    [client],
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

      const normalizedUser = normalizeAuthUser(
        verify_mfa_login.user,
        verify_mfa_login.permissions,
      );

      return {
        user: normalizedUser,
        tokens: {
          accessToken: verify_mfa_login.token,
          refreshToken: verify_mfa_login.refresh_token,
          accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        sessionId: "session-" + Date.now(),
      };
    },
    [client],
  );

  const handleLogout = useCallback(async () => {
    try {
      await client.mutate({ mutation: LOGOUT_MUTATION });
    } catch (e) {
      console.warn("Logout mutation failed", e);
    }
    await client.clearStore();
  }, [client]);

  const handleRefresh = useCallback(
    async (refreshToken: string): Promise<TokenPair> => {
      const { data } = await client.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: { refresh_token: refreshToken },
      });

      const { refresh_token } = data;
      if (!refresh_token.ok) {
        throw new Error(refresh_token.errors?.[0] || "Refresh failed");
      }

      return {
        accessToken: refresh_token.token,
        refreshToken: refresh_token.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    },
    [client],
  );

  const handleValidateSession = useCallback(async () => {
    try {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const decoded = decodeToken(accessToken);
      const expectedUserId =
        decoded?.user_id ?? decoded?.userId ?? decoded?.id ?? decoded?.sub;
      if (expectedUserId == null) {
        return false;
      }

      const { data } = await client.query({
        query: GET_CURRENT_USER,
        fetchPolicy: "network-only",
      });

      const currentUserId = data?.me?.id;
      if (!currentUserId) {
        return false;
      }

      const isMatchingUser = String(currentUserId) === String(expectedUserId);
      if (!isMatchingUser) {
        console.error("Auth identity mismatch detected during session validation.", {
          expectedUserId: String(expectedUserId),
          currentUserId: String(currentUserId),
        });
      }

      return isMatchingUser;
    } catch (e) {
      return false;
    }
  }, [client]);

  return (
    <AuthProvider
      onLogin={handleLogin}
      onVerifyMFA={handleVerifyMFA}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      onValidateSession={handleValidateSession}
      config={{
        token: {
          refreshThresholdSeconds: 300,
          accessTokenTTLSeconds: 900,
          refreshTokenTTLSeconds: 604800,
          storageType: "session",
          storagePrefix: "auth_",
          encryptTokens: false,
        },
      }}
    >
      {children}
    </AuthProvider>
  );
};
