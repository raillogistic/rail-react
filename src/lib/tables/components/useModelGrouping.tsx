import { gql, type ApolloClient } from "@apollo/client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Row, Table as RTTable } from "@tanstack/react-table";
import { toast } from "sonner";
import type { ComplexFilterInput, TableFieldMetadataType } from "../types";
import type { GroupingConfig } from "./baseTableTypes";

/**
 * Declarative options that control table grouping.
 */
export type ModelTableGrouping<TData> = {
  /** Backend field used to derive the group value (ex: 'category'). */
  field: string;
  /** Optional label displayed before the group value. */
  title?: string;
  /**
   * Sort order applied to backend grouping.
   * 'asc'/'desc' map to group/-group; 'count'/'-count' map to count/-count.
   */
  sort?: "asc" | "desc" | "count" | "-count";
  /** Allow users to collapse/expand groups (default: true). */
  collapsible?: boolean;
  /** Initial collapsed state applied to every group. */
  defaultCollapsed?: boolean;
  /** Optional server-side limit for buckets (falls back to backend default). */
  limit?: number;
  /** Allow multiple groups to be open at once (default: false). */
  multiOpen?: boolean;
};

export type GroupingBucket = {
  key: string;
  label: string;
  count: number;
};

export type GroupedRowSection<TData> = {
  key: string;
  label: React.ReactNode;
  rows: Array<Row<TData>>;
  collapsed?: boolean;
};

export type GroupingFieldOption = {
  value: string;
  label: string;
  raw: string;
};

export type UseModelGroupingOptions<TData> = {
  grouping?: ModelTableGrouping<TData>;
  fields: TableFieldMetadataType[];
  modelName: string;
  apolloClient: ApolloClient<unknown>;
  filtersPayload: ComplexFilterInput<string> | null | undefined;
  pageInfo: { total_count?: number | null } | null;
  pageSize: number;
  setters: {
    setPageIndex: (pageIndex: number) => void;
    setPageSize: (pageSize: number) => void;
  };
  table: RTTable<TData>;
};

export type UseModelGroupingResult<TData> = {
  selectedGroupingField: string | null;
  setSelectedGroupingField: React.Dispatch<React.SetStateAction<string | null>>;
  groupingBuckets: GroupingBucket[] | null;
  groupingLoading: boolean;
  groupingRequested: boolean;
  setGroupingRequested: React.Dispatch<React.SetStateAction<boolean>>;
  clearGroupingBuckets: () => void;
  groupableFields: GroupingFieldOption[];
  groupCollapsed: Record<string, boolean>;
  setGroupCollapsed: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  groupingPayload?: GroupingConfig<TData>;
  activeGrouping?: ModelTableGrouping<TData>;
  toggleGroupCollapsed: (key: string) => void;
};

/**
 * Manages grouping lifecycle: available fields, bucket retrieval, collapsing behavior,
 * and the grouping payload consumed by BaseTable.
 */
