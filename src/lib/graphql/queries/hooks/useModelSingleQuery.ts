import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { buildModelQueryField } from "../naming";
import { buildModelQueryDocument } from "../queryBuilder";
import { buildModelSingleQueryVariables } from "../variables";
import { useModelQueryMetadata } from "./useModelQueryMetadata";
import { useModelQueryDevMetrics } from "./useModelQueryDevMetrics";
import {
  requiresMetadataForQuery,
  resolveModelQueryOptions,
  resolveActiveDocument,
} from "./shared";
import type { UseModelQueryResult, UseModelSingleQueryOptions } from "../types";

/**
 * Executes a generated single-object model query.
 */
export function useModelSingleQuery(
  options: UseModelSingleQueryOptions,
): UseModelQueryResult {
  const resolved = resolveModelQueryOptions(options);

  const metadataState = useModelQueryMetadata({
    app: resolved.app,
    model: resolved.model,
    metadata: resolved.metadata,
    profile: resolved.metadataProfile ?? "table",
    skip: resolved.skipMetadata,
    queryOptions: resolved.metadataQueryOptions,
  });

  const metadata = metadataState.metadata;
  const waitForMetadata =
    requiresMetadataForQuery(resolved.selection, resolved.fields, resolved.includeFields, resolved.includeRelations) && !metadata;

  const builtDocument = useMemo(() => {
    if (waitForMetadata) return null;
    return buildModelQueryDocument({
      mode: "single",
      model: resolved.model,
      managerName: resolved.managerName,
      metadata,
      fields: resolved.fields,
      includeFields: resolved.includeFields,
      excludeFields: resolved.excludeFields,
      relations: resolved.relations,
      includeRelations: resolved.includeRelations,
      excludeRelations: resolved.excludeRelations,
      selection: resolved.selection,
      whereTypeName: resolved.whereTypeName,
      supportsQuick: resolved.supportsQuick,
      includeRowPermissions: resolved.includeRowPermissions,
      operationName: resolved.operationName,
      queryName: resolved.queryName,
      customArgumentDefinitions: resolved.customArgumentDefinitions,
      customArgumentAssignments: resolved.customArgumentAssignments,
    });
  }, [
    metadata,
    resolved.customArgumentAssignments,
    resolved.customArgumentDefinitions,
    resolved.excludeFields,
    resolved.excludeRelations,
    resolved.fields,
    resolved.includeFields,
    resolved.includeRelations,
    resolved.includeRowPermissions,
    resolved.managerName,
    resolved.model,
    resolved.operationName,
    resolved.queryName,
    resolved.relations,
    resolved.selection,
    resolved.supportsQuick,
    resolved.whereTypeName,
    waitForMetadata,
  ]);

  const variables = useMemo(
    () => buildModelSingleQueryVariables(options.id),
    [options.id],
  );

  const queryDocument = resolveActiveDocument(builtDocument);
  const queryName =
    builtDocument?.queryName ||
    resolved.queryName ||
    buildModelQueryField(resolved.model, "single", resolved.managerName);
  const requireId = options.requireId ?? true;
  const hasId =
    variables.id !== undefined &&
    variables.id !== null &&
    String(variables.id).trim() !== "";
  const skipForMissingId = requireId && !hasId;
  const skipQuery =
    Boolean(options.apollo?.skip) || !builtDocument || skipForMissingId;

  const queryState = useQuery(queryDocument, {
    ...(options.apollo || {}),
    variables,
    skip: skipQuery,
  });
  const dev = useModelQueryDevMetrics({
    metadataLoading: metadataState.loading,
    dataLoading: queryState.loading,
    skipQuery,
    requestKey: `${queryName}|${JSON.stringify(variables)}|${String(skipQuery)}`,
    metadataKey: `${resolved.app}|${resolved.model}|${String(resolved.skipMetadata)}`,
  });

  const refetch = useCallback(
    (nextVariables?: Record<string, unknown>) => {
      if (!builtDocument) {
        return Promise.resolve(null);
      }
      return queryState.refetch(
        (nextVariables || variables) as Record<string, unknown>,
      ) as Promise<unknown>;
    },
    [builtDocument, queryState, variables],
  );

  const loading = builtDocument ? queryState.loading : metadataState.loading;
  const rawData = queryState.data as Record<string, unknown> | undefined;
  const data = builtDocument ? rawData?.[queryName] ?? null : null;
  const error = (queryState.error || metadataState.error) as
    | Error
    | undefined;

  return {
    data,
    rawData,
    loading,
    error,
    refetch,
    queryDocument,
    variables,
    queryName,
    metadata,
    metadataLoading: metadataState.loading,
    metadataError: metadataState.error,
    dev,
  };
}
