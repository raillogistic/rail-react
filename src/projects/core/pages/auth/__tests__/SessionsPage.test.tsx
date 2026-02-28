import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { SessionsPage } from '@/projects/core/pages/auth/SessionsPage';
import { GET_ACTIVE_SESSIONS } from '@/shared/api/graphql/legacy/queries';
import { REVOKE_SESSION_MUTATION, REVOKE_ALL_SESSIONS_MUTATION } from '@/shared/api/graphql/legacy/mutations';
import * as useAuthHook from '@/features/auth/hooks/useAuth';

// Mock useAuth
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const cache = new InMemoryCache();

describe('SessionsPage', () => {
  const mockUser = { id: '1', username: 'test' };

  const mockSessions = [
    {
      id: 'session-1',
      device_type: 'desktop',
      browser: 'Chrome',
      location: 'New York, US',
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_current: true,
      ip_address: '127.0.0.1',
      os: 'Windows',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    {
      id: 'session-2',
      device_type: 'mobile',
      browser: 'Safari',
      location: 'London, UK',
      last_activity: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_current: false,
      ip_address: '10.0.0.1',
      os: 'iOS',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    }
  ];

  const mocks = [
    {
      request: {
        query: GET_ACTIVE_SESSIONS,
      },
      result: {
        data: {
          my_sessions: mockSessions.map(s => ({ ...s, __typename: 'Session' }))
        }
      }
    },
    {
      request: {
        query: REVOKE_SESSION_MUTATION,
        variables: { session_id: 'session-2' }
      },
      result: {
        data: {
          revoke_session: {
            ok: true,
            errors: [],
            __typename: 'RevokeSessionPayload'
          }
        }
      }
    },
    {
      request: {
        query: REVOKE_ALL_SESSIONS_MUTATION,
      },
      result: {
        data: {
          revoke_all_sessions: {
            ok: true,
            errors: [],
            __typename: 'RevokeAllSessionsPayload'
          }
        }
      }
    },
    // Refetch mock
    {
      request: {
        query: GET_ACTIVE_SESSIONS,
      },
      result: {
        data: {
          my_sessions: [mockSessions[0]].map(s => ({ ...s, __typename: 'Session' }))
        }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useAuthHook.useAuth as unknown as {
        mockReturnValue: (
          value: ReturnType<typeof useAuthHook.useAuth>,
        ) => void;
      }
    ).mockReturnValue({
      user: mockUser,
    } as ReturnType<typeof useAuthHook.useAuth>);
  });

  it('renders loading state initially', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <SessionsPage />
      </MockedProvider>
    );
    // SessionManager renders skeletons with animate-pulse class
    const skeletons = document.getElementsByClassName('animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Wait for data to load to avoid "not wrapped in act" warning
    await waitFor(() => {
      expect(screen.queryByText('Loading sessions...')).not.toBeInTheDocument();
    });
  });

  it('redirects/shows message if not logged in', () => {
    (
      useAuthHook.useAuth as unknown as {
        mockReturnValue: (
          value: ReturnType<typeof useAuthHook.useAuth>,
        ) => void;
      }
    ).mockReturnValue({ user: null } as ReturnType<typeof useAuthHook.useAuth>);

    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <SessionsPage />
      </MockedProvider>
    );

    expect(screen.getByText('Please log in to manage sessions.')).toBeInTheDocument();
  });

  it('displays sessions after loading', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <SessionsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chrome/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Safari/i)).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('handles session revocation', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <SessionsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Safari/i)).toBeInTheDocument();
    });

    const signOutButtons = screen.getAllByRole('button', { name: 'Sign out' });
    fireEvent.click(signOutButtons[0]);

    // Wait for Safari session to disappear (refetch behavior)
    await waitFor(() => {
      expect(screen.queryByText(/Safari/i)).not.toBeInTheDocument();
    });
  });
});
