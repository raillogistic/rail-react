import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  TableRow as ShadcnTableRow,
  TableCell,
} from "./TableFrame";
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
import { GET_MODEL_SCHEMA } from "../queries";
import { MutationSchema } from "../types";

function RowActions({ rowId }: { rowId: string }) {
  const { app, model, metadata } = useMetadata();
  const { refresh } = useTable();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const baseMutations = metadata?.mutations ?? [];
  const hasRowActions = baseMutations.some((mutation) => {
    const type = normalizeMutationType(mutation);
    return type === "update" || type === "delete";
  });

  const { data: instanceData, loading: instanceLoading } = useQuery(
    GET_MODEL_SCHEMA,
    {
      variables: { app, model, objectId: rowId },
      skip: !hasRowActions || !rowId,
    },
  );

  const instanceMutations =
    (instanceData?.modelSchema?.mutations as MutationSchema[] | undefined) ??
    baseMutations;

  const deleteMutation = findMutation(instanceMutations, "delete");
  const updateMutation = findMutation(instanceMutations, "update");

  const canDelete = !!deleteMutation?.allowed;
  const canEdit = !!updateMutation?.allowed;

  const deleteMutationName = deleteMutation?.name || `delete${model}`;
  const deleteDocument = useMemo(
    () => gql`
        mutation ${deleteMutationName}($id: ID!) {
          response: ${deleteMutationName}(id: $id) {
            ok
            errors { field message }
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
        toast.success(`${metadata?.verboseName ?? "Record"} deleted.`);
        refresh();
      } else {
        const message =
          result.data?.response?.errors
            ?.map((error: { message?: string }) => error?.message)
            .filter(Boolean)
            .join(", ") || "Delete failed.";
        toast.error(message);
      }
    } catch (error) {
      console.error("Failed to delete record", error);
      const message =
        error instanceof Error ? error.message : "Delete failed.";
      toast.error(message);
    } finally {
      setConfirmOpen(false);
    }
  };

  if (!hasRowActions) {
    return null;
  }

  if (instanceLoading) {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" disabled>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" disabled>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!canEdit && !canDelete) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {canEdit && (
        <Button size="sm" variant="ghost" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Delete"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {metadata?.verboseName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The record will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export function TableRows() {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    rowSelection,
    setRowSelection,
  } = useTable();

  if (!metadata) return null;

  const visibleColumns = columnOrder
    .map((colId) => metadata.fields.find((f) => f.name === colId))
    .filter((f) => f && columnVisibility[f.name]);

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
          Loading...
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
          No results.
        </TableCell>
      </ShadcnTableRow>
    );
  }

  return (
    <>
      {data.map((row) => {
        const rowId = String(row.id);
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
              aria-label="Select row"
            />
          </TableCell>

          {/* Data Cells */}
          {visibleColumns.map((field) => (
            <TableCell key={field!.name}>
              {formatCellValue(row[field!.name], field!)}
            </TableCell>
          ))}

          {/* Actions Cell */}
          <TableCell className="sticky right-0 bg-background">
            <RowActions rowId={rowId} />
          </TableCell>
        </ShadcnTableRow>
      )})}
    </>
  );
}
