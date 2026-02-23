import { useAuthContext } from '../context/AuthProvider';

export function useAuth() {
  const context = useAuthContext();

  return {
    // State
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    status: context.status,

    // Actions
    login: context.login,
    verifyMFA: context.verifyMFA,
    logout: context.logout,
    refreshSession: context.refreshSession,
    refreshAuth: context.refreshSession, // Alias for backward compatibility
    clearError: context.clearError,

    // Permissions
    hasPermission: context.hasPermission,
    hasRole: context.hasRole,

    // Status helpers
    isRefreshing: context.status === 'loading', // Approximation or need specific state
    isValidating: context.status === 'loading', // Approximation
  };
}
