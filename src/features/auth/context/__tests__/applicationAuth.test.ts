/** Profile customization applies consistently without purchasing-specific generic queries. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gql } from '@apollo/client';
import { print } from 'graphql';
import application from '@rail/application';
import { GET_CURRENT_USER } from '@/features/auth/api';
import { resolveSignedInUser } from '../ConnectedAuthProvider';
vi.mock('@rail/application', () => ({ default: {} }));
afterEach(() => { delete application.auth; });

describe('application authentication extension', () => {
  it('keeps default authentication independent from procurement fields and permissions', async () => {
    const query = vi.fn().mockResolvedValue({ data: { me: { id: '1', username: 'alice', roles: [], department: { isResponsibleForPurchases: true } } } });
    const user = await resolveSignedInUser({ query } as any, 'test-token');
    expect(print(GET_CURRENT_USER)).not.toMatch(/employeeNumber|isResponsibleForPurchases|department/);
    expect(user.permissions).toEqual([]);
    expect(query.mock.calls[0][0].query).toBe(GET_CURRENT_USER);
  });
  it('uses the supplied profile query and extends the normalized user', async () => {
    const customQuery = gql`query ApplicationProfile { me { id } }`;
    application.auth = { currentUserQuery: customQuery, extendUser: user => ({ ...user, metadata: { source: 'application' } }) };
    const query = vi.fn().mockResolvedValue({ data: { me: { id: '2', roles: [] } } });
    expect((await resolveSignedInUser({ query } as any, 'test-token')).metadata).toEqual({ source: 'application' });
    expect(query.mock.calls[0][0].query).toBe(customQuery);
  });
});
