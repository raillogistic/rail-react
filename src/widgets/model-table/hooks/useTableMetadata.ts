import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import {
  TABLE_BOOTSTRAP_METADATA_QUERY,
  TABLE_CAPABILITIES_METADATA_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
  recordModelUsage,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import { ModelPermissions, ModelSchema } from "../types";
import { toGraphqlFieldName } from "../utils";

export interface UseTableMetadataResult {
  metadata?: ModelSchema;
  loading: boolean;
  error?: Error;
  capabilitiesLoading: boolean;
  capabilitiesLoaded: boolean;
  ensureCapabilitiesLoaded: () => Promise<void>;
  scheduleCapabilitiesPrefetch: () => void;
}

type ModelSchemaQueryData = {
  modelSchema?: Partial<ModelSchema> | null;
};

const DEFAULT_MODEL_PERMISSIONS: ModelPermissions = {
  canList: false,
  canRetrieve: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canBulkCreate: false,
  canBulkUpdate: false,
  canBulkDelete: false,
  canExport: false,
  denialReasons: undefined,
};

type IdleTaskKind = "idle" | "timeout";
type ScheduledTaskId = number | ReturnType<typeof setTimeout>;
type StableMetadataCache = {
  signature: string;
  value: ModelSchema;
};

/**
 * Normalizes partial model-schema payload into a safe runtime schema.
 */
function normalizeModelSchema(
  payload: Partial<ModelSchema>,
  fallback: { app: string; model: string },
): ModelSchema {
  const fields = Array.isArray(payload.fields)
    ? payload.fields.map((field) => ({
        ...field,
        name: toGraphqlFieldName(field.name),
        fieldName: field.fieldName
          ? toGraphqlFieldName(field.fieldName)
          : field.fieldName,
      }))
    : [];

  const relationships = Array.isArray(payload.relationships)
    ? payload.relationships.map((relation) => ({
        ...relation,
        name: toGraphqlFieldName(relation.name),
        fieldName: relation.fieldName
          ? toGraphqlFieldName(relation.fieldName)
          : relation.fieldName,
      }))
    : [];

  return {
    app: payload.app || fallback.app,
    model: payload.model || fallback.model,
    verboseName: payload.verboseName || fallback.model,
    verboseNamePlural: payload.verboseNamePlural || payload.verboseName || fallback.model,
    primaryKey: payload.primaryKey || "id",
    ordering: payload.ordering,
    uniqueTogether: payload.uniqueTogether,
    fields,
    relationships,
    filters: Array.isArray(payload.filters) ? payload.filters : [],
    filterConfig: payload.filterConfig,
    relationFilters: Array.isArray(payload.relationFilters)
      ? payload.relationFilters
      : [],
    mutations: Array.isArray(payload.mutations) ? payload.mutations : [],
    permissions: payload.permissions || DEFAULT_MODEL_PERMISSIONS,
    fieldGroups: Array.isArray(payload.fieldGroups) ? payload.fieldGroups : [],
    templates: Array.isArray(payload.templates) ? payload.templates : [],
    metadataVersion: payload.metadataVersion || "bootstrap",
    customMetadata: payload.customMetadata,
  };
}

/**
 * Resolve table metadata via bootstrap query + lazy capabilities query.
 */
export function useTableMetadata(
  app: string,
  model: string,
): UseTableMetadataResult {
  const {
    data: bootstrapQueryData,
    loading: bootstrapLoading,
    error: bootstrapError,
  } = useQuery<ModelSchemaQueryData>(TABLE_BOOTSTRAP_METADATA_QUERY, {
    variables: { app, model },
    skip: !app || !model,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    returnPartialData: true,
    notifyOnNetworkStatusChange: true,
  });

  const [loadCapabilities, capabilitiesState] =
    useLazyQuery<ModelSchemaQueryData>(TABLE_CAPABILITIES_METADATA_QUERY, {
      // Capabilities payload is intentionally partial. Keep it out of Apollo
      // cache so it cannot overwrite bootstrap modelSchema slices (fields /
      // relationships), which would retrigger bootstrap + table-data queries.
      fetchPolicy: "no-cache",
      nextFetchPolicy: "no-cache",
      returnPartialData: false,
      notifyOnNetworkStatusChange: false,
    });

  const persistedMetadata = readPersistedTableMetadata(
    app,
    model,
  ) as Partial<ModelSchema> | null;

  const bootstrapMetadata = useMemo(
    () =>
      (bootstrapQueryData?.modelSchema as Partial<ModelSchema> | null | undefined) ??
      null,
    [bootstrapQueryData],
  );

  const capabilitiesMetadata = useMemo(
    () =>
      (capabilitiesState.data?.modelSchema as
        | Partial<ModelSchema>
        | null
        | undefined) ?? null,
    [capabilitiesState.data],
  );

  const stableMetadataCacheRef = useRef<StableMetadataCache | null>(null);
  const mergedMetadata = useMemo(() => {
    if (!bootstrapMetadata && !persistedMetadata && !capabilitiesMetadata) {
      return undefined;
    }

    const mergedFilterConfig = {
      ...(persistedMetadata?.filterConfig ?? {}),
      ...(bootstrapMetadata?.filterConfig ?? {}),
      ...(capabilitiesMetadata?.filterConfig ?? {}),
    };

    const merged = {
      ...(persistedMetadata ?? {}),
      ...(bootstrapMetadata ?? {}),
      ...(capabilitiesMetadata ?? {}),
      filterConfig:
        Object.keys(mergedFilterConfig).length > 0
          ? mergedFilterConfig
          : undefined,
    } as Partial<ModelSchema>;

    const normalized = normalizeModelSchema(merged, { app, model });
    const signature = JSON.stringify(normalized);
    if (
      stableMetadataCacheRef.current &&
      stableMetadataCacheRef.current.signature === signature
    ) {
      return stableMetadataCacheRef.current.value;
    }
    stableMetadataCacheRef.current = {
      signature,
      value: normalized,
    };
    return normalized;
  }, [app, model, bootstrapMetadata, capabilitiesMetadata, persistedMetadata]);

  useEffect(() => {
    if (!app || !model) return;
    recordModelUsage(app, model);
  }, [app, model]);

  useEffect(() => {
    if (!app || !model || !mergedMetadata) return;
    if (!bootstrapMetadata && !capabilitiesMetadata) return;
    persistTableMetadata(app, model, { modelSchema: mergedMetadata });
  }, [app, model, mergedMetadata, bootstrapMetadata, capabilitiesMetadata]);

  const capabilitiesRequestedRef = useRef(false);
  useEffect(() => {
    capabilitiesRequestedRef.current = false;
  }, [app, model]);

  const ensureCapabilitiesLoaded = useCallback(async () => {
    if (!app || !model) return;
    if (
      capabilitiesRequestedRef.current ||
      capabilitiesState.called ||
      capabilitiesState.loading
    ) {
      return;
    }
    capabilitiesRequestedRef.current = true;
    await loadCapabilities({
      variables: { app, model },
    }).catch(() => {
      capabilitiesRequestedRef.current = false;
      return undefined;
    });
  }, [
    app,
    model,
    loadCapabilities,
    capabilitiesState.called,
    capabilitiesState.loading,
  ]);

  const idleTaskIdRef = useRef<ScheduledTaskId | null>(null);
  const idleTaskKindRef = useRef<IdleTaskKind | null>(null);

  const clearScheduledPrefetch = useCallback(() => {
    if (idleTaskIdRef.current === null) {
      return;
    }

    if (
      idleTaskKindRef.current === "idle" &&
      typeof window !== "undefined" &&
      "cancelIdleCallback" in window
    ) {
      (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(
        Number(idleTaskIdRef.current),
      );
    } else if (idleTaskKindRef.current === "timeout") {
      clearTimeout(idleTaskIdRef.current);
    }

    idleTaskIdRef.current = null;
    idleTaskKindRef.current = null;
  }, []);

  const scheduleCapabilitiesPrefetch = useCallback(() => {
    if (capabilitiesState.called || capabilitiesState.loading) return;
    if (!app || !model) return;
    if (idleTaskIdRef.current !== null) return;

    const runPrefetch = () => {
      idleTaskIdRef.current = null;
      idleTaskKindRef.current = null;
      void ensureCapabilitiesLoaded();
    };

    if (typeof window === "undefined") {
      runPrefetch();
      return;
    }

    if ("requestIdleCallback" in window) {
      idleTaskKindRef.current = "idle";
      idleTaskIdRef.current = (
        window as Window & {
          requestIdleCallback: (
            callback: () => void,
            options?: { timeout?: number },
          ) => number;
        }
      ).requestIdleCallback(runPrefetch, { timeout: 500 });
      return;
    }

    idleTaskKindRef.current = "timeout";
    idleTaskIdRef.current = globalThis.setTimeout(runPrefetch, 80);
  }, [app, model, capabilitiesState.called, capabilitiesState.loading, ensureCapabilitiesLoaded]);

  useEffect(() => {
    return () => {
      clearScheduledPrefetch();
    };
  }, [clearScheduledPrefetch]);

  const loading = !mergedMetadata && bootstrapLoading;
  const error =
    !mergedMetadata && bootstrapError
      ? (bootstrapError as Error)
      : undefined;

  return {
    metadata: mergedMetadata,
    loading,
    error,
    capabilitiesLoading: capabilitiesState.loading,
    capabilitiesLoaded:
      capabilitiesState.called && !capabilitiesState.loading && !capabilitiesState.error,
    ensureCapabilitiesLoaded,
    scheduleCapabilitiesPrefetch,
  };
}
