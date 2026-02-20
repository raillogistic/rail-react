import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { buildModelQueryField } from "../naming";
import { buildModelQueryDocument } from "../queryBuilder";
import { buildModelSingleQueryVariables } from "../variables";
import { useModelQueryMetadata } from "./useModelQueryMetadata";
import {
  requiresMetadataForQuery,
  resolveActiveDocument,
} from "./shared";
import type { UseModelQueryResult, UseModelSingleQueryOptions } from "../types";

/**
 * Executes a generated single-object model query.
 */
export function useModelSingleQuery(
  options: UseModelSingleQueryOptions,
): UseModelQueryResult {
  const metadataState = useModelQueryMetadata({
    app: options.app,
    model: options.model,
    metadata: options.metadata,
    profile: options.metadataProfile ?? "table",
    skip: options.skipMetadata,
    queryOptions: options.metadataQueryOptions,
  });

  const metadata = metadataState.metadata;
  const waitForMetadata =
    requiresMetadataForQuery(options.selection, options.fields) && !metadata;

  const builtDocument = useMemo(() => {
    if (waitForMetadata) return null;
    return buildModelQueryDocument({
      mode: "single",
      model: options.model,
      managerName: options.managerName,
      metadata,
      fields: options.fields,
      relations: options.relations,
      selection: options.selection,
      whereTypeName: options.whereTypeName,
      supportsQuick: options.supportsQuick,
      includeRowPermissions: options.includeRowPermissions,
      operationName: options.operationName,
      queryName: options.queryName,
      customArgumentDefinitions: options.customArgumentDefinitions,
      customArgumentAssignments: options.customArgumentAssignments,
    });
  }, [
    metadata,
    options.customArgumentAssignments,
    options.customArgumentDefinitions,
    options.fields,
    options.includeRowPermissions,
    options.managerName,
    options.model,
    options.operationName,
    options.queryName,
    options.relations,
    options.selection,
    options.supportsQuick,
    options.whereTypeName,
    waitForMetadata,
  ]);

  const variables = useMemo(
    () => buildModelSingleQueryVariables(options.variables),
    [options.variables],
  );

  const queryDocument = resolveActiveDocument(builtDocument);
  const queryName =
    builtDocument?.queryName ||
    options.queryName ||
    buildModelQueryField(options.model, "single", options.managerName);
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
  };
}
