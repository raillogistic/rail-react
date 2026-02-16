import * as React from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import SectionHost from "./SectionHost";
import TableDetail from "./components/TableDetail";
import ListDetail from "./components/ListDetail";
import UnitFieldRenderer from "./units/UnitFieldRenderer";
import type {
  BaseDetailProps,
  BaseDetailSectionRenderContext,
  DetailTabConfig,
  DetailTabSectionConfig,
  DetailTabSectionList,
  DetailTabSectionTable,
  DetailTabSectionUnits,
} from "./types";
import type { DetailsPageSchema, SectionDefinition } from "./sectionTypes";

function resolveDataPathValue(data: unknown, dataPath?: string): unknown {
  const normalizedPath = String(dataPath || "").trim();
  if (!normalizedPath) return undefined;
  return normalizedPath.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, data);
}

function sortSections(sections: DetailTabSectionConfig[]): DetailTabSectionConfig[] {
  return [...sections].sort(
    (left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER),
  );
}

function resolveSectionGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 4));
  const classes = ["grid gap-4 grid-cols-1"];
  if (normalized >= 2) classes.push("md:grid-cols-2");
  if (normalized >= 3) classes.push("xl:grid-cols-3");
  if (normalized >= 4) classes.push("2xl:grid-cols-4");
  return classes.join(" ");
}

function buildLegacySectionId(
  tabKey: string,
  section: DetailTabSectionConfig,
  sectionIndex: number,
): string {
  if (section.id) return `${tabKey}:${section.id}`;
  return `${tabKey}-${section.type}-${sectionIndex}`;
}

function sectionKindFromType(
  section: DetailTabSectionConfig,
): SectionDefinition["kind"] {
  if (section.type === "list") return "list";
  if (section.type === "table") return "table";
  if (section.type === "units") return "general";
  return "custom";
}

