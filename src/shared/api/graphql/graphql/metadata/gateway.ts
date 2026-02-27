import * as React from "react";
import {
  useApolloClient,
  type ApolloError,
  type QueryHookOptions,
} from "@apollo/client";
import { MODEL_METADATA_QUERY, TABLE_MODEL_METADATA_QUERY } from "./queries";
import type { ModelMetadata } from "./types";
import {
  buildMetadataScopeKey,
  isCacheEntryFresh,
  METADATA_CACHE_TTL_MS,
  readMetadataCacheEntry,
  stableSerialize,
  useMetadataCacheEntry,
  writeMetadataCacheEntry,
  type MetadataKind,
} from "./cache";
import { recordMetadataRequest, type MetadataProfile } from "./telemetry";

type ModelMetadataQueryData = {
  modelSchema: ModelMetadata | null;
};

type MetadataQueryOptions = Omit<
  QueryHookOptions<ModelMetadataQueryData, Record<string, unknown>>,
  "variables" | "query"
>;

export interface MetadataGatewayParams {
  app: string;
  model: string;
  profile: MetadataProfile;
  objectId?: string | null;
  include?: string[];
  skip?: boolean;
  queryOptions?: MetadataQueryOptions;
}

export interface UseMetadataResult {
  metadata: ModelMetadata | null;
  loading: boolean;
  error: ApolloError | Error | undefined;
  refetch: () => Promise<ModelMetadata | null>;
}

interface FetchMetadataSnapshotOptions {
  forceNetwork?: boolean;
  queryOptions?: MetadataQueryOptions;
}

const inFlightRequests = new Map<string, Promise<ModelMetadata | null>>();

function getCacheKind(profile: MetadataProfile): MetadataKind {
  return profile === "table" ? "table" : "form";
}

function normalizeInclude(include?: string[]): string[] {
  if (!include || include.length === 0) return [];
  return include.filter(Boolean).sort();
}

/**
 * Builds a stable signature for metadata scope-sensitive options.
 */
export function buildMetadataSignature(params: MetadataGatewayParams): string {
  return stableSerialize({
    profile: params.profile,
    objectId: params.objectId ?? null,
    include: normalizeInclude(params.include),
  });
}

function buildScopeKey(params: MetadataGatewayParams): string {
  return buildMetadataScopeKey(
    params.app,
    params.model,
    buildMetadataSignature(params),
  );
}

function buildInFlightKey(
  params: MetadataGatewayParams,
  forceNetwork: boolean,
): string {
  return stableSerialize({
    app: params.app,
    model: params.model,
    profile: params.profile,
    objectId: params.objectId ?? null,
    include: normalizeInclude(params.include),
    forceNetwork,
  });
}

function toPayloadSize(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

/**
 * Normalizes unknown thrown values into a proper Error instance.
 */
export function normalizeMetadataError(error: unknown): ApolloError | Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error("Metadata request failed.");
}

/**
 * Fetches a single metadata snapshot with cache/in-flight request dedupe.
 */
export async function fetchMetadataSnapshot(
  client: ReturnType<typeof useApolloClient>,
  params: MetadataGatewayParams,
  options: FetchMetadataSnapshotOptions = {},
): Promise<ModelMetadata | null> {
  if (!params.app || !params.model || params.skip) {
    return null;
  }

  const cacheKind = getCacheKind(params.profile);
  const scopeKey = buildScopeKey(params);
  const cached = readMetadataCacheEntry<ModelMetadata>(cacheKind, scopeKey);
  const shouldUseCache =
    !options.forceNetwork && isCacheEntryFresh(cached, METADATA_CACHE_TTL_MS);

  if (shouldUseCache && cached?.data) {
    recordMetadataRequest({
      app: params.app,
      model: params.model,
      profile: params.profile,
      durationMs: 0,
      payloadBytes: 0,
      cacheHit: true,
      timestamp: Date.now(),
    });
    return cached.data;
  }

  const requestKey = buildInFlightKey(params, Boolean(options.forceNetwork));
  const inFlight = inFlightRequests.get(requestKey);
  if (inFlight) {
    return inFlight;
  }
  const queryDocument =
    params.profile === "table"
      ? TABLE_MODEL_METADATA_QUERY
      : MODEL_METADATA_QUERY;

  const startedAt = Date.now();
  const resolvedFetchPolicy = options.forceNetwork
    ? "network-only"
    : params.queryOptions?.fetchPolicy === "cache-and-network"
      ? "network-only"
      : (params.queryOptions?.fetchPolicy ?? "network-only");
  const queryPromise = client
    .query<ModelMetadataQueryData>({
      query: queryDocument,
      variables: {
        app: params.app,
        model: params.model,
        objectId: params.objectId ?? undefined,
      },
      fetchPolicy: resolvedFetchPolicy,
      errorPolicy: params.queryOptions?.errorPolicy,
      context: params.queryOptions?.context,
    })
    .then((result) => {
      const payload = result.data?.modelSchema ?? null;
      if (payload) {
        writeMetadataCacheEntry(
          cacheKind,
          scopeKey,
          payload.metadataVersion,
          payload,
        );
      }

      recordMetadataRequest({
        app: params.app,
        model: params.model,
        profile: params.profile,
        durationMs: Date.now() - startedAt,
        payloadBytes: toPayloadSize(result.data),
        cacheHit: false,
        timestamp: Date.now(),
      });

      return payload;
    })
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, queryPromise);
  return queryPromise;
}

