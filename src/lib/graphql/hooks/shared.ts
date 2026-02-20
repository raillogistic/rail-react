import { gql } from "@apollo/client";
import type { BuiltModelQueryDocument } from "../types";

/**
 * Skip-safe fallback query document used when generated query is unavailable.
 */
export const MODEL_QUERY_SKIP_DOCUMENT = gql`
  query ModelQuerySkip {
    __typename
  }
`;

/**
 * Returns `true` when metadata is required to build query document.
 */
export function requiresMetadataForQuery(
  selection: unknown,
  fields: unknown,
): boolean {
  if (typeof selection === "string" && selection.trim()) return false;
  if (selection && typeof selection === "object") return false;
  if (Array.isArray(fields) && fields.length > 0) return false;
  return true;
}

/**
 * Resolves active document used by Apollo query execution.
 */
export function resolveActiveDocument(
  built: BuiltModelQueryDocument | null,
) {
  return built?.queryDocument ?? MODEL_QUERY_SKIP_DOCUMENT;
}
