import type React from "react";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import { cn } from "@/lib/utils";
import { ChevronRight, Circle } from "lucide-react";

export type ListSectionItem = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  value?: unknown;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
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
  actions?: SectionDefinition<ListSectionData>["actions"];
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

function itemToneClass(tone?: ListSectionItem["tone"]): string {
  switch (tone) {
    case "success": return "text-emerald-500";
    case "warning": return "text-amber-500";
    case "danger": return "text-rose-500";
    case "info": return "text-blue-500";
    default: return "text-primary";
  }
}

function DefaultListItem({ item }: { item: ListSectionItem }) {
  return (
    <div className="flex items-center gap-4 w-full">
      <div className={cn(
        "shrink-0 p-2 rounded-lg bg-muted/50 group-hover:bg-background group-hover:shadow-sm transition-all",
        itemToneClass(item.tone)
      )}>
        {item.icon || <Circle className="size-4 fill-current opacity-20" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
          {String(item.title ?? item.value ?? "Item")}
        </div>
        {item.subtitle && (
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-70 truncate">
            {item.subtitle}
          </div>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
      const renderList = (listItems: ListSectionItem[], groupName?: string) => (
        <ul className="grid grid-cols-1 gap-2">
          {listItems.map((item, index) => (
            <li 
              key={String(item.id ?? (groupName ? `${groupName}-${index}` : index))}
              className="group relative flex items-center p-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/20 hover:shadow-md hover:bg-card/50 transition-all cursor-pointer"
            >
              {config.renderItem ? config.renderItem(item, index) : <DefaultListItem item={item} />}
            </li>
          ))}
        </ul>
      );

      if (!config.groupBy) {
        return renderList(items);
      }

      const grouped = items.reduce<Record<string, ListSectionItem[]>>((acc, item) => {
        const key = config.groupBy?.(item) || "Other";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      return (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {group}
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                <span className="text-[9px] font-black text-muted-foreground/40 bg-muted px-1.5 py-0.5 rounded leading-none">
                  {groupItems.length}
                </span>
              </div>
              {renderList(groupItems, group)}
            </div>
          ))}
        </div>
      );
    },
  };
}

export default createListSection;
