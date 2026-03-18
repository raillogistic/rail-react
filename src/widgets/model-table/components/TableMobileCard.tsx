import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { buildColumnDefinitions } from "../builders/columnDefinitions";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import {
  formatCellValue,
  normalizeBaseModelTableFieldsInput,
  resolveColumnVisibility,
  resolveFieldValue,
  resolveGroupingKey,
  resolveGroupingLabel,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  RowMutationPermissions,
} from "../types";
import type {
  ModelTableV2TableConfig,
  ModelTableDetailConfig,
  ModelTableUpdateConfig,
} from "../config/types";
import type { TemplatePdfPreviewPayload } from "../utils/templateExecution";
import { cn } from "@/shared/utils";
import { RowActions } from "./row/RowActions";
import { ProtectedFileCell } from "./ProtectedFileCell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";

const MOBILE_BATCH_SIZE = 24;

/**
 * Props for mobile-card rendering of table rows.
 */
type TableMobileCardProps = {
  emptyState?: string;
  refetch?: BaseModelTableRefetch;
  fields?: BaseModelTableFieldsInput;
  columnActions?: BaseModelTableColumnActionsInput;
  update?: ModelTableUpdateConfig;
  detail?: ModelTableDetailConfig;
  pdfPreview?: ModelTableV2TableConfig["pdfPreview"];
  onTemplatePdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
};

function normalizePdfUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /\.pdf(?:[?#].*)?$/i.test(trimmed) ? trimmed : null;
}

function getPdfLabel(pdfUrl: string): string {
  const normalizedPath = pdfUrl.split("#")[0]?.split("?")[0] ?? pdfUrl;
  const segments = normalizedPath.split("/").filter(Boolean);
  return segments[segments.length - 1] || "Preview PDF";
}

export function TableMobileCard({
  emptyState,
  refetch,
  fields,
  columnActions,
  update,
  detail,
  pdfPreview,
  onTemplatePdfPreview,
}: TableMobileCardProps) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    density,
    wrapCells,
    groupingField,
    groupCollapsed,
    setGroupCollapsed,
  } = useTable();
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH_SIZE);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>("");

  useEffect(() => {
    setVisibleCount(MOBILE_BATCH_SIZE);
  }, [data.length]);

  if (!metadata) return null;

  const normalizedFieldsConfig = useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );
  const allowedFieldIds = useMemo(
    () =>
      new Set(
        buildColumnDefinitions(metadata, normalizedFieldsConfig).map(
          (column) => column.id.split(".")[0],
        ),
      ),
    [metadata, normalizedFieldsConfig],
  );

  const byName = useMemo(
    () => new Map(metadata.fields.map((field) => [field.name, field])),
    [metadata.fields],
  );
  const byFieldName = useMemo(
    () =>
      new Map(
        metadata.fields.map((field) => [field.name || field.fieldName, field]),
      ),
    [metadata.fields],
  );

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((columnId) => byName.get(columnId) || byFieldName.get(columnId))
        .filter(
          (field): field is (typeof metadata.fields)[number] =>
            !!field &&
            allowedFieldIds.has(toGraphqlFieldName(field.name || field.fieldName)),
        ),
    [allowedFieldIds, byFieldName, byName, columnOrder, metadata.fields],
  );

  const mergedColumns = useMemo(() => {
    const seenColumns = new Set<string>();
    return [...orderedColumns, ...metadata.fields].filter((field) => {
      const canonicalFieldId = toGraphqlFieldName(field.name || field.fieldName);
      if (!allowedFieldIds.has(canonicalFieldId)) {
        return false;
      }
      if (seenColumns.has(field.name)) return false;
      seenColumns.add(field.name);
      return true;
    });
  }, [allowedFieldIds, metadata.fields, orderedColumns]);

  const visibleColumns = useMemo(
    () =>
      mergedColumns.filter((field) => {
        if (field.visibility === "hidden") return false;
        return resolveColumnVisibility(columnVisibility, [
          field.name,
          field.fieldName,
        ]);
      }),
    [columnVisibility, mergedColumns],
  );

  const showIdDescription =
    visibleColumns.length === 0 ||
    visibleColumns.some((field) => {
      const id = field.name || field.fieldName;
      return id === "id";
    });

  const groupingFieldMeta = useMemo(() => {
    if (!groupingField) return undefined;
    const root = groupingField.replace(/__/g, ".").split(".")[0];
    const candidates = [
      groupingField,
      toGraphqlFieldName(groupingField),
      toCamelCase(groupingField),
      toSnakeCase(groupingField),
      root,
      toGraphqlFieldName(root),
      toCamelCase(root),
      toSnakeCase(root),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const field = byName.get(candidate) || byFieldName.get(candidate);
      if (field) return field;
    }

    return undefined;
  }, [byFieldName, byName, groupingField]);

  const groupingFieldLabel = useMemo(() => {
    if (!groupingField) return undefined;
    if (groupingFieldMeta?.verboseName) return groupingFieldMeta.verboseName;
    const root = groupingField.replace(/__/g, ".").split(".")[0];
    return root || groupingField;
  }, [groupingField, groupingFieldMeta?.verboseName]);

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
        label: resolveGroupingLabel(row, groupingField, {
          fieldLabel: groupingFieldLabel,
          isBoolean: groupingFieldMeta?.isBoolean,
        }),
        rows: [row],
      });
    });

    return Array.from(groups.values());
  }, [data, groupingField, groupingFieldLabel, groupingFieldMeta?.isBoolean]);

  const displayedRows = data.slice(0, visibleCount);
  const displayedGroups = useMemo(() => {
    if (!groupedData) return null;

    let remaining = visibleCount;
    const groups: Array<{
      key: string;
      label: string;
      rows: Record<string, unknown>[];
    }> = [];

    groupedData.forEach((group) => {
      if (remaining <= 0) return;
      const rows = group.rows.slice(0, remaining);
      remaining -= rows.length;
      if (rows.length > 0) {
        groups.push({ ...group, rows });
      }
    });

    return groups;
  }, [groupedData, visibleCount]);

  const hasMore = visibleCount < data.length;
  const pdfPreviewEnabled = pdfPreview?.enabled ?? false;
  const titleField = visibleColumns[0];
  const otherFields = visibleColumns.slice(1);
  const rowSpacingClass =
    density === "compact"
      ? "gap-1 py-1"
      : density === "spacious"
        ? "gap-3 py-2"
        : "gap-2 py-1.5";
  const valueClass = wrapCells
    ? "text-right break-words"
    : "max-w-[200px] truncate text-right";

  const toggleGroup = (groupKey: string) => {
    setGroupCollapsed({
      ...groupCollapsed,
      [groupKey]: !groupCollapsed[groupKey],
    });
  };

  const openPdfPreview = (pdfUrl: string, fallbackTitle?: string) => {
    setPdfPreviewUrl(pdfUrl);
    setPdfPreviewTitle(
      fallbackTitle || pdfPreview?.title || getPdfLabel(pdfUrl),
    );
  };

  const closePdfPreview = () => {
    setPdfPreviewUrl(null);
    setPdfPreviewTitle("");
  };

  const renderMobileValue = (
    value: unknown,
    field: (typeof metadata.fields)[number],
  ) => {
    if (field.isFile && typeof value === "string") {
      return (
        <ProtectedFileCell
          value={value}
          onPdfPreview={pdfPreviewEnabled ? onTemplatePdfPreview : undefined}
        />
      );
    }

    const renderedValue = formatCellValue(value, field);
    const pdfUrl = pdfPreviewEnabled ? normalizePdfUrl(value) : null;
    if (!pdfUrl || typeof renderedValue !== "string") {
      return renderedValue;
    }

    return (
      <button
        type="button"
        className="max-w-full truncate text-left text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
        onClick={() => openPdfPreview(pdfUrl, renderedValue)}
      >
        {renderedValue}
      </button>
    );
  };

  const renderCardRow = (
    row: Record<string, unknown>,
    index: number,
    keyPrefix?: string,
  ) => {
    const rowId = String(row.id);
    const rowPermissions = row.rowPermissions as
      | RowMutationPermissions
      | undefined;

    return (
      <Card
        key={`${keyPrefix ?? "row"}:${rowId || index}`}
        className="overflow-hidden border-border/20 shadow-sm hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle
                className={cn(
                  "text-sm font-semibold",
                  wrapCells ? "" : "truncate",
                )}
              >
                {titleField
                  ? renderMobileValue(
                      resolveFieldValue(row, titleField),
                      titleField,
                    )
                  : metadata?.verboseName || "Element"}
              </CardTitle>
              {showIdDescription ? (
                <CardDescription className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                  ID: {rowId}
                </CardDescription>
              ) : null}
            </div>
            <div className="shrink-0">
              <RowActions
                row={row}
                data={data}
                refetch={refetch}
                permissions={rowPermissions}
                columnActions={columnActions}
                update={update}
                detail={detail}
                onTemplatePdfPreview={onTemplatePdfPreview}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={`grid text-xs px-4 pb-4 ${rowSpacingClass}`}>
          {otherFields.map((field) => (
            <div
              key={field.name}
              className="flex items-start justify-between gap-3 border-b border-border/10 pb-1.5 last:border-0 last:pb-0"
            >
              <span className="font-medium text-muted-foreground/70 text-[11px]">
                {field.verboseName}
              </span>
              <span className={cn(valueClass, "text-foreground/80")}>
                {renderMobileValue(resolveFieldValue(row, field), field)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading && data.length === 0) {
    return (
      <div className="space-y-2.5 md:hidden">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/20">
            <CardHeader className="px-4 pt-4 pb-2">
              <Skeleton className="h-4 w-[160px] " />
              <Skeleton className="h-3 w-[100px] mt-1" />
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              <Skeleton className="h-3.5 w-full " />
              <Skeleton className="h-3.5 w-full " />
              <Skeleton className="h-3.5 w-3/4 " />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-border/20 bg-muted/20 p-8 text-center md:hidden">
        <p className="text-sm font-medium text-muted-foreground/60">
          {emptyState ?? "Aucun r\u00e9sultat trouv\u00e9"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {displayedGroups
        ? displayedGroups.map((group) => {
            const collapsed = !!groupCollapsed[group.key];
            return (
              <div key={`group:${group.key}`} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between border bg-muted/30 px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold text-foreground/90">
                      {group.label}
                    </span>
                  </div>
                  <span className="bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {group.rows.length}
                  </span>
                </button>
                {!collapsed
                  ? group.rows.map((row, index) =>
                      renderCardRow(row, index, group.key),
                    )
                  : null}
              </div>
            );
          })
        : displayedRows.map((row, index) => renderCardRow(row, index))}

      {hasMore ? (
        <Button
          variant="outline"
          className="w-full border-border/20 text-xs font-semibold h-9"
          onClick={() =>
            setVisibleCount((current) =>
              Math.min(current + MOBILE_BATCH_SIZE, data.length),
            )
          }
        >
          Afficher plus ({data.length - visibleCount} restants)
        </Button>
      ) : null}
      {pdfPreviewEnabled && pdfPreviewUrl ? (
        <Dialog open onOpenChange={closePdfPreview}>
          <DialogContent className="flex h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden border-border/30 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
            <DialogHeader className="border-b border-border/20 px-6 py-4">
              <DialogTitle>{pdfPreviewTitle || "PDF preview"}</DialogTitle>
              <DialogDescription>
                {pdfPreview?.description ||
                  "Preview the PDF without leaving the current page."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <a
                href={pdfPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="w-fit text-sm text-primary underline underline-offset-4"
              >
                {pdfPreview?.openInNewTabLabel || "Open in a new tab"}
              </a>
              <iframe
                key={pdfPreviewUrl}
                src={pdfPreviewUrl}
                title={pdfPreviewTitle || "PDF preview"}
                className="min-h-0 flex-1 rounded-md border border-border/20 bg-background"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
