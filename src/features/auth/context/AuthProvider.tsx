import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthenticationManager } from '../AuthenticationManager';
import type {
  AuthState,
  AuthConfigInput,
  LoginCredentials,
  AuthResult,
  AuthUser,
  TokenPair,
  LogoutOptions,
} from '../types';
import { AUTH_SESSION_EVENT } from '@/shared/api/auth/token-storage';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  verifyMFA: (code: string) => Promise<AuthResult>;
  logout: (options?: LogoutOptions) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthConfigInput;
  onLogin?: (credentials: LoginCredentials) => Promise<
    | { success: true; user: AuthUser; tokens: TokenPair; sessionId: string }
    | { success: false; requiresMFA: true; ephemeralToken: string; mfaSetupRequired?: boolean }
  >;
  onVerifyMFA?: (code: string, ephemeralToken: string) => Promise<{ user: AuthUser; tokens: TokenPair; sessionId: string }>;
  onLogout?: () => Promise<void>;
  onRefresh?: (refreshToken?: string | null) => Promise<TokenPair>;
  onValidateSession?: () => Promise<boolean>;
  onResolveCurrentUser?: () => Promise<AuthUser | null>;
}

export function AuthProvider({
  children,
  config,
  onLogin,
  onLogout,
  onRefresh,
  onValidateSession,
  onVerifyMFA,
  onResolveCurrentUser,
}: AuthProviderProps) {
  const [manager] = useState(() => new AuthenticationManager(config));
  // Initialize with loading state to prevent flash of unauthenticated content
  const [state, setState] = useState<AuthState>(() => ({
    ...manager.getState(),
    isLoading: true,
    status: 'loading'
  }));

  useEffect(() => {
    let cancelled = false;
    // Subscribe to state changes
    const unsubscribe = manager.subscribe(setState);

    // Set validation function if provided
    if (onValidateSession) {
      manager.sessionService.setValidationFn(onValidateSession);
    }

    const initializeAuth = async () => {
      // Cookie-auth bootstrap: obtain a fresh access token when memory storage is empty.
      if (onRefresh && !manager.tokenService.getAccessToken()) {
        try {
          const tokens = await onRefresh(null);
          if (!cancelled) {
            manager.tokenService.setTokens(tokens);
          }
        } catch {
          // Best-effort only; manager.initialize() handles unauthenticated state.
        }
      }

      if (!cancelled) {
        await manager.initialize();
      }

      if (
        !cancelled &&
        onResolveCurrentUser &&
        manager.getState().isAuthenticated
      ) {
        try {
          const resolvedUser = await onResolveCurrentUser();
          if (!cancelled && resolvedUser) {
            manager.syncAuthenticatedUser(resolvedUser);
          }
        } catch {
          // Keep the token-derived user when resolving the full user fails.
        }
      }
    };

    void initializeAuth();

    const unsubscribeTokenExpiring = onRefresh
      ? manager.on('auth:token_expiring', () => {
          if (!manager.getState().isAuthenticated) {
            return;
          }
          void manager.tokenService.refreshTokens((refreshToken) => onRefresh(refreshToken)).catch(() => {
            // Refresh errors are handled by TokenService/Auth events.
          });
        })
      : () => {};

    const handleSessionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ isActive?: boolean }>).detail;
      if (detail?.isActive === false && manager.getState().isAuthenticated) {
        // Keep manager state in sync with tokenStorage-driven session invalidation
        // (e.g. Apollo auth failures clearing tokens outside manager APIs).
        void manager.logout({ silent: true, reason: 'session_expired' });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_SESSION_EVENT, handleSessionChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_SESSION_EVENT, handleSessionChange);
      }
      unsubscribeTokenExpiring();
      unsubscribe();
      manager.destroy();
    };
  }, [manager, onRefresh, onResolveCurrentUser, onValidateSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!onLogin) throw new Error('onLogin handler not provided');
    return manager.login(credentials, onLogin);
  }, [manager, onLogin]);

  const verifyMFA = useCallback(async (code: string) => {
    if (!onVerifyMFA) throw new Error('onVerifyMFA handler not provided');
    return manager.verifyMFA(code, onVerifyMFA);
  }, [manager, onVerifyMFA]);

  const logout = useCallback(async (options?: LogoutOptions) => {
    const shouldCallRemoteLogout =
      !!onLogout &&
      options?.silent !== true &&
      options?.reason !== 'session_expired' &&
      options?.reason !== 'forced_logout';

    try {
      if (shouldCallRemoteLogout) {
        await onLogout();
      }
    } finally {
      await manager.logout(options);
    }
  }, [manager, onLogout]);

  const hasPermission = useCallback((permission: string) => {
    return manager.hasPermission(permission);
  }, [manager]);

  const hasRole = useCallback((role: string) => {
    return manager.hasRole(role);
  }, [manager]);

  const refreshSession = useCallback(async () => {
    if (!onRefresh) throw new Error('onRefresh handler not provided');
    await manager.tokenService.refreshTokens((refreshToken) => onRefresh(refreshToken));
  }, [manager, onRefresh]);

  const clearError = useCallback(() => {
    manager.clearError();
  }, [manager]);

  const value: AuthContextValue = {
    ...state,
    login,
    verifyMFA,
    logout,
    hasPermission,
    hasRole,
    refreshSession,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P & { auth: AuthContextValue }>,
): React.FC<P> {
  const WithAuthComponent: React.FC<P> = (props) => {
    const auth = useAuthContext();
    return <Component {...(props as P)} auth={auth} />;
  };

  WithAuthComponent.displayName = `withAuth(${
    Component.displayName ?? Component.name ?? 'Component'
  })`;

  return WithAuthComponent;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
