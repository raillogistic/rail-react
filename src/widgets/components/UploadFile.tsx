import React from "react";
import { AlertCircle, FileImage, Loader2, Upload, X } from "lucide-react";
import { useModelUpdateMutation } from "@/shared/api/graphql/graphql/mutations/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";
import { Button } from "@/shared/ui/kit/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { Input } from "@/shared/ui/kit/input";
import { toast } from "@/shared/ui/kit/sonner";
import { cn } from "@/shared/utils";

export type UploadFileProps = {
  model: string;
  id: string | number;
  field: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  menu?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onUploaded?: (payload: Record<string, unknown>) => void;
};

function getPayloadErrors(payload: Record<string, unknown> | null): string[] {
  const rawErrors = payload?.errors;
  if (!Array.isArray(rawErrors)) {
    return [];
  }

  return rawErrors
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as { message?: unknown; field?: unknown };
      const message = String(record.message ?? "").trim();
      const field = String(record.field ?? "").trim();
      if (!message) {
        return null;
      }
      return field ? `${field}: ${message}` : message;
    })
    .filter((message): message is string => Boolean(message));
}

function isImageFile(file: File | null): boolean {
  return Boolean(file?.type?.startsWith("image/"));
}

function renderIcon(icon: React.ReactNode, className: string) {
  if (React.isValidElement<{ className?: string }>(icon)) {
    return React.cloneElement(icon, {
      className: cn(className, icon.props.className),
    });
  }

  return <span className={className}>{icon}</span>;
}

export function UploadFile({
  model,
  id,
  field,
  title,
  description,
  icon,
  menu = false,
  accept,
  disabled = false,
  className,
  triggerClassName,
  confirmLabel = "Enregistrer",
  cancelLabel = "Annuler",
  onUploaded,
}: UploadFileProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const modalTitle = title?.trim() || "Televerser un fichier";
  const modalDescription =
    description?.trim() ||
    "Selectionnez un fichier puis confirmez pour l'enregistrer sur cet element.";
  const hasSelectedImage = isImageFile(selectedFile);
  const triggerIcon = renderIcon(icon ?? <Upload />, "size-4 shrink-0");
  const headerIcon = renderIcon(icon ?? <Upload />, "size-5");

  const { execute, loading } = useModelUpdateMutation({
    model,
    selection: "id",
    skipModelForm: true,
    apollo: {
      errorPolicy: "all",
    },
  });

  React.useEffect(() => {
    if (!selectedFile || !hasSelectedImage) {
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [hasSelectedImage, selectedFile]);

  const resetState = React.useCallback(() => {
    setSelectedFile(null);
    setLocalError(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen && !loading) {
        resetState();
      }
    },
    [loading, resetState],
  );

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setSelectedFile(file);
      setLocalError(null);
    },
    [],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedFile(null);
    setLocalError(null);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!selectedFile) {
      setLocalError("Selectionnez un fichier avant de continuer.");
      return;
    }

    setLocalError(null);

    try {
      const result = await execute({
        id,
        input: {
          [field]: selectedFile,
        },
      });

      const payload =
        ((result.data?.response as Record<string, unknown> | undefined) ??
          null);

      if (!payload?.ok) {
        const messages = getPayloadErrors(payload);
        const message =
          messages[0] ?? "Le fichier n'a pas pu etre enregistre.";
        setLocalError(message);
        toast.error(message);
        return;
      }

      toast.success("Fichier enregistre.");
      onUploaded?.(payload);
      resetState();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Le fichier n'a pas pu etre enregistre.";
      setLocalError(message);
      toast.error(message);
    }
  }, [execute, field, id, onUploaded, resetState, selectedFile]);

  return (
    <>
      {menu ? (
        <DropdownMenuItem
          className={cn("gap-2", triggerClassName, className)}
          disabled={disabled}
          onSelect={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
        >
          {triggerIcon}
          {modalTitle}
        </DropdownMenuItem>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn("gap-2", triggerClassName, className)}
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          {triggerIcon}
          {modalTitle}
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg rounded-2xl border border-border/60 p-0 overflow-hidden">
          <DialogHeader className="border-b border-border/40 bg-muted/20 px-6 py-5">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {headerIcon}
              </span>
              {modalTitle}
            </DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <label
              htmlFor={`upload-${model}-${field}-${id}`}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center transition-colors",
                "hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileImage className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {selectedFile ? "Changer le fichier" : "Choisir un fichier"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept ? `Formats acceptés: ${accept}` : "Tous les fichiers sont acceptés."}
                </p>
              </div>
              <Input
                id={`upload-${model}-${field}-${id}`}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {selectedFile ? (
              <div className="space-y-4 rounded-2xl border border-border/50 bg-background px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full"
                    onClick={clearSelection}
                    disabled={loading}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/10">
                    <img
                      src={previewUrl}
                      alt={selectedFile.name}
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {localError ? (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="size-4" />
                <AlertTitle>Echec de l'enregistrement</AlertTitle>
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter className="border-t border-border/40 bg-muted/10 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || disabled}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const UploadButton = UploadFile;

export default UploadFile;
