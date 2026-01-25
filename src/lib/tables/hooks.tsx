// useGraphQLModelTable.tsx
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  gql,
  useQuery,
  useApolloClient,
  type ApolloError,
  type WatchQueryFetchPolicy,
} from "@apollo/client";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ModelTableType,
  TableFieldMetadataType,
  ComplexFilterInput,
  GraphQLTableVars,
  type ModelTableFiltersOptions,
} from "./types";
import {
  buildMetadataScopeKey,
  isCacheEntryFresh,
  stableSerialize,
  useMetadataCacheEntry,
  writeMetadataCacheEntry,
  METADATA_CACHE_TTL_MS,
} from "@/lib/metadata/cache";
import { DEFAULT_PAGINATION_ORDERING } from "@/graphql/queries";

/* ----------------------------
   ?Y?? Metadata Queries
---------------------------- */
const MODEL_TABLE_BASE_QUERY = gql`
  query model_table_base(
    $app_name: String!
    $model_name: String!
    $exclude: [String]
    $only: [String]
    $include_nested: Boolean
    $only_lookup: [String]
    $exclude_lookup: [String]
  ) {
    response: modelTable(
      appName: $app_name
      modelName: $model_name
      exclude: $exclude
      only: $only
      includeNested: $include_nested
      onlyLookup: $only_lookup
      excludeLookup: $exclude_lookup
    ) {
      metadataVersion
      app
      model
      verboseName
      verboseNamePlural
      tableName
      ordering
      defaultOrdering
      permissions {
        can_create: canCreate
        can_update: canUpdate
        can_delete: canDelete
        can_read: canRead
        can_list: canList
        reasons
      }
      fields {
        name
        accessor
        display
        editable
        field_type: fieldType
        filterable
        sortable
        title
        helpText
        is_property: isProperty
        is_related: isRelated
        permissions {
          can_read: canRead
          can_write: canWrite
          visibility
          access_level: accessLevel
          mask_value: maskValue
          reason
        }
      }
    }
  }
`;

const MODEL_TABLE_FILTERS_QUERY = gql`
  query model_table_filters(
    $app_name: String!
    $model_name: String!
    $exclude: [String]
    $only: [String]
    $include_nested: Boolean
    $only_lookup: [String]
    $exclude_lookup: [String]
  ) {
    response: modelTable(
      appName: $app_name
      modelName: $model_name
      exclude: $exclude
      only: $only
      includeNested: $include_nested
      onlyLookup: $only_lookup
      excludeLookup: $exclude_lookup
    ) {
      metadataVersion
      filters {
        field_name: fieldName
        field_label: fieldLabel
        is_nested: isNested
        related_model: relatedModel
        is_custom: isCustom
        options {
          choices {
            value
            label
          }
          name
          lookup_expr: lookupExpr
          help_text: helpText
          filter_type: filterType
        }
        nested {
          field_name: fieldName
          field_label: fieldLabel
          is_nested: isNested
          related_model: relatedModel
          is_custom: isCustom
          options {
            choices {
              value
              label
            }
            name
            lookup_expr: lookupExpr
            help_text: helpText
            filter_type: filterType
          }
        }
      }
    }
  }
`;

const MODEL_TABLE_MUTATIONS_QUERY = gql`
  query model_table_mutations(
    $app_name: String!
    $model_name: String!
    $exclude: [String]
    $only: [String]
    $include_nested: Boolean
    $only_lookup: [String]
    $exclude_lookup: [String]
  ) {
    response: modelTable(
      appName: $app_name
      modelName: $model_name
      exclude: $exclude
      only: $only
      includeNested: $include_nested
      onlyLookup: $only_lookup
      excludeLookup: $exclude_lookup
    ) {
      metadataVersion
      mutations {
        name
        method_name: methodName
        description
        input_type: inputType
        input_fields: inputFields {
          name
          field_type: fieldType
          required
          default_value: defaultValue
          description
          choices
          validation_rules: validationRules
          widget_type: widgetType
          placeholder
          help_text: helpText
          min_length: minLength
          max_length: maxLength
          min_value: minValue
          max_value: maxValue
          pattern
          related_model: relatedModel
          multiple
        }
        requires_authentication: requiresAuthentication
        required_permissions: requiredPermissions
        mutation_type: mutationType
        model_name: modelName
        form_config: formConfig
        validation_schema: validationSchema
        success_message: successMessage
        error_messages: errorMessages
        action
      }
    }
  }
`;

