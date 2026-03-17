import { cn } from "@/shared/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/kit/toggle-group";
import type { ModelTableNavFiltersConfig } from "../../config/types";
import { useTableFilters } from "../../hooks/useTableFilters";

type NavFiltersBarProps = {
  navFilters?: ModelTableNavFiltersConfig;
  className?: string;
};

export function NavFiltersBar({
  navFilters,
  className,
}: NavFiltersBarProps) {
  const { navFilterSelections, setNavFilterSelection } = useTableFilters();

  if (!navFilters?.groups.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-border/40 bg-muted/20 px-3 py-3",
        className,
      )}
      data-testid="table-nav-filters"
    >
      <div className="flex w-full gap-3 overflow-x-auto pb-1">
        {navFilters.groups.map((group) => {
          const selectedValue = navFilterSelections[group.key] ?? undefined;

          return (
            <div key={group.key} className="flex min-w-max flex-col gap-2">
              {group.label ? (
                <span className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </span>
              ) : null}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={1}
                value={selectedValue ?? ""}
                onValueChange={(value) =>
                  setNavFilterSelection(group.key, value || null)
                }
                className="flex-nowrap"
                aria-label={group.label || group.key}
              >
                {group.items.map((item) => (
                  <ToggleGroupItem
                    key={item.key}
                    value={item.key}
                    className={cn(
                      "h-8 rounded-md border-border/60 bg-background/80 px-3 text-[11px] font-semibold capitalize whitespace-nowrap",
                      item.clear &&
                        "text-muted-foreground data-[state=on]:text-foreground",
                    )}
                    aria-label={
                      typeof item.count === "number"
                        ? `${item.label}(${item.count})`
                        : item.label
                    }
                  >
                    {item.label}
                    {typeof item.count === "number" ? `(${item.count})` : ""}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          );
        })}
      </div>
    </div>
  );
}
