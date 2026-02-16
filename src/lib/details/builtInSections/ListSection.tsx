import type React from "react";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type ListSectionItem = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  value?: unknown;
  [key: string]: unknown;
};

export type ListSectionData =
  | ListSectionItem[]
  | {
      items: ListSectionItem[];
    };

export type ListSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<ListSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => ListSectionData | undefined;
  load?: SectionDefinition<ListSectionData>["load"];
  groupBy?: (item: ListSectionItem) => string;
  renderItem?: (item: ListSectionItem, index: number) => React.ReactNode;
  skeleton?: SectionDefinition<ListSectionData>["skeleton"];
  empty?: SectionDefinition<ListSectionData>["empty"];
  error?: SectionDefinition<ListSectionData>["error"];
  testId?: string;
};

function resolveItems(data: ListSectionData | undefined): ListSectionItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

function defaultRenderItem(item: ListSectionItem): React.ReactNode {
  return (
    <div className="min-w-0">
      <div className="text-sm font-medium">{String(item.title ?? item.value ?? "Item")}</div>
      {item.subtitle ? (
        <div className="text-xs text-muted-foreground">{item.subtitle}</div>
      ) : null}
    </div>
  );
}

export function createListSection(config: ListSectionConfig): SectionDefinition<ListSectionData> {
  return {
    ...config,
    kind: "list",
    dataSource: "related",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data }) => {
      const items = resolveItems(data);
      if (!config.groupBy) {
        return (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={String(item.id ?? index)} className="rounded-md border p-3">
                {config.renderItem ? config.renderItem(item, index) : defaultRenderItem(item)}
              </li>
            ))}
          </ul>
        );
      }

      const grouped = items.reduce<Record<string, ListSectionItem[]>>((acc, item) => {
        const key = config.groupBy?.(item) || "Other";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      return (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </h4>
              <ul className="space-y-2">
                {groupItems.map((item, index) => (
                  <li key={String(item.id ?? `${group}-${index}`)} className="rounded-md border p-3">
                    {config.renderItem
                      ? config.renderItem(item, index)
                      : defaultRenderItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    },
  };
}

export default createListSection;
