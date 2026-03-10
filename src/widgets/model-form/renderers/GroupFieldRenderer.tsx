import React from "react";
import { cn } from "@/shared/utils";
import type { UseFormReturn } from "@tanstack/react-form";
import type { GroupFieldConfig } from "../types/schema";
import { FieldRenderer } from "./FieldRenderer";
import { buildResponsiveGridClass } from "./utils";
import { Card } from "@/shared/ui/kit/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import { ChevronDown } from "lucide-react";

type GroupFieldRendererProps<TValues> = {
  config: GroupFieldConfig;
  path: string;
  form: UseFormReturn<TValues>;
  colSpan?: number;
  defaultColSpan?: number;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
  hiddenFields?: Set<string>;
};

export const GroupFieldRenderer = <TValues extends Record<string, any>>({
  config,
  path,
  form,
  colSpan,
  defaultColSpan,
  globalReadOnly,
  globalDisabled,
  hiddenFields,
}: GroupFieldRendererProps<TValues>) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const isCollapsible = config.collapsible;

  const gridClass = cn(
    "grid gap-x-4 gap-y-4",
    buildResponsiveGridClass(config.columns ?? 1),
  );

  const variant = config.ui?.variant ?? "default";

  // Base content to render (the grid of fields)
  const content = (
    <div className={gridClass}>
      {config.fields.map((child) => (
        <FieldRenderer
          key={`${path}.${child.name}`}
          config={child}
          path={`${path}.${child.name}`}
          form={form}
          colSpan={child.colSpan ?? defaultColSpan}
          defaultColSpan={defaultColSpan}
          globalReadOnly={globalReadOnly}
          globalDisabled={globalDisabled}
          hiddenFields={hiddenFields}
        />
      ))}
    </div>
  );

  // If card variant
  if (variant === "card") {
    return (
      <Card
        className={cn(
          "overflow-hidden  border-border/40  transition-all hover:",
          config.ui?.className,
        )}
        style={
          colSpan
            ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
            : undefined
        }
      >
        {config.label && (
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-semibold tracking-tight">
                {config.label}
              </h4>
              {config.description && (
                <p className="text-[11px] text-muted-foreground">
                  {config.description}
                </p>
              )}
            </div>
            {isCollapsible && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-muted/50"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isOpen ? "rotate-180" : "",
                  )}
                />
              </button>
            )}
          </div>
        )}

        {isCollapsible ? (
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <div className="p-4">{content}</div>
            </div>
          </div>
        ) : (
          <div className="p-4">{content}</div>
        )}
      </Card>
    );
  }

  // If fieldset variant
  if (variant === "fieldset") {
    return (
      <fieldset
        className={cn(
          " border border-border/60 p-4",
          config.ui?.className,
        )}
        style={
          colSpan
            ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
            : undefined
        }
      >
        {config.label && (
          <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
            {config.label}
          </legend>
        )}
        {config.description && (
          <p className="mb-4 text-xs text-muted-foreground">
            {config.description}
          </p>
        )}
        {content}
      </fieldset>
    );
  }

  // Default variant (just a div, maybe with a header)
  return (
    <div
      className={cn("flex flex-col gap-4", config.ui?.className)}
      style={
        colSpan
          ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
          : undefined
      }
    >
      {(config.label || config.description) && (
        <div className="flex flex-col gap-1 pb-1">
          {config.label && (
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {config.label}
              {isCollapsible && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-0.5 hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      isOpen ? "rotate-180" : "",
                    )}
                  />
                </button>
              )}
            </h4>
          )}
          {config.description && (
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          )}
        </div>
      )}

      {isCollapsible ? (
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">{content}</div>
        </div>
      ) : (
        content
      )}
    </div>
  );
};
