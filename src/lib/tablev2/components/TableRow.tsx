import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import { TableRow as ShadcnTableRow, TableCell } from "./TableFrame";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/lib/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { toast } from "sonner";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { GET_MODEL_SCHEMA } from "../queries";
import {
  formatCellValue,
  findMutation,
  getSyntheticRelationCountSource,
  normalizeMutationType,
  resolveFieldValue,
  resolveGroupingKey,
  resolveGroupingLabel,
} from "../utils";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableColumnActionContext,
  BaseModelTableRelationStatsConfig,
  BaseModelTableRelationStatsOverride,
  BaseModelTableRefetch,
  FieldSchema,
  RelationshipSchema,
  RowMutationPermissions,
} from "../types";

type StatsRelationMeta = {
  relationName: string;
  relationLabel: string;
  relatedApp: string;
  relatedModel: string;
};

type RelationStatsHoverProps = {
  row: Record<string, unknown>;
  primaryKey: string;
  model: string;
  whereType: string;
  relation: StatsRelationMeta;
  overrideRenderer?: BaseModelTableRelationStatsOverride;
  children: React.ReactNode;
};

function toSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function toLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeRelationKey(value: string): string {
  return toSnakeCase(value || "").replace(/_/g, "");
}

function toGraphqlFieldName(value: string): string {
  const camel = toCamelCase(value || "");
  if (!camel) return "";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

const STAT_METRIC_META = [
  { suffix: "DistinctCount", label: "Distinct", order: 5 },
  { suffix: "Count", label: "Count", order: 4 },
  { suffix: "Sum", label: "Sum", order: 0 },
  { suffix: "Avg", label: "Avg", order: 1 },
  { suffix: "Min", label: "Min", order: 2 },
  { suffix: "Max", label: "Max", order: 3 },
] as const;

type ParsedStatEntry = {
  key: string;
  value: unknown;
  fieldKey: string;
  fieldLabel: string;
  metricLabel: string;
  order: number;
  isSummary: boolean;
};

function parseStatEntry(
  key: string,
  value: unknown,
  labelLookup: Record<string, string>,
): ParsedStatEntry {
  if (key === "totalCount") {
    return {
      key,
      value,
      fieldKey: key,
      fieldLabel: "Total records",
      metricLabel: "Count",
      order: -1,
      isSummary: true,
    };
  }

  for (const metric of STAT_METRIC_META) {
    if (!key.endsWith(metric.suffix)) continue;
    const rawBase = key.slice(0, -metric.suffix.length);
    const fieldKey = rawBase || key;
    return {
      key,
      value,
      fieldKey,
      fieldLabel: labelLookup[fieldKey] || toLabel(fieldKey),
      metricLabel: metric.label,
      order: metric.order,
      isSummary: false,
    };
  }

  return {
    key,
    value,
    fieldKey: key,
    fieldLabel: toLabel(key),
    metricLabel: "Value",
    order: 99,
    isSummary: false,
  };
}

function formatStatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && value.trim() !== "") {
      return Number.isInteger(parsed)
        ? parsed.toLocaleString()
        : parsed.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return value;
  }
  return String(value);
}

function buildStatsQueryDocument(
  model: string,
  relationName: string,
  whereType: string,
  statFieldNames: string[],
) {
  const lowerCaseModel = model.charAt(0).toLowerCase() + model.slice(1);
  const queryName = `${lowerCaseModel}Pages`;
  const operationName = `${lowerCaseModel}${relationName.replace(/[^a-zA-Z0-9]/g, "")}StatsHover`;
  const statsFieldName = `${relationName}Stats`;

  return gql`
    query ${operationName}($where: ${whereType}, $skipCount: Boolean) {
      ${queryName}(page: 1, perPage: 1, where: $where, skipCount: $skipCount) {
        items {
          id
          ${statsFieldName} {
            ${statFieldNames.join("\n            ")}
          }
        }
      }
    }
  `;
}

