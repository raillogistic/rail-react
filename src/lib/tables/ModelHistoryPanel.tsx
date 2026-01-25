import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useApolloClient, type ApolloError } from "@apollo/client";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/lib/components/ui/drawer";
import { Search, Info, Loader2, X, Check } from "lucide-react";
import { BaseTable } from "./BaseTable";
import {
  parseHistoryChangesPayload,
  type SerializedHistoryChange,
} from "./components/HistoryChangesCell";
import type { ColumnFiltersConfig, ModelTableOptions } from "./ModelTable";
import type {
  ComplexFilterInput,
  ModelTableType,
  TableFieldMetadataType,
} from "./types";
import { useGraphQLModelTable } from "./hooks";
import type { UseGraphQLModelTableOptions } from "./hooks";
import { useUIConfig } from "./useUIConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { QuickFilter } from "./components/QuickFilter";
import {
  buildGraphQLRecipe,
  resolveRecords,
  defaultMapRecord,
} from "@/lib/form/inputs/query";
import type { ChoiceOption } from "@/lib/form/inputs/types";

type ModelHistoryPanelProps = {
  appName: string;
  modelName: string;
  meta: ModelTableType | null;
  fields: TableFieldMetadataType[];
  title: string;
  hookOptions?: UseGraphQLModelTableOptions;
  enableQuickSearch: boolean;
  columnFilters?: ColumnFiltersConfig;
  options?: ModelTableOptions;
  columnKey: string;
  componentId: string;
  userId?: string;
  baseFilters: ComplexFilterInput<string> | null;
  quickFilters?: (
    | string
    | {
        field: string;
        title?: string;
        icon?: React.ReactNode;
        searchable?: boolean;
      }
  )[];
  onAdvancedFiltersApply?: (filters: ComplexFilterInput<string> | null) => void;
  onPermissionRevoked?: () => void;
  onError?: (error: ApolloError) => void;
  onRefetchChange?: (handler: (() => void) | null) => void;
};

const HISTORY_TYPE_LABELS: Record<string, string> = {
  "+": "Création",
  "~": "Modification",
  "-": "Suppression",
};

const HISTORY_TYPE_FILTERS = [
  {
    value: "+",
    label: "Créations",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
  },
  {
    value: "~",
    label: "Modifications",
    className: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  },
  {
    value: "-",
    label: "Suppressions",
    className: "bg-rose-100 text-rose-900 hover:bg-rose-200",
  },
];

type HistoryInstanceQuickFilterProps = {
  appName: string;
  modelName: string;
  values: ChoiceOption[];
  onChange: (value: ChoiceOption[]) => void;
};

