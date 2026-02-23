/**
 * Session validation hook for revalidating user sessions on app startup
 *
 * Purpose: Validates user session using 'me' query instead of relying solely on stored tokens
 * Args: None (hook usage)
 * Returns: Session validation status and utilities
 * Raises: None (handles errors internally)
 * Example: const { isValidating, validateSession } = useSessionValidation()
 */

import { useCallback, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { tokenStorage } from "../utils/token-storage";
import {
  GET_CURRENT_USER_RESOLVED,
  type CurrentUserResponse,
} from "@/shared/api/graphql/legacy/queries";
import client from "@/shared/api/apollo/client";

interface UseSessionValidationReturn {
  wasAborted: boolean;
  isValidating: boolean;
  validateSession: () => Promise<CurrentUserResponse["me"] | null>;
  clearValidationError: () => void;
  validationError: string | null;
}

/**
 * Hook for session validation using 'me' query
 */
export const useSessionValidation = (): UseSessionValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [wasAborted, setWasAborted] = useState(false);

  // Lazy query for current user (me query)
  const [getCurrentUser] = useLazyQuery<CurrentUserResponse>(
    GET_CURRENT_USER_RESOLVED,
    {
      client: client,
      errorPolicy: "all",
      fetchPolicy: "network-only", // Always fetch from network for validation
    },
  );
  // console.log("access token", tokenStorage.getAccessToken());

  /**
   * Clear validation error
   */
  const clearValidationError = useCallback(() => {
    setValidationError(null);
    setWasAborted(false);
  }, []);

  /**
   * Validate current session using 'me' query
   * This is the recommended approach instead of relying solely on stored tokens
   */
  const validateSession = useCallback(async (): Promise<
    CurrentUserResponse["me"] | null
  > => {
    // Cookie-based sessions can't be inferred from Web Storage; always attempt server validation.

    setIsValidating(true);
    setValidationError(null);
    setWasAborted(false);

    try {
      const { data, error } = await getCurrentUser();
      console.log("getCurrentUser", data);

      if (error) {
        console.warn("Session validation failed:", error.message);

        // Check if it's an authentication error
        if (
          error.graphQLErrors?.some(
            (err) =>
              err.extensions?.code === "UNAUTHENTICATED" ||
              err.message.includes("authentication") ||
              err.message.includes("unauthorized"),
          )
        ) {
          // Clear invalid tokens
          tokenStorage.clearAllTokens();
          setValidationError("Session expired. Please log in again.");
          return null;
        }

        // Network or other errors - don't clear tokens
        setValidationError(
          "Unable to validate session. Please check your connection.",
        );
        return null;
      }

      if (!data?.me) {
        console.warn("Session validation failed: No user data received");
        tokenStorage.clearAllTokens();
        setValidationError("Invalid session. Please log in again.");
        return null;
      }

      // Session is valid
      return data.me;
    } catch (error: any) {
      // Handle AbortError specifically (occurs when request is cancelled)
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        console.log(
          "Session validation was aborted (likely due to component unmount or navigation)",
        );
        setWasAborted(true);
        return null;
      }

      console.error("Session validation error:", error);

      // Handle network errors gracefully
      if (error.networkError) {
        setValidationError("Network error during session validation.");
        return null;
      }

      // For other errors, assume session is invalid
      tokenStorage.clearAllTokens();
      setValidationError("Session validation failed. Please log in again.");
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [getCurrentUser]);

  return {
    isValidating,
    validateSession,
    clearValidationError,
    validationError,
    wasAborted,
  };
};

