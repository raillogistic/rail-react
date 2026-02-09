import * as React from "react";
import BaseDetail from "./BaseDetail";
import type {
  DetailPanelConfig,
  DetailFieldConfig,
  DetailTabConfig,
  ModelDetailProps,
  ModelDetailUpdateFormConfig,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import ModelForm, { type ModelFormProps } from "../form/backend/ModelForm";
import { Pencil, Trash2 } from "lucide-react";
import { useGraphQLModelTable } from "../tablev2/compat/hooks";
import { Drawer, DrawerContent } from "@/lib/components/ui/drawer";
import { cn } from "../utils";
import { toast } from "@/lib/components/ui/sonner";
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
      date.getMonth() + 1
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

const mergeUniqueStrings = (
  ...groups: Array<Iterable<string | null | undefined> | null | undefined>
) => {
  const acc = new Set<string>();
  groups.forEach((group) => {
    if (!group) return;
    for (const value of group) {
      if (typeof value === "string" && value.trim().length > 0) {
        acc.add(value);
      }
    }
  });
  return Array.from(acc);
};

const relationIdKeys = ["id", "pk", "value", "uuid"];

const isMultiSelectionRelationship = (
  relationship?: ModelMetadataRelationship | null
) => {
  if (!relationship) return false;
  if (
    relationship.one_to_one ||
    relationship.foreign_key ||
    relationship.relationship_type === "ForeignKey" ||
    relationship.relationship_type === "OneToOneField"
  ) {
    return false;
  }
  if (
    relationship.multiple ||
    relationship.many_to_many ||
    relationship.relationship_type === "ManyToManyField" ||
    relationship.relationship_type === "ReverseManyToMany"
  ) {
    return true;
  }
  if (relationship.relationship_type === "ManyToOneRel") {
    return Boolean(relationship.many_to_many);
  }
  return false;
};

const extractRelationIdentifier = (value: unknown) => {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }
  if (typeof value === "object") {
    for (const key of relationIdKeys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (
        typeof candidate === "string" ||
        typeof candidate === "number" ||
        candidate === null
      ) {
        return candidate;
      }
    }
  }
  return undefined;
};

const extractRelationLabel = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const candidate =
    record.desc ??
    record.name ??
    record.label ??
    record.title ??
    record.code ??
    record.reference;
  if (candidate === null || candidate === undefined) return undefined;
  return String(candidate);
};

const buildRelationshipInitialEntry = (
  entry: unknown
): string | number | Record<string, unknown> | null => {
  const identifier = extractRelationIdentifier(entry);
  if (
    identifier === undefined ||
    identifier === null ||
    (typeof identifier !== "string" && typeof identifier !== "number")
  ) {
    return null;
  }
  const label = extractRelationLabel(entry);
  if (label) {
    const description =
      typeof entry === "object"
        ? (entry as Record<string, unknown>).description ??
          (entry as Record<string, unknown>).desc2 ??
          (entry as Record<string, unknown>).code
        : undefined;
    const option: Record<string, unknown> = {
      value: identifier,
      label,
    };
    if (description) {
      option.description = String(description);
    }
    return option;
  }
  return identifier;
};

const normalizeRelationshipValue = (
  value: unknown,
  multiple: boolean
): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (multiple) {
    const source = Array.isArray(value) ? value : [value];
    const mapped = source
      .map((entry) => buildRelationshipInitialEntry(entry))
      .filter(
        (entry): entry is string | number | Record<string, unknown> =>
          entry !== null
      );
    return mapped;
  }
  if (Array.isArray(value)) {
    if (!value.length) return null;
    const normalized = buildRelationshipInitialEntry(value[0]);
    return normalized ?? null;
  }
  return buildRelationshipInitialEntry(value) ?? value;
};

function buildDetailFields(
  fields: DetailFieldConfig[],
  requested?: string[] | undefined
): DetailFieldConfig[] {
  if (!requested?.length) return fields;
  const targetSet = new Set(requested);
  return fields.filter((field) => targetSet.has(field.name));
}

