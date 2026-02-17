import type React from "react";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type {
  SectionDefinition,
  SectionRuntimeCtx,
} from "../sectionTypes";
import type {
  UnitFieldDensity,
  UnitFieldInput,
  UnitFieldMode,
} from "../units/unitFieldTypes";
import { cn } from "@/lib/utils";

export type GeneralSectionData =
  | UnitFieldInput[]
  | {
      fields: UnitFieldInput[];
    };

export type GeneralSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  order?: number;
  columns?: number;
  mode?: UnitFieldMode;
  density?: UnitFieldDensity;
  defaultLocale?: string;
  defaultTimezone?: string;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<GeneralSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => GeneralSectionData | undefined;
  load?: SectionDefinition<GeneralSectionData>["load"];
  actions?: SectionDefinition<GeneralSectionData>["actions"];
  skeleton?: SectionDefinition<GeneralSectionData>["skeleton"];
  empty?: SectionDefinition<GeneralSectionData>["empty"];
  error?: SectionDefinition<GeneralSectionData>["error"];
  testId?: string;
};

function resolveGeneralFields(data: GeneralSectionData | undefined): UnitFieldInput[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.fields) ? data.fields : [];
}

function resolveGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 4));
  const classes = ["grid grid-cols-1 gap-x-12 gap-y-8"];
  if (normalized >= 2) classes.push("md:grid-cols-2");
  if (normalized >= 3) classes.push("xl:grid-cols-3");
  if (normalized >= 4) classes.push("2xl:grid-cols-4");
  return classes.join(" ");
}

export function createGeneralSection(config: GeneralSectionConfig): SectionDefinition<GeneralSectionData> {
  const columns = Math.max(1, Math.min(config.columns ?? 2, 4));
  return {
    ...config,
    kind: "general",
    dataSource: "computed",
    loadingStrategy: config.loadingStrategy ?? "eager",
    render: ({ data, runtime }) => {
      const fields = resolveGeneralFields(data);
      return (
        <div className={cn(resolveGridClasses(columns), "py-2")}>
          {fields.map((field, index) => (
            <div 
              key={field.id ?? `general-field-${index}`} 
              className="min-w-0 transition-all duration-200 hover:translate-x-1"
            >
              <UnitFieldRenderer
                field={field}
                mode={config.mode ?? "labelValue"}
                density={config.density ?? "normal"}
                defaultLocale={config.defaultLocale ?? runtime.locale}
                defaultTimezone={config.defaultTimezone ?? runtime.timezone}
              />
            </div>
          ))}
        </div>
      );
    },
  };
}

export default createGeneralSection;
