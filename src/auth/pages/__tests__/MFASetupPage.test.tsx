import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { MFASetupPage } from '../MFASetupPage';
import { SETUP_MFA_MUTATION, VERIFY_MFA_SETUP_MUTATION } from '@/graphql/mutations';
import * as useAuthHook from '../../hooks/useAuth';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const cache = new InMemoryCache();

// Mock react-router-dom
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MFASetupPage', () => {
  const mockUser = { id: '1', username: 'test' };

  const mocks = [
    {
      request: {
        query: SETUP_MFA_MUTATION,
        variables: { method: 'totp' }
      },
      result: {
        data: {
          setup_mfa: {
            secret: 'TESTSECRET123',
            qr_code_url: 'data:image/png;base64,fakeqrcode',
            backup_codes: ['code1', 'code2'],
            __typename: 'MFASetupPayload'
          }
        }
      }
    },
    {
      request: {
        query: VERIFY_MFA_SETUP_MUTATION,
        variables: { code: '123456', secret: 'TESTSECRET123' }
      },
      result: {
        data: {
          verify_mfa_setup: {
            ok: true,
            errors: [],
            __typename: 'VerifyMFASetupPayload'
          }
        }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthHook.useAuth as any).mockReturnValue({
      user: mockUser,
    });
  });

  it('renders intro step initially', () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <MFASetupPage />
      </MockedProvider>
    );
    expect(screen.getByText('Set up Multi-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Setup' })).toBeInTheDocument();
  });

  it('progresses to setup step on start', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <MFASetupPage />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Setup' }));

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });

    expect(screen.getByText('TESTSECRET123')).toBeInTheDocument();
  });

  it('allows copying secret to clipboard', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <MFASetupPage />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Setup' }));
    await waitFor(() => {
      expect(screen.getByText('TESTSECRET123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TESTSECRET123');
  });

  it('progresses to verify step', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <MFASetupPage />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Setup' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Verify Code')).toBeInTheDocument();
  });

  it('handles verification success', async () => {
    render(
      <MockedProvider mocks={mocks} cache={cache}>
        <MFASetupPage />
      </MockedProvider>
    );

    // Go to setup
    fireEvent.click(screen.getByRole('button', { name: 'Start Setup' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    // Go to verify
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Enter code
    const input = screen.getByLabelText('Verification Code');
    fireEvent.change(input, { target: { value: '123456' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(screen.getByText('MFA Enabled')).toBeInTheDocument();
    });

    expect(screen.getByText('Backup Codes')).toBeInTheDocument();
    expect(screen.getByText('code1')).toBeInTheDocument();
  });
});
