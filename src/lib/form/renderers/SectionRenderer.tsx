/**
 * Renders a single form section with grid layout, optional card wrapper,
 * and accordion support.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/lib/components/ui/separator";
import type { FormSectionConfig } from "../types/schema";
import { FieldRenderer } from "./FieldRenderer";
import { buildResponsiveGridClass } from "./utils";

export type SectionRendererProps<TValues> = {
  section: FormSectionConfig;
  form: UseFormReturn<TValues>;
  columns: number;
  showHeaders: boolean;
  variant: "default" | "compact" | "popup";
  hiddenFields?: Set<string>;
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

export const SectionRenderer = <TValues extends Record<string, any>>({
  section,
  form,
  columns,
  showHeaders,
  variant,
  hiddenFields,
  globalReadOnly,
  globalDisabled,
}: SectionRendererProps<TValues>) => {
  const responsiveClasses = React.useMemo(
    () => buildResponsiveGridClass(columns),
    [columns],
  );

  const ui = section.ui ?? {};
  const cardEnabled = ui.card ?? false;
  const Wrapper = cardEnabled ? Card : "div";
  const wrapperClass = cardEnabled
    ? "overflow-hidden border-border/50 shadow-sm"
    : "space-y-4";
  const isPopup = variant === "popup" || variant === "compact";

  const accordionEnabled = Boolean(ui.accordion);
  const defaultAccordionOpen = ui.accordionDefaultOpen ?? true;
  const [accordionOpen, setAccordionOpen] =
    React.useState(defaultAccordionOpen);
  const previousDefaultRef = React.useRef(defaultAccordionOpen);

  React.useEffect(() => {
    if (previousDefaultRef.current !== defaultAccordionOpen) {
      previousDefaultRef.current = defaultAccordionOpen;
      setAccordionOpen(defaultAccordionOpen);
    }
  }, [defaultAccordionOpen]);

  const headerVisible = Boolean(
    (section.title || section.description) && showHeaders,
  );

  const visibleFields = React.useMemo(
    () => section.fields.filter((f) => !hiddenFields?.has(f.name) && !f.hidden),
    [section.fields, hiddenFields],
  );

  if (visibleFields.length === 0) return null;

  const fieldsGrid = (
    <div
      className={cn(
        "grid gap-x-6 gap-y-2",
        responsiveClasses,
        ui.bodyClassName,
        isPopup ? "px-0" : null,
      )}
    >
      {visibleFields.map((field) => {
        const span = field.type === "list" ? columns : field.colSpan;
        return (
          <FieldRenderer
            key={field.name}
            config={field}
            path={field.name}
            form={form}
            colSpan={span}
            globalReadOnly={globalReadOnly}
            globalDisabled={globalDisabled}
            hiddenFields={hiddenFields}
          />
        );
      })}
    </div>
  );

  const headerContent = headerVisible ? (
    <div className="flex flex-col gap-1 pb-2">
      {section.title ? (
        <div className="flex items-center gap-2.5">
          {section.icon && (
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {renderIcon(section.icon, "size-4")}
            </div>
          )}
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {section.title}
          </h3>
        </div>
      ) : null}
      {section.description ? (
        <p className="text-sm text-muted-foreground/80 pl-[calc(2rem+0.625rem)]">
          {section.description}
        </p>
      ) : null}
      {!cardEnabled && <Separator className="mt-2 opacity-50" />}
    </div>
  ) : null;

  if (!accordionEnabled) {
    return (
      <Wrapper
        className={cn(
          wrapperClass,
          !cardEnabled && "border-0 shadow-none bg-transparent p-0",
          ui.className,
          isPopup ? "p-0" : null,
        )}
      >
        {cardEnabled && headerContent && (
          <div className="border-b bg-muted/30 px-6 py-4">{headerContent}</div>
        )}
        <div className={cn(cardEnabled ? "p-6" : "pt-2")}>
          {!cardEnabled && headerContent}
          {fieldsGrid}
        </div>
      </Wrapper>
    );
  }

  const accordionTitle = section.title ?? section.id ?? "Section";

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-border/60 bg-card/30 transition-all duration-300 hover:border-border",
        accordionOpen && "bg-card shadow-sm",
        ui.className,
      )}
    >
      <Collapsible
        open={accordionOpen}
        onOpenChange={(open) => setAccordionOpen(open)}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between px-6 py-4 text-left outline-none transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20",
              accordionOpen && "border-b bg-muted/20",
            )}
          >
            <div className="flex items-center gap-3">
              {section.icon && (
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors",
                    accordionOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {renderIcon(section.icon, "size-4")}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight">
                  {accordionTitle}
                </span>
                {section.description && !accordionOpen && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {section.description}
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full transition-all duration-300",
                accordionOpen
                  ? "bg-primary/10 text-primary rotate-180"
                  : "bg-muted text-muted-foreground rotate-0",
              )}
            >
              <ChevronDown className="size-4" />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down",
          )}
        >
          <div className="p-6">
            {section.description && (
              <p className="mb-6 text-sm text-muted-foreground/80">
                {section.description}
              </p>
            )}
            {fieldsGrid}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
