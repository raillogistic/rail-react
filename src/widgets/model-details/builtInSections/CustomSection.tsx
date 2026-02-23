import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type CustomSectionConfig<TData = unknown> = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  dataSource?: SectionDefinition<TData>["dataSource"];
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<TData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => TData | undefined;
  load?: SectionDefinition<TData>["load"];
  render: SectionDefinition<TData>["render"];
  skeleton?: SectionDefinition<TData>["skeleton"];
  empty?: SectionDefinition<TData>["empty"];
  error?: SectionDefinition<TData>["error"];
  actions?: SectionDefinition<TData>["actions"];
  testId?: string;
};

export function createCustomSection<TData = unknown>(
  config: CustomSectionConfig<TData>,
): SectionDefinition<TData> {
  return {
    ...config,
    kind: "custom",
    dataSource: config.dataSource ?? "computed",
    loadingStrategy: config.loadingStrategy ?? "lazy",
  };
}

export default createCustomSection;
