import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { gql, useMutation } from "@apollo/client";
import { TableRow as ShadcnTableRow, TableCell } from "./TableFrame";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Button } from "@/lib/components/ui/button";
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
import { formatCellValue, findMutation, normalizeMutationType } from "../utils";
import type { BaseModelTableColumnDef, RowMutationPermissions } from "../types";

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
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {canEdit && (
        <Button size="sm" variant="ghost" aria-label="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
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
}: {
  loadingText?: string;
  emptyState?: string;
  columns?: BaseModelTableColumnDef[];
}) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    rowSelection,
    setRowSelection,
  } = useTable();

  if (!metadata && !columns) return null;

  const fieldLookup = useMemo(() => {
    if (!metadata) return new Map<string, typeof metadata.fields[number]>();
    const lookup = new Map<string, typeof metadata.fields[number]>();
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
    if (value === null || value === undefined) return "—";
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

  const visibleColumns = (() => {
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
      .filter((f) => f && columnVisibility[f.name]);
  })();

  const handleRowSelect = (rowId: string, checked: boolean) => {
    setRowSelection({
      ...rowSelection,
      [rowId]: checked,
    });
  };

  if (loading && data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + 2}
          className="h-24 text-center"
        >
          {loadingText ?? "Chargement..."}
        </TableCell>
      </ShadcnTableRow>
    );
  }

  if (data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + 2}
          className="h-24 text-center"
        >
          {emptyState ?? "Aucun resultat."}
        </TableCell>
      </ShadcnTableRow>
    );
  }

  return (
    <>
      {data.map((row) => {
        const rowId = String(row.id);
        const rowPermissions = (row as Record<string, unknown>)
          .rowPermissions as RowMutationPermissions | undefined;
        return (
          <ShadcnTableRow
            key={rowId}
            data-state={rowSelection[rowId] && "selected"}
          >
            {/* Selection Cell */}
            <TableCell>
              <Checkbox
                checked={!!rowSelection[rowId]}
                onCheckedChange={(checked) =>
                  handleRowSelect(rowId, checked as boolean)
                }
                aria-label="Selectionner la ligne"
              />
            </TableCell>

            {/* Data Cells */}
            {visibleColumns.map((field) => {
              if ("accessor" in field) {
                const value = resolveValue(row, field.accessor);
                const isSimpleAccessor = !field.accessor.includes(".");
                const metaField = isSimpleAccessor
                  ? fieldLookup.get(field.accessor)
                  : undefined;

                return (
                  <TableCell key={field.id}>
                    {field.render
                      ? field.render(value, row, {
                          accessor: field.accessor,
                          columnId: field.id,
                        })
                      : metaField
                        ? formatCellValue(value, metaField)
                        : formatFallbackValue(value)}
                  </TableCell>
                );
              }

              return (
                <TableCell key={field!.name}>
                  {formatCellValue(row[field!.name], field!)}
                </TableCell>
              );
            })}

            {/* Actions Cell */}
            <TableCell className="sticky right-0 bg-background">
              <RowActions rowId={rowId} permissions={rowPermissions} />
            </TableCell>
          </ShadcnTableRow>
        );
      })}
    </>
  );
}
