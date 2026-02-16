import * as React from "react";
import BaseDetail from "./BaseDetail";
import type {
  DetailPanelConfig,
  DetailFieldConfig,
  DetailTabConfig,
  ModelDetailProps,
  NestedDetailConfig,
  RelatedTableConfig,
} from "./types";
import {
  useGraphQLModelDetail,
  useLazyRelatedTable,
  type ModelMetadataRelationship,
} from "./hooks";
import type { SortingState } from "@tanstack/react-table";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { useGraphQLModelTable } from "../table/compat/hooks";
import { useModelAccess, ModelAccessContext } from "@/lib/security/modelAccess";
import { useModelTelemetry } from "@/lib/telemetry/useModelTelemetry";
import { useAuditableAction } from "@/lib/security/useAuditableAction";

const numericFieldTypes = new Set([
  "IntegerField",
  "PositiveIntegerField",
  "PositiveSmallIntegerField",
  "SmallIntegerField",
  "BigIntegerField",
  "DecimalField",
  "FloatField",
]);

function formatValueByType(value: unknown, fieldType?: string) {
  if (value === null || value === undefined) return "";
  const pad = (val: number) => String(val).padStart(2, "0");
  const toDate = (raw: unknown) => {
    if (raw instanceof Date) return raw;
    if (typeof raw === "string" || typeof raw === "number") {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  };
  if (typeof value === "object" && value !== null) {
    if ("desc" in (value as Record<string, unknown>)) {
      return String((value as Record<string, unknown>).desc ?? "");
    }
    if ("name" in (value as Record<string, unknown>)) {
      return String((value as Record<string, unknown>).name ?? "");
    }
  }
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (fieldType === "DateField" || fieldType === "DateTimeField") {
    const date = toDate(value);
    if (!date) return String(value);
    const base = `${pad(date.getDate())}-${pad(
      date.getMonth() + 1,
    )}-${date.getFullYear()}`;
    if (fieldType === "DateTimeField") {
      return `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return base;
  }
  if (numericFieldTypes.has(fieldType ?? "")) {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isNaN(num)) {
      const decimals =
        fieldType === "DecimalField" || fieldType === "FloatField" ? 2 : 0;
      return new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: decimals,
      }).format(num);
    }
  }
  return String(value);
}

const normalizeFieldValue = (field: string | undefined) =>
  field ? field.replace(/[^a-z0-9]/gi, "").toLowerCase() : "";

function buildDetailFields(
  fields: DetailFieldConfig[],
  requested?: string[] | undefined,
): DetailFieldConfig[] {
  if (!requested?.length) return fields;
  const targetSet = new Set(requested);
  return fields.filter((field) => targetSet.has(field.name));
}

function LegacyModelDetail({
  appName,
  modelName,
  id,
  className,
  includeSections,
  excludeSections,
  relatedTableConfigs,
  nested,
}: ModelDetailProps) {
  const { metadata, tableMeta, item, loading, error } = useGraphQLModelDetail(
    appName,
    modelName,
    id,
  );
  const modelAccess = useModelAccess({
    appName,
    modelName,
    tableMetaOverride: tableMeta,
    formMetaOverride: metadata,
    loadTableMetadata: !tableMeta,
    loadFormMetadata: !metadata,
  });
  const telemetry = useModelTelemetry({
    component: "ModelDetail",
    appName,
    modelName,
    attributes: { "rail.detail.id": String(id) },
  });
  const logAction = useAuditableAction({
    appName,
    modelName,
    component: "ModelDetail",
    logEvent: telemetry.logEvent,
  });
  React.useEffect(() => {
    logAction("detail.loaded", { metadata: { id } });
  }, [id, logAction]);
  React.useEffect(() => {
    if (error) {
      telemetry.recordError(error);
    }
  }, [error, telemetry]);
  const normalizedRelatedConfigs = React.useMemo(() => {
    const map = new Map<string, RelatedTableConfig>();
    Object.entries(relatedTableConfigs ?? {}).forEach(([key, config]) => {
      if (key && config) {
        map.set(key.trim().toLowerCase(), config);
      }
    });
    return map;
  }, [relatedTableConfigs]);

  const getRelationConfig = React.useCallback(
    (relation: ModelMetadataRelationship): RelatedTableConfig | undefined => {
      const candidates = [
        relation.name,
        relation.name.replace(/_/g, ""),
        `${relation.name}s`,
        relation.related_model,
        relation.related_model?.replace(/_/g, ""),
        relation.verbose_name?.replace(/ /g, ""),
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      for (const candidate of candidates) {
        const config = normalizedRelatedConfigs.get(candidate);
        if (config) return config;
      }
      return undefined;
    },
    [normalizedRelatedConfigs],
  );
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({});
  const [relationCounts, setRelationCounts] = React.useState<
    Record<string, number | undefined>
  >({});
  const handleCountChange = React.useCallback(
    (relationName: string, count?: number) => {
      setRelationCounts((prev) => {
        if (prev[relationName] === count) return prev;
        return { ...prev, [relationName]: count };
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!item) return;
    setRelationCounts((prev) => {
      const next = { ...prev };
      (metadata?.relationships ?? []).forEach((rel) => {
        const countKey = `${rel.name}_count`;
        if (Object.prototype.hasOwnProperty.call(item, countKey)) {
          const raw = (item as Record<string, unknown>)[countKey];
          const parsed = typeof raw === "number" ? raw : Number(raw);
          if (!Number.isNaN(parsed)) {
            next[rel.name] = parsed;
          }
        }
      });
      return next;
    });
  }, [item, metadata]);

  const primitiveFields: DetailFieldConfig[] = React.useMemo(() => {
    const fields = tableMeta?.fields ?? [];
    const excluded = new Set(["id", "desc"]);
    return fields
      .filter((f) => !f.is_related && !excluded.has(f.name))
      .map((f) => ({
        name: f.name,
        label: f.title ?? f.name,
        render: (value: unknown) => formatValueByType(value, f.field_type),
      }));
  }, [tableMeta]);

  const includeSet = React.useMemo(
    () => (includeSections?.length ? new Set(includeSections) : null),
    [includeSections],
  );
  const excludeSet = React.useMemo(
    () => (excludeSections?.length ? new Set(excludeSections) : null),
    [excludeSections],
  );
  const shouldIncludeSection = React.useCallback(
    (sectionId: string) => {
      if (includeSet && includeSet.size > 0) return includeSet.has(sectionId);
      if (excludeSet && excludeSet.size > 0) return !excludeSet.has(sectionId);
      return true;
    },
    [includeSet, excludeSet],
  );

  const overviewPanels: DetailPanelConfig[] = React.useMemo(() => {
    if (!shouldIncludeSection("main")) return [];
    return [
      {
        id: "main",
        title: metadata?.verbose_name || modelName,
        sections: [{ id: "primary", fields: primitiveFields }],
      },
    ];
  }, [metadata, modelName, primitiveFields, shouldIncludeSection]);

  const detailTabs: DetailTabConfig[] = React.useMemo(() => {
    if (!overviewPanels.length) return [];
    return [
      {
        key: "overview",
        label: "DÃ©tails",
        sections: [{ type: "list", panels: overviewPanels }],
      },
    ];
  }, [overviewPanels]);

  const nestedEntries = React.useMemo(() => {
    if (!nested?.length || !metadata?.relationships?.length) return [];
    return nested
      .map<{
        relation?: ModelMetadataRelationship;
        config?: NestedDetailConfig;
      }>((entry) => {
        if (typeof entry === "string") {
          return {
            relation: metadata.relationships?.find(
              (rel) =>
                normalizeFieldValue(rel.name) === normalizeFieldValue(entry),
            ),
            config: undefined,
          };
        }
        const key = Object.keys(entry)[0];
        return {
          relation: metadata.relationships?.find(
            (rel) => normalizeFieldValue(rel.name) === normalizeFieldValue(key),
          ),
          config: entry[key],
        };
      })
      .filter((item) => Boolean(item.relation)) as {
      relation: ModelMetadataRelationship;
      config?: NestedDetailConfig;
    }[];
  }, [nested, metadata]);

  const relatedSections: ModelMetadataRelationship[] = React.useMemo(() => {
    const rels = metadata?.relationships ?? [];
    return rels.filter((r) => {
      if (!(r.is_reverse || r.many_to_many)) return false;
      if (!shouldIncludeSection(r.name)) return false;
      const { targetApp, targetModel } = getRelationTarget(r);
      return !!targetApp && !!targetModel;
    });
  }, [metadata, shouldIncludeSection]);

  if (loading) return <div className={className}>Chargement...</div>;
  if (!item) {
    return (
      <ModelAccessContext.Provider value={modelAccess}>
        <div className={className}>Aucun Ã©lÃ©ment</div>
      </ModelAccessContext.Provider>
    );
  }
  return (
    <ModelAccessContext.Provider value={modelAccess}>
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">
            {metadata?.verbose_name ?? modelName}
          </div>
        </div>
        {detailTabs.length ? (
          <BaseDetail data={item} tabs={detailTabs} className="mb-4" />
        ) : null}
        {nestedEntries.length ? (
          <div className="space-y-6">
            {nestedEntries.map(({ relation, config }) =>
              relation ? (
                <NestedDetailCard
                  key={relation.name}
                  relation={relation}
                  config={config}
                  parentApp={appName}
                  parentItem={item}
                  parentId={id}
                />
              ) : null,
            )}
          </div>
        ) : null}
        {relatedSections.length ? (
          <div className="space-y-4">
            {relatedSections.map((rel) => (
              <RelatedItemsSection
                key={rel.name}
                relation={rel}
                parentModel={modelName}
                parentId={id}
                isOpen={openSections[rel.name] ?? false}
                onToggle={(value) =>
                  setOpenSections((prev) => ({ ...prev, [rel.name]: value }))
                }
                config={getRelationConfig(rel)}
                count={relationCounts[rel.name]}
                onCountChange={handleCountChange}
              />
            ))}
          </div>
        ) : null}
      </div>
    </ModelAccessContext.Provider>
  );
}

export default function ModelDetail(props: ModelDetailProps) {
  return <LegacyModelDetail {...props} />;
}

function RelatedItemsSection({
  relation,
  parentModel,
  parentId,
  isOpen,
  onToggle,
  config,
  count,
  onCountChange,
}: {
  relation: ModelMetadataRelationship;
  parentModel: string;
  parentId: string | number;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  config?: RelatedTableConfig;
  count?: number;
  onCountChange: (relation: string, count?: number) => void;
}) {
  const { targetApp, targetModel } = getRelationTarget(relation);
  if (!targetApp || !targetModel) return null;
  const title = relation.verbose_name || relation.name;
  const displayedCount = count;

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {title}
          {typeof displayedCount === "number" ? (
            <span className="text-muted-foreground"> ({displayedCount})</span>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggle(!isOpen)}>
          {isOpen ? "Masquer" : "Afficher"}
        </Button>
      </div>
      {isOpen ? (
        <div className="pt-3">
          <RelatedItemsTable
            relation={relation}
            targetApp={targetApp}
            targetModel={targetModel}
            parentModel={parentModel}
            parentId={parentId}
            config={config}
            onCountChange={onCountChange}
          />
        </div>
      ) : (
        <div className="pt-3 text-sm text-muted-foreground">
          Cliquez sur â€œAfficherâ€ pour charger les donnÃ©es.
        </div>
      )}
    </div>
  );
}

function RelatedItemsTable({
  relation,
  targetApp,
  targetModel,
  parentModel,
  parentId,
  config,
  onCountChange,
}: {
  relation: ModelMetadataRelationship;
  targetApp: string;
  targetModel: string;
  parentModel: string;
  parentId: string | number;
  config?: RelatedTableConfig;
  onCountChange: (relation: string, count?: number) => void;
}) {
  const lazy = useLazyRelatedTable(
    targetApp,
    targetModel,
    parentModel,
    parentId,
    relation.to_field ?? undefined,
  );
  return (
    <SimpleRelatedItemsTable
      relation={relation}
      targetApp={targetApp}
      targetModel={targetModel}
      lazyVariables={lazy.initVariables}
      config={config?.simple}
      modelTableProps={config?.modelTableProps}
      onCountChange={onCountChange}
    />
  );
}

function SimpleRelatedItemsTable({
  relation,
  targetApp,
  targetModel,
  lazyVariables,
  config,
  modelTableProps,
  onCountChange,
}: {
  relation: ModelMetadataRelationship;
  targetApp: string;
  targetModel: string;
  lazyVariables: Record<string, unknown>;
  config?: RelatedTableConfig["simple"];
  modelTableProps?: RelatedTableConfig["modelTableProps"];
  onCountChange: (relation: string, count?: number) => void;
}) {
  const simpleConfig = config ?? {};
  const simpleInitialPageSize =
    modelTableProps?.hookOptions?.initialPageSize ?? simpleConfig.pageSize ?? 5;
  const simpleHookOptions = React.useMemo(() => {
    const opts = modelTableProps?.hookOptions ?? {};
    const initVariables = {
      ...((opts.initVariables as Record<string, unknown>) ?? {}),
      ...lazyVariables,
    };
    return {
      ...opts,
      initVariables,
      initialPageSize: simpleInitialPageSize,
    };
  }, [lazyVariables, modelTableProps?.hookOptions, simpleInitialPageSize]);

  const tableHook = useGraphQLModelTable({
    appName: targetApp,
    modelName: targetModel,
    ...simpleHookOptions,
  });

  const rows = (tableHook.items as Record<string, unknown>[]) ?? [];
  const metaFields = tableHook.fields ?? [];
  const requestedFields = simpleConfig.fields?.length
    ? simpleConfig.fields
    : metaFields
        .filter((field) => !field.is_related)
        .map((field) => field.name);
  const maxColumns = simpleConfig.maxColumns ?? 4;
  const fieldOrder = Array.from(new Set(requestedFields));
  if (!fieldOrder.includes("desc")) fieldOrder.unshift("desc");
  const columnKeys = fieldOrder.slice(0, maxColumns);
  const columns = columnKeys.map((key) => {
    const metaField = metaFields.find((field) => field.name === key);
    return {
      key,
      label: metaField?.title ?? key,
      fieldType: metaField?.field_type,
    };
  });
  const rowActions = simpleConfig.rowActions;
  const customRowActions = rowActions?.custom ?? [];
  const showRowActions =
    (rowActions?.enableEdit ?? false) ||
    (rowActions?.enableDelete ?? false) ||
    customRowActions.length > 0;

  const headerActions = simpleConfig.headerActions ?? [];
  const quickSearchEnabled = simpleConfig.enableQuickSearch ?? false;
  const [searchValue, setSearchValue] = React.useState(
    tableHook.state.quick ?? "",
  );
  const handleQuickSearch = React.useCallback(() => {
    tableHook.setters.setQuick(searchValue);
  }, [searchValue, tableHook.setters]);

  const pageInfo = tableHook.pageInfo;
  const currentPage = pageInfo?.current_page ?? tableHook.state.pageIndex + 1;
  const totalPages = pageInfo?.page_count ?? 1;
  const hasNextPage = pageInfo?.has_next_page ?? currentPage < totalPages;

  const activeSort = (tableHook.state.sorting as SortingState)[0];
  const sortable = simpleConfig.sortable ?? true;
  const toggleSort = (columnKey: string) => {
    if (!sortable) return;
    const current = activeSort;
    let nextState: SortingState = [{ id: columnKey, desc: false }];
    if (current && current.id === columnKey) {
      if (!current.desc) {
        nextState = [{ id: columnKey, desc: true }];
      } else {
        nextState = [];
      }
    }
    tableHook.setters.setSorting(nextState);
  };

  const reload = React.useCallback(() => {
    tableHook.refetch();
  }, [tableHook]);

  const relationName = relation.name;
  const totalCount = tableHook.pageInfo?.total_count ?? rows.length;
  React.useEffect(() => {
    onCountChange(relationName, totalCount);
  }, [relationName, totalCount, onCountChange]);

  const hasError = Boolean(tableHook.error);
  return (
    <div className="space-y-3">
      {(quickSearchEnabled || headerActions.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {quickSearchEnabled ? (
            <div className="flex items-center gap-2">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Recherche..."
                className="w-48"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickSearch}
                disabled={tableHook.loading}
              >
                Filtrer
              </Button>
            </div>
          ) : (
            <span />
          )}
          {headerActions.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {headerActions.map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant ?? "outline"}
                  size="sm"
                  onClick={() =>
                    action.onClick({ relation: relationName, reload })
                  }
                >
                  {action.icon}
                  <span className={action.icon ? "ml-1" : ""}>
                    {action.label}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div className="rounded-md border">
        {hasError ? (
          <div className="p-4 text-sm text-destructive">
            Erreur lors du chargement des Ã©lÃ©ments liÃ©s.
          </div>
        ) : tableHook.loading ? (
          <div className="p-4 text-sm text-muted-foreground">Chargement...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            Aucun Ã©lÃ©ment associÃ©.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 ${
                          sortable ? "cursor-pointer" : ""
                        }`}
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}
                        {activeSort?.id === col.key
                          ? activeSort.desc
                            ? "â†“"
                            : "â†‘"
                          : null}
                      </button>
                    </th>
                  ))}
                  {showRowActions ? (
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={String(row.id ?? row.desc ?? idx)}
                    className="border-t"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        {formatValueByType(row?.[col.key], col.fieldType)}
                      </td>
                    ))}
                    {showRowActions ? (
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {rowActions?.enableEdit ? (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                rowActions.onEdit?.({
                                  relation: relationName,
                                  row,
                                  reload,
                                })
                              }
                              title={rowActions.editLabel ?? "Modifier"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {rowActions?.enableDelete ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() =>
                                rowActions.onDelete?.({
                                  relation: relationName,
                                  row,
                                  reload,
                                })
                              }
                              title={rowActions.deleteLabel ?? "Supprimer"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {customRowActions.map((action) => (
                            <Button
                              key={action.key}
                              variant={action.variant ?? "outline"}
                              size="sm"
                              onClick={() =>
                                action.onClick({
                                  relation: relationName,
                                  row,
                                  reload,
                                })
                              }
                            >
                              {action.icon}
                              <span className={action.icon ? "ml-1" : ""}>
                                {action.label}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {currentPage} / {totalPages} Â·{" "}
          {pageInfo?.total_count ?? rows.length} Ã©lÃ©ment
          {(pageInfo?.total_count ?? rows.length) > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={tableHook.loading || currentPage <= 1}
            onClick={tableHook.setters.previousPage}
          >
            PrÃ©cÃ©dent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={tableHook.loading || !hasNextPage}
            onClick={tableHook.setters.nextPage}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}

type NestedDetailCardProps = {
  relation: ModelMetadataRelationship;
  config?: NestedDetailConfig;
  parentApp: string;
  parentItem: Record<string, unknown> | null;
  parentId: string | number;
};

function NestedDetailCard({
  relation,
  config,
  parentApp,
  parentItem,
  parentId,
}: NestedDetailCardProps) {
  const targetApp = relation.related_app ?? parentApp;
  const targetModel = relation.related_model ?? relation.name;
  const relationValue = parentItem?.[relation.name];
  const resolvedId =
    (relationValue && typeof relationValue === "object"
      ? (relationValue.id ?? relationValue.pk ?? relationValue.value)
      : undefined) ??
    parentItem?.[relation.to_field ?? ""] ??
    parentItem?.[relation.from_field ?? ""] ??
    parentId;

  const recordId =
    resolvedId !== undefined && resolvedId !== null
      ? String(resolvedId)
      : undefined;

  const {
    metadata: nestedMeta,
    item: nestedItem,
    loading: nestedLoading,
  } = useGraphQLModelDetail(targetApp, targetModel, recordId ?? "");

  const fieldsMeta = nestedMeta?.fields ?? [];
  const detailFields = React.useMemo<DetailFieldConfig[]>(() => {
    const configs = fieldsMeta
      .filter((field) => field.name !== "id")
      .map((field) => ({
        name: field.name,
        label: field.title ?? field.name,
        render: (value: unknown) => formatValueByType(value, field.field_type),
      }));
    return config?.fields?.length
      ? buildDetailFields(configs, config.fields)
      : configs;
  }, [fieldsMeta, config?.fields]);

  if (!targetApp || !targetModel || !recordId) return null;
  if (nestedLoading || !nestedItem) {
    return (
      <div className="rounded-lg border bg-background/50 p-4 text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const title = config?.title ?? relation.verbose_name ?? relation.name;
  const panels: DetailPanelConfig[] = [
    {
      id: `${relation.name}-nested`,
      title,
      sections: [{ id: `${relation.name}-fields`, fields: detailFields }],
    },
  ];
  const tabs: DetailTabConfig[] = [
    {
      key: `${relation.name}-nested`,
      label: title,
      sections: [{ type: "list", panels }],
    },
  ];

  return (
    <div className="rounded-lg border bg-background/60 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <BaseDetail
        data={nestedItem ?? {}}
        tabs={tabs}
        className="bg-transparent"
        initialTab={tabs[0].key}
      />
    </div>
  );
}

function getRelationTarget(relation: ModelMetadataRelationship): {
  targetApp?: string;
  targetModel?: string;
} {
  const maybeObject =
    relation.related_model && typeof relation.related_model === "object"
      ? relation.related_model
      : null;
  const targetApp = relation.related_app ?? maybeObject?.app_name ?? undefined;
  const targetModel =
    typeof relation.related_model === "string"
      ? relation.related_model
      : (maybeObject?.model_name ?? undefined);
  return { targetApp, targetModel };
}
