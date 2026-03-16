import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import {
 TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY,
 TABLE_ACTION_DETAILS_METADATA_QUERY,
 TABLE_BOOTSTRAP_METADATA_QUERY,
 TABLE_CAPABILITIES_METADATA_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";
import {
 persistTableMetadata,
 readPersistedTableMetadata,
 recordModelUsage,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import {
 ModelPermissions,
 ModelSchema,
 TableBootstrapInitialState,
 TableBootstrapMinimal,
} from "../types";
import { toGraphqlFieldName } from "../utils";

export interface UseTableMetadataResult {
 metadata?: ModelSchema;
 bootstrapInitialState?: TableBootstrapInitialState;
 bootstrapStateLoading: boolean;
 loading: boolean;
 error?: Error;
 actionBootstrapLoading: boolean;
 actionBootstrapLoaded: boolean;
 actionDetailsLoading: boolean;
 actionDetailsLoaded: boolean;
 actionDetailsError?: Error;
 capabilitiesLoading: boolean;
 capabilitiesLoaded: boolean;
 capabilitiesError?: Error;
 ensureActionDetailsLoaded: () => Promise<void>;
 ensureCapabilitiesLoaded: () => Promise<void>;
 scheduleActionDetailsPrefetch: () => void;
 scheduleCapabilitiesPrefetch: () => void;
}

type ModelSchemaQueryData = {
 modelSchema?: Partial<ModelSchema> | null;
 tableBootstrapMinimal?: TableBootstrapMinimal | null;
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
 * Resolve table metadata via:
 * - bootstrap query (columns/layout),
 * - lightweight actions bootstrap (permissions + built-in mutations),
 * - lazy filter capabilities query,
 * - lazy action-details query (templates + full mutation metadata).
 */
export function useTableMetadata(
 app: string,
 model: string,
 persistenceKey?: string,
): UseTableMetadataResult {
 const {
 data: bootstrapQueryData,
 loading: bootstrapLoading,
 error: bootstrapError,
 } = useQuery<ModelSchemaQueryData>(TABLE_BOOTSTRAP_METADATA_QUERY, {
 variables: { app, model, persistenceKey },
 skip: !app || !model,
 fetchPolicy: "cache-first",
 nextFetchPolicy: "cache-first",
 returnPartialData: true,
 notifyOnNetworkStatusChange: true,
 });

 const {
 data: actionBootstrapQueryData,
 loading: actionBootstrapLoading,
 } = useQuery<ModelSchemaQueryData>(TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY, {
 variables: { app, model },
 skip: !app || !model,
 fetchPolicy: "cache-first",
 nextFetchPolicy: "cache-first",
 returnPartialData: true,
 notifyOnNetworkStatusChange: false,
 });

 const [loadCapabilities, capabilitiesState] =
 useLazyQuery<ModelSchemaQueryData>(TABLE_CAPABILITIES_METADATA_QUERY, {
 // Filter capabilities payload is intentionally partial. Keep it out of Apollo
 // cache so it cannot overwrite bootstrap modelSchema slices (fields /
 // relationships), which would retrigger bootstrap + table-data queries.
 fetchPolicy: "no-cache",
 nextFetchPolicy: "no-cache",
 returnPartialData: false,
 notifyOnNetworkStatusChange: false,
 });

 const [loadActionDetails, actionDetailsState] =
 useLazyQuery<ModelSchemaQueryData>(TABLE_ACTION_DETAILS_METADATA_QUERY, {
 // Action-details payload is intentionally partial and loaded lazily.
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

 const bootstrapInitialState = useMemo(
 () =>
 (bootstrapQueryData?.tableBootstrapMinimal?.initialState as
 | TableBootstrapInitialState
 | null
 | undefined) ?? undefined,
 [bootstrapQueryData],
 );

 const actionBootstrapMetadata = useMemo(
 () =>
 (actionBootstrapQueryData?.modelSchema as
 | Partial<ModelSchema>
 | null
 | undefined) ?? null,
 [actionBootstrapQueryData],
 );

 const capabilitiesMetadata = useMemo(
 () =>
 (capabilitiesState.data?.modelSchema as
 | Partial<ModelSchema>
 | null
 | undefined) ?? null,
 [capabilitiesState.data],
 );

 const actionDetailsMetadata = useMemo(
 () =>
 (actionDetailsState.data?.modelSchema as
 | Partial<ModelSchema>
 | null
 | undefined) ?? null,
 [actionDetailsState.data],
 );

 const stableMetadataCacheRef = useRef<StableMetadataCache | null>(null);
 const mergedMetadata = useMemo(() => {
 if (!bootstrapMetadata && !persistedMetadata) {
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
 ...(actionBootstrapMetadata ?? {}),
 ...(capabilitiesMetadata ?? {}),
 ...(actionDetailsMetadata ?? {}),
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
 }, [
 app,
 model,
 actionBootstrapMetadata,
 actionDetailsMetadata,
 bootstrapMetadata,
 capabilitiesMetadata,
 persistedMetadata,
 ]);

 useEffect(() => {
 if (!app || !model) return;
 recordModelUsage(app, model);
 }, [app, model]);

 useEffect(() => {
 if (!app || !model || !mergedMetadata) return;
 if (!bootstrapMetadata && !persistedMetadata) {
 return;
 }
 if (
 !bootstrapMetadata &&
 !actionBootstrapMetadata &&
 !capabilitiesMetadata &&
 !actionDetailsMetadata
 ) {
 return;
 }
 persistTableMetadata(app, model, { modelSchema: mergedMetadata });
 }, [
 app,
 model,
 mergedMetadata,
 actionBootstrapMetadata,
 actionDetailsMetadata,
 bootstrapMetadata,
 capabilitiesMetadata,
 persistedMetadata,
 ]);

 const capabilitiesRequestedRef = useRef(false);
 const actionDetailsRequestedRef = useRef(false);
 useEffect(() => {
 capabilitiesRequestedRef.current = false;
 actionDetailsRequestedRef.current = false;
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

 const ensureActionDetailsLoaded = useCallback(async () => {
 if (!app || !model) return;
 if (
 actionDetailsRequestedRef.current ||
 actionDetailsState.called ||
 actionDetailsState.loading
 ) {
 return;
 }
 actionDetailsRequestedRef.current = true;
 await loadActionDetails({
 variables: { app, model },
 }).catch(() => {
 actionDetailsRequestedRef.current = false;
 return undefined;
 });
 }, [
 app,
 model,
 actionDetailsState.called,
 actionDetailsState.loading,
 loadActionDetails,
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

 const scheduleActionDetailsPrefetch = useCallback(() => {
 if (actionDetailsState.called || actionDetailsState.loading) return;
 if (!app || !model) return;
 if (idleTaskIdRef.current !== null) return;

 const runPrefetch = () => {
 idleTaskIdRef.current = null;
 idleTaskKindRef.current = null;
 void ensureActionDetailsLoaded();
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
 }, [
 app,
 model,
 actionDetailsState.called,
 actionDetailsState.loading,
 ensureActionDetailsLoaded,
 ]);

 useEffect(() => {
 return () => {
 clearScheduledPrefetch();
 };
 }, [clearScheduledPrefetch]);

 const loading = !bootstrapMetadata && !persistedMetadata && bootstrapLoading;
 const error =
 !bootstrapMetadata && !persistedMetadata && bootstrapError
 ? (bootstrapError as Error)
 : undefined;

 return {
 metadata: mergedMetadata,
 bootstrapInitialState,
 bootstrapStateLoading: bootstrapLoading,
 loading,
 error,
 actionBootstrapLoading,
 actionBootstrapLoaded: !actionBootstrapLoading && (Boolean(app) && Boolean(model)),
 actionDetailsLoading: actionDetailsState.loading,
 actionDetailsLoaded:
 actionDetailsState.called &&
 !actionDetailsState.loading &&
 !actionDetailsState.error,
 actionDetailsError: actionDetailsState.error as Error | undefined,
 capabilitiesLoading: capabilitiesState.loading,
 capabilitiesLoaded:
 capabilitiesState.called && !capabilitiesState.loading && !capabilitiesState.error,
 capabilitiesError: capabilitiesState.error as Error | undefined,
 ensureActionDetailsLoaded,
 ensureCapabilitiesLoaded,
 scheduleActionDetailsPrefetch,
 scheduleCapabilitiesPrefetch: scheduleActionDetailsPrefetch,
 };
}