export default function BaseDetail<TData = Record<string, unknown>>({
  data,
  tabs,
  className,
  initialTab,
  defaultValue,
  value,
  onValueChange,
  showTabs = true,
  sectionsColumns = 1,
  sectionsContainerClassName,
  tabListClassName,
  tabTriggerClassName,
  activeTabTriggerClassName,
  inactiveTabTriggerClassName,
  renderTabList,
  renderSection,
  sectionRenderers,
}: BaseDetailProps<TData>) {
  const resolvedTabs = React.useMemo(() => tabs ?? [], [tabs]);
  const firstTabKey = resolvedTabs[0]?.key ?? "tab-0";
  const isControlled = value !== undefined;
  const [internalActive, setInternalActive] = React.useState<string>(
    defaultValue ?? initialTab ?? firstTabKey,
  );

  const requestedActive = isControlled ? (value ?? firstTabKey) : internalActive;
  const active = resolvedTabs.some((tab) => tab.key === requestedActive)
    ? requestedActive
    : firstTabKey;

  React.useEffect(() => {
    if (isControlled) return;
    if (internalActive === active) return;
    setInternalActive(active);
  }, [active, internalActive, isControlled]);

  const setActive = React.useCallback(
    (nextTab: string) => {
      if (!isControlled) {
        setInternalActive(nextTab);
      }
      onValueChange?.(nextTab);
    },
    [isControlled, onValueChange],
  );

  const dataRecord = data as Record<string, unknown>;

  const sectionLayoutMap = React.useMemo(() => {
    const map = new Map<
      string,
      {
        section: DetailTabSectionConfig;
        tab: DetailTabConfig;
      }
    >();
    resolvedTabs.forEach((tab) => {
      sortSections(tab.sections).forEach((section, sectionIndex) => {
        const id = buildLegacySectionId(tab.key, section, sectionIndex);
        map.set(id, { section, tab });
      });
    });
    return map;
  }, [resolvedTabs]);

  const buildDefaultSectionRenderer = React.useCallback(
    (section: DetailTabSectionConfig): React.ReactNode => {
      if (section.type === "list") {
        return (
          <ListDetail
            data={dataRecord}
            panels={(section as DetailTabSectionList).panels}
            className={section.contentClassName}
          />
        );
      }

      if (section.type === "table") {
        const tableSection = section as DetailTabSectionTable;
        const sourceRows: unknown[] = Array.isArray(tableSection.rows)
          ? tableSection.rows
          : (resolveDataPathValue(dataRecord, tableSection.dataPath) as unknown[]);
        const resolvedRows = Array.isArray(sourceRows) ? sourceRows : [];

        return (
          <Card className="p-3 space-y-3">
            {(tableSection.title || tableSection.actions?.length) && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  {tableSection.title ? (
                    <h4 className="text-sm font-semibold">{tableSection.title}</h4>
                  ) : null}
                  {tableSection.description ? (
                    <p className="text-xs text-muted-foreground">
                      {tableSection.description}
                    </p>
                  ) : null}
                </div>
                {tableSection.actions && tableSection.actions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {tableSection.actions.map((action) => (
                      <Button
                        key={action.key}
                        size={action.size ?? "sm"}
                        variant={action.variant ?? "outline"}
                        onClick={() =>
                          action.on_click?.({
                            data: dataRecord,
                            rows: resolvedRows,
                          })
                        }
                      >
                        {action.icon}
                        {action.size === "icon" ? null : (
                          <span className={action.icon ? "ml-1" : ""}>{action.label}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            <TableDetail
              columns={tableSection.columns}
              rows={resolvedRows}
              enable_quick_search={tableSection.enable_quick_search}
              enable_sorting={tableSection.enable_sorting}
              initial_page_size={tableSection.initial_page_size}
            />
          </Card>
        );
      }

      if (section.type === "units") {
        const unitSection = section as DetailTabSectionUnits;
        const fields = Array.isArray(unitSection.fields) ? unitSection.fields : [];
        const columns = Math.max(1, Math.min(unitSection.columns ?? 1, 4));

        return (
          <Card className="p-3 space-y-3">
            {(unitSection.title || unitSection.description) && (
              <div>
                {unitSection.title ? (
                  <h4 className="text-sm font-semibold">{unitSection.title}</h4>
                ) : null}
                {unitSection.description ? (
                  <p className="text-xs text-muted-foreground">{unitSection.description}</p>
                ) : null}
              </div>
            )}
            <div className={resolveSectionGridClasses(columns)}>
              {fields.map((field, index) => (
                <div key={field.id ?? `unit-field-${index}`} className="min-w-0">
                  <UnitFieldRenderer
                    field={field}
                    mode={unitSection.mode}
                    density={unitSection.density}
                    defaultLocale={unitSection.defaultLocale}
                    defaultTimezone={unitSection.defaultTimezone}
                  />
                </div>
              ))}
            </div>
          </Card>
        );
      }

      return null;
    },
    [dataRecord],
  );

  const schema = React.useMemo<DetailsPageSchema>(() => {
    const mappedTabs = resolvedTabs.map((tab) => {
      const mappedSections: SectionDefinition[] = sortSections(tab.sections).map(
        (section, sectionIndex) => {
          const sectionId = buildLegacySectionId(tab.key, section, sectionIndex);
          return {
            id: sectionId,
            kind: sectionKindFromType(section),
            title: section.title,
            description: section.description,
            order: section.order,
            loadingStrategy: "eager",
            dataSource: "entity",
            render: () => {
              const builtInDefaultSection = () => buildDefaultSectionRenderer(section);
              const typeRenderer = sectionRenderers?.[section.type];

              const renderContextFactory = (
                defaultSection: () => React.ReactNode,
              ): BaseDetailSectionRenderContext<TData> => ({
                tab,
                section,
                sectionIndex,
                data,
                activeTab: active,
                defaultSection,
              });

              const defaultSection = () => {
                if (!typeRenderer) return builtInDefaultSection();
                const byType = typeRenderer(renderContextFactory(builtInDefaultSection));
                return byType !== undefined ? byType : builtInDefaultSection();
              };

              const customSection = renderSection?.(renderContextFactory(defaultSection));
              const renderedSection =
                customSection !== undefined ? customSection : defaultSection();

              return <div className={cn("min-w-0", section.contentClassName)}>{renderedSection}</div>;
            },
          };
        },
      );

      return {
        id: tab.key,
        title: tab.label,
        order: 0,
        loadingStrategy: "lazy" as const,
        sections: mappedSections,
      };
    });

    return {
      header: [],
      tabs: mappedTabs,
    };
  }, [
    active,
    buildDefaultSectionRenderer,
    data,
    renderSection,
    resolvedTabs,
    sectionRenderers,
  ]);

  if (resolvedTabs.length === 0) {
    return <div className={cn("flex flex-col gap-4", className)} />;
  }

  const activeTabMeta = resolvedTabs.find((tab) => tab.key === active);
  const computedSectionsContainerClassName = cn(
    sectionsContainerClassName,
    activeTabMeta?.sectionsContainerClassName,
  );

  return (
    <SectionHost
      schema={schema}
      runtime={{
        entityId: "base-detail-entity",
        entity: dataRecord,
      }}
      className={cn("flex flex-col gap-4", className)}
      initialTabId={defaultValue ?? initialTab ?? firstTabKey}
      activeTabId={active}
      onActiveTabChange={setActive}
      renderTabList={
        renderTabList
          ? ({ activeTab, setActiveTab, defaultTabList }) =>
              renderTabList({
                tabs: resolvedTabs,
                activeTab,
                setActiveTab,
                defaultTabList: () => defaultTabList(),
              })
          : showTabs
            ? undefined
            : () => null
      }
      tabListClassName={tabListClassName}
      tabTriggerClassName={tabTriggerClassName}
      activeTabTriggerClassName={activeTabTriggerClassName}
      inactiveTabTriggerClassName={inactiveTabTriggerClassName}
      sectionColumns={sectionsColumns}
      sectionsContainerClassName={computedSectionsContainerClassName}
      resolveSectionContainer={(sectionDefinition) => {
        const item = sectionLayoutMap.get(sectionDefinition.id);
        if (!item) return undefined;
        const section = item.section;
        const sectionSpan = Math.max(
          1,
          Math.min(
            Number(section.span ?? 1) || 1,
            Math.max(1, Math.min(sectionsColumns, 4)),
          ),
        );
        return {
          className: section.containerClassName,
          style: {
            order: section.order,
            gridColumn:
              sectionSpan > 1 ? `span ${sectionSpan} / span ${sectionSpan}` : undefined,
          },
        };
      }}
    />
  );
}
