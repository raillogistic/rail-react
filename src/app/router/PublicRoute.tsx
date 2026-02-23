/**
 * Public Route Component
 * 
 * Purpose: Handles routes accessible to non-authenticated users and redirects authenticated users
 * Args: children (components to render), redirectTo (where to redirect authenticated users)
 * Returns: Public content or redirect for authenticated users
 * Raises: None (handles redirects internally)
 * Example: <PublicRoute><LoginPage /></PublicRoute>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/features/auth/context';
import { DEFAULT_APP_ROUTE } from "@/app/router/navigation";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowAuthenticated?: boolean;
}

interface PublicRouteState {
  from?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = DEFAULT_APP_ROUTE,
  allowAuthenticated = false,
}) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and this route doesn't allow authenticated users
  if (isAuthenticated && !allowAuthenticated) {
    // Check if there's a 'from' state to redirect back to
    const from = (location.state as PublicRouteState | null)?.from ?? redirectTo;
    return <Navigate to={from} replace />;
  }

  // Render public content
  return <>{children}</>;
};

/**
 * Higher-order component version of PublicRoute
 */
export const withPublicRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    allowAuthenticated?: boolean;
  }
): React.FC<P> => {
  const PublicComponent: React.FC<P> = (props) => (
    <PublicRoute 
      redirectTo={options?.redirectTo}
      allowAuthenticated={options?.allowAuthenticated}
    >
      <Component {...props} />
    </PublicRoute>
  );

  PublicComponent.displayName = `withPublicRoute(${Component.displayName || Component.name})`;
  
  return PublicComponent;
};
