import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLazyQuery, useQuery, type QueryHookOptions } from "@apollo/client";
import {
  DETAIL_ACTION_DETAILS_METADATA_QUERY,
  DETAIL_BOOTSTRAP_METADATA_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";
import type {
  DetailBootstrapMinimal,
  ModelMetadata,
  ModelPermissions,
} from "@/shared/api/graphql/graphql/metadata/types";

type MetadataQueryOptions = Omit<
  QueryHookOptions<Record<string, unknown>, Record<string, unknown>>,
  "variables" | "query"
>;

type DetailBootstrapQueryData = {
  modelSchema?: Partial<ModelMetadata> | null;
  detailBootstrapMinimal?: Partial<DetailBootstrapMinimal> | null;
};

type DetailActionDetailsQueryData = {
  modelSchema?: Partial<ModelMetadata> | null;
};

type IdleTaskKind = "idle" | "timeout";
type ScheduledTaskId = number | ReturnType<typeof setTimeout>;
type StableMetadataCache = {
  signature: string;
  value: ModelMetadata;
};

export interface UseDetailMetadataResult {
  metadata: ModelMetadata | null;
  defaultIncludeFields: string[];
  loading: boolean;
  error?: Error;
  actionDetailsLoading: boolean;
  actionDetailsLoaded: boolean;
  actionDetailsError?: Error;
  refetch: () => Promise<ModelMetadata | null>;
  ensureActionDetailsLoaded: () => Promise<void>;
  scheduleActionDetailsPrefetch: () => void;
}

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

function normalizeFieldMetadata(
  fields: Partial<ModelMetadata>["fields"],
): ModelMetadata["fields"] {
  return Array.isArray(fields)
    ? fields.map((field) => ({
        name: String(field?.name ?? field?.fieldName ?? ""),
        fieldName: field?.fieldName,
        verboseName: String(field?.verboseName ?? field?.name ?? field?.fieldName ?? ""),
        helpText: field?.helpText,
        fieldType: String(field?.fieldType ?? "String"),
        graphqlType: String(field?.graphqlType ?? "String"),
        pythonType: field?.pythonType,
        required: Boolean(field?.required),
        nullable: Boolean(field?.nullable),
        blank: Boolean(field?.blank),
        editable: Boolean(field?.editable),
        unique: Boolean(field?.unique),
        maxLength: field?.maxLength,
        minLength: field?.minLength,
        maxValue: field?.maxValue,
        minValue: field?.minValue,
        decimalPlaces: field?.decimalPlaces,
        maxDigits: field?.maxDigits,
        choices: Array.isArray(field?.choices) ? field.choices : [],
        defaultValue: field?.defaultValue,
        hasDefault: Boolean(field?.hasDefault),
        autoNow: Boolean(field?.autoNow),
        autoNowAdd: Boolean(field?.autoNowAdd),
        validators: Array.isArray(field?.validators) ? field.validators : [],
        regexPattern: field?.regexPattern,
        readable: field?.readable !== false,
        writable: Boolean(field?.writable),
        visibility: String(field?.visibility ?? "detail"),
        isPrimaryKey: Boolean(field?.isPrimaryKey),
        isIndexed: Boolean(field?.isIndexed),
        isRelation: Boolean(field?.isRelation),
        isComputed: Boolean(field?.isComputed),
        isFile: Boolean(field?.isFile),
        isImage: Boolean(field?.isImage),
        isJson: Boolean(field?.isJson),
        isDate: Boolean(field?.isDate),
        isDatetime: Boolean(field?.isDatetime),
        isNumeric: Boolean(field?.isNumeric),
        isBoolean: Boolean(field?.isBoolean),
        isText: Boolean(field?.isText),
        isRichText: Boolean(field?.isRichText),
        isFsmField: Boolean(field?.isFsmField),
        fsmTransitions: Array.isArray(field?.fsmTransitions)
          ? field.fsmTransitions
          : [],
        customMetadata: field?.customMetadata,
      }))
    : [];
}

function normalizeRelationshipMetadata(
  relationships: Partial<ModelMetadata>["relationships"],
): ModelMetadata["relationships"] {
  return Array.isArray(relationships)
    ? relationships.map((relation) => ({
        name: String(relation?.name ?? relation?.fieldName ?? ""),
        fieldName: relation?.fieldName,
        verboseName: String(
          relation?.verboseName ?? relation?.name ?? relation?.fieldName ?? "",
        ),
        helpText: relation?.helpText,
        relatedApp: String(relation?.relatedApp ?? ""),
        relatedModel: String(relation?.relatedModel ?? ""),
        relatedModelVerbose: String(
          relation?.relatedModelVerbose ?? relation?.relatedModel ?? "",
        ),
        relationType: String(relation?.relationType ?? ""),
        isReverse: Boolean(relation?.isReverse),
        isToOne: Boolean(relation?.isToOne),
        isToMany: Boolean(relation?.isToMany),
        onDelete: relation?.onDelete,
        relatedName: relation?.relatedName,
        throughModel: relation?.throughModel,
        required: Boolean(relation?.required),
        nullable: Boolean(relation?.nullable),
        editable: Boolean(relation?.editable),
        lookupField: String(relation?.lookupField ?? "id"),
        searchFields: Array.isArray(relation?.searchFields)
          ? relation.searchFields
          : [],
        readable: relation?.readable !== false,
        writable: Boolean(relation?.writable),
        canCreateInline: Boolean(relation?.canCreateInline),
        customMetadata: relation?.customMetadata,
      }))
    : [];
}

function normalizeModelMetadata(
  payload: Partial<ModelMetadata>,
  fallback: { app: string; model: string },
): ModelMetadata {
  return {
    app: String(payload.app ?? fallback.app),
    model: String(payload.model ?? fallback.model),
    verboseName: String(payload.verboseName ?? fallback.model),
    verboseNamePlural: String(
      payload.verboseNamePlural ?? payload.verboseName ?? fallback.model,
    ),
    primaryKey: String(payload.primaryKey ?? "id"),
    ordering: Array.isArray(payload.ordering) ? payload.ordering : [],
    uniqueTogether: Array.isArray(payload.uniqueTogether)
      ? payload.uniqueTogether
      : [],
    fields: normalizeFieldMetadata(payload.fields),
    relationships: normalizeRelationshipMetadata(payload.relationships),
    filters: Array.isArray(payload.filters) ? payload.filters : [],
    filterConfig: payload.filterConfig,
    relationFilters: Array.isArray(payload.relationFilters)
      ? payload.relationFilters
      : [],
    mutations: Array.isArray(payload.mutations) ? payload.mutations : [],
    permissions: payload.permissions ?? DEFAULT_MODEL_PERMISSIONS,
    fieldGroups: Array.isArray(payload.fieldGroups) ? payload.fieldGroups : [],
    templates: Array.isArray(payload.templates) ? payload.templates : [],
    metadataVersion: String(payload.metadataVersion ?? "detail-bootstrap"),
    customMetadata: payload.customMetadata,
  };
}

export function useDetailMetadata(
  app: string,
  model: string,
  objectId?: string,
  queryOptions?: MetadataQueryOptions,
): UseDetailMetadataResult {
  const {
    data: bootstrapQueryData,
    loading: bootstrapLoading,
    error: bootstrapError,
    refetch: refetchBootstrapQuery,
  } = useQuery<DetailBootstrapQueryData>(DETAIL_BOOTSTRAP_METADATA_QUERY, {
    variables: {
      app,
      model,
      objectId: objectId ?? undefined,
    },
    skip: !app || !model,
    fetchPolicy: queryOptions?.fetchPolicy ?? "cache-first",
    nextFetchPolicy: "cache-first",
    returnPartialData: true,
    notifyOnNetworkStatusChange: true,
    errorPolicy: queryOptions?.errorPolicy,
    context: queryOptions?.context,
  });

  const [loadActionDetails, actionDetailsState] =
    useLazyQuery<DetailActionDetailsQueryData>(DETAIL_ACTION_DETAILS_METADATA_QUERY, {
      fetchPolicy: "no-cache",
      nextFetchPolicy: "no-cache",
      returnPartialData: false,
      notifyOnNetworkStatusChange: false,
      errorPolicy: queryOptions?.errorPolicy,
      context: queryOptions?.context,
    });

  const bootstrapMetadata = useMemo(
    () =>
      (bootstrapQueryData?.modelSchema as Partial<ModelMetadata> | null | undefined) ??
      null,
    [bootstrapQueryData],
  );
  const detailBootstrap = useMemo(
    () =>
      (bootstrapQueryData?.detailBootstrapMinimal as
        | Partial<DetailBootstrapMinimal>
        | null
        | undefined) ?? null,
    [bootstrapQueryData],
  );
  const actionDetailsMetadata = useMemo(
    () =>
      (actionDetailsState.data?.modelSchema as
        | Partial<ModelMetadata>
        | null
        | undefined) ?? null,
    [actionDetailsState.data],
  );

  const stableMetadataCacheRef = useRef<StableMetadataCache | null>(null);
  const metadata = useMemo(() => {
    if (!bootstrapMetadata && !actionDetailsMetadata) {
      return null;
    }

    const normalized = normalizeModelMetadata(
      {
        ...(bootstrapMetadata ?? {}),
        ...(actionDetailsMetadata ?? {}),
      },
      { app, model },
    );
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
  }, [actionDetailsMetadata, app, bootstrapMetadata, model]);

  const defaultIncludeFields = useMemo(() => {
    if (!Array.isArray(detailBootstrap?.defaultIncludeFields)) {
      return [];
    }
    return detailBootstrap.defaultIncludeFields
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);
  }, [detailBootstrap?.defaultIncludeFields]);

  const actionDetailsRequestedRef = useRef(false);
  useEffect(() => {
    actionDetailsRequestedRef.current = false;
  }, [app, model, objectId]);

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
      variables: {
        app,
        model,
        objectId: objectId ?? undefined,
      },
    }).catch(() => {
      actionDetailsRequestedRef.current = false;
      return undefined;
    });
  }, [
    app,
    model,
    objectId,
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
      (
        window as Window & {
          cancelIdleCallback: (id: number) => void;
        }
      ).cancelIdleCallback(Number(idleTaskIdRef.current));
    } else if (idleTaskKindRef.current === "timeout") {
      clearTimeout(idleTaskIdRef.current);
    }

    idleTaskIdRef.current = null;
    idleTaskKindRef.current = null;
  }, []);

  const scheduleActionDetailsPrefetch = useCallback(() => {
    if (!app || !model) return;
    if (actionDetailsState.called || actionDetailsState.loading) return;
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

  useEffect(() => clearScheduledPrefetch, [clearScheduledPrefetch]);

  const refetch = useCallback(async () => {
    if (!app || !model) {
      return null;
    }

    const refreshes: Array<Promise<unknown>> = [
      refetchBootstrapQuery({
        app,
        model,
        objectId: objectId ?? undefined,
      }),
    ];

    if (actionDetailsState.called) {
      refreshes.push(
        loadActionDetails({
          variables: {
            app,
            model,
            objectId: objectId ?? undefined,
          },
        }),
      );
    }

    await Promise.all(refreshes).catch(() => undefined);
    return metadata;
  }, [
    app,
    loadActionDetails,
    metadata,
    model,
    objectId,
    refetchBootstrapQuery,
    actionDetailsState.called,
  ]);

  const loading = !bootstrapMetadata && bootstrapLoading;
  const error = !bootstrapMetadata && bootstrapError
    ? (bootstrapError as Error)
    : undefined;

  return {
    metadata,
    defaultIncludeFields,
    loading,
    error,
    actionDetailsLoading: actionDetailsState.loading,
    actionDetailsLoaded:
      actionDetailsState.called &&
      !actionDetailsState.loading &&
      !actionDetailsState.error,
    actionDetailsError: actionDetailsState.error as Error | undefined,
    refetch,
    ensureActionDetailsLoaded,
    scheduleActionDetailsPrefetch,
  };
}
