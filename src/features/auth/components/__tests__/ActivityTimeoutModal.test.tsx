import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityTimeoutModal } from '../ActivityTimeoutModal';
import * as useActivityMonitorHook from '../../hooks/useActivityMonitor';
import * as useAuthHook from '../../hooks/useAuth';

// Mock useActivityMonitor
vi.mock('../../hooks/useActivityMonitor', () => ({
  useActivityMonitor: vi.fn(),
}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ActivityTimeoutModal', () => {
  const extendSessionMock = vi.fn();
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthHook.useAuth as any).mockReturnValue({
      logout: logoutMock,
    });
  });

  it('renders nothing when not warning', () => {
    (useActivityMonitorHook.useActivityMonitor as any).mockReturnValue({
      isWarning: false,
      timeUntilTimeout: null,
      extendSession: extendSessionMock,
    });

    render(<ActivityTimeoutModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal when warning', () => {
    (useActivityMonitorHook.useActivityMonitor as any).mockReturnValue({
      isWarning: true,
      timeUntilTimeout: 60000, // 60s
      extendSession: extendSessionMock,
    });

    render(<ActivityTimeoutModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/session timeout warning/i)).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('calls extendSession when button clicked', () => {
    (useActivityMonitorHook.useActivityMonitor as any).mockReturnValue({
      isWarning: true,
      timeUntilTimeout: 60000,
      extendSession: extendSessionMock,
    });

    render(<ActivityTimeoutModal />);
    fireEvent.click(screen.getByRole('button', { name: /stay logged in/i }));
    expect(extendSessionMock).toHaveBeenCalled();
  });

  it('logs out immediately when requested', () => {
    (useActivityMonitorHook.useActivityMonitor as any).mockReturnValue({
      isWarning: true,
      timeUntilTimeout: 60000,
      extendSession: extendSessionMock,
    });

    render(<ActivityTimeoutModal />);
    fireEvent.click(screen.getByRole('button', { name: /log out now/i }));
    expect(logoutMock).toHaveBeenCalledWith({ reason: 'idle_timeout' });
  });
});
