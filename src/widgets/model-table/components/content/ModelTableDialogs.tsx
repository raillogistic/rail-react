import React, { Suspense, lazy } from "react";
import { ModelForm } from "@/widgets/model-form";
import type { ModelTableDialogsSlotProps } from "./types";
import { FormOverlay } from "../ModelTableOverlays";

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
    <>
      {controller.createFormProps ? (
        <FormOverlay
          mode={controller.createOverlayMode}
          open={controller.createDialogOpen}
          onOpenChange={controller.setCreateDialogOpen}
          title={controller.createOverlayTitle}
          width={controller.createOverlayWidth}
          height={controller.createOverlayHeight}
          drawerDirection={controller.createOverlayDrawerDirection}
        >
          <ModelForm<Record<string, unknown>> {...controller.createFormProps} />
        </FormOverlay>
      ) : null}

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
    </>
  );
}
