/**
 * @file ModelTablePdfPreviewDialog.tsx
 * @description Composant de dialogue pour la prévisualisation des PDF du ModelTable.
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 */
import { RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";

type ModelTablePdfPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pdfUrl: string;
  pdfSrc: string;
  openInNewTabLabel: string;
  refreshLabel: string;
  refreshPendingLabel: string;
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
};

export function ModelTablePdfPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  pdfUrl,
  pdfSrc,
  openInNewTabLabel,
  refreshLabel,
  refreshPendingLabel,
  refreshing,
  onRefresh,
}: ModelTablePdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden border border-border/50 bg-background p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border/20 px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-sm text-primary underline underline-offset-4"
            >
              {openInNewTabLabel}
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void onRefresh()}
              disabled={refreshing}
            >
              <RotateCw className="h-3.5 w-3.5" />
              {refreshing ? refreshPendingLabel : refreshLabel}
            </Button>
          </div>
          <iframe
            key={pdfSrc}
            src={pdfSrc}
            title={title}
            className="min-h-0 flex-1 rounded-md border border-border/20 bg-background"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
