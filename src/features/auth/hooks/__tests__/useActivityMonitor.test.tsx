import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActivityMonitor } from '../useActivityMonitor';
import * as useAuthHook from '../useAuth';

// Mock useAuth
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useActivityMonitor', () => {
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    (useAuthHook.useAuth as any).mockReturnValue({
      isAuthenticated: true,
      logout: logoutMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does nothing if not authenticated', () => {
    (useAuthHook.useAuth as any).mockReturnValue({
      isAuthenticated: false,
      logout: logoutMock,
    });

    const { result } = renderHook(() => useActivityMonitor({
      idleTimeoutMs: 1000,
      warningThresholdMs: 500,
    }));

    // Advance time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isIdle).toBe(false);
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('detects idle state and logs out', () => {
    const { result } = renderHook(() => useActivityMonitor({
      idleTimeoutMs: 1000,
      warningThresholdMs: 500,
    }));

    expect(result.current.isIdle).toBe(false);

    // Advance past idle timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isIdle).toBe(true);
    expect(logoutMock).toHaveBeenCalledWith({ reason: 'idle_timeout' });
  });

  it('shows warning before timeout', () => {
    const { result } = renderHook(() => useActivityMonitor({
      idleTimeoutMs: 1000,
      warningThresholdMs: 200, // Warn at 800ms
    }));

    expect(result.current.isWarning).toBe(false);

    // Advance to warning time (800ms)
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.isIdle).toBe(false);

    // Advance to timeout (1000ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isIdle).toBe(true);
  });

  it('resets timer on activity', () => {
    const { result } = renderHook(() => useActivityMonitor({
      idleTimeoutMs: 1000,
      warningThresholdMs: 500,
    }));

    // Advance time a bit
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Simulate activity (e.g., calling resetActivity manually or triggering event)
    act(() => {
      result.current.resetActivity();
    });

    // Advance past original timeout (would be 1000ms total, but we reset at 500ms)
    act(() => {
      vi.advanceTimersByTime(600); // Total 1100ms from start, but only 600ms since reset
    });

    expect(result.current.isIdle).toBe(false);
    expect(logoutMock).not.toHaveBeenCalled();

    // Advance to new timeout (1000ms since reset)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.isIdle).toBe(true);
  });
});
