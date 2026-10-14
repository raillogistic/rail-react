import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { MFASetupPage } from '@/projects/core/pages/auth/MFASetupPage';
import { SETUP_MFA_MUTATION, VERIFY_MFA_SETUP_MUTATION } from '@/shared/api/graphql/legacy/mutations';
import { GET_MFA_STATUS } from '@/shared/api/graphql/legacy/queries';
import * as useAuthHook from '@/features/auth/hooks/useAuth';

// Mock useAuth
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/' }),
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

  const buildMocks = () => [
    {
      request: {
        query: GET_MFA_STATUS,
        variables: {},
      },
      result: {
        data: {
          me: {
            id: '1',
            mfa_enabled: false,
            __typename: 'UserType',
          },
        },
      },
    },
    {
      request: {
        query: GET_MFA_STATUS,
        variables: {},
      },
      result: {
        data: {
          me: {
            id: '1',
            mfa_enabled: false,
            __typename: 'UserType',
          },
        },
      },
    },
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

  const renderPage = () =>
    render(
      <MockedProvider mocks={buildMocks()} cache={new InMemoryCache()}>
        <MFASetupPage />
      </MockedProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    (
      navigator.clipboard.writeText as unknown as {
        mockResolvedValue: (value?: unknown) => void;
      }
    ).mockResolvedValue(undefined);
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

  it('renders intro step initially', async () => {
    renderPage();
    expect(await screen.findByText("Configurer l'authentification à deux facteurs")).toBeInTheDocument();
  });

  it('progresses to setup step on start', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Commencer la configuration' });

    fireEvent.click(screen.getByRole('button', { name: 'Commencer la configuration' }));
    expect(await screen.findByText('Scanner le code QR')).toBeInTheDocument();
    expect(screen.getByText('TESTSECRET123')).toBeInTheDocument();
  });

  it('allows copying secret to clipboard', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Commencer la configuration' });

    fireEvent.click(screen.getByRole('button', { name: 'Commencer la configuration' }));
    await screen.findByText('TESTSECRET123');

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TESTSECRET123');
  });

  it('progresses to verify step', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Commencer la configuration' });

    fireEvent.click(screen.getByRole('button', { name: 'Commencer la configuration' }));
    await screen.findByRole('button', { name: 'Suivant' });

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(await screen.findByText('Vérifier le code')).toBeInTheDocument();
  });

  it('handles verification success', async () => {
    renderPage();

    // Go to setup
    await screen.findByRole('button', { name: 'Commencer la configuration' });
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la configuration' }));

    // Go to verify
    await screen.findByRole('button', { name: 'Suivant' });
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    // Verify
    const input = await screen.findByLabelText('Code de vérification');
    fireEvent.change(input, { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: 'Vérifier' }));

    expect(await screen.findByText('MFA Activée')).toBeInTheDocument();

    expect(screen.getByText('Codes de secours')).toBeInTheDocument();
    expect(screen.getByText('code1')).toBeInTheDocument();
  });
});
