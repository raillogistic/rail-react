import * as React from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BaseDetailProps,
  BaseDetailSectionRenderContext,
  DetailTabConfig,
  DetailTabSectionConfig,
  DetailTabSectionList,
  DetailTabSectionTable,
} from "./types";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/components/ui/tabs";
import TableDetail from "./components/TableDetail";
import ListDetail from "./components/ListDetail";

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

function resolveSectionGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 4));
  const classes = ["grid gap-4 grid-cols-1"];
  if (normalized >= 2) classes.push("md:grid-cols-2");
  if (normalized >= 3) classes.push("xl:grid-cols-3");
  if (normalized >= 4) classes.push("2xl:grid-cols-4");
  return classes.join(" ");
}

function sortSections(
  sections: DetailTabSectionConfig[],
): DetailTabSectionConfig[] {
  return [...sections].sort(
    (left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER),
  );
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
  const resolvedTabs = tabs ?? [];
  const firstTabKey = resolvedTabs[0]?.key ?? "tab-0";
  const isControlled = value !== undefined;
  const [internalActive, setInternalActive] = React.useState<string>(
    defaultValue ?? initialTab ?? firstTabKey,
  );

  const requestedActive = isControlled
    ? (value ?? firstTabKey)
    : internalActive;
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

  const renderSimpleTable = React.useCallback(
    (section: DetailTabSectionTable) => {
      const sourceRows: unknown[] = Array.isArray(section.rows)
        ? section.rows
        : (resolveDataPathValue(dataRecord, section.dataPath) as unknown[]);
      const resolvedRows = Array.isArray(sourceRows) ? sourceRows : [];

      return (
        <Card className="p-3 space-y-3">
          {(section.title || section.actions?.length) && (
            <div className="flex items-center justify-between gap-3">
              <div>
                {section.title ? (
                  <h4 className="text-sm font-semibold">{section.title}</h4>
                ) : null}
                {section.description ? (
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                ) : null}
              </div>
              {section.actions && section.actions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {section.actions.map((action) => (
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
                        <span className={action.icon ? "ml-1" : ""}>
                          {action.label}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <TableDetail
            columns={section.columns}
            rows={resolvedRows}
            enable_quick_search={section.enable_quick_search}
            enable_sorting={section.enable_sorting}
            initial_page_size={section.initial_page_size}
          />
        </Card>
      );
    },
    [dataRecord],
  );

  const renderListSections = React.useCallback(
    (section: DetailTabSectionList) => (
      <ListDetail
        data={dataRecord}
        panels={section.panels}
        className={section.contentClassName}
      />
    ),
    [dataRecord],
  );

  const renderBuiltInSection = React.useCallback(
    (section: DetailTabSectionConfig) => {
      if (section.type === "list") {
        return renderListSections(section);
      }
      if (section.type === "table") {
        return renderSimpleTable(section);
      }
      return null;
    },
    [renderListSections, renderSimpleTable],
  );

  const defaultTabList = React.useCallback(() => {
    if (!showTabs || resolvedTabs.length <= 1) return null;
    return (
      <TabsList className={cn("mb-2", tabListClassName)}>
        {resolvedTabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={cn(
              tabTriggerClassName,
              tab.key === active
                ? activeTabTriggerClassName
                : inactiveTabTriggerClassName,
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    );
  }, [
    showTabs,
    resolvedTabs,
    tabListClassName,
    tabTriggerClassName,
    activeTabTriggerClassName,
    inactiveTabTriggerClassName,
    active,
  ]);

  const renderedTabList = renderTabList?.({
    tabs: resolvedTabs,
    activeTab: active,
    setActiveTab: setActive,
    defaultTabList,
  });

  if (resolvedTabs.length === 0) {
    return <div className={cn("flex flex-col gap-4", className)} />;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Tabs value={active} onValueChange={setActive}>
        {renderedTabList !== undefined ? renderedTabList : defaultTabList()}
        {resolvedTabs.map((tab: DetailTabConfig) => (
          <TabsContent key={tab.key} value={tab.key}>
            <div
              className={cn(
                resolveSectionGridClasses(sectionsColumns),
                sectionsContainerClassName,
                tab.sectionsContainerClassName,
              )}
            >
              {sortSections(tab.sections).map((section, sectionIndex) => {
                const builtInDefaultSection = () =>
                  renderBuiltInSection(section);
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
                  if (!typeRenderer) {
                    return builtInDefaultSection();
                  }
                  const sectionByType = typeRenderer(
                    renderContextFactory(builtInDefaultSection),
                  );
                  return sectionByType !== undefined
                    ? sectionByType
                    : builtInDefaultSection();
                };

                const customSection = renderSection?.(
                  renderContextFactory(defaultSection),
                );
                const renderedSection =
                  customSection !== undefined
                    ? customSection
                    : defaultSection();

                const sectionSpan = Math.max(
                  1,
                  Math.min(
                    Number(section.span ?? 1) || 1,
                    Math.max(1, Math.min(sectionsColumns, 4)),
                  ),
                );

                const sectionStyle: React.CSSProperties = {
                  order: section.order,
                  gridColumn:
                    sectionSpan > 1
                      ? `span ${sectionSpan} / span ${sectionSpan}`
                      : undefined,
                };

                return (
                  <div
                    key={
                      section.id ?? `${tab.key}-${section.type}-${sectionIndex}`
                    }
                    className={cn("min-w-0", section.containerClassName)}
                    style={sectionStyle}
                  >
                    <div className={cn("min-w-0", section.contentClassName)}>
                      {renderedSection}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