const MODEL_TABLE_TEMPLATES_QUERY = gql`
  query model_table_templates(
    $app_name: String!
    $model_name: String!
    $exclude: [String]
    $only: [String]
    $include_nested: Boolean
    $only_lookup: [String]
    $exclude_lookup: [String]
  ) {
    response: modelTable(
      appName: $app_name
      modelName: $model_name
      exclude: $exclude
      only: $only
      includeNested: $include_nested
      onlyLookup: $only_lookup
      excludeLookup: $exclude_lookup
    ) {
      metadataVersion
      pdfTemplates {
        key
        methodName
        title
        endpoint
        urlPath
        guard
        requireAuthentication
        roles
        permissions
        allowed
        denialReason
        allowClientData
        clientDataFields
        clientDataSchema
      }
    }
  }
`;

type BaseMetadataResponse = {
  response: Omit<ModelTableType, "filters" | "mutations" | "pdfTemplates">;
};

type FiltersMetadataResponse = {
  response: Pick<ModelTableType, "metadataVersion" | "filters">;
};

type MutationsMetadataResponse = {
  response: Pick<ModelTableType, "metadataVersion" | "mutations">;
};

type PdfTemplatesMetadataResponse = {
  response: Pick<ModelTableType, "metadataVersion" | "pdfTemplates">;
};

type MetadataLoadingState = {
  base: boolean;
  filters: boolean;
  mutations: boolean;
  pdfTemplates: boolean;
};

const mergeMetadataPayload = (
  incoming: Partial<ModelTableType> | null,
  previous: ModelTableType | null
): ModelTableType | null => {
  if (!incoming && !previous) return null;
  const baseline = (previous ?? incoming) as ModelTableType | null;
  if (!baseline) return null;
  const merged: ModelTableType = {
    ...baseline,
    ...(incoming ?? {}),
    metadataVersion:
      incoming?.metadataVersion ??
      previous?.metadataVersion ??
      baseline.metadataVersion ??
      "unknown",
    filters: incoming?.filters ?? previous?.filters ?? baseline.filters ?? [],
    mutations:
      incoming?.mutations ?? previous?.mutations ?? baseline.mutations ?? [],
    pdfTemplates:
      incoming?.pdfTemplates ??
      previous?.pdfTemplates ??
      baseline.pdfTemplates ??
      [],
  };
  return merged;
};

const DEFAULT_METADATA_LOADING_STATE: MetadataLoadingState = {
  base: false,
  filters: false,
  mutations: false,
  pdfTemplates: false,
};

type DataQueryOptions = {
  fieldName?: string;
  includeQuickArgument?: boolean;
  filterTypeName?: string;
};

type SelectionBuilderArgs = {
  fields: TableFieldMetadataType[];
  excludeColumns: string[];
  filters: any[];
  additionalSelectionFields?: string[];
};

