import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { gql, useMutation } from "@apollo/client";
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
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import {
  formatCellValue,
  findMutation,
  normalizeMutationType,
  resolveGroupingKey,
  resolveGroupingLabel,
} from "../utils";
import type {
  BaseModelTableColumnDef,
  BaseModelTableRefetch,
  FieldSchema,
  RowMutationPermissions,
} from "../types";

function RowActions({
  rowId,
  permissions,
}: {
  rowId: string;
  permissions?: RowMutationPermissions | null;
}) {
  const { model, metadata } = useMetadata();
  const { refresh } = useTable();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const baseMutations = metadata?.mutations ?? [];
  const baseDeleteMutation = findMutation(baseMutations, "delete");
  const baseUpdateMutation = findMutation(baseMutations, "update");
  const baseCanDelete = !!baseDeleteMutation?.allowed;
  const baseCanEdit = !!baseUpdateMutation?.allowed;
  const hasRowActions = baseMutations.some((mutation) => {
    const type = normalizeMutationType(mutation);
    return type === "update" || type === "delete";
  });
  const canDelete = baseCanDelete && (permissions?.canDelete ?? true);
  const canEdit = baseCanEdit && (permissions?.canUpdate ?? true);

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

  if (!hasRowActions) {
    return null;
  }

  if (!canEdit && !canDelete) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <Button size="icon" variant="ghost" aria-label="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
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
      )}
    </div>
  );
}

export function TableRows({
  loadingText,
  emptyState,
  columns,
  enableSelection,
  refetch,
  performance,
  scrollContainerRef,
  infiniteMode,
}: {
  loadingText?: string;
  emptyState?: string;
  columns?: BaseModelTableColumnDef[];
  enableSelection?: boolean;
  refetch?: BaseModelTableRefetch;
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

  const resolveValue = (row: Record<string, unknown>, accessor: string) =>
    accessor.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
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
    density === "compact" ? 40 : density === "spacious" ? 56 : 48;
  const cellPadding =
    density === "compact"
      ? "py-1 px-3"
      : density === "spacious"
        ? "py-3 px-3.5"
        : "py-2 px-3";
  const cellTextClass = wrapCells
    ? "whitespace-normal break-words leading-snug"
    : "max-w-[24rem] overflow-hidden text-ellipsis whitespace-nowrap";

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
    const rowStripe = rowIndex % 2 === 0 ? "even" : "odd";

    return (
      <ShadcnTableRow
        key={rowId}
        data-state={isSelected ? "selected" : undefined}
        data-row-stripe={rowStripe}
        className={cn(
          "border-b border-muted/40 transition-colors group",
          isSelected && "ring-1 ring-primary/40",
          density === "compact" ? "h-10" : density === "spacious" ? "h-14" : "h-12",
        )}
        style={
          {
            backgroundColor: "var(--row-bg)",
          } as React.CSSProperties
        }
      >
        {enableSelection ? (
          <TableCell
            className={cn(cellPadding, "px-2 text-left transition-colors table-first-column")}
          >
            <Checkbox
              checked={!!rowSelection[rowId]}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                handleRowSelect(rowId, checked === true)
              }
              aria-label="Selectionner la ligne"
            />
          </TableCell>
        ) : null}

        {visibleColumns.map((field) => {
          if ("accessor" in field) {
            const value = resolveValue(row, field.accessor);
            const isSimpleAccessor = !field.accessor.includes(".");
            const metaField = isSimpleAccessor
              ? fieldLookup.get(field.accessor)
              : undefined;

            return (
              <TableCell key={field.id} className={cellPadding}>
                <div className={cellTextClass}>
                  {field.render
                    ? field.render(value, row, {
                        accessor: field.accessor,
                        columnId: field.id,
                        data,
                        refetch,
                      })
                    : metaField
                      ? formatCellValue(value, metaField)
                      : formatFallbackValue(value)}
                </div>
              </TableCell>
            );
          }

          return (
            <TableCell key={field.name} className={cellPadding}>
              <div className={cellTextClass}>
                {formatCellValue(row[field.name], field)}
              </div>
            </TableCell>
          );
        })}

        <TableCell
          className={cn(
            cellPadding,
            "w-px shrink-0 px-2 text-right sticky right-0 z-10 transition-colors table-last-column table-sticky-cell",
          )}
        >
          <RowActions rowId={rowId} permissions={rowPermissions} />
        </TableCell>
      </ShadcnTableRow>
    );
  };

  if (loading && data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + fixedColumnCount}
          className="h-24"
        >
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>{loadingText ?? "Chargement..."}</span>
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
          className="h-24"
        >
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            {emptyState ?? "Aucun resultat."}
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
              <ShadcnTableRow className="bg-muted/40">
                <TableCell
                  colSpan={visibleColumns.length + fixedColumnCount}
                  className="px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => toggleGroup(group.key)}
                      >
                        {collapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-2 font-medium">
                        {group.label}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {group.rows.length} element(s)
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
              className="py-3 text-center text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de lignes supplementaires...
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
            className="py-3 text-center text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de lignes supplementaires...
            </span>
          </TableCell>
        </ShadcnTableRow>
      ) : null}
    </>
  );
}


