/**
 * @module paths
 * @description Canonical route constants used by router and manifest checks.
 */

export const ROUTES = {
  LOGIN: "/login",
  AUTH_ENDPOINT_CONFIG: "/auth/endpoint-config",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  MODEL_IMPORT: "/model-import",
  NOT_FOUND: "/404",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_APPEARANCE: "/settings/appearance",
  SETTINGS_LAYOUT: "/settings/layout",
  SETTINGS_ADMIN: "/settings/admin",
  SETTINGS_SESSIONS: "/settings/sessions",
  SETTINGS_MFA: "/settings/mfa",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

export const PUBLIC_ROUTE_PATHS: readonly string[] = [
  ROUTES.LOGIN,
  ROUTES.AUTH_ENDPOINT_CONFIG,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.NOT_FOUND,
  "/",
];
