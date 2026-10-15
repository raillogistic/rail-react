import { useAuthContext } from '../context/AuthProvider';

export function useSession() {
  const context = useAuthContext();

  return {
    lastActivity: context.lastActivity,
    sessionExpiresAt: context.sessionExpiresAt,
    refreshSession: context.refreshSession,
    isAuthenticated: context.isAuthenticated,
  };
}
