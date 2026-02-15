import React, { useMemo, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import { findMutation, normalizeMutationType } from "../../utils";
import type {
  BaseModelTableColumnActionContext,
  BaseModelTableColumnActionsInput,
  BaseModelTableRefetch,
  RowMutationPermissions,
} from "../../types";

type RowActionsProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown>[];
  refetch?: BaseModelTableRefetch;
  permissions?: RowMutationPermissions | null;
  columnActions?: BaseModelTableColumnActionsInput;
};

export function RowActions({
  row,
  data,
  refetch,
  permissions,
  columnActions,
}: RowActionsProps) {
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
        toast.success(`${metadata?.verboseName ?? "Enregistrement"} supprimé.`);
        refresh();
      } else {
        const message =
          result.data?.response?.errors
            ?.map((error: { message?: string }) => error?.message)
            .filter(Boolean)
            .join(", ") || "Échec de suppression.";
        toast.error(message);
      }
    } catch (error) {
      console.error("Failed to delete record", error);
      const message = error instanceof Error ? error.message : "Échec de suppression.";
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
          : "Échec de l'action personnalisée.";
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
              Cette action est irréversible. L'enregistrement sera supprimé
              définitivement.
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
