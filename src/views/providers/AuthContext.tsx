import { createContext, useContext } from 'react';
import type { UseAuthReturn } from "@/auth/hooks/useAuth";

// Create authentication context
export const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};
