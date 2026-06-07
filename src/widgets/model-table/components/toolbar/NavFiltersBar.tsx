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

/**
 * Affiche la barre des filtres de navigation sous forme de segments premium.
 *
 * @param props Les paramètres de rendu, incluant la configuration des filtres.
 * @returns Le composant de la barre de filtres.
 */
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
        "flex w-full flex-col gap-2 overflow-hidden border-b border-border/10 bg-transparent py-2.5",
        className,
      )}
      data-testid="table-nav-filters"
    >
      <div className="flex w-full gap-5 items-center overflow-x-auto pb-1 select-none no-scrollbar">
        {navFilters.groups.map((group) => {
          const selectedValue = navFilterSelections[group.key] ?? undefined;

          return (
            <div key={group.key} className="flex min-w-max items-center gap-3">
              {group.label ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 mr-1">
                  {group.label}
                </span>
              ) : null}
              <ToggleGroup
                type="single"
                variant="outline"
                value={selectedValue ?? ""}
                onValueChange={(value) =>
                  setNavFilterSelection(group.key, value || null)
                }
                className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/5"
                aria-label={group.label || group.key}
              >
                {group.items.map((item) => (
                  <ToggleGroupItem
                    key={item.key}
                    value={item.key}
                    className={cn(
                      "h-7 rounded-md px-3 text-[11px] font-semibold transition-all duration-300 whitespace-nowrap border-none shadow-none",
                      "text-muted-foreground/80 hover:text-foreground hover:bg-muted/35",
                      "data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:font-bold data-[state=on]:shadow-sm data-[state=on]:border-border/10",
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

/**
 * Libellé d'un filtre de navigation incluant son badge de compteur dynamique.
 *
 * @param props Les paramètres de l'item à afficher.
 * @returns Le libellé formaté avec son badge.
 */
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
  const isSelected = navFilterSelections[groupKey] === itemKey;

  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      {navFilters.count && typeof count === "number" && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full px-1.5 py-0.25 text-[9px] font-bold transition-all duration-300",
            isSelected
              ? "bg-primary/10 text-primary"
              : "bg-muted-foreground/10 text-muted-foreground/75",
          )}
        >
          ({count})
        </span>
      )}
    </div>
  );
}
