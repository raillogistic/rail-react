import { useMemo } from "react";
import {
  useModelPageQuery,
  type ModelMetadata,
} from "@/shared/api/graphql/graphql";
import { cn } from "@/shared/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/kit/toggle-group";
import type { ModelTableNavFiltersConfig } from "../../config/types";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import { useTableFilters } from "../../hooks/useTableFilters";
import {
  mergeModelTableQueryVariables,
  resolveNavFilterItemVariables,
  resolveNavFilterVariables,
} from "../../utils";

type NavFiltersBarProps = {
  navFilters?: ModelTableNavFiltersConfig;
  queryManager?: string;
  className?: string;
};

export function NavFiltersBar({
  navFilters,
  queryManager,
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
                    aria-label={item.label}
                  >
                    <NavFilterItemLabel
                      navFilters={navFilters}
                      queryManager={queryManager}
                      groupKey={group.key}
                      itemKey={item.key}
                      label={item.label}
                    />
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

type NavFilterItemLabelProps = {
  navFilters: ModelTableNavFiltersConfig;
  queryManager?: string;
  groupKey: string;
  itemKey: string;
  label: string;
};

function NavFilterItemLabel({
  navFilters,
  queryManager,
  groupKey,
  itemKey,
  label,
}: NavFilterItemLabelProps) {
  const { app, model, metadata } = useMetadata();
  const { quickSearch, filterVariables } = useTable();
  const { navFilterSelections } = useTableFilters();

  const group = useMemo(
    () => navFilters.groups.find((entry) => entry.key === groupKey),
    [groupKey, navFilters.groups],
  );
  const item = useMemo(
    () => group?.items.find((entry) => entry.key === itemKey),
    [group?.items, itemKey],
  );
  const siblingNavVariables = useMemo(
    () =>
      resolveNavFilterVariables(navFilters, navFilterSelections, {
        excludeGroupKeys: [groupKey],
      }),
    [groupKey, navFilterSelections, navFilters],
  );
  const baseVariables = useMemo(
    () =>
      navFilters.includeTableVariable
        ? mergeModelTableQueryVariables(filterVariables, siblingNavVariables)
        : undefined,
    [filterVariables, navFilters.includeTableVariable, siblingNavVariables],
  );
  const itemVariables = useMemo(
    () =>
      item
        ? resolveNavFilterItemVariables(item, groupKey, navFilterSelections)
        : undefined,
    [groupKey, item, navFilterSelections],
  );
  const countingVariables = useMemo(
    () => mergeModelTableQueryVariables(baseVariables, itemVariables),
    [baseVariables, itemVariables],
  );

  const { data } = useModelPageQuery({
    identity: {
      app,
      model,
      managerName: queryManager,
    },
    metadataOptions: {
      metadata: (metadata as ModelMetadata | null) ?? null,
      metadataProfile: "table",
      skipMetadata: true,
    },
    selectionOptions: {
      // Page queries already include pageInfo in the generated selection block.
      // Ask for the smallest valid item payload and read totalCount from pageInfo.
      selection: "id",
    },
    variables: {
      page: 1,
      perPage: 1,
      quick:
        navFilters.includeTableVariable && metadata?.filterConfig?.supportsQuick
          ? quickSearch || undefined
          : undefined,
      where: countingVariables.where,
      presets: countingVariables.presets,
      distinctOn: countingVariables.distinctOn,
      orderBy: countingVariables.orderBy,
      skipCount: false,
    },
    apollo: {
      skip: !navFilters.count || !app || !model || !metadata,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      returnPartialData: true,
      notifyOnNetworkStatusChange: false,
    },
  });

  const count = data?.pageInfo?.totalCount;
  return (
    <>
      {label}
      {navFilters.count && typeof count === "number" ? `(${count})` : ""}
    </>
  );
}