function RelationStatsHover({
  row,
  primaryKey,
  model,
  whereType,
  relation,
  overrideRenderer,
  children,
}: RelationStatsHoverProps) {
  const client = useApolloClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statFieldLabels, setStatFieldLabels] = useState<
    Record<string, string>
  >({});

  const rowIdentifierRaw = row[primaryKey] ?? row.id;
  const rowIdentifier =
    rowIdentifierRaw === null || rowIdentifierRaw === undefined
      ? null
      : String(rowIdentifierRaw);

  const fetchStats = React.useCallback(async () => {
    if (!rowIdentifier) return;
    if (loading || stats) return;

    setLoading(true);
    setError(null);

    try {
      const relatedSchemaResult = await client.query({
        query: GET_MODEL_SCHEMA,
        variables: {
          app: relation.relatedApp,
          model: relation.relatedModel,
        },
        fetchPolicy: "cache-first",
      });

      const relatedFields =
        (relatedSchemaResult.data?.modelSchema?.fields as Array<{
          name?: string;
          fieldName?: string;
          verboseName?: string;
          isNumeric?: boolean;
          isRelation?: boolean;
          isPrimaryKey?: boolean;
        }>) ?? [];

      const numericFields = relatedFields
        .filter(
          (field) => field.isNumeric && !field.isRelation && !field.isPrimaryKey,
        )
        .map((field) => {
          const raw = field.name || field.fieldName || "";
          const key = toGraphqlFieldName(raw);
          const label = field.verboseName || toLabel(raw);
          return { key, label };
        })
        .filter(
          (field): field is { key: string; label: string } =>
            !!field.key && !!field.label,
        );

      const fieldLabelLookup: Record<string, string> = {};
      numericFields.forEach((field) => {
        fieldLabelLookup[field.key] = field.label;
      });
      setStatFieldLabels(fieldLabelLookup);

      const numericFieldBases = Object.keys(fieldLabelLookup);

      let statFieldNames: string[] = [
        ...numericFieldBases.flatMap((base) => [
          `${base}Sum`,
          `${base}Avg`,
          `${base}Min`,
          `${base}Max`,
          `${base}Count`,
          `${base}DistinctCount`,
        ]),
      ];

      if (!statFieldNames.includes("totalCount")) {
        statFieldNames = ["totalCount", ...statFieldNames];
      }

      const queryDocument = buildStatsQueryDocument(
        model,
        relation.relationName,
        whereType,
        statFieldNames,
      );

      const whereField = primaryKey;
      const queryResult = await client.query({
        query: queryDocument,
        variables: {
          where: {
            [whereField]: {
              eq: rowIdentifierRaw,
            },
          },
          skipCount: true,
        },
        fetchPolicy: "cache-first",
      });

      const listKey = `${model.charAt(0).toLowerCase()}${model.slice(1)}Pages`;
      const statsKey = `${relation.relationName}Stats`;
      const rawStatsObject =
        queryResult.data?.[listKey]?.items?.[0]?.[statsKey] ?? null;
      const statsObject =
        rawStatsObject && typeof rawStatsObject === "object"
          ? Object.fromEntries(
              Object.entries(rawStatsObject).filter(
                ([key]) => !key.startsWith("__"),
              ),
            )
          : rawStatsObject;

      setStats(statsObject);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Stats indisponibles.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    client,
    loading,
    model,
    primaryKey,
    relation.relatedApp,
    relation.relatedModel,
    relation.relationName,
    rowIdentifier,
    rowIdentifierRaw,
    stats,
    whereType,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        void fetchStats();
      }
    },
    [fetchStats],
  );

  const statEntries = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats).map(([key, value]) =>
      parseStatEntry(key, value, statFieldLabels),
    );
  }, [statFieldLabels, stats]);

  const summaryEntry = useMemo(
    () => statEntries.find((entry) => entry.isSummary),
    [statEntries],
  );

  const groupedEntries = useMemo(() => {
    const grouped = new Map<
      string,
      { fieldLabel: string; values: ParsedStatEntry[] }
    >();
    statEntries
      .filter((entry) => entry.value !== null && entry.value !== undefined)
      .forEach((entry) => {
        if (entry.isSummary) return;
        if (entry.value === null || entry.value === undefined) return;
        const current = grouped.get(entry.fieldKey);
        if (current) {
          current.values.push(entry);
          return;
        }
        grouped.set(entry.fieldKey, {
          fieldLabel: entry.fieldLabel,
          values: [entry],
        });
      });
    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        values: group.values.sort((left, right) => {
          if (left.order !== right.order) return left.order - right.order;
          return left.key.localeCompare(right.key);
        }),
      }))
      .sort((left, right) => left.fieldLabel.localeCompare(right.fieldLabel));
  }, [statEntries]);

  const overrideContent = overrideRenderer
    ? overrideRenderer({
        row,
        relationName: relation.relationName,
        loading,
        error,
        stats,
      })
    : null;

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={120}>
      <TooltipTrigger asChild>
        <span className="inline-flex w-full cursor-help items-center justify-start">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[360px] rounded-xl border border-border/70 bg-popover/95 p-0 text-xs text-popover-foreground shadow-xl backdrop-blur"
      >
        <div className="overflow-hidden rounded-xl">
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {relation.relationLabel}
            </p>
            <p className="text-sm font-semibold text-foreground">Relation Stats</p>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto p-3">
          {overrideContent ? (
            overrideContent
          ) : loading ? (
            <p className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement...
            </p>
          ) : error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-destructive">
              {error}
            </p>
          ) : statEntries.length ? (
            <>
              {summaryEntry ? (
                <div className="rounded-lg border border-border/70 bg-card/90 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {summaryEntry.fieldLabel}
                  </p>
                  <p className="text-lg font-semibold leading-tight text-foreground">
                    {formatStatValue(summaryEntry.value)}
                  </p>
                </div>
              ) : null}
              {groupedEntries.map((group) => (
                <div
                  key={group.fieldLabel}
                  className="rounded-lg border border-border/60 bg-background/80 p-2"
                >
                  <p className="mb-1.5 text-[11px] font-semibold text-foreground">
                    {group.fieldLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.values.map((entry) => (
                      <div
                        key={entry.key}
                        className="rounded-md border border-border/40 bg-muted/30 px-2 py-1"
                      >
                        <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                          {entry.metricLabel}
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {formatStatValue(entry.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="rounded-md border border-dashed border-border/60 px-2 py-1.5 text-muted-foreground">
              Aucune statistique.
            </p>
          )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function RowActions({
  row,
  data,
  refetch,
  permissions,
  columnActions,
}: {
  row: Record<string, unknown>;
  data: Record<string, unknown>[];
  refetch?: BaseModelTableRefetch;
  permissions?: RowMutationPermissions | null;
  columnActions?: BaseModelTableColumnActionsInput;
}) {
  const { model, metadata } = useMetadata();
  const { refresh } = useTable();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rowIdValue = row.id;
  const rowId =
    rowIdValue === undefined || rowIdValue === null ? "" : String(rowIdValue);
  const baseMutations = metadata?.mutations ?? [];
  const baseDeleteMutation = findMutation(baseMutations, "delete");
  const baseUpdateMutation = findMutation(baseMutations, "update");
  const baseCanDelete = !!baseDeleteMutation?.allowed;
  const baseCanEdit = !!baseUpdateMutation?.allowed;
  const hasRowActions = baseMutations.some((mutation) => {
    const type = normalizeMutationType(mutation);
    return type === "update" || type === "delete";
  });
  const canDelete = !!rowId && baseCanDelete && (permissions?.canDelete ?? true);
  const canEdit = baseCanEdit && (permissions?.canUpdate ?? true);
  const actionContext = useMemo<BaseModelTableColumnActionContext>(
    () => ({
      row,
      data,
      refetch,
    }),
    [data, refetch, row],
  );
  const customActions = useMemo(() => {
    const source =
      typeof columnActions === "function"
        ? columnActions(actionContext)
        : columnActions;
    return source ?? [];
  }, [actionContext, columnActions]);
  const hasBuiltinActions = canEdit || canDelete;
  const hasAnyActions = hasBuiltinActions || customActions.length > 0;

  const deleteMutationName = baseDeleteMutation?.name || `delete${model}`;
  const deleteDocument = useMemo(
    () => gql`
        mutation ${deleteMutationName}($id: ID!) {
          response: ${deleteMutationName}(id: $id) {
            ok
            errors { field message code severity details }
          }
        }
      `,
    [deleteMutationName],
  );
  const [executeDelete, { loading: deleting }] = useMutation(deleteDocument, {
    errorPolicy: "all",
  });

  const handleDelete = async () => {
    try {
      const result = await executeDelete({ variables: { id: rowId } });
      const ok = !!result.data?.response?.ok;
      if (ok) {
        toast.success(`${metadata?.verboseName ?? "Enregistrement"} supprime.`);
        refresh();
      } else {
        const message =
          result.data?.response?.errors
            ?.map((error: { message?: string }) => error?.message)
            .filter(Boolean)
            .join(", ") || "Echec de suppression.";
        toast.error(message);
      }
    } catch (error) {
      console.error("Failed to delete record", error);
      const message = error instanceof Error ? error.message : "Echec de suppression.";
      toast.error(message);
    } finally {
      setConfirmOpen(false);
    }
  };
  const handleEdit = () => {
    console.info("Edit row action triggered", row);
  };
  const runCustomAction = (
    onClick: (context: BaseModelTableColumnActionContext) => void | Promise<void>,
  ) => {
    void Promise.resolve(onClick(actionContext)).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Echec de l'action personnalisee.";
      toast.error(message);
    });
  };

  if (!hasRowActions && customActions.length === 0) {
    return null;
  }

  if (!hasAnyActions) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 rounded-md border-border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
              aria-label="Actions de la ligne"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canEdit ? (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Supprimer
              </DropdownMenuItem>
            ) : null}
            {hasBuiltinActions && customActions.length > 0 ? (
              <DropdownMenuSeparator />
            ) : null}
            {customActions.map((action, index) => {
              const key = action.key ?? `custom-row-action-${index}`;
              if (typeof (action as { render?: unknown }).render === "function") {
                const renderAction = (
                  action as { render: (context: BaseModelTableColumnActionContext) => React.ReactNode }
                ).render;
                return <React.Fragment key={key}>{renderAction(actionContext)}</React.Fragment>;
              }
              if (typeof (action as { onClick?: unknown }).onClick !== "function") {
                return null;
              }
              const clickAction = (
                action as {
                  onClick: (
                    context: BaseModelTableColumnActionContext,
                  ) => void | Promise<void>;
                  label?: string;
                }
              );
              return (
                <DropdownMenuItem
                  key={key}
                  variant={action.variant}
                  className={action.className}
                  disabled={action.disabled}
                  onClick={() => runCustomAction(clickAction.onClick)}
                >
                  {action.icon}
                  {clickAction.label ?? "Action"}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {metadata?.verboseName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. L'enregistrement sera supprime
              definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function TableRows({
  loadingText,
  emptyState,
  columns,
  enableSelection,
  refetch,
  columnActions,
  relationStats,
  performance,
  scrollContainerRef,
  infiniteMode,
}: {
  loadingText?: string;
  emptyState?: string;
  columns?: BaseModelTableColumnDef[];
  enableSelection?: boolean;
  refetch?: BaseModelTableRefetch;
  columnActions?: BaseModelTableColumnActionsInput;
  relationStats?: BaseModelTableRelationStatsConfig;
  performance?: {
    enableVirtualization?: boolean;
    virtualizeThreshold?: number;
    overscan?: number;
  };
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  infiniteMode?: boolean;
}) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    rowSelection,
    setRowSelection,
    groupingField,
    groupCollapsed,
    setGroupCollapsed,
    density,
    wrapCells,
  } = useTable();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const fieldLookup = useMemo(() => {
    if (!metadata) return new Map<string, FieldSchema>();
    const lookup = new Map<string, FieldSchema>();
    metadata.fields.forEach((field) => {
      lookup.set(field.name, field);
      if (field.fieldName) lookup.set(field.fieldName, field);
    });
    return lookup;
  }, [metadata]);

  const relationLookup = useMemo(() => {
    const lookup = new Map<string, RelationshipSchema>();
    if (!metadata?.relationships) return lookup;
    metadata.relationships.forEach((relation) => {
      if (relation.name) lookup.set(relation.name, relation);
      if (relation.fieldName) lookup.set(relation.fieldName, relation);
    });
    return lookup;
  }, [metadata?.relationships]);

  const resolveValue = (row: Record<string, unknown>, accessor: string) =>
    accessor.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      const record = acc as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        return record[key];
      }
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
      );
      if (Object.prototype.hasOwnProperty.call(record, camelKey)) {
        return record[camelKey];
      }
      const snakeKey = key
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
      if (Object.prototype.hasOwnProperty.call(record, snakeKey)) {
        return record[snakeKey];
      }
      return undefined;
    }, row);

  const formatFallbackValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const whereType = metadata?.filterConfig?.inputTypeName || `${metadata?.model || "Model"}WhereInput`;
  const primaryKey = metadata?.primaryKey || "id";
  const statsEnabled = relationStats?.enabled !== false;
  const includeSet = useMemo(
    () =>
      new Set((relationStats?.include ?? []).map((name) => normalizeRelationKey(name))),
    [relationStats?.include],
  );
  const excludeSet = useMemo(
    () =>
      new Set((relationStats?.exclude ?? []).map((name) => normalizeRelationKey(name))),
    [relationStats?.exclude],
  );

  const resolveStatsRelation = React.useCallback(
    (
      accessor: string,
      fieldMeta?: FieldSchema,
    ): StatsRelationMeta | null => {
      if (!statsEnabled) return null;
      if (!metadata) return null;
      const root = accessor.split(".")[0];
      if (!root || root.endsWith("Stats")) return null;
      const normalizedRoot = normalizeRelationKey(root);

      const candidates = new Set<string>();
      const relationFromSynthetic = fieldMeta
        ? getSyntheticRelationCountSource(fieldMeta)
        : undefined;
      if (relationFromSynthetic) candidates.add(relationFromSynthetic);
      if (fieldMeta?.isRelation) {
        if (fieldMeta.name) candidates.add(fieldMeta.name);
        if (fieldMeta.fieldName) candidates.add(fieldMeta.fieldName);
      }
      candidates.add(root);
      if (/count$/i.test(root)) {
        const stripped = root.replace(/count$/i, "");
        if (stripped) candidates.add(stripped);
      }

      const normalizedCandidates = new Set<string>();
      candidates.forEach((candidate) => {
        normalizedCandidates.add(candidate);
        normalizedCandidates.add(
          candidate.replace(/_([a-z])/g, (_, letter: string) =>
            letter.toUpperCase(),
          ),
        );
        normalizedCandidates.add(toSnakeCase(candidate));
      });

      let relation: RelationshipSchema | undefined;
      normalizedCandidates.forEach((candidate) => {
        if (relation) return;
        relation = relationLookup.get(candidate);
      });
      if (!relation) return null;
      const normalizedRelationName = normalizeRelationKey(
        relation.name || relation.fieldName || root,
      );
      if (includeSet.size > 0) {
        const includeMatch =
          includeSet.has(normalizedRelationName) || includeSet.has(normalizedRoot);
        if (!includeMatch) return null;
      }
      if (
        excludeSet.has(normalizedRelationName) ||
        excludeSet.has(normalizedRoot)
      ) {
        return null;
      }

      const relationType = (relation.relationType || "").toUpperCase();
      const isReverseOrManyToMany =
        relation.isReverse ||
        relationType.includes("MANY_TO_MANY") ||
        relationType.includes("MANYTOMANY") ||
        relationType.includes("REVERSE_FK");

      if (!relation.isToMany || !isReverseOrManyToMany) return null;

      const relationName = toGraphqlFieldName(
        relation.name || relation.fieldName || "",
      );
      if (!relationName) return null;
      const relationLabel =
        relation.verboseName ||
        fieldMeta?.verboseName ||
        toLabel(relation.name || relation.fieldName || relationName);

      return {
        relationName,
        relationLabel,
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
      };
    },
    [excludeSet, includeSet, metadata, relationLookup, statsEnabled],
  );

  const resolveStatsOverride = React.useCallback(
    (
      accessor: string,
      relationName: string,
    ): BaseModelTableRelationStatsOverride | undefined => {
      const overrides = relationStats?.overrides;
      if (!overrides) return undefined;

      const root = accessor.split(".")[0] || accessor;
      const keyCandidates = [
        accessor,
        root,
        toCamelCase(root),
        toSnakeCase(root),
        relationName,
        toCamelCase(relationName),
        toSnakeCase(relationName),
      ];

      for (const key of keyCandidates) {
        if (Object.prototype.hasOwnProperty.call(overrides, key)) {
          return overrides[key];
        }
      }

      return undefined;
    },
    [relationStats?.overrides],
  );

  const visibleColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds =
        columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) => columnVisibility[column.id] ?? true);
    }

    if (!metadata) return [];
    return columnOrder
      .map((colId) => metadata.fields.find((f) => f.name === colId))
      .filter(
        (field): field is FieldSchema => !!field && columnVisibility[field.name],
      );
  }, [columnOrder, columnVisibility, columns, metadata]);

  const groupedData = useMemo(() => {
    if (!groupingField) return null;

    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        rows: Record<string, unknown>[];
      }
    >();

    data.forEach((row) => {
      const key = resolveGroupingKey(row, groupingField);
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
        return;
      }
      groups.set(key, {
        key,
        label: resolveGroupingLabel(row, groupingField),
        rows: [row],
      });
    });

    return Array.from(groups.values());
  }, [data, groupingField]);

  const handleRowSelect = (rowId: string, checked: boolean) => {
    const nextSelection = { ...rowSelection };
    if (checked) {
      nextSelection[rowId] = true;
    } else {
      delete nextSelection[rowId];
    }
    setRowSelection(nextSelection);
  };

  const fixedColumnCount = (enableSelection ? 1 : 0) + 1;
  const rowHeight =
    density === "compact" ? 32 : density === "spacious" ? 48 : 40;
  const cellPadding =
    density === "compact"
      ? "py-0 px-2.5"
      : density === "spacious"
        ? "py-0 px-4"
        : "py-0 px-3";
  const cellTextSize =
    density === "compact" ? "text-xs" : density === "spacious" ? "text-sm" : "text-sm";
  const cellTextClass = wrapCells
    ? "whitespace-normal break-words leading-snug py-1"
    : "truncate";

  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const updateMetrics = () => {
      setViewportHeight(container.clientHeight);
      setScrollTop(container.scrollTop);
    };

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setScrollTop(container.scrollTop);
      });
    };

    updateMetrics();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [scrollContainerRef]);

  const renderDataRow = (
    row: Record<string, unknown>,
    rowIndex: number,
  ): React.ReactNode => {
    const rowId = String(row.id);
    const isSelected = enableSelection && rowSelection[rowId];
    const rowPermissions = row.rowPermissions as RowMutationPermissions | undefined;
    const isEven = rowIndex % 2 === 0;

    return (
      <ShadcnTableRow
        key={rowId}
        data-state={isSelected ? "selected" : undefined}
        className={cn(
          "group/row relative border-b border-border/50 transition-colors duration-75",
          // Selection state
          isSelected && "bg-primary/5 hover:bg-primary/10",
          !isSelected && "hover:bg-muted/30",
          !isSelected && isEven && "bg-white dark:bg-card",
          !isSelected && !isEven && "bg-slate-50/50 dark:bg-muted/10",
          density === "compact" ? "h-8" : density === "spacious" ? "h-12" : "h-10",
        )}
      >
        {enableSelection ? (
          <TableCell
            className={cn(
              cellPadding,
              "w-[40px] text-center table-first-column border-r border-border/30",
              isSelected && "text-primary",
            )}
          >
            <div className="flex h-full items-center justify-center">
              <Checkbox
                checked={!!rowSelection[rowId]}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  handleRowSelect(rowId, checked === true)
                }
                aria-label="Selectionner la ligne"
                className={cn(
                  "h-4 w-4 rounded-sm border-muted-foreground/40 data-[state=checked]:border-primary",
                  "transition-all duration-200"
                )}
              />
            </div>
          </TableCell>
        ) : null}

        {visibleColumns.map((field) => {
          if ("accessor" in field) {
            const value = resolveValue(row, field.accessor);
            const isSimpleAccessor = !field.accessor.includes(".");
            const metaField = isSimpleAccessor
              ? fieldLookup.get(field.accessor)
              : undefined;
            const statsRelation = resolveStatsRelation(field.accessor, metaField);
            const statsOverride = statsRelation
              ? resolveStatsOverride(field.accessor, statsRelation.relationName)
              : undefined;

            const renderedValue = field.render
              ? field.render(value, row, {
                  accessor: field.accessor,
                  columnId: field.id,
                  data,
                  refetch,
                })
              : metaField
                ? formatCellValue(value, metaField)
                : formatFallbackValue(value);

            return (
              <TableCell 
                key={field.id} 
                className={cn(
                  cellPadding, 
                  cellTextSize, 
                  "text-foreground/80 border-r border-border/30 last:border-0",
                  "group-hover/row:text-foreground transition-colors"
                )}
              >
                <div className={cn(cellTextClass, "flex items-center h-full")}>
                  {statsRelation ? (
                    <RelationStatsHover
                      row={row}
                      primaryKey={primaryKey}
                      model={metadata?.model || "Model"}
                      whereType={whereType}
                      relation={statsRelation}
                      overrideRenderer={statsOverride}
                    >
                      {renderedValue}
                    </RelationStatsHover>
                  ) : (
                    renderedValue
                  )}
                </div>
              </TableCell>
            );
          }

          const statsRelation = resolveStatsRelation(field.name || field.fieldName, field);
          const statsOverride = statsRelation
            ? resolveStatsOverride(field.name || field.fieldName, statsRelation.relationName)
            : undefined;
          const renderedValue = formatCellValue(resolveFieldValue(row, field), field);

          return (
            <TableCell 
              key={field.name} 
              className={cn(
                cellPadding, 
                cellTextSize, 
                "text-foreground/80 border-r border-border/30 last:border-0",
                "group-hover/row:text-foreground transition-colors"
              )}
            >
              <div className={cn(cellTextClass, "flex items-center h-full")}>
                {statsRelation ? (
                  <RelationStatsHover
                    row={row}
                    primaryKey={primaryKey}
                    model={metadata?.model || "Model"}
                    whereType={whereType}
                    relation={statsRelation}
                    overrideRenderer={statsOverride}
                  >
                    {renderedValue}
                  </RelationStatsHover>
                ) : (
                  renderedValue
                )}
              </div>
            </TableCell>
          );
        })}

        <TableCell
          className={cn(
            cellPadding,
            "w-[60px] shrink-0 px-2 text-right",
            "sticky right-0 z-10",
            "table-last-column table-sticky-cell",
            "bg-background border-l border-border/60",
          )}
        >
          <RowActions
            row={row}
            data={data}
            refetch={refetch}
            permissions={rowPermissions}
            columnActions={columnActions}
          />
        </TableCell>
      </ShadcnTableRow>
    );
  };

  if (loading && data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + fixedColumnCount}
          className="h-48"
        >
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <Loader2 className="relative h-6 w-6 animate-spin text-primary/60" />
            </div>
            <span className="text-sm font-medium">{loadingText ?? "Chargement..."}</span>
          </div>
        </TableCell>
      </ShadcnTableRow>
    );
  }

  if (data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + fixedColumnCount}
          className="h-48"
        >
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-2">
              <svg
                className="h-6 w-6 text-muted-foreground/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">{emptyState ?? "Aucun resultat."}</span>
          </div>
        </TableCell>
      </ShadcnTableRow>
    );
  }

  const toggleGroup = (groupKey: string) => {
    const nextCollapsed = { ...groupCollapsed };
    const current = nextCollapsed[groupKey] ?? false;
    nextCollapsed[groupKey] = !current;
    setGroupCollapsed(nextCollapsed);
  };

  if (groupedData && groupedData.length > 0) {
    let renderedIndex = 0;
    return (
      <>
        {groupedData.map((group) => {
          const collapsed = groupCollapsed[group.key] ?? false;

          return (
            <React.Fragment key={`group-${group.key}`}>
              <ShadcnTableRow 
                className="bg-muted/40 border-b border-border hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(group.key)}
              >
                <TableCell
                  colSpan={visibleColumns.length + fixedColumnCount}
                  className="px-2 py-1.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm hover:bg-background/80"
                      onClick={(e) => {
                         e.stopPropagation();
                         toggleGroup(group.key);
                      }}
                    >
                      {collapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <span className="text-sm font-semibold text-foreground/80">
                      {group.label}
                    </span>
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {group.rows.length}
                    </span>
                  </div>
                </TableCell>
              </ShadcnTableRow>
              {!collapsed
                ? group.rows.map((row) => renderDataRow(row, renderedIndex++))
                : null}
            </React.Fragment>
          );
        })}
        {infiniteMode && loading ? (
          <ShadcnTableRow>
            <TableCell
              colSpan={visibleColumns.length + fixedColumnCount}
              className="py-4 text-center"
            >
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </span>
            </TableCell>
          </ShadcnTableRow>
        ) : null}
      </>
    );
  }

  const enableVirtualization =
    (performance?.enableVirtualization ?? true) &&
    !wrapCells &&
    !groupingField &&
    data.length >= (performance?.virtualizeThreshold ?? 80) &&
    viewportHeight > 0;
  const overscan = Math.max(2, performance?.overscan ?? 8);
  const startIndex = enableVirtualization
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    : 0;
  const visibleCount = enableVirtualization
    ? Math.ceil(viewportHeight / rowHeight) + overscan * 2
    : data.length;
  const endIndex = enableVirtualization
    ? Math.min(data.length, startIndex + visibleCount)
    : data.length;
  const topSpacerHeight = enableVirtualization ? startIndex * rowHeight : 0;
  const bottomSpacerHeight = enableVirtualization
    ? Math.max(0, (data.length - endIndex) * rowHeight)
    : 0;
  const visibleRows = data.slice(startIndex, endIndex);

  return (
    <>
      {enableVirtualization && topSpacerHeight > 0 ? (
        <ShadcnTableRow aria-hidden="true">
          <TableCell
            colSpan={visibleColumns.length + fixedColumnCount}
            style={{ height: `${topSpacerHeight}px` }}
            className="border-0 p-0"
          />
        </ShadcnTableRow>
      ) : null}
      {(enableVirtualization ? visibleRows : data).map((row, index) =>
        renderDataRow(row, enableVirtualization ? startIndex + index : index),
      )}
      {enableVirtualization && bottomSpacerHeight > 0 ? (
        <ShadcnTableRow aria-hidden="true">
          <TableCell
            colSpan={visibleColumns.length + fixedColumnCount}
            style={{ height: `${bottomSpacerHeight}px` }}
            className="border-0 p-0"
          />
        </ShadcnTableRow>
      ) : null}
      {infiniteMode && loading ? (
        <ShadcnTableRow>
          <TableCell
            colSpan={visibleColumns.length + fixedColumnCount}
            className="py-4 text-center"
          >
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement...
            </span>
          </TableCell>
        </ShadcnTableRow>
      ) : null}
    </>
  );
}