export default function ModelDetail({
  appName,
  modelName,
  id,
  className,
  includeSections,
  excludeSections,
  onEdit,
  onUpdate,
  relatedTableConfigs,
  nested,
  updateForm,
}: ModelDetailProps) {
  const { metadata, tableMeta, item, loading, error, refetch } = useGraphQLModelDetail(
    appName,
    modelName,
    id
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
    [normalizedRelatedConfigs]
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
    []
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
    [includeSections]
  );
  const excludeSet = React.useMemo(
    () => (excludeSections?.length ? new Set(excludeSections) : null),
    [excludeSections]
  );
  const shouldIncludeSection = React.useCallback(
    (sectionId: string) => {
      if (includeSet && includeSet.size > 0) return includeSet.has(sectionId);
      if (excludeSet && excludeSet.size > 0) return !excludeSet.has(sectionId);
      return true;
    },
    [includeSet, excludeSet]
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
                normalizeFieldValue(rel.name) === normalizeFieldValue(entry)
            ),
            config: undefined,
          };
        }
        const key = Object.keys(entry)[0];
        return {
          relation: metadata.relationships?.find(
            (rel) => normalizeFieldValue(rel.name) === normalizeFieldValue(key)
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

  const autoExcludedRelationships = React.useMemo(
    () =>
      mergeUniqueStrings(
        nestedEntries.map((entry) => entry.relation.name),
        relatedSections.map((relation) => relation.name)
      ),
    [nestedEntries, relatedSections]
  );

  const handleDetailUpdated = React.useCallback(
    (payload: Record<string, unknown>) => {
      onUpdate?.(payload);
      void refetch();
    },
    [onUpdate, refetch]
  );

  if (loading) return <div className={className}>Chargement...</div>;
  if (!item) {
    return (
      <ModelAccessContext.Provider value={modelAccess}>
        <div className={className}>Aucun Ã©lÃ©ment</div>
      </ModelAccessContext.Provider>
    );
  }
  const updateBlockedReason = null;

  return (
    <ModelAccessContext.Provider value={modelAccess}>
      <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">
          {metadata?.verbose_name ?? modelName}
        </div>
        <div className="flex items-center gap-2">
          <UpdateRecordButton
            appName={appName}
            modelName={modelName}
            entityLabel={metadata?.verbose_name ?? modelName}
            initialValues={item}
            onUpdated={handleDetailUpdated}
            onEdit={onEdit}
            config={{
              ...updateForm,
            }}
            autoExcludedRelationships={autoExcludedRelationships}
            relationships={metadata?.relationships}
            blockedReason={updateBlockedReason ?? undefined}
          />
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
                onParentUpdated={() => onUpdate?.(item ?? {})}
              />
            ) : null
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
    relation.to_field ?? undefined
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
  parentId,
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
    tableHook.state.quick ?? ""
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
  onParentUpdated?: () => void;
};

function NestedDetailCard({
  relation,
  config,
  parentApp,
  parentItem,
  parentId,
  onParentUpdated,
}: NestedDetailCardProps) {
  const targetApp = relation.related_app ?? parentApp;
  const targetModel = relation.related_model ?? relation.name;
  const relationValue = parentItem?.[relation.name];
  const resolvedId =
    (relationValue && typeof relationValue === "object"
      ? relationValue.id ?? relationValue.pk ?? relationValue.value
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
    refetch: nestedRefetch,
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

  const creationFormConfig = React.useMemo(() => {
    if (!config?.allowUpdate || !config.updateForm || !nestedItem) {
      return null;
    }
    const userProps = config.updateForm;
    const genericRelationExclusions =
      nestedMeta?.relationships
        ?.filter((rel) => rel.relationship_type === "GenericRelation")
        .map((rel) => rel.name) ?? [];
    const defaultExcludeRelationships = mergeUniqueStrings(
      nestedMeta?.relationships?.map((rel) => rel.name),
      genericRelationExclusions,
      [relation.name]
    );
    const excludeRelations = mergeUniqueStrings(
      userProps.excludeRelationships,
      defaultExcludeRelationships
    );
    const formConfig = {
      ...userProps,
      appName: userProps.appName ?? targetApp,
      modelName: userProps.modelName ?? targetModel,
      mutationMode: "update" as const,
      mutationId: recordId,
      initialValues: {
        ...((userProps.initialValues as Record<string, unknown>) ?? {}),
        ...nestedItem,
      },
      excludeRelationships: excludeRelations,
      nestedFields: userProps.nestedFields ?? [],
    } satisfies ModelFormProps<Record<string, unknown>>;
    formConfig.onCompleted = (payload: any) => {
      userProps.onCompleted?.(payload);
      nestedRefetch();
      onParentUpdated?.();
      setUpdateOpen(false);
    };
    return formConfig;
  }, [
    config?.allowUpdate,
    config?.updateForm,
    nestedItem,
    nestedMeta?.relationships,
    onParentUpdated,
    relation.name,
    nestedRefetch,
    targetApp,
    targetModel,
  ]);

  const [isUpdateOpen, setUpdateOpen] = React.useState(false);

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
        {config?.allowUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpdateOpen(true)}
          >
            Modifier
          </Button>
        )}
      </div>
      <BaseDetail
        data={nestedItem ?? {}}
        tabs={tabs}
        className="bg-transparent"
        initialTab={tabs[0].key}
      />
      {config?.allowUpdate &&
        creationFormConfig &&
        (config.mode === "drawer" ? (
          <Drawer
            open={isUpdateOpen}
            onOpenChange={setUpdateOpen}
            direction={config.drawerDirection ?? "right"}
          >
            <DrawerContent
              className={cn("p-0", config.width ? "" : undefined)}
              style={{ width: config.width, height: config.height }}
            >
              <div className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">
                  {config.modalTitle ?? `Modifier ${title}`}
                </h2>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
                <ModelForm {...creationFormConfig} />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={isUpdateOpen} onOpenChange={setUpdateOpen}>
            <DialogContent
              className={cn(
                "max-w-3xl",
                config.width ? "max-w-none" : undefined
              )}
              style={{ width: config.width, height: config.height }}
            >
              <DialogHeader>
                <DialogTitle>
                  {config.modalTitle ?? `Modifier ${title}`}
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto">
                <ModelForm {...creationFormConfig} />
              </div>
            </DialogContent>
          </Dialog>
        ))}
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
      : maybeObject?.model_name ?? undefined;
  return { targetApp, targetModel };
}

