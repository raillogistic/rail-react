import React from "react";
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

export const ConnectedAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const client = useApolloClient();

  const handleLogin = async (credentials: LoginCredentials) => {
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

    return {
      success: true as const,
      user: login.user,
      tokens: {
        accessToken: login.token,
        refreshToken: login.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // Approximate if not returned
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      sessionId: "session-" + Date.now(), // Backend should ideally return session ID
    };
  };

  const handleVerifyMFA = async (code: string, ephemeralToken: string) => {
    const { data } = await client.mutate({
      mutation: VERIFY_MFA_LOGIN_MUTATION,
      variables: { code, ephemeral_token: ephemeralToken },
    });

    const { verify_mfa_login } = data;

    if (!verify_mfa_login.ok) {
      throw new Error(verify_mfa_login.errors?.[0] || "Verification failed");
    }

    return {
      user: verify_mfa_login.user,
      tokens: {
        accessToken: verify_mfa_login.token,
        refreshToken: verify_mfa_login.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      sessionId: "session-" + Date.now(),
    };
  };

  const handleLogout = async () => {
    try {
      await client.mutate({ mutation: LOGOUT_MUTATION });
    } catch (e) {
      console.warn("Logout mutation failed", e);
    }
    await client.clearStore();
  };

  const handleRefresh = async (refreshToken: string): Promise<TokenPair> => {
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
  };

  const handleValidateSession = async () => {
    try {
      // Don't validate if no token (unless checking cookie session?)
      // For now, assume if we have access token or cookie, we try.
      const { data } = await client.query({
        query: GET_CURRENT_USER,
        fetchPolicy: "network-only",
      });
      return !!data?.me;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthProvider
      onLogin={handleLogin}
      onVerifyMFA={handleVerifyMFA}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      onValidateSession={handleValidateSession}
      config={{
        token: {
          storageType: "memory", // ConnectedAuthProvider manages token storage via services
        },
      }}
    >
      {children}
    </AuthProvider>
  );
};
