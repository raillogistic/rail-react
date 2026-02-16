import * as React from "react";
import { Card } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import type { DetailPanelConfig } from "../types";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldInput } from "../units/unitFieldTypes";

function Grid({
  columns,
  children,
}: {
  columns?: number;
  children: React.ReactNode;
}) {
  const normalized = Math.max(1, Math.min(columns ?? 2, 6));
  const classes = ["grid-cols-1"];
  if (normalized >= 2) classes.push("sm:grid-cols-2");
  if (normalized >= 3) classes.push("md:grid-cols-3");
  if (normalized >= 4) classes.push("lg:grid-cols-4");
  if (normalized >= 5) classes.push("xl:grid-cols-5");
  if (normalized >= 6) classes.push("2xl:grid-cols-6");
  return <div className={cn("grid gap-4", classes.join(" "))}>{children}</div>;
}

export default function ListDetail({
  data,
  panels,
  className,
}: {
  data: Record<string, unknown>;
  panels: DetailPanelConfig[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {panels.map((panel: DetailPanelConfig, idx: number) => (
        <Card key={panel.id ?? String(idx)} className="p-4 space-y-4">
          {panel.title ? (
            <h3 className="text-base font-semibold">{panel.title}</h3>
          ) : null}
          {panel.sections.map((section, sidx) => (
            <div key={section.id ?? String(sidx)} className="space-y-2">
              {section.title ? (
                <h4 className="text-sm font-medium">{section.title}</h4>
              ) : null}
              {section.description ? (
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
              <Grid columns={section.columns ?? 2}>
                {section.fields.map((field, fidx) => {
                  const shouldRenderUnit =
                    field.type === "unit" || Boolean(field.unitField);
                  const baseUnitField = shouldRenderUnit
                    ? ((field.unitField ?? {
                        kind: "text",
                      }) as UnitFieldInput)
                    : null;
                  const resolvedUnitField = baseUnitField
                    ? ({
                        ...baseUnitField,
                        id: baseUnitField.id || field.name,
                        label: baseUnitField.label ?? field.label ?? field.name,
                        value:
                          baseUnitField.value !== undefined
                            ? baseUnitField.value
                            : data?.[field.name],
                      } as UnitFieldInput)
                    : null;
                  const unitMode = field.unitMode ?? "valueOnly";
                  const showLegacyLabel = !resolvedUnitField || unitMode === "valueOnly";

                  return (
                    <div
                      key={`${field.name}-${fidx}`}
                      style={
                        field.colSpan
                          ? {
                              gridColumn: `span ${field.colSpan} / span ${field.colSpan}`,
                            }
                          : undefined
                      }
                      className="space-y-1"
                    >
                      {showLegacyLabel ? (
                        <div className="text-xs text-muted-foreground">
                          {field.label ?? field.name}
                        </div>
                      ) : null}
                      <div className="text-sm">
                        {resolvedUnitField ? (
                          <UnitFieldRenderer
                            field={resolvedUnitField}
                            mode={unitMode}
                            density={field.unitDensity}
                            defaultLocale={field.unitDefaultLocale}
                            defaultTimezone={field.unitDefaultTimezone}
                          />
                        ) : field.render ? (
                          field.render(data?.[field.name], data)
                        ) : (
                          String(data?.[field.name] ?? "")
                        )}
                      </div>
                    </div>
                  );
                })}
              </Grid>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
