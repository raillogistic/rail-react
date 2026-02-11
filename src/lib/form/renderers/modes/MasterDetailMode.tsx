/**
 * Master-detail mode: split layout with live preview pane.
 *
 * Replaces the old MasterDetailPreviewForm component.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import { LayoutPanelLeft, Eye } from "lucide-react";
import type { FormSectionConfig } from "../../types/schema";
import type { FormLayoutMode } from "../../types/layout";
import { StandardMode } from "./StandardMode";

type MasterDetailConfig<TValues> = Extract<
  FormLayoutMode<TValues>,
  { type: "master-detail" }
>;

export type MasterDetailModeProps<TValues> = {
  sections: FormSectionConfig[];
  form: UseFormReturn<TValues>;
  columns: number;
  variant: "default" | "compact" | "popup";
  config: MasterDetailConfig<TValues>;
  hiddenFields?: Set<string>;
  hiddenSections?: Set<string>;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
};

export const MasterDetailMode = <TValues extends Record<string, any>>({
  sections,
  form,
  columns,
  variant,
  config,
  hiddenFields,
  hiddenSections,
  globalReadOnly,
  globalDisabled,
}: MasterDetailModeProps<TValues>) => {
  const values = useStore(form.store, (state) => state.values as TValues);

  const [left, right] = config.splitRatio ?? [60, 40];
  const gridTemplate = `${left}fr ${right}fr`;

  return (
    <div
      className="grid gap-6 items-start animate-in fade-in duration-500"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <div className="flex flex-col gap-6">
        {config.renderToolbar && (
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-2 shadow-sm">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <LayoutPanelLeft className="size-4" />
                Édition
             </div>
             {config.renderToolbar({ form })}
          </div>
        )}
        <div className="rounded-xl bg-card/5 p-1">
          <StandardMode
            sections={sections}
            form={form}
            columns={columns}
            showHeaders
            variant={variant}
            hiddenFields={hiddenFields}
            hiddenSections={hiddenSections}
            globalReadOnly={globalReadOnly}
            globalDisabled={globalDisabled}
          />
        </div>
      </div>
      
      <div className="sticky top-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Eye className="size-4 text-primary" />
          Aperçu en direct
        </div>
        <Card className={cn(
          "overflow-hidden border-border/40 bg-background/50 shadow-xl backdrop-blur-sm transition-all duration-300",
          config.previewClassName
        )}>
          <div className="p-6">
            {config.renderPreview(values)}
          </div>
        </Card>
      </div>
    </div>
  );
};
