/**
 * Renders a single form section with grid layout, optional card wrapper,
 * and accordion support.
 *
 * @module form/renderers/SectionRenderer
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { Card } from "@/shared/ui/kit/card";
import { cn } from "@/shared/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/shared/ui/kit/separator";
import type { FormSectionConfig } from "../types/schema";
import { FieldRenderer } from "./FieldRenderer";
import { buildResponsiveGridClass } from "./utils";

/** Props for the SectionRenderer component. */
export type SectionRendererProps<TValues> = {
  section: FormSectionConfig;
  form: UseFormReturn<TValues>;
  columns: number;
  defaultColSpan?: number;
  showHeaders: boolean;
  variant: "default" | "compact" | "popup";
  hiddenFields?: Set<string>;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
};

/**
 * Safely renders an icon component (element, component, or forwardRef).
 * Returns `null` when Icon is falsy.
 */
const renderIcon = (Icon: any, className: string) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) {
    return React.cloneElement(Icon as React.ReactElement<any>, {
      className: cn(className, (Icon.props as any)?.className),
    });
  }
  if (
    typeof Icon === "function" ||
    (typeof Icon === "object" && (Icon as any).$$typeof)
  ) {
    return <Icon className={className} />;
  }
  return null;
};

/**
 * Renders a section: an optional header (title + description),
 * a responsive field grid, with optional card or accordion wrapping.
 */
export const SectionRenderer = <TValues extends Record<string, any>>({
  section,
  form,
  columns,
  defaultColSpan,
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
    ? "overflow-hidden rounded-xl border border-border/40 shadow-sm"
    : "space-y-3";
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
        "grid gap-x-6",
        responsiveClasses,
        ui.bodyClassName,
        isPopup ? "gap-y-0 px-0" : "gap-y-2",
      )}
    >
      {visibleFields.map((field) => {
        const span =
          field.colSpan ?? (field.type === "list" ? columns : defaultColSpan);
        return (
          <FieldRenderer
            key={field.name}
            config={field}
            path={field.name}
            form={form}
            colSpan={span}
            defaultColSpan={defaultColSpan}
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
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {renderIcon(section.icon, "size-3.5")}
            </div>
          )}
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {section.title}
          </h3>
        </div>
      ) : null}
      {section.description ? (
        <p className="text-sm text-muted-foreground/70 pl-[calc(1.75rem+0.625rem)]">
          {section.description}
        </p>
      ) : null}
      {!cardEnabled && <Separator className="mt-2 opacity-30" />}
    </div>
  ) : null;

  // ── Non-accordion layout ─────────────────────────────────────────────
  if (!accordionEnabled) {
    return (
      <Wrapper
        className={cn(
          wrapperClass,
          !cardEnabled && "border-0 bg-transparent p-0",
          ui.className,
          isPopup ? "p-0" : null,
        )}
      >
        {cardEnabled && headerContent && (
          <div className="border-b border-border/30 bg-muted/20 px-5 py-3.5">
            {headerContent}
          </div>
        )}
        <div className={cn(cardEnabled ? "p-5" : "pt-1")}>
          {!cardEnabled && headerContent}
          {fieldsGrid}
        </div>
      </Wrapper>
    );
  }

  // ── Accordion layout ─────────────────────────────────────────────────
  const accordionTitle = section.title ?? section.id ?? "Section";

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-border/40 bg-card/30 transition-all duration-200 hover:border-border/60",
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
              "flex w-full items-center justify-between px-5 py-3.5 text-left outline-none transition-colors",
              "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset",
              accordionOpen && "border-b border-border/30 bg-muted/15",
            )}
          >
            <div className="flex items-center gap-2.5">
              {section.icon && (
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-colors",
                    accordionOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {renderIcon(section.icon, "size-3.5")}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">
                  {accordionTitle}
                </span>
                {section.description && !accordionOpen && (
                  <span className="text-xs text-muted-foreground/60 line-clamp-1">
                    {section.description}
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-md transition-all duration-200",
                accordionOpen
                  ? "bg-primary/10 text-primary rotate-180"
                  : "bg-muted/50 text-muted-foreground rotate-0",
              )}
            >
              <ChevronDown className="size-3.5" />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down",
          )}
        >
          <div className="p-5">
            {section.description && (
              <p className="mb-5 text-sm text-muted-foreground/70">
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