export function useModelGrouping<TData>({
  grouping,
  fields,
  modelName,
  apolloClient,
  filtersPayload,
  pageInfo,
  pageSize,
  setters,
  table,
}: UseModelGroupingOptions<TData>): UseModelGroupingResult<TData> {
  const [selectedGroupingField, setSelectedGroupingField] = useState<
    string | null
  >(grouping?.field ?? null);
  const [groupingBuckets, setGroupingBuckets] = useState<
    GroupingBucket[] | null
  >(null);
  const [groupingLoading, setGroupingLoading] = useState(false);
  const [groupingRequested, setGroupingRequested] = useState(false);
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    setSelectedGroupingField(grouping?.field ?? null);
  }, [grouping?.field]);

  const groupableFields = useMemo<GroupingFieldOption[]>(() => {
    const disallowed = new Set([
      "DateField",
      "DateTimeField",
      "TimeField",
      "TextField",
    ]);
    return (fields ?? [])
      .filter((field) => !disallowed.has(field.field_type))
      .map((field) => ({
        value: field.name,
        label: field.title ?? field.name,
        raw: field.name,
      }));
  }, [fields]);

  useEffect(() => {
    if (
      selectedGroupingField &&
      !groupableFields.some((f) => f.value === selectedGroupingField)
    ) {
      setSelectedGroupingField(null);
    }
  }, [groupableFields, selectedGroupingField]);

  const activeGrouping = useMemo<ModelTableGrouping<TData> | undefined>(() => {
    if (!selectedGroupingField) return undefined;
    const targetField = fields.find((f) => {
      const path = f.name.replace(/\./g, "__");
      return selectedGroupingField === path || selectedGroupingField === f.name;
    });
    const base = grouping ? { ...grouping } : {};
    const title =
      base.title ??
      targetField?.title ??
      targetField?.name ??
      selectedGroupingField;
    return {
      ...base,
      field: selectedGroupingField,
      title,
    } as ModelTableGrouping<TData>;
  }, [fields, grouping, selectedGroupingField]);

  const groupingOrderBy = useMemo(() => {
    if (!activeGrouping?.sort) return "group";
    if (activeGrouping.sort === "asc") return "group";
    if (activeGrouping.sort === "desc") return "-group";
    return activeGrouping.sort;
  }, [activeGrouping?.sort]);

  useEffect(() => {
    if (!selectedGroupingField) return;
    const total = pageInfo?.total_count ?? null;
    if (total && total > pageSize) {
      setters.setPageIndex(0);
      setters.setPageSize(total);
    }
  }, [pageInfo?.total_count, pageSize, selectedGroupingField, setters]);

  const groupingQuery = useMemo(() => {
    const modelPrefix =
      modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const filterTypeName = `${modelPrefix}ComplexFilter`;
    const queryName = `${modelName.toLowerCase()}GroupingQuery`.replace(
      /[^A-Za-z0-9_]/g,
      "_"
    );
    const fieldName = `${modelName.toLowerCase()}s_groups`;
    const schemaFieldName = `${modelName.toLowerCase()}sGroups`;
    return gql`
      query ${queryName}(
        $group_by: String!
        $filters: ${filterTypeName}
        $limit: Int
        $order_by: String
      ) {
        ${fieldName}: ${schemaFieldName}(
          groupBy: $group_by
          filters: $filters
          limit: $limit
          orderBy: $order_by
        ) {
          key
          label
          count
        }
      }
    `;
  }, [modelName]);

  useEffect(() => {
    if (!selectedGroupingField || !groupingRequested) {
      setGroupingBuckets(null);
      setGroupingLoading(false);
      return;
    }
    if (groupingLoading) return;
    setGroupingLoading(true);
    const fieldName = `${modelName.toLowerCase()}s_groups`;
    apolloClient
      .query({
        query: groupingQuery,
        variables: {
          group_by: selectedGroupingField,
          filters: filtersPayload ?? null,
          limit: grouping?.limit,
          order_by: groupingOrderBy,
        },
        fetchPolicy: "network-only",
      })
      .then((result) => {
        const buckets = (result.data?.[fieldName] ?? []) as GroupingBucket[];
        setGroupingBuckets(
          (buckets || []).map((bucket) => ({
            key:
              bucket?.key === null || bucket?.key === undefined
                ? "__EMPTY__"
                : String(bucket.key),
            label:
              typeof bucket?.label === "string"
                ? bucket.label
                : String(bucket?.key ?? "Non renseigne"),
            count: Number(bucket?.count ?? 0),
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error("Erreur lors du chargement du regroupement");
        setGroupingBuckets([]);
      })
      .finally(() => setGroupingLoading(false));
  }, [
    apolloClient,
    filtersPayload,
    grouping?.limit,
    groupingOrderBy,
    groupingQuery,
    modelName,
    selectedGroupingField,
    groupingRequested,
    groupingLoading,
  ]);

  const deriveRowGroupKey = useCallback(
    (row: TData): string => {
      if (!selectedGroupingField) return "__EMPTY__";
      const path = selectedGroupingField.split("__");
      let current: any = row as Record<string, unknown>;
      for (const segment of path) {
        if (current === null || current === undefined) {
          current = null;
          break;
        }
        current = (current as Record<string, unknown>)[segment];
      }
      if (current === null || current === undefined || current === "")
        return "__EMPTY__";
      if (typeof current === "object") {
        const obj = current as Record<string, unknown>;
        if (obj.id !== undefined && obj.id !== null) return String(obj.id);
        if (obj.pk !== undefined && obj.pk !== null) return String(obj.pk);
        if (obj.code !== undefined && obj.code !== null) return String(obj.code);
        if (obj.name !== undefined && obj.name !== null) return String(obj.name);
        if (obj.title !== undefined && obj.title !== null)
          return String(obj.title);
        if (obj.desc !== undefined && obj.desc !== null) return String(obj.desc);
      }
      return String(current);
    },
    [selectedGroupingField]
  );

  useEffect(() => {
    if (!activeGrouping || !groupingBuckets) {
      setGroupCollapsed((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    setGroupCollapsed((prev) => {
      const next: Record<string, boolean> = {};
      groupingBuckets.forEach((group) => {
        next[group.key] = true;
      });
      return next;
    });
  }, [activeGrouping, groupingBuckets]);

  const toggleGroupCollapsed = useCallback(
    (key: string) => {
      if (activeGrouping && activeGrouping.collapsible === false) return;
      setGroupCollapsed((prev) => {
        const isCollapsed =
          prev[key] ?? activeGrouping?.defaultCollapsed ?? true;
        const allKeys =
          groupingBuckets?.map((bucket) => bucket.key) ?? Object.keys(prev);
        const next: Record<string, boolean> = {};

        if (activeGrouping?.multiOpen !== false) {
          allKeys.forEach((k) => {
            next[k] = prev[k] ?? activeGrouping?.defaultCollapsed ?? true;
          });
          next[key] = !isCollapsed;
          return next;
        }

        allKeys.forEach((k) => {
          next[k] = true;
        });
        if (isCollapsed) {
          next[key] = false;
        }
        return next;
      });
    },
    [
      activeGrouping?.collapsible,
      activeGrouping?.defaultCollapsed,
      activeGrouping?.multiOpen,
      groupingBuckets,
    ]
  );

  const groupingPayload = useMemo(() => {
    if (
      !groupingBuckets ||
      groupingBuckets.length === 0 ||
      !selectedGroupingField
    )
      return undefined;
    const rows = table?.getRowModel?.().rows ?? [];
    const rowsByKey = new Map<string, Array<Row<TData>>>();
    rows.forEach((row) => {
      const key = deriveRowGroupKey(row.original as TData);
      const list = rowsByKey.get(key) ?? [];
      list.push(row as Row<TData>);
      rowsByKey.set(key, list);
    });

    const bucketMap = new Map<string, GroupingBucket>();
    groupingBuckets.forEach((bucket) => bucketMap.set(bucket.key, bucket));

    const groups: GroupedRowSection<TData>[] = [];

    groupingBuckets.forEach((bucket) => {
      const matchingRows = rowsByKey.get(bucket.key) ?? [];
      groups.push({
        key: bucket.key,
        label: (
          <span className="flex items-center gap-2">
            <span className="font-medium">{bucket.label}</span>
            <span className="text-xs text-muted-foreground">
              {(bucket.count ?? matchingRows.length) ?? matchingRows.length} element(s)
            </span>
          </span>
        ),
        rows: matchingRows as Array<Row<TData>>,
        collapsed: groupCollapsed[bucket.key] ?? false,
      });
    });

    rowsByKey.forEach((matchingRows, key) => {
      if (bucketMap.has(key)) return;
      groups.push({
        key,
        label: (
          <span className="flex items-center gap-2">
            <span className="font-medium">
              {key === "__EMPTY__" ? "Non renseigne" : key}
            </span>
            <span className="text-xs text-muted-foreground">
              {matchingRows.length} element(s)
            </span>
          </span>
        ),
        rows: matchingRows as Array<Row<TData>>,
        collapsed: groupCollapsed[key] ?? false,
      });
    });
    if (!groups.length) return undefined;
    const anyOpen = groups.some((g) => !g.collapsed);
    const normalizedGroups =
      anyOpen || activeGrouping?.multiOpen
        ? groups
        : groups.map((g) => ({ ...g, collapsed: true }));
    return {
      groups: normalizedGroups,
      collapsible: activeGrouping?.collapsible ?? true,
      onToggle: toggleGroupCollapsed,
    } as GroupingConfig<TData>;
  }, [
    activeGrouping?.collapsible,
    activeGrouping?.multiOpen,
    deriveRowGroupKey,
    groupCollapsed,
    groupingBuckets,
    selectedGroupingField,
    table,
    toggleGroupCollapsed,
  ]);

  return {
    selectedGroupingField,
    setSelectedGroupingField,
    groupingBuckets,
    groupingLoading,
    groupingRequested,
    setGroupingRequested,
    clearGroupingBuckets: () => setGroupingBuckets(null),
    groupableFields,
    groupCollapsed,
    setGroupCollapsed,
    groupingPayload,
    activeGrouping,
    toggleGroupCollapsed,
  };
}
