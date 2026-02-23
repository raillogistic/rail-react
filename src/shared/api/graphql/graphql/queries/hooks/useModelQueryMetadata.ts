import { useCallback } from "react";
import { useMetadata } from "@/shared/api/graphql/graphql/metadata/gateway";
import type { ModelMetadata } from "@/shared/api/graphql/graphql/metadata/types";
import type { MetadataProfile } from "@/shared/api/graphql/graphql/metadata/telemetry";
import type { UseModelQueryMetadataResult } from "../types";

/**
 * Parameters for metadata resolution hook.
 */
export interface UseModelQueryMetadataOptions {
  /**
   * Django app label.
   */
  app: string;
  /**
   * Django model name.
   */
  model: string;
  /**
   * Preloaded metadata snapshot.
   */
  metadata?: ModelMetadata | null;
  /**
   * Metadata profile used by metadata gateway.
   */
  profile?: MetadataProfile;
  /**
   * Disables metadata fetching.
   */
  skip?: boolean;
  /**
   * Optional query options forwarded to metadata gateway.
   */
  queryOptions?: Record<string, unknown>;
}

/**
 * Returns a resolved metadata snapshot from explicit input or metadata gateway.
 */
export function useModelQueryMetadata(
  options: UseModelQueryMetadataOptions,
): UseModelQueryMetadataResult {
  const explicitMetadata = options.metadata ?? null;
  const shouldSkipGateway =
    Boolean(options.skip) ||
    Boolean(explicitMetadata) ||
    !options.app ||
    !options.model;

  const gateway = useMetadata({
    app: options.app,
    model: options.model,
    profile: options.profile ?? "table",
    skip: shouldSkipGateway,
    queryOptions: options.queryOptions as never,
  });

  const refetch = useCallback(async (): Promise<ModelMetadata | null> => {
    if (explicitMetadata) return explicitMetadata;
    return gateway.refetch();
  }, [explicitMetadata, gateway]);

  return {
    metadata: explicitMetadata ?? gateway.metadata,
    loading: explicitMetadata ? false : gateway.loading,
    error: explicitMetadata ? undefined : (gateway.error as Error | undefined),
    refetch,
  };
}