const buildSelectionSet = ({
  fields,
  excludeColumns,
  filters,
  additionalSelectionFields = [],
}: SelectionBuilderArgs): string => {
  const choiceFields = new Set<string>();
  filters.forEach((filter) => {
    if (
      filter.options?.some((opt: any) => opt.choices && opt.choices.length > 0)
    ) {
      choiceFields.add(filter.field_name);
    }
  });

  const isChoiceFieldType = (typeName?: string) => {
    if (!typeName) return false;
    const normalized = typeName.toLowerCase();
    return (
      normalized.includes("choice") ||
      normalized.includes("enum") ||
      normalized.includes("fsm")
    );
  };

  const filteredFields = fields.filter((f) => !excludeColumns.includes(f.name));
  const fieldSelections = filteredFields.map((f) => {
    if (f.is_related) {
      return `${f.name} { id desc }`;
    }
    const needsChoiceDescription =
      choiceFields.has(f.name) || isChoiceFieldType(f.field_type);
    if (needsChoiceDescription) {
      return `${f.name}\n${f.name}_desc`;
    }
    return f.name;
  });

  return ["id", "desc", ...fieldSelections, ...additionalSelectionFields].join(
    "\n"
  );
};

/**
 * Normalizes ordering payloads into a trimmed string array.
 */
