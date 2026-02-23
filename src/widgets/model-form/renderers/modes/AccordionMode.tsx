/**
 * Accordion mode: renders each section as a collapsible panel.
 *
 * Replaces the old AccordionSectionsForm component.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";
import type { FormSectionConfig } from "../../types/schema";
import type { FormLayoutMode } from "../../types/layout";
import { SectionRenderer } from "../SectionRenderer";

type AccordionConfig = Extract<FormLayoutMode, { type: "accordion" }>;

export type AccordionModeProps<TValues> = {
  sections: FormSectionConfig[];
  form: UseFormReturn<TValues>;
  columns: number;
  variant: "default" | "compact" | "popup";
  config: AccordionConfig;
  hiddenFields?: Set<string>;
  hiddenSections?: Set<string>;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
};

const renderIcon = (Icon: any, className: string) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) {
    return React.cloneElement(Icon as React.ReactElement, {
      className: cn(className, (Icon.props as any)?.className),
    });
  }
  if (typeof Icon === "function" || (typeof Icon === "object" && (Icon as any).$$typeof)) {
    return <Icon className={className} />;
  }
  return null;
};

export const AccordionMode = <TValues extends Record<string, any>>({
  sections,
  form,
  columns,
  variant,
  config,
  hiddenFields,
  hiddenSections,
  globalReadOnly,
  globalDisabled,
}: AccordionModeProps<TValues>) => {
  const visibleSections = sections.filter((section, index) => {
    const sectionId = section.id ?? `__section_${index}`;
    return !hiddenSections?.has(sectionId);
  });

  const initialExpanded = React.useMemo<Set<string>>(() => {
    const defaultExp = config.defaultExpanded ?? "first";
    const set = new Set<string>();

    if (defaultExp === "all") {
      visibleSections.forEach((s, i) => set.add(s.id ?? `__section_${i}`));
    } else if (defaultExp === "first") {
      const firstId =
        visibleSections[0]?.id ?? (visibleSections.length ? "__section_0" : "");
      if (firstId) set.add(firstId);
    } else if (Array.isArray(defaultExp)) {
      defaultExp.forEach((id) => set.add(id));
    }

    return set;
  }, [config.defaultExpanded, visibleSections]);

  const [expanded, setExpanded] = React.useState(initialExpanded);

  const toggleSection = React.useCallback(
    (sectionId: string, open: boolean) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (open) {
          if (!config.allowMultiple) next.clear();
          next.add(sectionId);
        } else {
          next.delete(sectionId);
        }
        return next;
      });
    },
    [config.allowMultiple],
  );

  return (
    <div className="flex flex-col gap-3">
      {visibleSections.map((section, index) => {
        const sectionId = section.id ?? `__section_${index}`;
        const isOpen = expanded.has(sectionId);
        const title = section.title ?? section.id ?? `Section ${index + 1}`;

        return (
          <div
            key={sectionId}
            className={cn(
              "group overflow-hidden rounded-xl border border-border/60 bg-card/30 transition-all duration-300 hover:border-border",
              isOpen && "bg-card shadow-sm border-border"
            )}
          >
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => toggleSection(sectionId, open)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between px-6 py-4 text-left outline-none transition-colors",
                    "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20",
                    isOpen && "border-b bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {section.icon && (
                      <div className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        isOpen ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {renderIcon(section.icon, "size-4")}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-bold tracking-tight">{title}</span>
                      {section.description && !isOpen && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {section.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "flex size-6 items-center justify-center rounded-full transition-all duration-300",
                    isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-muted text-muted-foreground rotate-0"
                  )}>
                    <ChevronDown className="size-4" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent
                className="overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
              >
                <div className="p-6">
                  <SectionRenderer
                    section={{ ...section, ui: { ...section.ui, accordion: false, card: false } }}
                    form={form}
                    columns={section.columns ?? columns}
                    showHeaders={true}
                    variant={variant}
                    hiddenFields={hiddenFields}
                    globalReadOnly={globalReadOnly}
                    globalDisabled={globalDisabled}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};
