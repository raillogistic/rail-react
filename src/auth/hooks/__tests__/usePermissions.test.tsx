import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from '../usePermissions';
import * as useAuthHook from '../useAuth';

vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('usePermissions', () => {
  const mockHasPermission = vi.fn();
  const mockHasRole = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthHook.useAuth as any).mockReturnValue({
      user: null,
      hasPermission: mockHasPermission,
      hasRole: mockHasRole,
    });
  });

  it('returns empty permissions/roles when user is null', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions).toEqual([]);
    expect(result.current.roles).toEqual([]);
  });

  it('returns user permissions and roles', () => {
    (useAuthHook.useAuth as any).mockReturnValue({
      user: {
        permissions: ['read:users', 'write:users'],
        roles: ['admin'],
      },
      hasPermission: mockHasPermission,
      hasRole: mockHasRole,
    });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions).toEqual(['read:users', 'write:users']);
    expect(result.current.roles).toEqual(['admin']);
  });

  it('delegates checks to auth context', () => {
    mockHasPermission.mockReturnValue(true);
    mockHasRole.mockReturnValue(false);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('test')).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith('test');

    expect(result.current.hasRole('admin')).toBe(false);
    expect(mockHasRole).toHaveBeenCalledWith('admin');
  });

  it('implements helper methods correctly', () => {
    mockHasPermission.mockImplementation((p) => p === 'p1');

    const { result } = renderHook(() => usePermissions());

    // hasAllPermissions (AND)
    expect(result.current.hasAllPermissions(['p1'])).toBe(true);
    expect(result.current.hasAllPermissions(['p1', 'p2'])).toBe(false);

    // hasAnyPermission (OR)
    expect(result.current.hasAnyPermission(['p2'])).toBe(false);
    expect(result.current.hasAnyPermission(['p1', 'p2'])).toBe(true);

    // canAccess
    result.current.canAccess('resource', 'action');
    expect(mockHasPermission).toHaveBeenCalledWith('resource:action');
  });
});
