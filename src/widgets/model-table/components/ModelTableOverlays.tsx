import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/kit/drawer";
import { Button } from "@/shared/ui/kit/button";
import DynamicForm from "@/widgets/model-form/inputs/form";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import { cn } from "@/shared/utils";

/**
 * Props shared by modal/drawer overlays.
 * @property mode - Overlay variant ("modal" or "drawer").
 * @property open - Whether the overlay is visible.
 * @property onOpenChange - Callback invoked when the overlay opens or closes.
 * @property title - Title displayed in the header.
 * @property width - Optional explicit width.
 * @property height - Optional explicit height.
 * @property drawerDirection - Drawer opening direction when mode is "drawer".
 * @property children - Content rendered inside the overlay.
 */
export type OverlayProps = {
  mode: "modal" | "drawer";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
};

/**
 * Generic overlay that renders either a Dialog or a Drawer based on mode.
 */
export function FormOverlay({
  mode,
  open,
  onOpenChange,
  title,
  width,
  height,
  drawerDirection = "right",
  children,
}: OverlayProps) {
  if (mode === "modal") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("max-w-3xl", width ? "max-w-none" : undefined)}
          style={{
            width,
            maxWidth: width,
            height,
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={drawerDirection}
    >
      <DrawerContent
        className={cn("p-0", width ? "max-w-none" : undefined)}
        style={{
          width: width || "50vw",
          maxWidth: width || "50vw",
          height,
        }}
      >
        <DrawerHeader className="px-4 pt-4">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Confirmation dialog used for destructive actions like delete.
 */
export type DeleteDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  loading = false,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Suppression..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Props for the dialog used to run custom row actions.
 * @property open - Whether the dialog is open.
 * @property mode - Display mode ("confirm" or "form").
 * @property actionMeta - Metadata describing the mutation.
 * @property schema - Optional schema when the action requires user input.
 * @property defaults - Default values injected into the form.
 * @property submitting - Whether the action is currently executing.
 * @property onCancel - Called when the dialog is closed without executing.
 * @property onExecute - Called with optional payload when user confirms/submit.
 */
export type ActionDialogProps = {
  open: boolean;
  mode: "confirm" | "form" | null;
  actionMeta: {
    name: string;
    description?: string | null;
    action?: string | Record<string, unknown> | null;
  } | null;
  schema?: FormSchema | null;
  defaults?: Record<string, unknown>;
  submitting?: boolean;
  onCancel: () => void;
  onExecute: (payload?: Record<string, unknown>) => void;
};

export function ActionDialog({
  open,
  mode,
  actionMeta,
  schema,
  defaults,
  submitting = false,
  onCancel,
  onExecute,
}: ActionDialogProps) {
  if (!open || !actionMeta || !mode) return null;
  const actionPayload =
    typeof actionMeta.action === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(actionMeta.action);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
              ? (parsed as Record<string, unknown>)
              : {};
          } catch {
            return {};
          }
        })()
      : actionMeta.action && typeof actionMeta.action === "object"
        ? actionMeta.action
        : {};
  const severity =
    (actionPayload.severity as string | undefined) === "destructive"
      ? "destructive"
      : "default";
  const confirmLabel =
    (actionPayload.confirm_label as string | undefined) ?? "Confirmer";
  const cancelLabel =
    (actionPayload.cancel_label as string | undefined) ?? "Annuler";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader className={mode === "confirm" ? undefined : "sr-only"}>
          <DialogTitle>
            {(actionPayload.title as string | undefined) ??
              actionMeta.description ??
              actionMeta.name}
          </DialogTitle>
        </DialogHeader>
        {mode === "confirm" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {(actionPayload.message as string | undefined) ??
                (actionMeta.description as string | undefined) ??
                "Voulez-vous exécuter cette action ?"}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel} disabled={submitting}>
                {cancelLabel}
              </Button>
              <Button variant={severity} onClick={() => onExecute()} disabled={submitting}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        ) : schema ? (
          <DynamicForm
            key={actionMeta.name}
            schema={schema}
            state={{
              defaultValues: defaults ?? {},
              disableAutoReset: true,
              isLoading: submitting,
            }}
            behavior={{
              onSubmit: (values) => {
                onExecute(values as Record<string, unknown>);
              },
            }}
            actions={{
              submitLabel:
                (actionPayload.submit_label as string | undefined) ??
                "Exécuter",
              resetLabel: cancelLabel,
            }}
            layout={{
              showSectionHeaders: true,
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog that captures client data before printing a PDF template.
 */
export type PrintDialogProps = {
  open: boolean;
  title: string;
  schema: FormSchema;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
};

export function PrintDialog({
  open,
  title,
  schema,
  defaultValues,
  submitLabel = "Imprimer",
  cancelLabel = "Annuler",
  onSubmit,
  onCancel,
}: PrintDialogProps) {
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DynamicForm
          schema={schema}
          state={{
            defaultValues: defaultValues ?? {},
            disableAutoReset: true,
          }}
          behavior={{
            onSubmit: (values) => {
              onSubmit(values);
            },
          }}
          actions={{
            submitLabel,
            resetLabel: cancelLabel,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