type UpdateRecordButtonProps = {
  appName: string;
  modelName: string;
  entityLabel?: string | null;
  initialValues: Record<string, unknown>;
  onUpdated?: (data: Record<string, unknown>) => void;
  onEdit?: (data: Record<string, unknown>) => void;
  config?: ModelDetailUpdateFormConfig;
  autoExcludedRelationships: string[];
  relationships?: ModelMetadataRelationship[];
  blockedReason?: string | null;
};

function UpdateRecordButton({
  appName,
  modelName,
  entityLabel,
  initialValues,
  onUpdated,
  onEdit,
  config,
  autoExcludedRelationships,
  relationships,
  blockedReason,
}: UpdateRecordButtonProps) {
  const resolvedConfig = config ?? {};
  const {
    enabled = true,
    triggerLabel = "Modifier",
    triggerIcon,
    mode = "modal",
    drawerDirection = "right",
    width,
    height,
    title,
    description,
    autoExcludeDisplayedRelationships = true,
    includeFields,
    excludeFields,
    includeRelationships,
    excludeRelationships,
    formProps,
  } = resolvedConfig;

  const [open, setOpen] = React.useState(false);
  const [openCount, setOpenCount] = React.useState(0);
  const userFormProps = formProps ?? {};
  const {
    onCompleted: userOnCompleted,
    onError: userOnError,
    initialValues: overrideInitialValues,
    exclude: userExclude,
    only: userOnly,
    excludeRelationships: userExcludeRelationships,
    onlyRelationships: userOnlyRelationships,
    showHeading: userShowHeading,
    showSectionHeaders: userShowSectionHeaders,
    title: userFormTitle,
    description: userFormDescription,
    containerClassName: userContainerClassName,
    ...restUserFormProps
  } = userFormProps;

  const titleLabel =
    title ?? userFormTitle ?? `Modifier ${entityLabel ?? "l'Ã©lÃ©ment"}`;
  const descriptionLabel = description ?? userFormDescription ?? null;

  const handleOpen = React.useCallback(() => {
    onEdit?.(initialValues);
    setOpenCount((prev) => prev + 1);
    setOpen(true);
  }, [initialValues, onEdit]);

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
    },
    [setOpen]
  );

  const includeRelationshipSet = React.useMemo(
    () => new Set(includeRelationships ?? []),
    [includeRelationships]
  );
  const genericRelationExclusions = React.useMemo(
    () =>
      (relationships ?? [])
        .filter((relation) => relation.relationship_type === "GenericRelation")
        .map((relation) => relation.name),
    [relationships]
  );
  const autoRelationshipExclusions = React.useMemo(() => {
    if (!autoExcludeDisplayedRelationships) return [];
    return autoExcludedRelationships.filter(
      (relation) => !includeRelationshipSet.has(relation)
    );
  }, [
    autoExcludeDisplayedRelationships,
    autoExcludedRelationships,
    includeRelationshipSet,
  ]);

  const mergedExcludeRelationships = React.useMemo(
    () =>
      mergeUniqueStrings(
        autoRelationshipExclusions,
        excludeRelationships,
        userExcludeRelationships as string[] | undefined,
        genericRelationExclusions
      ),
    [
      autoRelationshipExclusions,
      excludeRelationships,
      userExcludeRelationships,
      genericRelationExclusions,
    ]
  );

  const mergedOnlyRelationships = React.useMemo(() => {
    if (userOnlyRelationships && userOnlyRelationships.length) {
      return userOnlyRelationships;
    }
    if (includeRelationships && includeRelationships.length) {
      return includeRelationships;
    }
    return undefined;
  }, [includeRelationships, userOnlyRelationships]);

  const mergedExcludeFields = React.useMemo(
    () =>
      mergeUniqueStrings(
        excludeFields,
        userExclude as string[] | undefined,
        autoRelationshipExclusions
      ),
    [excludeFields, userExclude, autoRelationshipExclusions]
  );

  const mergedOnlyFields = React.useMemo(() => {
    if (userOnly && userOnly.length) return userOnly;
    if (includeFields && includeFields.length) return includeFields;
    return undefined;
  }, [includeFields, userOnly]);

  // Fingerprints ensure recomputation when cache updates mutate the object in place.
  const initialValuesFingerprint = JSON.stringify(initialValues ?? {});
  const overrideInitialValuesFingerprint = JSON.stringify(
    (overrideInitialValues as Record<string, unknown>) ?? {}
  );

  const mergedInitialValues = React.useMemo(() => {
    const base: Record<string, unknown> = {
      ...initialValues,
      ...((overrideInitialValues as Record<string, unknown>) ?? {}),
    };
    const overrideId =
      (overrideInitialValues as Record<string, unknown>)?.id ??
      (overrideInitialValues as Record<string, unknown>)?.pk;
    const resolvedId =
      overrideId ??
      initialValues?.id ??
      initialValues?.pk ??
      base.id ??
      base.pk ??
      null;
    if (resolvedId !== null && resolvedId !== undefined) {
      base.id = resolvedId;
    }
    const relationshipMetadata = relationships ?? [];
    const next = { ...base };
    const handled = new Set<string>();
    relationshipMetadata.forEach((relationship) => {
      const fieldName = relationship.name;
      if (!(fieldName in next)) return;
      const multiple = isMultiSelectionRelationship(relationship);
      next[fieldName] = normalizeRelationshipValue(next[fieldName], multiple);
      handled.add(fieldName);
    });
    Object.keys(next).forEach((fieldName) => {
      if (handled.has(fieldName)) return;
      const value = next[fieldName];
      if (
        value === null ||
        value === undefined ||
        (typeof value !== "object" && !Array.isArray(value))
      ) {
        return;
      }
      const heuristicMultiple = Array.isArray(value);
      next[fieldName] = normalizeRelationshipValue(value, heuristicMultiple);
    });
    return next;
  }, [
    initialValues,
    overrideInitialValues,
    relationships,
    initialValuesFingerprint,
    overrideInitialValuesFingerprint,
  ]);

  const resolvedRecordId = React.useMemo(() => {
    const candidates = [
      (mergedInitialValues as Record<string, unknown>)?.id,
      (mergedInitialValues as Record<string, unknown>)?.pk,
      initialValues?.id,
      initialValues?.pk,
    ];
    const resolved = candidates.find(
      (value) => typeof value === "string" || typeof value === "number"
    );
    return resolved !== undefined ? String(resolved) : undefined;
  }, [mergedInitialValues, initialValues]);

  const resolvedContainerClassName = React.useMemo(() => {
    if (!userContainerClassName && mode !== "drawer") return undefined;
    if (mode === "drawer") {
      return cn("flex h-full flex-col", userContainerClassName);
    }
    return userContainerClassName;
  }, [mode, userContainerClassName]);

  const finalFormProps = React.useMemo(() => {
    const shouldShowHeading = userShowHeading ?? false;
    const shouldShowSectionHeaders = userShowSectionHeaders ?? false;
    const effectiveFormTitle =
      userFormTitle ?? (shouldShowHeading ? titleLabel : undefined);
    const effectiveFormDescription =
      userFormDescription ??
      (shouldShowHeading ? descriptionLabel ?? undefined : undefined);
    const effectiveMutationId =
      restUserFormProps.mutationId ?? resolvedRecordId;
    const props: ModelFormProps<Record<string, unknown>> = {
      ...restUserFormProps,
      appName: restUserFormProps.appName ?? appName,
      modelName: restUserFormProps.modelName ?? modelName,
      mutationMode: "update",
      initialValues: mergedInitialValues,
      showHeading: shouldShowHeading,
      showSectionHeaders: shouldShowSectionHeaders,
    };
    if (effectiveMutationId !== undefined && effectiveMutationId !== null) {
      props.mutationId = String(effectiveMutationId);
    }
    if (effectiveFormTitle !== undefined) {
      props.title = effectiveFormTitle;
    }
    if (effectiveFormDescription !== undefined) {
      props.description = effectiveFormDescription;
    }
    if (resolvedContainerClassName) {
      props.containerClassName = resolvedContainerClassName;
    }
    if (mergedExcludeFields.length) {
      props.exclude = mergedExcludeFields;
    }
    if (mergedOnlyFields?.length) {
      props.only = mergedOnlyFields;
    }
    if (mergedExcludeRelationships.length) {
      props.excludeRelationships = mergedExcludeRelationships;
    }
    if (mergedOnlyRelationships?.length) {
      props.onlyRelationships = mergedOnlyRelationships;
    }
    return props;
  }, [
    restUserFormProps,
    appName,
    modelName,
    mergedInitialValues,
    mergedExcludeFields,
    mergedOnlyFields,
    mergedExcludeRelationships,
    mergedOnlyRelationships,
    resolvedContainerClassName,
    userShowHeading,
    userShowSectionHeaders,
    userFormTitle,
    userFormDescription,
    titleLabel,
    descriptionLabel,
    resolvedRecordId,
  ]);

  const containerStyle = React.useMemo(() => {
    const resolvedWidth = width ?? undefined;
    const resolvedHeight =
      mode === "drawer" ? height ?? "100vh" : height ?? undefined;
    return {
      width: resolvedWidth,
      maxWidth: resolvedWidth,
      height: resolvedHeight,
    };
  }, [mode, width, height]);

  const formInstanceKey = React.useMemo(() => {
    const base = resolvedRecordId
      ? `${modelName}-${resolvedRecordId}`
      : `${modelName}-form`;
    const relCount = relationships?.length ?? 0;
    return `${base}-${relCount}-${openCount}`;
  }, [resolvedRecordId, modelName, relationships, openCount]);

  if (!enabled) return null;

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpen}
      disabled={Boolean(blockedReason)}
      title={blockedReason ?? undefined}
    >
      {triggerIcon}
      <span className={triggerIcon ? "ml-1" : undefined}>{triggerLabel}</span>
    </Button>
  );
  const triggerContent = blockedReason ? (
    <div className="flex flex-col gap-1">
      {triggerButton}
      <span className="text-xs text-muted-foreground max-w-xs">
        {blockedReason}
      </span>
    </div>
  ) : (
    triggerButton
  );

  const formBody = open ? (
    <ModelForm
      key={formInstanceKey}
      {...finalFormProps}
      onCompleted={(payload) => {
        userOnCompleted?.(payload);
        onUpdated?.(payload);
        toast.success(`${entityLabel ?? "Enregistrement"} mis Ã  jour.`);
        setOpen(false);
      }}
      onError={(error) => {
        userOnError?.(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Ã‰chec de la mise Ã  jour. Merci de rÃ©essayer."
        );
      }}
    />
  ) : null;

  if (mode === "drawer") {
    return (
      <>
        {triggerContent}
        <Drawer
          open={open}
          onOpenChange={handleClose}
          direction={drawerDirection}
        >
          <DrawerContent
            className={cn(
              "flex h-full flex-col p-0",
              width ? "max-w-none sm:max-w-none" : undefined
            )}
            style={containerStyle}
          >
            <DialogTitle></DialogTitle>
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">{titleLabel}</h2>
              {descriptionLabel ? (
                <p className="text-sm text-muted-foreground">
                  {descriptionLabel}
                </p>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden px-4 py-4">
              {formBody}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {triggerContent}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={cn("max-w-3xl", width ? "max-w-none" : undefined)}
          style={containerStyle}
        >
          <DialogHeader>
            <DialogTitle>{titleLabel}</DialogTitle>
            {descriptionLabel ? (
              <p className="text-sm text-muted-foreground">
                {descriptionLabel}
              </p>
            ) : null}
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">{formBody}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