const HistoryInstanceQuickFilter: React.FC<HistoryInstanceQuickFilterProps> = ({
  appName,
  modelName,
  values,
  onChange,
}) => {
  const client = useApolloClient();
  const recipe = useMemo(
    () => buildGraphQLRecipe({ relatedModel: `${appName}.${modelName}` }),
    [appName, modelName]
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ChoiceOption[]>(values);

  const fetchOptions = useCallback(
    async (term: string) => {
      if (!recipe.document) return;
      setLoading(true);
      try {
        const variables: Record<string, any> = {};
        if (recipe.searchVariableName) {
          variables[recipe.searchVariableName] = term;
        }
        if (recipe.limitVariableName) {
          variables[recipe.limitVariableName] = 25;
        }
        if (values.length > 0 && recipe.includeVariableName) {
          variables[recipe.includeVariableName] = values.map((entry) => entry.value);
        }
        const response = await client.query({
          query: recipe.document,
          variables,
          fetchPolicy: "network-only",
        });
        const records = resolveRecords(response.data, recipe.resultPath);
        const mapped = records
          .map((record) =>
            defaultMapRecord(
              record,
              recipe.valueKey,
              recipe.labelKey,
              recipe.descriptionKey
            )
          )
          .filter((option): option is ChoiceOption => Boolean(option));
        const nextOptions = new Map<string, ChoiceOption>();
        mapped.forEach((option) => {
          nextOptions.set(String(option.value), option);
        });
        values.forEach((selected) => {
          nextOptions.set(String(selected.value), selected);
        });
        setOptions(Array.from(nextOptions.values()));
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error(
            "[ModelHistoryPanel] Impossible de charger les instances",
            error
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [client, recipe, values]
  );

  useEffect(() => {
    if (!open) return;
    const term = search.trim();
    const timer = setTimeout(() => {
      void fetchOptions(term);
    }, 250);
    return () => {
      clearTimeout(timer);
    };
  }, [fetchOptions, open, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    setOptions((prev) => {
      const map = new Map<string, ChoiceOption>();
      values.forEach((option) => map.set(String(option.value), option));
      prev.forEach((option) => {
        if (!map.has(String(option.value))) {
          map.set(String(option.value), option);
        }
      });
      return Array.from(map.values());
    });
  }, [values]);

  if (!recipe.document) {
    return (
      <Button variant="outline" size="sm" className="h-8 border-dashed" disabled>
        Instances indisponibles
      </Button>
    );
  }

  const clearSelection = () => {
    onChange([]);
    setSearch("");
  };

  const toggleValue = (option: ChoiceOption) => {
    const exists = values.some(
      (entry) => String(entry.value) === String(option.value)
    );
    if (exists) {
      onChange(values.filter((entry) => String(entry.value) !== String(option.value)));
    } else {
      onChange([...values, option]);
    }
  };

  const triggerLabel = useMemo(() => {
    if (values.length === 0) {
      return "Instances";
    }
    if (values.length === 1) {
      return values[0].label;
    }
    return `${values.length} instances`;
  }, [values]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed min-w-[200px] justify-start"
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="truncate text-left text-sm">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] space-y-2 p-3" align="start">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom ou référence"
            className="h-8"
          />
          {values.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : options.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            <div className="space-y-1">
              {options.map((option) => {
                const isActive = values.some(
                  (entry) => String(entry.value) === String(option.value)
                );
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      toggleValue(option);
                    }}
                    className={`flex w-full items-center rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted gap-2 ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {values.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => {
              clearSelection();
              setOpen(false);
            }}
          >
            Effacer la sélection
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

const describeHistoryValue = (
  value: unknown,
  display?: string | null
): string => {
  if (display) return display;
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (
    value &&
    typeof value === "object" &&
    ("id" in (value as Record<string, unknown>) ||
      "label" in (value as Record<string, unknown>))
  ) {
    const ref = value as Record<string, unknown>;
    return (ref.label as string) ?? String(ref.id ?? "—");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatFieldValue = (
  row: Record<string, unknown>,
  field: TableFieldMetadataType
): string => {
  if (!row) return "—";
  if (field.is_related) {
    return (row?.[field.name] as { desc?: string })?.desc ?? "—";
  }
  const descValue = row?.[`${field.name}_desc`];
  if (descValue) {
    return `${descValue}`;
  }
  const raw = row?.[field.name];
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.field_type === "BooleanField") {
    return raw ? "Oui" : "Non";
  }
  if (
    field.field_type === "DateField" ||
    field.field_type === "DateTimeField"
  ) {
    const parsed = new Date(raw as string);
    if (!Number.isNaN(parsed.getTime())) {
      const base = parsed.toLocaleDateString();
      if (field.field_type === "DateField") {
        return base;
      }
      return `${base} ${parsed.toLocaleTimeString().slice(0, 5)}`;
    }
  }
  return `${raw}`;
};

const renderChangesCount = (changes: SerializedHistoryChange[]): ReactNode => {
  const count = changes.length;
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">0 changement</span>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs font-semibold"
        >
          {count} changement{count > 1 ? "s" : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] space-y-2 p-3">
        <p className="text-sm font-semibold">
          {count} champ{count > 1 ? "s" : ""} modifié{count > 1 ? "s" : ""}
        </p>
        <div className="max-h-60 overflow-y-auto space-y-2 text-sm">
          {changes.map((change) => (
            <div
              key={`popover-${change.field}`}
              className="rounded-md border bg-muted/30 p-2"
            >
              <p className="font-semibold">{change.label}</p>
              <p className="text-muted-foreground text-xs">
                {describeHistoryValue(change.old_value, change.old_display)} →{" "}
                <span className="font-medium text-foreground">
                  {describeHistoryValue(change.new_value, change.new_display)}
                </span>
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const defaultSelection = {
  enabled: false,
  position: "start" as const,
  header_title: "#",
};

const historyTableOptions = (
  options?: ModelTableOptions
): ModelTableOptions => ({
  compact: true,
  enable_column_drag: true,
  enable_multi_sort: false,
  multi_sort_on_plain_click: true,
  ...(options ?? {}),
});

const ModelHistoryPanel: React.FC<ModelHistoryPanelProps> = ({
  appName,
  modelName,
  meta,
  fields,
  title,
  hookOptions,
  enableQuickSearch,
  columnFilters,
  options,
  columnKey,
  componentId,
  userId,
  baseFilters,
  onAdvancedFiltersApply,
  onPermissionRevoked,
  onError,
  onRefetchChange,
}) => {
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string[]>([]);
  const [historyInstanceFilter, setHistoryInstanceFilter] = useState<
    ChoiceOption[]
  >([]);
  const [historyDetailRow, setHistoryDetailRow] = useState<any | null>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const changeTypeOptions = useMemo(
    () =>
      HISTORY_TYPE_FILTERS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );
  const changeTypeFilterMeta = useMemo<FilterFieldType>(
    () => ({
      field_name: "history_type",
      field_label: "Type de changement",
      is_nested: false,
      related_model: null,
      is_custom: true,
      options: [
        {
          name: "history_type__in",
          lookup_expr: "in",
          help_text: "",
          filter_type: "ChoiceFilter",
          choices: HISTORY_TYPE_FILTERS.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        },
      ],
      nested: [],
    }),
    []
  );

  const historySelectionFields = useMemo(
    () => [
      "history_id",
      "instance_id",
      "desc",
      "history_type",
      "history_date",
      "history_change_reason",
      "history_user { id desc:username }",
      "history_changes",
    ],
    []
  );

  const historyColumns = useMemo(() => {
    const formatDateValue = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const parsed = value instanceof Date ? value : new Date(value as string);
      if (Number.isNaN(parsed.getTime())) return "";
      return `${parsed.toLocaleDateString()} ${parsed
        .toLocaleTimeString()
        .slice(0, 5)}`;
    };
    return [
      {
        id: "history_detail",
        header: "",
        enableSorting: false,
        cell: ({ row }: { row: { original: any } }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 px-3 text-xs font-semibold"
            onClick={() => {
              setHistoryDetailRow(row.original);
              setHistoryDetailOpen(true);
            }}
          >
            <Info className="mr-1 h-3.5 w-3.5" />
          </Button>
        ),
      },
      {
        id: "history_date",
        header: "Date",
        accessorKey: "history_date",
        enableSorting: true,
        meta: { display: "history_date" },
        cell: (info: { getValue: () => unknown }) =>
          formatDateValue(info.getValue()),
      },
      {
        id: "history_type",
        header: "Type",
        accessorKey: "history_type",
        enableSorting: true,
        meta: { display: "history_type" },
        cell: (info: { getValue: () => unknown }) => (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {HISTORY_TYPE_LABELS[info.getValue() as string] ??
              (info.getValue() as string) ??
              ""}
          </span>
        ),
      },
      {
        id: "history_changes",
        header: "Changements",
        accessorKey: "history_changes",
        enableSorting: false,
        cell: (info: {
          getValue: () => SerializedHistoryChange[] | string;
        }) => {
          const parsed = parseHistoryChangesPayload(
            info.getValue() as SerializedHistoryChange[] | string
          );
          return renderChangesCount(parsed);
        },
      },
      {
        id: "history_user",
        header: "Auteur",
        accessorFn: (row: any) => row?.history_user?.desc ?? "",
        enableSorting: false,
      },
      {
        id: "instance_id",
        header: "Instance",
        accessorKey: "instance_id",
        enableSorting: false,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.original?.desc ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original?.instance_id ?? "—"}
            </span>
          </div>
        ),
      },
    ];
  }, []);

  const historyColumnIds = useMemo(
    () => historyColumns.map((column) => column.id ?? ""),
    [historyColumns]
  );

  const historyQueryField = useMemo(
    () => `${modelName.toLowerCase()}s_pages_history`,
    [modelName]
  );

  const historyFilterTypeName = useMemo(
    () => `Historical${modelName}ComplexFilter`,
    [modelName]
  );

  const historyInitVariables = useMemo(() => {
    const baseInit = hookOptions?.initVariables;
    if (!baseInit) {
      return { order_by: ["-history_date"] };
    }
    if (baseInit.order_by !== undefined) {
      return baseInit;
    }
    return { ...baseInit, order_by: ["-history_date"] };
  }, [hookOptions?.initVariables]);

  const historyHook = useGraphQLModelTable({
    appName,
    modelName,
    ...(hookOptions ?? {}),
    appendColumns: historyColumns,
    additionalSelectionFields: historySelectionFields,
    initVariables: historyInitVariables,
    queryOptions: {
      ...(hookOptions?.queryOptions ?? {}),
      fieldName: historyQueryField,
      responseKey: historyQueryField,
      includeQuickArgument: false,
      filterTypeName: historyFilterTypeName,
    },
  });

  const {
    table: historyTable,
    pageInfo: historyPageInfo,
    loading: historyLoading,
    error: historyError,
    state: historyState,
    setters: historySetters,
    refetch: historyRefetch,
    supportsQuickSearch: historySupportsQuickSearch,
  } = historyHook;

  useEffect(() => {
    onRefetchChange?.(() => {
      void historyRefetch();
    });
    return () => {
      onRefetchChange?.(null);
    };
  }, [historyRefetch, onRefetchChange]);

  useEffect(() => {
    if (!historyTable) return;
    const allowed = new Set(historyColumnIds);
    const currentVis = historyTable.getState().columnVisibility;
    const nextVis: Record<string, boolean> = { ...currentVis };
    let changed = false;
    historyTable.getAllLeafColumns().forEach((column) => {
      if (!allowed.has(column.id) && nextVis[column.id] !== false) {
        nextVis[column.id] = false;
        changed = true;
      }
    });
    if (changed) {
      historyTable.setColumnVisibility(nextVis);
    }
  }, [historyColumnIds, historyTable]);

  const { config: historyConfig, saveConfig: saveHistoryConfig } = useUIConfig(
    componentId,
    userId
  );

  useEffect(() => {
    if (!historyConfig || !historyTable) return;
    if (historyConfig.columnVisibility) {
      const currentVis = historyTable.getState().columnVisibility;
      const newVis: Record<string, boolean> = {};
      let changed = false;
      const allowed = new Set(historyColumnIds);
      const storedVisible = historyConfig.columnVisibility.filter((id) =>
        allowed.has(id)
      );

      historyTable.getAllLeafColumns().forEach((col) => {
        const isVisible = storedVisible.includes(col.id);
        newVis[col.id] = isVisible;
        if (
          currentVis[col.id] !== isVisible &&
          (currentVis[col.id] !== undefined || !isVisible)
        ) {
          if ((currentVis[col.id] ?? true) !== isVisible) {
            changed = true;
          }
        }
      });

      if (changed) {
        historyTable.setColumnVisibility(newVis);
      }
    }

    if (historyConfig.columnOrder) {
      const currentOrder = historyTable.getState().columnOrder;
      const allowed = new Set(historyColumnIds);
      const sanitizedOrder = historyConfig.columnOrder.filter((id) =>
        allowed.has(id)
      );
      const isDifferent =
        currentOrder.length !== sanitizedOrder.length ||
        currentOrder.some((id, index) => id !== sanitizedOrder[index]);

      if (isDifferent) {
        historyTable.setColumnOrder(sanitizedOrder);
      }
    }
  }, [historyColumnIds, historyConfig, historyTable]);

  const historyDetailChanges = useMemo(
    () => parseHistoryChangesPayload(historyDetailRow?.history_changes),
    [historyDetailRow?.history_changes]
  );

  useEffect(() => {
    const parts: ComplexFilterInput<string>[] = [];
    if (baseFilters) {
      parts.push(baseFilters);
    }
    if (historyTypeFilter.length > 0) {
      parts.push({
        history_type__in: historyTypeFilter,
      } as unknown as ComplexFilterInput<string>);
    }
    if (historyInstanceFilter.length > 0) {
      parts.push({
        instance__in: historyInstanceFilter.map((option) =>
          String(option.value)
        ),
      } as unknown as ComplexFilterInput<string>);
    }

    let merged: ComplexFilterInput<string> | null = null;
    if (parts.length === 1) {
      merged = parts[0];
    } else if (parts.length > 1) {
      merged = { AND: parts } as ComplexFilterInput<string>;
    }

    historySetters.setAdvancedFilters((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(merged)) {
        return merged;
      }
      return prev;
    });
  }, [baseFilters, historyInstanceFilter, historySetters, historyTypeFilter]);

  useEffect(() => {
    if (historyError) {
      onError?.(historyError);
      const permissionDenied =
        historyError.graphQLErrors?.some((err) =>
          err.message?.includes("Operation 'history' is not permitted")
        ) ||
        historyError.message?.includes("Operation 'history' is not permitted");
      if (permissionDenied) {
        onPermissionRevoked?.();
      }
    }
  }, [historyError, onError, onPermissionRevoked]);

  const hasHistoryFilters =
    historyTypeFilter.length > 0 || historyInstanceFilter.length > 0;

  const renderedHistoryQuickFilters = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <QuickFilter
          title="Type de changement"
          options={changeTypeOptions}
          selectedValues={historyTypeFilter}
          onChange={setHistoryTypeFilter}
        />
        <HistoryInstanceQuickFilter
          appName={appName}
          modelName={modelName}
          values={historyInstanceFilter}
          onChange={setHistoryInstanceFilter}
        />
        {hasHistoryFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHistoryTypeFilter([]);
              setHistoryInstanceFilter([]);
            }}
            className="h-8 px-2"
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </>
  );

  const handleHistoryQuickSearch =
    enableQuickSearch && historySupportsQuickSearch
      ? (search: string) => {
          historySetters.setQuick(search);
        }
      : undefined;

  const historyTableNode = (
    <BaseTable
      table={historyTable}
      title={title}
      className="flex-1 min-h-0"
      loading={historyLoading}
      empty_message="Historique vide"
      columnFilters={columnFilters ?? { mode: "ag-grid", debounce_ms: 1 }}
      onQuickSearch={undefined}
      available_filters={meta?.filters ?? []}
      on_advanced_filters_apply={onAdvancedFiltersApply}
      columns_visibility_storage_key={columnKey}
      remote_total_count={historyPageInfo?.total_count}
      toolbar_actions={undefined}
      top_actions={undefined}
      row_actions={undefined}
      selection={defaultSelection}
      quick_filter_components={renderedHistoryQuickFilters}
      options={historyTableOptions(options)}
      pagination_api={{
        first_page: historySetters.firstPage,
        last_page: historySetters.lastPage,
        previous_page: historySetters.previousPage,
        next_page: historySetters.nextPage,
        set_page_size: historySetters.setPageSize,
        page_index: historyState.pageIndex,
        page_count: historyPageInfo?.page_count ?? 0,
        page_size: historyState.pageSize,
        page_size_options: [10, 25, 50, 100],
      }}
      onColumnVisibilityChange={(vis) => {
        if (
          historyConfig?.columnVisibility &&
          JSON.stringify(vis) === JSON.stringify(historyConfig.columnVisibility)
        )
          return;
        saveHistoryConfig?.({ ...historyConfig, columnVisibility: vis });
      }}
      onColumnOrderChange={(order) => {
        if (
          historyConfig?.columnOrder &&
          JSON.stringify(order) === JSON.stringify(historyConfig.columnOrder)
        )
          return;
        saveHistoryConfig?.({ ...historyConfig, columnOrder: order });
      }}
    />
  );

  const historyDetailDrawer = (
    <Drawer open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
      <DrawerContent
        className="max-w-none"
        style={{
          width: "100vw",
          maxWidth: "100vw",
          height: "100vh",
          maxHeight: "100vh",
        }}
      >
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>{title}</DrawerTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryDetailOpen(false)}
          >
            Fermer
          </Button>
        </DrawerHeader>
        <div className="flex h-[calc(100vh-80px)] flex-col overflow-y-auto p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">Type</p>
              <p className="text-lg font-semibold">
                {historyDetailRow?.history_type
                  ? HISTORY_TYPE_LABELS[historyDetailRow.history_type] ??
                    historyDetailRow.history_type
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">Auteur</p>
              <p className="text-lg font-semibold">
                {historyDetailRow?.history_user?.desc ?? "Système"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">
                Instance
              </p>
              <p className="text-lg font-semibold">
                {historyDetailRow?.desc ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {historyDetailRow?.instance_id ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">
                Horodatage
              </p>
              <p className="text-lg font-semibold">
                {historyDetailRow?.history_date
                  ? new Date(
                      historyDetailRow.history_date as string
                    ).toLocaleString()
                  : "—"}
              </p>
            </div>
            {historyDetailRow?.history_change_reason ? (
              <div className="rounded-lg border bg-muted/30 p-4 md:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">
                  Raison renseignée
                </p>
                <p className="text-sm font-medium">
                  {historyDetailRow.history_change_reason}
                </p>
              </div>
            ) : null}
          </div>
          <section className="space-y-3">
            <p className="text-sm font-semibold">Changements détectés</p>
            {historyDetailChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun champ modifié pour cette révision.
              </p>
            ) : (
              <div className="space-y-3">
                {historyDetailChanges.map((change) => (
                  <div
                    key={`drawer-change-${change.field}`}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <p className="text-sm font-semibold">{change.label}</p>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          Ancienne valeur
                        </span>
                        <span className="font-medium text-destructive">
                          {describeHistoryValue(
                            change.old_value,
                            change.old_display
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs uppercase text-muted-foreground">
                        <span>Évolution</span>
                        <span className="text-primary">→</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          Nouvelle valeur
                        </span>
                        <span className="font-semibold text-foreground">
                          {describeHistoryValue(
                            change.new_value,
                            change.new_display
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="space-y-3">
            <p className="text-sm font-semibold">Valeurs de l&apos;instance</p>
            {historyDetailRow ? (
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={`history-field-${field.name}`}
                    className="rounded-lg border bg-background p-3"
                  >
                    <p className="text-xs uppercase text-muted-foreground">
                      {field.title ?? field.name}
                    </p>
                    <p className="text-sm font-medium">
                      {formatFieldValue(historyDetailRow, field)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sélectionnez une ligne pour inspecter les valeurs.
              </p>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      {historyTableNode}
      {historyDetailDrawer}
    </>
  );
};

export default ModelHistoryPanel;