/**
 * Hook to read metadata with cache-first behavior and manual refetch.
 */
export function useMetadata(params: MetadataGatewayParams): UseMetadataResult {
  const client = useApolloClient();
  const includeSignature = React.useMemo(
    () => stableSerialize(normalizeInclude(params.include)),
    [params.include],
  );
  const normalizedInclude = React.useMemo(
    () => normalizeInclude(params.include),
    [includeSignature],
  );
  const queryFetchPolicy = params.queryOptions?.fetchPolicy;
  const queryErrorPolicy = params.queryOptions?.errorPolicy;
  const queryContext = params.queryOptions?.context;

  const scopeKey = React.useMemo(
    () =>
      buildScopeKey({
        app: params.app,
        model: params.model,
        profile: params.profile,
        objectId: params.objectId,
        include: normalizedInclude,
      }),
    [
      params.app,
      params.model,
      params.objectId,
      params.profile,
      normalizedInclude,
    ],
  );
  const cacheKind = React.useMemo(
    () => getCacheKind(params.profile),
    [params.profile],
  );
  const cachedEntry = useMetadataCacheEntry<ModelMetadata>(cacheKind, scopeKey);

  const [networkState, setNetworkState] = React.useState<{
    loading: boolean;
    error: ApolloError | Error | undefined;
  }>({
    loading: false,
    error: undefined,
  });

  const shouldFetch =
    !params.skip && !isCacheEntryFresh(cachedEntry, METADATA_CACHE_TTL_MS);

  const executeFetch = React.useCallback(
    async (forceNetwork: boolean) => {
      if (params.skip) return null;
      setNetworkState((previous) =>
        previous.loading && previous.error === undefined
          ? previous
          : { loading: true, error: undefined },
      );
      try {
        const payload = await fetchMetadataSnapshot(
          client,
          {
            app: params.app,
            model: params.model,
            profile: params.profile,
            objectId: params.objectId,
            include: normalizedInclude,
            skip: params.skip,
            queryOptions: {
              fetchPolicy: queryFetchPolicy,
              errorPolicy: queryErrorPolicy,
              context: queryContext,
            },
          },
          {
            forceNetwork,
            queryOptions: {
              fetchPolicy: queryFetchPolicy,
              errorPolicy: queryErrorPolicy,
              context: queryContext,
            },
          },
        );
        setNetworkState({ loading: false, error: undefined });
        return payload;
      } catch (error) {
        const normalized = normalizeMetadataError(error);
        setNetworkState({ loading: false, error: normalized });
        throw normalized;
      }
    },
    [
      client,
      normalizedInclude,
      queryContext,
      queryErrorPolicy,
      queryFetchPolicy,
      params.app,
      params.model,
      params.objectId,
      params.profile,
      params.skip,
    ],
  );

  React.useEffect(() => {
    if (!shouldFetch) return;
    void executeFetch(false).catch(() => undefined);
  }, [executeFetch, shouldFetch]);

  const refetch = React.useCallback(() => executeFetch(true), [executeFetch]);

  return {
    metadata: params.skip ? null : (cachedEntry?.data ?? null),
    loading:
      !params.skip &&
      !cachedEntry?.data &&
      (networkState.loading || shouldFetch),
    error: networkState.error,
    refetch,
  };
}
