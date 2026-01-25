// Helpers for matching the backend schema naming convention.
//
// Rail Django typically runs Graphene with `auto_camelcase=True`, meaning
// Python fields like `refresh_token` are exposed as GraphQL `refreshToken`.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCamelCaseSchema = (): boolean => ((import.meta as any).env?.VITE_GRAPHQL_AUTO_CAMELCASE ?? 'true') !== 'false';

