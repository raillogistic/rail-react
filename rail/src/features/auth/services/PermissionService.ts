interface PermissionConfig {
  cacheTTLMs: number;
  wildcardChar: string;
}

interface PermissionCache {
  permissions: string[];
  roles: string[];
  timestamp: number;
}

export class PermissionService {
  private config: PermissionConfig;
  private cache: PermissionCache | null = null;

  constructor(config: PermissionConfig = { cacheTTLMs: 300_000, wildcardChar: '*' }) {
    this.config = config;
  }

  // Set permissions from user data
  setPermissions(permissions: string[], roles: string[]): void {
    this.cache = {
      permissions,
      roles,
      timestamp: Date.now(),
    };
  }

  // Check single permission
  hasPermission(permission: string): boolean {
    if (!this.cache || this.isCacheExpired()) return false;
    return this.matchPermission(permission, this.cache.permissions);
  }

  // Check all permissions (AND)
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  // Check any permission (OR)
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  // Check role
  hasRole(role: string): boolean {
    if (!this.cache || this.isCacheExpired()) return false;
    return this.cache.roles.includes(role);
  }

  // Check any role
  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  // Resource:action permission check
  canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }

  // Get all permissions
  getPermissions(): string[] {
    return this.cache?.permissions || [];
  }

  // Get all roles
  getRoles(): string[] {
    return this.cache?.roles || [];
  }

  // Invalidate cache
  invalidate(): void {
    this.cache = null;
  }

  private isCacheExpired(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > this.config.cacheTTLMs;
  }

  private matchPermission(required: string, granted: string[]): boolean {
    // Direct match
    if (granted.includes(required)) return true;

    // Wildcard matching
    const wc = this.config.wildcardChar;

    // Check for global wildcard
    if (granted.includes(wc)) return true;

    // Check for partial wildcards (e.g., "users:*" matches "users:read")
    const [resource, action] = required.split(':');
    if (resource && action) {
      if (granted.includes(`${resource}:${wc}`)) return true;
      if (granted.includes(`${wc}:${action}`)) return true;
    }

    return false;
  }
}
