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
type ModelTableDialogsProps<
 TSource extends object = Record<string, unknown>,
> = ModelTableDialogsSlotProps<TSource>;

/**
 * Renders dialog overlays required by the composed content shell.
 */
export function ModelTableDialogs<
 TSource extends object = Record<string, unknown>,
>({ controller }: ModelTableDialogsProps<TSource>) {
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
 <ModelForm<TSource> {...controller.createFormProps} />
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
