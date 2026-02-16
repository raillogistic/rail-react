import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SectionLoadingStrategy } from "./sectionTypes";

export type TabHostTab = {
  id: string;
  title: string;
  loadingStrategy?: SectionLoadingStrategy;
  testId?: string;
};

export type TabHostTabListRenderContext = {
  tabs: TabHostTab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  defaultTabList: () => React.ReactNode;
};

export type TabHostProps = {
  tabs: TabHostTab[];
  className?: string;
  defaultActiveTab?: string;
  activeTab?: string;
  onActiveTabChange?: (tabId: string) => void;
  onTabActivated?: (tabId: string) => void;
  renderContent: (tab: TabHostTab, isVisited: boolean) => React.ReactNode;
  renderTabList?: (ctx: TabHostTabListRenderContext) => React.ReactNode | undefined;
  tabListClassName?: string;
  tabTriggerClassName?: string;
  activeTabTriggerClassName?: string;
  inactiveTabTriggerClassName?: string;
};

export default function TabHost({
  tabs,
  className,
  defaultActiveTab,
  activeTab,
  onActiveTabChange,
  onTabActivated,
  renderContent,
  renderTabList,
  tabListClassName,
  tabTriggerClassName,
  activeTabTriggerClassName,
  inactiveTabTriggerClassName,
}: TabHostProps) {
  const firstTabId = tabs[0]?.id ?? "";
  const isControlled = activeTab !== undefined;
  const [internalActive, setInternalActive] = React.useState<string>(
    defaultActiveTab ?? firstTabId,
  );
  const [visitedTabs, setVisitedTabs] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (defaultActiveTab) initial[defaultActiveTab] = true;
    if (firstTabId) initial[firstTabId] = true;
    return initial;
  });

  const requested = isControlled ? (activeTab ?? firstTabId) : internalActive;
  const resolvedActive = tabs.some((tab) => tab.id === requested) ? requested : firstTabId;

  React.useEffect(() => {
    if (!resolvedActive) return;
    setVisitedTabs((current) => {
      if (current[resolvedActive]) return current;
      return { ...current, [resolvedActive]: true };
    });
    onTabActivated?.(resolvedActive);
  }, [onTabActivated, resolvedActive]);

  const setActiveTab = React.useCallback(
    (tabId: string) => {
      if (!isControlled) setInternalActive(tabId);
      onActiveTabChange?.(tabId);
    },
    [isControlled, onActiveTabChange],
  );

  const defaultTabList = React.useCallback(() => {
    if (tabs.length <= 1) return null;
    return (
      <TabsList className={cn("mb-2", tabListClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            data-testid={tab.testId}
            className={cn(
              tabTriggerClassName,
              resolvedActive === tab.id
                ? activeTabTriggerClassName
                : inactiveTabTriggerClassName,
            )}
          >
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    );
  }, [
    tabs,
    tabListClassName,
    tabTriggerClassName,
    resolvedActive,
    activeTabTriggerClassName,
    inactiveTabTriggerClassName,
  ]);

  const renderedTabList = renderTabList?.({
    tabs,
    activeTab: resolvedActive,
    setActiveTab,
    defaultTabList,
  });

  if (tabs.length === 0) return null;

  return (
    <Tabs value={resolvedActive} onValueChange={setActiveTab} className={className}>
      {renderedTabList !== undefined ? renderedTabList : defaultTabList()}
      {tabs.map((tab) => {
        const isVisited =
          visitedTabs[tab.id] ||
          tab.loadingStrategy === "eager" ||
          resolvedActive === tab.id;

        return (
          <TabsContent key={tab.id} value={tab.id}>
            {renderContent(tab, isVisited)}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