const normalizeOrderingInput = (
  ordering?: string | string[]
): string[] => {
  if (Array.isArray(ordering)) {
    return ordering
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry): entry is string => Boolean(entry));
  }
  if (typeof ordering === "string") {
    const trimmed = ordering.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

/**
 * Guarantees a non-empty ordering payload, defaulting to newest-first.
 */
const resolveOrderingWithDefault = (
  ordering?: string | string[]
): string[] => {
  const normalized = normalizeOrderingInput(ordering);
  if (normalized.length > 0) return normalized;
  return [...DEFAULT_PAGINATION_ORDERING];
};

/* ----------------------------
   ⚙️ Helper: Build Data Query
----------------------------- */
function buildAutoDataQuery(
  modelName: string,
  fields: TableFieldMetadataType[],
  excludeColumns: string[],
  filters: any[] = [],
  customSelection?: string,
  additionalSelectionFields: string[] = [],
  options?: DataQueryOptions
) {
  const fieldName = options?.fieldName ?? `${modelName.toLowerCase()}s_pages`;
  const queryName = fieldName.replace(/[^a-zA-Z0-9_]/g, "_");
  const includeQuick = options?.includeQuickArgument ?? true;

  const typeName =
    options?.filterTypeName ??
    `${modelName.charAt(0).toUpperCase() + modelName.slice(1)}ComplexFilter`;

  const selection =
    customSelection ??
    buildSelectionSet({
      fields,
      excludeColumns,
      filters,
      additionalSelectionFields,
    });

  const quickVariable = includeQuick ? ", $quick:String" : "";
  const quickArgument = includeQuick ? ",quick:$quick" : "";

  return gql`
    query ${queryName}($filters: ${typeName}, $ordering: [String], $page: Int, $per_page: Int${quickVariable}) {
      ${fieldName}(filters: $filters, orderBy: $ordering, page: $page, perPage: $per_page${quickArgument}) {
        page_info: pageInfo {
          total_count: totalCount
          page_count: pageCount
          current_page: currentPage
          per_page: perPage
          has_next_page: hasNextPage
          has_previous_page: hasPreviousPage
        }
        items {
          ${selection}
        }
      }
    }
  `;
}

/**
 * Loads table metadata in stages so the table can build columns quickly before filters,
 * mutations, and templates finish loading.
 */
export function useModelTableMetadata(
  appName: string,
  modelName: string,
  filtersOptions?: ModelTableFiltersOptions,
  options?: { skip?: boolean }
) {
  const client = useApolloClient();
  const filtersSignature = useMemo(
    () => stableSerialize(filtersOptions ?? {}),
    [filtersOptions]
  );
  const scopeKey = useMemo(
    () => buildMetadataScopeKey(appName, modelName, filtersSignature),
    [appName, modelName, filtersSignature]
  );
  const cachedEntry = useMetadataCacheEntry<ModelTableType>("table", scopeKey);
  const variables = useMemo(
    () => ({
      app_name: appName,
      model_name: modelName,
      exclude: filtersOptions?.exclude,
      only: filtersOptions?.only,
      include_nested: filtersOptions?.include_nested,
      only_lookup: filtersOptions?.only_lookup,
      exclude_lookup: filtersOptions?.exclude_lookup,
    }),
    [appName, modelName, filtersSignature]
  );
  const autoFetchEnabled = !(options?.skip ?? false);
  const [loadingState, setLoadingState] = useState<MetadataLoadingState>(
    DEFAULT_METADATA_LOADING_STATE
  );
  const [error, setError] = useState<ApolloError | undefined>(undefined);
  const latestMetadataRef = useRef<ModelTableType | null>(
    cachedEntry?.data ?? null
  );
  const detailFetcherRef = useRef<
    ((forceNetwork?: boolean) => Promise<void>) | null
  >(null);
  const detailsFetchInFlight = useRef(false);

  useEffect(() => {
    latestMetadataRef.current = cachedEntry?.data ?? null;
  }, [cachedEntry]);

  const applyMetadataPatch = useCallback(
    (partial: Partial<ModelTableType> | null) => {
      const merged = mergeMetadataPayload(partial, latestMetadataRef.current);
      if (!merged) return null;
      latestMetadataRef.current = merged;
      writeMetadataCacheEntry(
        "table",
        scopeKey,
        merged.metadataVersion ?? partial?.metadataVersion ?? "unknown",
        merged
      );
      return merged;
    },
    [scopeKey]
  );

  const runBaseQuery = useCallback(
    async (fetchPolicy: WatchQueryFetchPolicy = "cache-and-network") => {
      setLoadingState((prev) => ({ ...prev, base: true }));
      setError(undefined);
      try {
        const result = await client.query<
          BaseMetadataResponse,
          GraphQLTableVars
        >({
          query: MODEL_TABLE_BASE_QUERY,
          variables,
          fetchPolicy: "cache-first",
        });
        const merged = applyMetadataPatch(result.data?.response ?? null);
        void detailFetcherRef.current?.(false);
        return merged;
      } catch (err) {
        setError(err as ApolloError);
        throw err;
      } finally {
        setLoadingState((prev) => ({ ...prev, base: false }));
      }
    },
    [client, variables, applyMetadataPatch]
  );

  const runFiltersQuery = useCallback(
    async (fetchPolicy: WatchQueryFetchPolicy = "network-only") => {
      setLoadingState((prev) => ({ ...prev, filters: true }));
      setError(undefined);
      try {
        const result = await client.query<
          FiltersMetadataResponse,
          GraphQLTableVars
        >({
          query: MODEL_TABLE_FILTERS_QUERY,
          variables,
          fetchPolicy,
        });
        return applyMetadataPatch(result.data?.response ?? null);
      } catch (err) {
        setError(err as ApolloError);
        throw err;
      } finally {
        setLoadingState((prev) => ({ ...prev, filters: false }));
      }
    },
    [client, variables, applyMetadataPatch]
  );

  const runMutationsQuery = useCallback(
    async (fetchPolicy: WatchQueryFetchPolicy = "network-only") => {
      setLoadingState((prev) => ({ ...prev, mutations: true }));
      setError(undefined);
      try {
        const result = await client.query<
          MutationsMetadataResponse,
          GraphQLTableVars
        >({
          query: MODEL_TABLE_MUTATIONS_QUERY,
          variables,
          fetchPolicy,
        });
        return applyMetadataPatch(result.data?.response ?? null);
      } catch (err) {
        setError(err as ApolloError);
        throw err;
      } finally {
        setLoadingState((prev) => ({ ...prev, mutations: false }));
      }
    },
    [client, variables, applyMetadataPatch]
  );

  const runTemplatesQuery = useCallback(
    async (fetchPolicy: WatchQueryFetchPolicy = "network-only") => {
      setLoadingState((prev) => ({ ...prev, pdfTemplates: true }));
      setError(undefined);
      try {
        const result = await client.query<
          PdfTemplatesMetadataResponse,
          GraphQLTableVars
        >({
          query: MODEL_TABLE_TEMPLATES_QUERY,
          variables,
          fetchPolicy,
        });
        return applyMetadataPatch(result.data?.response ?? null);
      } catch (err) {
        setError(err as ApolloError);
        throw err;
      } finally {
        setLoadingState((prev) => ({ ...prev, pdfTemplates: false }));
      }
    },
    [client, variables, applyMetadataPatch]
  );

  const shouldFetchBase =
    autoFetchEnabled && !isCacheEntryFresh(cachedEntry, METADATA_CACHE_TTL_MS);

  useEffect(() => {
    if (!shouldFetchBase) return;
    runBaseQuery("network-only").catch(() => undefined);
  }, [shouldFetchBase, runBaseQuery]);

  const ensureDetailMetadata = useCallback(
    async (forceNetwork = false) => {
      if (!autoFetchEnabled) return;
      const snapshot = latestMetadataRef.current ?? cachedEntry?.data ?? null;
      if (!snapshot) return;
      const filtersMissing =
        !snapshot.filters || snapshot.filters.length === 0 || forceNetwork;
      const mutationsMissing =
        !snapshot.mutations || snapshot.mutations.length === 0 || forceNetwork;
      const templatesMissing =
        !snapshot.pdfTemplates ||
        snapshot.pdfTemplates.length === 0 ||
        forceNetwork;
      const stale = forceNetwork
        ? true
        : !isCacheEntryFresh(cachedEntry, METADATA_CACHE_TTL_MS);
      const needsDetails =
        filtersMissing || mutationsMissing || templatesMissing || stale;
      if (!needsDetails || detailsFetchInFlight.current) {
        return;
      }
      detailsFetchInFlight.current = true;
      try {
        if (filtersMissing || stale) {
          await runFiltersQuery(forceNetwork ? "network-only" : "cache-first");
        }
        if (mutationsMissing || stale) {
          await runMutationsQuery(
            forceNetwork ? "network-only" : "cache-first"
          );
        }
        if (templatesMissing || stale) {
          await runTemplatesQuery(
            forceNetwork ? "network-only" : "cache-first"
          );
        }
      } catch (err) {
        setError(err as ApolloError);
      } finally {
        detailsFetchInFlight.current = false;
      }
    },
    [
      autoFetchEnabled,
      cachedEntry,
      runFiltersQuery,
      runMutationsQuery,
      runTemplatesQuery,
    ]
  );

  useEffect(() => {
    detailFetcherRef.current = ensureDetailMetadata;
  }, [ensureDetailMetadata]);

  useEffect(() => {
    void ensureDetailMetadata(false);
  }, [ensureDetailMetadata]);

  const refetch = useCallback(async () => {
    await runBaseQuery("network-only");
    await ensureDetailMetadata(true);
    return latestMetadataRef.current;
  }, [ensureDetailMetadata, runBaseQuery]);

  const metadata = cachedEntry?.data ?? latestMetadataRef.current ?? null;
  const loading =
    !metadata && autoFetchEnabled && (loadingState.base || shouldFetchBase);

  return {
    metadata,
    loading,
    error,
    refetch,
    loadingFilters: loadingState.filters,
    loadingMutations: loadingState.mutations,
    loadingPdfTemplates: loadingState.pdfTemplates,
  };
}

const buildInitialSortingState = (
  orderBy?: string | string[]
): SortingState => {
  const entries = normalizeOrderingInput(orderBy);
  if (entries.length === 0) return [];
  return entries
    .map((entry) => {
      const isDesc = entry.startsWith("-");
      const id = isDesc ? entry.slice(1) : entry;
      return { id, desc: isDesc };
    })
    .filter((entry) => Boolean(entry.id));
};

/* ----------------------------
   ⚡ Hook: useGraphQLModelTable
---------------------------- */
export function useGraphQLModelTable({
  appName,
  modelName,
  filtersOptions,
  excludeColumns = [],
  overrideColumns = {},
  appendColumns = [],
  customItems = null,
  initVariables = {},
  initialPageSize = 12,
  onQueryBuilt,
  customSelection,
  additionalSelectionFields = [],
  queryOptions,
  skip = false,
}: {
  appName: string;
  modelName: string;
  filtersOptions?: ModelTableFiltersOptions;
  excludeColumns?: string[];
  overrideColumns?: Record<string, Partial<ColumnDef<any>>>;
  appendColumns?: ColumnDef<any>[];
  customItems?: any[] | null;
  initVariables?: {
    filters?: Record<string, any>;
    per_page?: number;
    page?: number;
    order_by?: string | string[];
  };
  initialPageSize?: number;
  customSelection?: string;
  onQueryBuilt?: (query: string) => void;
  additionalSelectionFields?: string[];
  queryOptions?: DataQueryOptions & { responseKey?: string };
  skip?: boolean;
}) {
  /* --- 1. Fetch metadata --- */
  const {
    metadata: modelMeta,
    loading: metaLoading,
    error: metaError,
    loadingFilters: metaFiltersLoading,
    loadingMutations: metaMutationsLoading,
    loadingPdfTemplates: metaTemplatesLoading,
  } = useModelTableMetadata(appName, modelName, filtersOptions, { skip });
  const fields = modelMeta?.fields ?? [];
  const filters = modelMeta?.filters ?? [];
  const metadataLoadingState = useMemo(
    () => ({
      base: metaLoading,
      filters: metaFiltersLoading ?? false,
      mutations: metaMutationsLoading ?? false,
      pdfTemplates: metaTemplatesLoading ?? false,
    }),
    [
      metaFiltersLoading,
      metaLoading,
      metaMutationsLoading,
      metaTemplatesLoading,
    ]
  );

  /* --- 2. Table state --- */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const initialOrdering = useMemo(
    () => resolveOrderingWithDefault(initVariables?.order_by),
    [initVariables?.order_by]
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    buildInitialSortingState(initialOrdering)
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [quick, setQuick] = useState<string>("");
  const [advancedFilters, setAdvancedFilters] =
    useState<ComplexFilterInput<string> | null>(null);

  useEffect(() => {
    if (!fields.length) return;
    setColumnVisibility((prev) => {
      let changed = false;
      const next: VisibilityState = { ...prev };
      const hideByDefault = new Set(["DateTimeField", "TextField"]);
      fields.forEach((field) => {
        if (
          hideByDefault.has(field.field_type ?? "") &&
          next[field.name] === undefined
        ) {
          next[field.name] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [fields]);

  /* --- 3. Build GraphQL Query --- */
  const includeQuickArgument = queryOptions?.includeQuickArgument ?? true;
  const responseKey =
    queryOptions?.responseKey ??
    queryOptions?.fieldName ??
    `${modelName.toLowerCase()}s_pages`;

  const dataQuery = useMemo(() => {
    if (!fields.length) return null;
    const q = buildAutoDataQuery(
      modelName,
      fields,
      excludeColumns,
      filters,
      customSelection,
      additionalSelectionFields,
      queryOptions
    );
    if (onQueryBuilt) onQueryBuilt(q.loc?.source.body ?? "");
    return q;
  }, [
    fields,
    modelName,
    excludeColumns,
    filters,
    customSelection,
    additionalSelectionFields,
    queryOptions,
    onQueryBuilt,
  ]);

  /* --- 4. Filters Payload --- */
  const filtersPayload = useMemo(() => {
    // Build an array of per-column filters (as the API expects)
    const and = columnFilters
      .filter((f: any) => f.value)
      .map((f: any) => {
        // Support "field__lookup" syntax
        const [field, lookup] = f.id.split("__");
        return {
          [field]: { [lookup || "icontains"]: f.value },
        } as ComplexFilterInput<string>;
      });

    const parts: ComplexFilterInput<string>[] = [];

    // Include advanced (manually constructed) filters when present
    if (advancedFilters) {
      parts.push(advancedFilters);
    }

    // Include column filters when present
    if (and.length) {
      const columnFiltersPayload =
        and.length === 1
          ? and[0]
          : ({ AND: and } as ComplexFilterInput<string>);
      parts.push(columnFiltersPayload);
    }

    // If no parts built from UI state, fallback to initVariables.filters
    if (parts.length === 0) {
      return (initVariables?.filters ??
        null) as ComplexFilterInput<string> | null;
    }

    // If only one part, return it directly; otherwise combine with AND
    if (parts.length === 1) {
      // If we have UI filters AND initVariables.filters, we might want to combine them
      // But usually UI filters override init filters or work on top.
      // If initVariables.filters is "base filters" (like "category=books"), we should probably AND them.
      if (initVariables?.filters) {
        return {
          AND: [parts[0], initVariables.filters],
        } as ComplexFilterInput<string>;
      }
      return parts[0];
    }

    if (initVariables?.filters) {
      parts.push(initVariables.filters as ComplexFilterInput<string>);
    }
    return { AND: parts } as ComplexFilterInput<string>;
  }, [columnFilters, initVariables, advancedFilters]);

  /* --- 5. Ordering Payload --- */
  const orderingPayload = useMemo(() => {
    if (sorting.length === 0) return initialOrdering;
    return sorting.map((s) => (s.desc ? `-${s.id}` : s.id));
  }, [sorting, initialOrdering]);

  /* --- 6. Fetch Data (or use custom items) --- */
  const {
    data: tableData,
    loading: tableLoading,
    error: tableError,
    refetch,
  } = useQuery(
    dataQuery ??
      gql`
        query {
          dummy
        }
      `,
    {
      skip: skip || !dataQuery || !!customItems,
      initialFetchPolicy: "cache-and-network",
      variables: {
        ...initVariables,
        filters: filtersPayload,
        ordering: orderingPayload,
        page: pageIndex + 1,
        per_page: pageSize,
        ...(includeQuickArgument ? { quick } : {}),
      },
      // Prefer cache-first to avoid unnecessary network calls that can cause latency
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      // Reduce re-renders during background fetches
      notifyOnNetworkStatusChange: false,
      returnPartialData: true,
    }
  );

  const pageInfo = customItems
    ? {
        total_count: customItems.length,
        page_count: 1,
        current_page: 1,
        per_page: customItems.length,
        has_next_page: false,
        has_previous_page: false,
      }
    : tableData?.[responseKey]?.page_info;

  const items = customItems ?? tableData?.[responseKey]?.items ?? [];

  /* --- 7. Build Columns --- */
  const columns = useMemo<ColumnDef<any>[]>(() => {
    const padNumber = (value: number) => value.toString().padStart(2, "0");
    const toDate = (value: unknown): Date | null => {
      if (value === null || value === undefined) return null;
      const parsed = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const formatDate = (date: Date) =>
      `${padNumber(date.getDate())}-${padNumber(
        date.getMonth() + 1
      )}-${date.getFullYear()}`;
    const formatDateValue = (value: unknown, type: string | undefined) => {
      const date = toDate(value);
      if (!date) return "";
      if (type === "DateTimeField") {
        return `${formatDate(date)} ${padNumber(date.getHours())}:${padNumber(
          date.getMinutes()
        )}`;
      }
      if (type === "DateField") {
        return formatDate(date);
      }
      return value;
    };
    const numericFieldTypes = new Map<string, { maxFractionDigits: number }>([
      ["IntegerField", { maxFractionDigits: 0 }],
      ["PositiveIntegerField", { maxFractionDigits: 0 }],
      ["PositiveSmallIntegerField", { maxFractionDigits: 0 }],
      ["SmallIntegerField", { maxFractionDigits: 0 }],
      ["BigIntegerField", { maxFractionDigits: 0 }],
      ["DecimalField", { maxFractionDigits: 2 }],
      ["FloatField", { maxFractionDigits: 2 }],
    ]);
    const isNumericField = (type?: string) => numericFieldTypes.has(type ?? "");
    const formatNumber = (value: unknown, type?: string) => {
      const numericConfig = type ? numericFieldTypes.get(type) : undefined;
      if (numericConfig) {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isNaN(numeric)) {
          const formatter = new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: numericConfig.maxFractionDigits,
            minimumFractionDigits: 0,
          });
          return formatter.format(numeric);
        }
      }
      return value;
    };
    const baseCols = fields
      .filter((f) => !excludeColumns.includes(f.name))
      .map((f) => ({
        id: f.name,

        header: f.title ?? f.name,
        accessorFn: (row: any) => {
          if (f.is_related) {
            return row?.[f.name]?.desc ?? "";
          }
          // Prefer the description field if available (for choice fields)
          return row?.[`${f.name}_desc`] ?? row?.[f.name];
        },
        enableSorting: f.sortable,
        enableColumnFilter: f.filterable,
        // Provide metadata used by BaseTable to build ordering payloads
        // "display" corresponds to the backend-recognized field/path for sorting
        meta: { display: f.display?.replace(".", "__") ?? f.name },
        cell: (info: any) => {
          const val = info.getValue();
          if (f.field_type === "BooleanField") return val ? "✅" : "❌";
          if (
            f.field_type === "DateField" ||
            f.field_type === "DateTimeField"
          ) {
            return formatDateValue(val, f.field_type);
          }
          if (
            isNumericField(f.field_type) &&
            val !== undefined &&
            val !== null &&
            val !== ""
          ) {
            return formatNumber(val, f.field_type);
          }
          return val ?? "";
        },
        ...overrideColumns[f.name],
      }));

    return [...baseCols, ...appendColumns];
  }, [fields, excludeColumns, overrideColumns, appendColumns]);

  /* --- 8. Build Table --- */
  const table = useReactTable({
    data: items,
    columns,
    pageCount: pageInfo?.page_count ?? -1,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: true,
    maxMultiSortColCount: 10,
    state: {
      pagination: { pageIndex, pageSize } as PaginationState,
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") return;
      setPageIndex(updater.pageIndex);
      setPageSize(updater.pageSize);
    },
  });

  /* --- 9. Combined Loading & Error --- */
  const loading = skip ? false : metaLoading || tableLoading;
  const error = metaError || tableError;

  const setters = useMemo(
    () => ({
      nextPage: () => setPageIndex(pageIndex + 1),
      previousPage: () => setPageIndex(pageIndex - 1),
      firstPage: () => setPageIndex(0),
      lastPage: () => setPageIndex(pageInfo?.page_count ?? -1),
      setPageIndex,
      setPageSize,
      setSorting,
      setColumnFilters,
      setColumnVisibility,
      setQuick,
      setAdvancedFilters,
    }),
    [pageIndex, pageInfo?.page_count]
  );

  return {
    meta: modelMeta,
    fields,
    items,
    pageInfo,
    table,
    loading,
    error,
    refetch,
    state: {
      pageIndex,
      pageSize,
      sorting,
      columnFilters,
      columnVisibility,
      quick,
      advancedFilters,
    },
    payloads: {
      filters: filtersPayload,
      ordering: orderingPayload,
      quick,
    },
    setters,
    metadataLoading: metadataLoadingState,
    supportsQuickSearch: includeQuickArgument,
  };
}

/**
const {
  table,
  fields,
  meta,
  items,
  pageInfo,
  loading,
  refetch,
  setters,
} = useGraphQLModelTable({
  appName: "inventory",
  modelName: "Product",
  excludeColumns: ["debug_field"],
  initVariables: {
    filters: { active: { exact: true } },
    ordering: ["-created_at"],
  },
  overrideColumns: {
    price: {
      cell: (info) => (
        <span className="font-semibold text-green-600">
          ${info.getValue()}
        </span>
      ),
    },
  },
});

 */
