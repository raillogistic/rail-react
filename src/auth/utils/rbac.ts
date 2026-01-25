/**
 * Role-Based Access Control (RBAC) utilities
 * 
 * Purpose: Provides utilities for checking user permissions and roles
 * Args: User object with roles and permissions
 * Returns: Boolean values for permission checks
 * Raises: None (returns false for invalid inputs)
 * Example: hasPermission(user, 'users.view') // true/false
 */

import { User } from "@/graphql/queries";


/**
 * Permission constants for the application
 * These should match the backend permission codenames
 */
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Dashboard access
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ADMIN: 'dashboard.admin',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_SYSTEM: 'settings.system',

  // Rail logistics specific
  LOGISTICS_VIEW: 'logistics.view',
  LOGISTICS_MANAGE: 'logistics.manage',
  LOGISTICS_ADMIN: 'logistics.admin',
} as const;

/**
 * Role constants for common roles
 */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  LOGISTICS_MANAGER: 'logistics_manager',
  LOGISTICS_OPERATOR: 'logistics_operator',
} as const;

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permissionCodename: string): boolean => {
  if (!user) return false;

  // Superusers have all permissions
  if (user.is_superuser) return true;

  // Check if user has the permission through any of their roles
  return user.roles.some(role =>
    role.permissions.some(permission =>
      permission.codename === permissionCodename
    )
  );
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissionCodenames: string[]): boolean => {
  if (!user) return false;

  // Superusers have all permissions
  if (user.is_superuser) return true;

  return permissionCodenames.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissionCodenames: string[]): boolean => {
  if (!user) return false;

  // Superusers have all permissions
  if (user.is_superuser) return true;

  return permissionCodenames.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user) return false;

  return user.roles.some(role => role.name === roleName);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roleNames: string[]): boolean => {
  if (!user) return false;

  return roleNames.some(roleName => hasRole(user, roleName));
};

/**
 * Check if user is staff member
 */
export const isStaff = (user: User | null): boolean => {
  return user?.is_staff || false;
};

/**
 * Check if user is superuser
 */
export const isSuperuser = (user: User | null): boolean => {
  return user?.is_superuser || false;
};

/**
 * Check if user is admin (either superuser or has admin role)
 */
export const isAdmin = (user: User | null): boolean => {
  return isSuperuser(user) || hasRole(user, ROLES.ADMIN);
};

/**
 * Get all permission codenames for a user
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user) return [];

  // Superusers have all permissions - return a comprehensive list
  if (user.is_superuser) {
    return Object.values(PERMISSIONS);
  }

  // Collect all unique permissions from user's roles
  const permissions = new Set<string>();

  user.roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.add(permission.codename);
    });
  });

  return Array.from(permissions);
};

/**
 * Get all role names for a user
 */
export const getUserRoles = (user: User | null): string[] => {
  if (!user) return [];

  return user.roles.map(role => role.name);
};

/**
 * Check if user can access a specific route/feature
 * This is a higher-level function that combines multiple checks
 */
export const canAccessFeature = (
  user: User | null,
  feature: {
    requiredPermissions?: string[];
    requiredRoles?: string[];
    requireStaff?: boolean;
    requireSuperuser?: boolean;
    requireAnyPermission?: boolean; // If true, user needs ANY of the permissions, not ALL
  }
): boolean => {
  if (!user) return false;

  // Check superuser requirement
  if (feature.requireSuperuser && !isSuperuser(user)) {
    return false;
  }

  // Check staff requirement
  if (feature.requireStaff && !isStaff(user)) {
    return false;
  }

  // Check role requirements
  if (feature.requiredRoles && feature.requiredRoles.length > 0) {
    if (!hasAnyRole(user, feature.requiredRoles)) {
      return false;
    }
  }

  // Check permission requirements
  if (feature.requiredPermissions && feature.requiredPermissions.length > 0) {
    if (feature.requireAnyPermission) {
      if (!hasAnyPermission(user, feature.requiredPermissions)) {
        return false;
      }
    } else {
      if (!hasAllPermissions(user, feature.requiredPermissions)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Feature access configurations for different parts of the application
 */
export const FEATURE_ACCESS = {
  DASHBOARD: {
    requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  DASHBOARD_ADMIN: {
    requiredPermissions: [PERMISSIONS.DASHBOARD_ADMIN],
  },
  USER_MANAGEMENT: {
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
  },
  USER_CREATE: {
    requiredPermissions: [PERMISSIONS.USERS_CREATE],
  },
  USER_EDIT: {
    requiredPermissions: [PERMISSIONS.USERS_EDIT],
  },
  USER_DELETE: {
    requiredPermissions: [PERMISSIONS.USERS_DELETE],
  },
  REPORTS: {
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW],
  },
  REPORTS_CREATE: {
    requiredPermissions: [PERMISSIONS.REPORTS_CREATE],
  },
  REPORTS_EXPORT: {
    requiredPermissions: [PERMISSIONS.REPORTS_EXPORT],
  },
  SETTINGS: {
    requiredPermissions: [PERMISSIONS.SETTINGS_VIEW],
  },
  SETTINGS_EDIT: {
    requiredPermissions: [PERMISSIONS.SETTINGS_EDIT],
  },
  SYSTEM_SETTINGS: {
    requiredPermissions: [PERMISSIONS.SETTINGS_SYSTEM],
    requireStaff: true,
  },
  LOGISTICS: {
    requiredPermissions: [PERMISSIONS.LOGISTICS_VIEW],
  },
  LOGISTICS_MANAGE: {
    requiredPermissions: [PERMISSIONS.LOGISTICS_MANAGE],
  },
  LOGISTICS_ADMIN: {
    requiredPermissions: [PERMISSIONS.LOGISTICS_ADMIN],
    requiredRoles: [ROLES.LOGISTICS_MANAGER, ROLES.ADMIN],
    requireAnyPermission: true,
  },
} as const;