/**
 * Protected Route Component
 *
 * Purpose: Guards routes that require authentication and redirects unauthorized users
 * Args: children (components to render if authenticated), fallback (optional loading component)
 * Returns: Protected content or redirect to login
 * Raises: None (handles redirects internally)
 * Example: <ProtectedRoute><Dashboard /></ProtectedRoute>
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROUTES } from "@/shared/routing/routes";
import OfflineNotification from "@/widgets/components/OfflineNotification";
import {
  userMeetsRouteAccessRequirement,
} from "@/features/auth/utils/permission-matching";
import type { AppRouteConfig } from "./contracts";
import type { RouteAccessRequirement } from "@/shared/routing/access";
import { normalizeRouteAccessRequirement } from "@/shared/routing/access";
import { useOptionalRouteAccess } from "./routeAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPermission?: string;
  access?: RouteAccessRequirement;
  route?: AppRouteConfig;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requiredPermission,
  access,
  route,
}) => {
  const { isAuthenticated, isLoading, isRefreshing, isValidating, user } =
    useAuth();
  const routeAccess = useOptionalRouteAccess();
  const location = useLocation();

  // Show loading state while checking authentication or refreshing tokens
  if (isLoading || isRefreshing || isValidating) {
    const loadingMessage = isRefreshing
      ? "Refreshing session..."
      : isValidating
      ? "Validating session..."
      : "Loading...";

    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
    );
  }

  if (routeAccess?.isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading access rules...</p>
          </div>
        </div>
      )
    );
  }

  const normalizedAccess = normalizeRouteAccessRequirement({
    ...(access ?? {}),
    allPermissions: [
      ...((access?.allPermissions ?? [])),
      ...(requiredPermission ? [requiredPermission] : []),
    ],
  });
  const hasAccess = route
    ? (routeAccess?.canAccessRoute(route) ?? true)
    : userMeetsRouteAccessRequirement(user, normalizedAccess, {
        isAuthenticated,
      });

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render protected content
  return (
    <>
      <OfflineNotification />
      {children}
    </>
  );
};

/**
 * Higher-order component version of ProtectedRoute
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string,
  access?: RouteAccessRequirement,
): React.FC<P> => {
  const ProtectedComponent: React.FC<P> = (props) => (
    <ProtectedRoute
      requiredPermission={requiredPermission}
      access={access}
    >
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${
    Component.displayName || Component.name
  })`;

  return ProtectedComponent;
};


