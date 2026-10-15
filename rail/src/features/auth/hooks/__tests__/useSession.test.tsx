import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSession } from '../useSession';
import * as useAuthContextHook from '../../context/AuthProvider';

// Mock useAuthContext
vi.mock('../../context/AuthProvider', () => ({
  useAuthContext: vi.fn(),
}));

describe('useSession', () => {
  const refreshSessionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides session state from context', () => {
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);

    (useAuthContextHook.useAuthContext as any).mockReturnValue({
      lastActivity: now,
      sessionExpiresAt: expires,
      refreshSession: refreshSessionMock,
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useSession());

    expect(result.current.lastActivity).toBe(now);
    expect(result.current.sessionExpiresAt).toBe(expires);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('exposes refreshSession method', async () => {
    (useAuthContextHook.useAuthContext as any).mockReturnValue({
      lastActivity: null,
      sessionExpiresAt: null,
      refreshSession: refreshSessionMock,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useSession());
    await result.current.refreshSession();

    expect(refreshSessionMock).toHaveBeenCalled();
  });
});
