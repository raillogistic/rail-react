import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { cn } from "@/shared/utils";
import type { SectionLoadingStrategy } from "./sectionTypes";

export type TabHostTab = {
  id: string;
  title: string;
  icon?: React.ReactNode;
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
      <div className="flex justify-start mb-10 overflow-x-auto pb-4 no-scrollbar">
        <TabsList 
          className={cn(
            "inline-flex h-12 items-center justify-start rounded-[1.25rem] bg-muted/40 p-1.5 text-muted-foreground border border-border/20 backdrop-blur-xl shadow-xl shadow-primary/[0.02]", 
            tabListClassName
          )}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              data-testid={tab.testId}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-[0.9rem] px-6 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]",
                "hover:text-foreground/80 hover:bg-muted/50",
                tabTriggerClassName,
                resolvedActive === tab.id
                  ? activeTabTriggerClassName
                  : inactiveTabTriggerClassName,
              )}
            >
              {tab.icon && <span className="mr-2.5 size-3.5 opacity-80 shrink-0">{tab.icon}</span>}
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
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
    <Tabs value={resolvedActive} onValueChange={setActiveTab} className={cn("w-full", className)}>
      {renderedTabList !== undefined ? renderedTabList : defaultTabList()}
      {tabs.map((tab) => {
        const isVisited =
          visitedTabs[tab.id] ||
          tab.loadingStrategy === "eager" ||
          resolvedActive === tab.id;

        return (
          <TabsContent 
            key={tab.id} 
            value={tab.id}
            className="mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out-expo fill-mode-forwards">
               {renderContent(tab, isVisited)}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
