/**
 * Cookie-based authentication utilities.
 * 
 * NOTE: The primary token storage is now HttpOnly cookies managed by the backend.
 * These utilities are placeholders or for specific non-HttpOnly needs if any.
 * 
 * For security reasons, JavaScript cannot access HttpOnly cookies.
 * Presence of auth session is inferred from successful API calls or a non-HttpOnly 'logged_in' flag cookie if implemented.
 */

import { tokenStorage } from "../token-storage";

export const isAuthCookiePresent = (): boolean => {
  // In a HttpOnly flow, we can't read the cookie value directly in JS.
  // Return a *hint* only (used for UX), never for real authorization.
  return tokenStorage.hasValidSession();
};
