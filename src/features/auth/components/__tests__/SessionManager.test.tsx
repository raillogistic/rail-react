import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager, Session } from '../SessionManager';

describe('SessionManager', () => {
  const mockSessions: Session[] = [
    {
      id: 'session-1',
      deviceName: 'Chrome on Windows',
      browser: 'Chrome',
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      current: true,
      ipAddress: '127.0.0.1',
      deviceType: 'desktop'
    },
    {
      id: 'session-2',
      deviceName: 'Safari on iPhone',
      browser: 'Safari',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      current: false,
      ipAddress: '192.168.1.1',
      deviceType: 'mobile'
    }
  ];

  const onRevokeMock = vi.fn();
  const onRevokeAllMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Make the mock take a little time to resolve so we can see the loading state
    onRevokeMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)));
    onRevokeAllMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)));
  });

  it('displays loading state', () => {
    const { container } = render(
      <SessionManager
        sessions={[]}
        isLoading={true}
        onRevoke={onRevokeMock}
        onRevokeAll={onRevokeAllMock}
      />
    );

    // Check for skeleton elements
    const skeletons = container.getElementsByClassName('animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays sessions', () => {
    render(
      <SessionManager
        sessions={mockSessions}
        isLoading={false}
        onRevoke={onRevokeMock}
        onRevokeAll={onRevokeAllMock}
      />
    );

    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('handles revocation of a single session', async () => {
    render(
      <SessionManager
        sessions={mockSessions}
        isLoading={false}
        onRevoke={onRevokeMock}
        onRevokeAll={onRevokeAllMock}
      />
    );

    // Find the revoke button for the non-current session
    const signOutButtons = screen.getAllByRole('button', { name: 'Sign out' });
    const individualSignOut = signOutButtons[0];

    fireEvent.click(individualSignOut);

    // Wait for loading state (Signing out...)
    await waitFor(() => {
      expect(screen.getByText('Signing out...')).toBeInTheDocument();
    });

    expect(onRevokeMock).toHaveBeenCalledWith('session-2');

    // Wait for loading to finish and text to revert
    await waitFor(() => {
      expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
    });
  });

  it('handles revocation of all other sessions', async () => {
    render(
      <SessionManager
        sessions={mockSessions}
        isLoading={false}
        onRevoke={onRevokeMock}
        onRevokeAll={onRevokeAllMock}
      />
    );

    const revokeAllBtn = screen.getByRole('button', { name: /sign out all other devices/i });
    fireEvent.click(revokeAllBtn);

    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByText('Signing out...')).toBeInTheDocument();
    });

    expect(onRevokeAllMock).toHaveBeenCalled();

    // Wait for finished
    await waitFor(() => {
      expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
    });
  });
});
