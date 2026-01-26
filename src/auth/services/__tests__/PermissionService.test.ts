import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../PermissionService';

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
  });

  it('checks permissions correctly', () => {
    permissionService.setPermissions(['users:read', 'posts:write'], ['admin']);

    expect(permissionService.hasPermission('users:read')).toBe(true);
    expect(permissionService.hasPermission('users:write')).toBe(false);
    expect(permissionService.hasRole('admin')).toBe(true);
    expect(permissionService.hasRole('user')).toBe(false);
  });

  it('supports wildcards', () => {
    permissionService.setPermissions(['users:*', '*:view'], []);

    expect(permissionService.hasPermission('users:read')).toBe(true);
    expect(permissionService.hasPermission('users:delete')).toBe(true);
    expect(permissionService.hasPermission('posts:view')).toBe(true);
    expect(permissionService.hasPermission('posts:edit')).toBe(false);
  });

  it('supports global wildcard', () => {
    permissionService.setPermissions(['*'], []);

    expect(permissionService.hasPermission('anything:do')).toBe(true);
  });

  it('handles cache expiration', () => {
    vi.useFakeTimers();
    permissionService = new PermissionService({ cacheTTLMs: 1000, wildcardChar: '*' });

    permissionService.setPermissions(['perm'], ['role']);
    expect(permissionService.hasPermission('perm')).toBe(true);

    vi.advanceTimersByTime(1100);
    expect(permissionService.hasPermission('perm')).toBe(false);
    expect(permissionService.hasRole('role')).toBe(false);

    vi.useRealTimers();
  });

  it('hasAllPermissions (AND)', () => {
    permissionService.setPermissions(['A', 'B'], []);
    expect(permissionService.hasAllPermissions(['A', 'B'])).toBe(true);
    expect(permissionService.hasAllPermissions(['A', 'C'])).toBe(false);
  });

  it('hasAnyPermission (OR)', () => {
    permissionService.setPermissions(['A'], []);
    expect(permissionService.hasAnyPermission(['A', 'C'])).toBe(true);
    expect(permissionService.hasAnyPermission(['B', 'C'])).toBe(false);
  });
});
