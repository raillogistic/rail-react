import { useMemo } from 'react';
import { useAuth } from './useAuth';
import React from 'react';

export function usePermissions() {
  const { user, hasPermission, hasRole } = useAuth();

  const permissions = useMemo(() => user?.permissions || [], [user]);
  const roles = useMemo(() => user?.roles || [], [user]);

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAllPermissions: (perms: string[]) => perms.every(hasPermission),
    hasAnyPermission: (perms: string[]) => perms.some(hasPermission),
    hasAllRoles: (r: string[]) => r.every(hasRole),
    hasAnyRole: (r: string[]) => r.some(hasRole),
    canAccess: (resource: string, action: string) => hasPermission(`${resource}:${action}`),
  };
}

// HOC for permission-based rendering
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
) {
  return function PermissionGuard(props: P) {
    const { hasPermission } = usePermissions();
    if (!hasPermission(requiredPermission)) return null;
    return <Component {...props} />;
  };
}

// Component for declarative permission checks
export function RequirePermission({
  permission,
  children,
  fallback = null
}: {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
