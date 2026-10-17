/** Session invalidation and server token expiry remain authoritative for the shared provider. */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AuthUser, LoginCredentials, TokenPair } from '../../types';

const state = vi.hoisted(() => ({
  props: null as null | {
    onRefresh: () => Promise<TokenPair>;
    onLogin: (credentials: LoginCredentials) => Promise<unknown>;
    onResolveCurrentUser: () => Promise<AuthUser | null>;
  },
  client: { mutate: vi.fn(), query: vi.fn(), clearStore: vi.fn() },
}));
vi.mock('@apollo/client', async original => ({
  ...await original<typeof import('@apollo/client')>(),
  useApolloClient: () => state.client,
}));
vi.mock('../AuthProvider', () => ({
  AuthProvider: (props: NonNullable<typeof state.props> & { children: React.ReactNode }) => {
    state.props = props;
    return props.children;
  },
}));
import { ConnectedAuthProvider } from '../ConnectedAuthProvider';

beforeEach(() => { vi.clearAllMocks(); state.client.clearStore.mockResolvedValue(undefined); });
afterEach(cleanup);

it('clears user data on silent or cross-tab invalidation and removes its listener', async () => {
  const view = render(<ConnectedAuthProvider><span>Ready</span></ConnectedAuthProvider>);
  await act(async () => {
    window.dispatchEvent(new CustomEvent('auth-session-change', { detail: { isActive: false } }));
  });
  expect(state.client.clearStore).toHaveBeenCalledOnce();
  view.unmount();
  window.dispatchEvent(new CustomEvent('auth-session-change', { detail: { isActive: false } }));
  expect(state.client.clearStore).toHaveBeenCalledOnce();
});

it('uses the JWT expiry instead of assuming a fifteen-minute access token', async () => {
  const exp = Math.floor(Date.now() / 1000) + 75;
  const token = `${btoa('{}')}.${btoa(JSON.stringify({ exp, sub: 'synthetic' }))}.signature`;
  state.client.mutate.mockResolvedValue({ data: { refresh_token: { ok: true, token } } });
  render(<ConnectedAuthProvider><span>Ready</span></ConnectedAuthProvider>);
  const pair = await state.props!.onRefresh();
  expect(pair.accessTokenExpiresAt.getTime()).toBe(exp * 1000);
});

it('does not reuse a profile resolved with another credential', async () => {
  state.client.mutate.mockResolvedValue({ data: { login: { ok: true, token: 'synthetic-login' } } });
  state.client.query
    .mockResolvedValueOnce({ data: { me: { id: 'old-user', username: 'old-user' } } })
    .mockResolvedValueOnce({ data: { my_sessions: [] } })
    .mockResolvedValueOnce({ data: { me: { id: 'new-user', username: 'new-user' } } });
  render(<ConnectedAuthProvider><span>Ready</span></ConnectedAuthProvider>);
  await state.props!.onLogin({ username: 'old-user', password: 'synthetic-password' });
  expect((await state.props!.onResolveCurrentUser())?.id).toBe('new-user');
});
