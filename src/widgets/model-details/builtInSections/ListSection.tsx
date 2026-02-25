/**
 * @module ListSection
 * @description Section de liste pour afficher des éléments en colonne.
 * Supporte le regroupement, les icônes personnalisées et les tons de couleur.
 */
import type React from "react";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import { cn } from "@/shared/utils";
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

/** Extrait les éléments depuis les données de la section. */
function resolveItems(data: ListSectionData | undefined): ListSectionItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

/** Résout la classe de ton pour les icônes. */
function itemToneClass(tone?: ListSectionItem["tone"]): string {
  switch (tone) {
    case "success":
      return "text-emerald-500";
    case "warning":
      return "text-amber-500";
    case "danger":
      return "text-rose-500";
    case "info":
      return "text-blue-500";
    default:
      return "text-primary";
  }
}

/** Élément de liste par défaut. */
function DefaultListItem({ item }: { item: ListSectionItem }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className={cn(
          "shrink-0 p-1.5 rounded-lg bg-muted/40 transition-colors group-hover:bg-muted/60",
          itemToneClass(item.tone),
        )}
      >
        {item.icon || <Circle className="size-3.5 fill-current opacity-20" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {String(item.title ?? item.value ?? "Item")}
        </div>
        {item.subtitle && (
          <div className="text-xs text-muted-foreground/60 mt-0.5 truncate">
            {item.subtitle}
          </div>
        )}
      </div>
      <ChevronRight className="size-3.5 text-muted-foreground/30 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </div>
  );
}

export function createListSection(
  config: ListSectionConfig,
): SectionDefinition<ListSectionData> {
  return {
    ...config,
    kind: "list",
    dataSource: "related",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data }) => {
      const items = resolveItems(data);
      const renderList = (listItems: ListSectionItem[], groupName?: string) => (
        <ul className="grid grid-cols-1 gap-1.5">
          {listItems.map((item, index) => (
            <li
              key={String(
                item.id ?? (groupName ? `${groupName}-${index}` : index),
              )}
              className="group relative flex items-center px-3 py-2.5 rounded-lg border border-border/30 bg-card/20 hover:border-border/50 hover:bg-card/40 transition-all cursor-pointer"
            >
              {config.renderItem ? (
                config.renderItem(item, index)
              ) : (
                <DefaultListItem item={item} />
              )}
            </li>
          ))}
        </ul>
      );

      if (!config.groupBy) {
        return renderList(items);
      }

      const grouped = items.reduce<Record<string, ListSectionItem[]>>(
        (acc, item) => {
          const key = config.groupBy?.(item) || "Other";
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        },
        {},
      );

      return (
        <div className="space-y-5">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h4 className="text-xs font-semibold text-muted-foreground/50">
                  {group}
                </h4>
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-[11px] font-medium text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded leading-none">
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
