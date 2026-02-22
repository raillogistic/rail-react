import React, { Suspense, lazy } from "react";
import type { ModelTableDialogsSlotProps } from "./types";

const PrintDialog = lazy(() =>
  import("../ModelTableOverlays").then((module) => ({
    default: module.PrintDialog,
  })),
);

/**
 * Props for the default dialogs slot.
 */
type ModelTableDialogsProps = ModelTableDialogsSlotProps;

/**
 * Renders dialog overlays required by the composed content shell.
 */
export function ModelTableDialogs({ controller }: ModelTableDialogsProps) {
  return (
    <Suspense fallback={null}>
      <PrintDialog
        open={controller.printDialogOpen}
        title={controller.printDialogTitle}
        schema={controller.printDialogSchema}
        submitLabel={controller.printDialogSubmitLabel}
        cancelLabel="Annuler"
        onCancel={controller.closePrintDialog}
        onSubmit={controller.submitPrintDialog}
      />
    </Suspense>
  );
}
