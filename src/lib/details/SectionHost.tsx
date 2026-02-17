import * as React from "react";
import { cn } from "@/lib/utils";
import SectionFrame, { type SectionFrameAction } from "./SectionFrame";
import TabHost, { type TabHostTab, type TabHostTabListRenderContext } from "./TabHost";
import SectionEmptyState from "./states/SectionEmptyState";
import SectionErrorState from "./states/SectionErrorState";
import SectionNoAccessState from "./states/SectionNoAccessState";
import SectionSkeleton from "./states/SectionSkeleton";
import {
  createSectionCacheApi,
  evaluateSectionVisibility,
  evaluateTabVisibility,
  getSectionInstanceKey,
  isAbortLikeError,
  isSectionDataEmpty,
  loadSectionData,
  resolveSectionActions,
  resolveSectionLoadingStrategy,
  resolveTabLoadingStrategy,
  safeSectionError,
} from "./sectionState";
import {
  sortByOrder,
  validateDetailsPageSchema,
  type DetailsPageSchema,
  type NoAccessBehavior,
  type RetryOptions,
  type SectionDefinition,
  type SectionRuntimeCtx,
  type SectionState,
  type TabDefinition,
} from "./sectionTypes";

type EntityLoaderCtx<TEntity = unknown> = {
  runtime: SectionRuntimeCtx<TEntity>;
  abortSignal: AbortSignal;
};

export type SectionHostContextValue<TEntity = unknown> = {
  runtime: SectionRuntimeCtx<TEntity>;
  schema: DetailsPageSchema;
  sectionStates: Record<string, SectionState<unknown>>;
  reloadSection: (section: SectionDefinition, tabId?: string) => Promise<void>;
};

const SectionHostContext = React.createContext<SectionHostContextValue | null>(null);

export function useSectionHostContext<TEntity = unknown>(): SectionHostContextValue<TEntity> {
  const ctx = React.useContext(SectionHostContext);
  if (!ctx) {
    throw new Error("useSectionHostContext must be used inside SectionHost.");
  }
  return ctx as SectionHostContextValue<TEntity>;
}

export type SectionHostProps<TEntity = Record<string, unknown>> = {
  schema: DetailsPageSchema;
  runtime: Omit<SectionRuntimeCtx<TEntity>, "entity"> & { entity?: TEntity };
  entityLoader?: (ctx: EntityLoaderCtx<TEntity>) => Promise<TEntity>;
  className?: string;
  noAccessBehavior?: NoAccessBehavior;
  retryOptions?: RetryOptions;
  initialTabId?: string;
  activeTabId?: string;
  onActiveTabChange?: (tabId: string) => void;
  renderTabList?: (ctx: TabHostTabListRenderContext) => React.ReactNode | undefined;
  tabListClassName?: string;
  tabTriggerClassName?: string;
  activeTabTriggerClassName?: string;
  inactiveTabTriggerClassName?: string;
  sectionsContainerClassName?: string;
  sectionColumns?: number;
  resolveSectionContainer?: (
    section: SectionDefinition,
    tabId?: string,
  ) => { className?: string; style?: React.CSSProperties } | undefined;
};

type SectionMeta = {
  tabId?: string;
};

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function ManagedSection({
  section,
  runtime,
  tabId,
  noAccessBehavior,
  sectionsContainerClassName,
  sectionContainerClassName,
  sectionContainerStyle,
  sectionState,
  loadSection,
}: {
  section: SectionDefinition;
  runtime: SectionRuntimeCtx;
  tabId?: string;
  noAccessBehavior: NoAccessBehavior;
  sectionsContainerClassName?: string;
  sectionContainerClassName?: string;
  sectionContainerStyle?: React.CSSProperties;
  sectionState: SectionState<unknown>;
  loadSection: (section: SectionDefinition, tabId?: string, force?: boolean) => Promise<void>;
}) {
  const visibility = React.useMemo(
    () => evaluateSectionVisibility(section, runtime, noAccessBehavior),
    [noAccessBehavior, runtime, section],
  );
  const instanceKey = React.useMemo(
    () => getSectionInstanceKey(section, runtime, tabId),
    [runtime, section, tabId],
  );

  const loadingStrategy = resolveSectionLoadingStrategy(section);
  React.useEffect(() => {
    if (!visibility.visible || !visibility.hasAccess) return;
    if (sectionState.status !== "idle") return;
    if (loadingStrategy === "eager" || loadingStrategy === "lazy") {
      void loadSection(section, tabId);
    }
  }, [
    loadSection,
    loadingStrategy,
    section,
    sectionState.status,
    tabId,
    visibility.hasAccess,
    visibility.visible,
  ]);

  if (!visibility.visible) return null;

  const reload = () => loadSection(section, tabId, true);
  const actions = resolveSectionActions(section, runtime, sectionState, reload);
  const frameActions: SectionFrameAction[] = actions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    tone: action.tone,
    ariaLabel: action.ariaLabel,
    disabled:
      action.disabled || (visibility.disabledState?.disabled && action.disabled !== false),
    disabledReason: action.disabledReason ?? visibility.disabledState?.reason,
    onClick: () =>
      action.onClick({
        section,
        runtime,
        state: sectionState,
        reload,
      }),
  }));

  let content: React.ReactNode = null;
  if (!visibility.hasAccess) {
    content = <SectionNoAccessState />;
  } else if (sectionState.status === "loading") {
    content = section.skeleton ? section.skeleton() : <SectionSkeleton />;
  } else if (sectionState.status === "error") {
    content = section.error ? (
      section.error({
        sectionId: section.id,
        runtime,
        error: sectionState.error ?? new Error("Section load failed."),
        retry: reload,
      })
    ) : (
      <SectionErrorState onRetry={reload} />
    );
  } else if (sectionState.status === "empty") {
    content = section.empty ? (
      section.empty({
        section,
        runtime,
        state: sectionState as SectionState<unknown> & { status: "empty" },
        data: sectionState.data,
        disabledState: visibility.disabledState,
        actions,
        reload,
      })
    ) : (
      <SectionEmptyState />
    );
  } else if (sectionState.status === "success") {
    content = section.render({
      section,
      runtime,
      state: sectionState,
      data: sectionState.data,
      disabledState: visibility.disabledState,
      actions,
      reload,
    });
  } else {
    content = section.skeleton ? section.skeleton() : <SectionSkeleton />;
  }

  return (
    <div
      key={instanceKey}
      className={cn(
        "min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500", 
        sectionsContainerClassName, 
        sectionContainerClassName
      )}
      style={sectionContainerStyle}
      data-testid={section.testId ?? `section-${section.id}`}
    >
      <SectionFrame
        title={section.title}
        description={section.description}
        icon={section.icon}
        actions={frameActions}
        disabled={visibility.disabledState?.disabled}
        disabledReason={visibility.disabledState?.reason}
        testId={section.testId ?? `section-frame-${section.id}`}
        headerClassName={section.kind === "header" ? "bg-primary/5 border-primary/10 py-8" : undefined}
      >
        {content}
      </SectionFrame>
    </div>
  );
}

export default function SectionHost<TEntity = Record<string, unknown>>({
  schema,
  runtime,
  entityLoader,
  className,
  noAccessBehavior = "hide",
  retryOptions,
  initialTabId,
  activeTabId,
  onActiveTabChange,
  renderTabList,
  tabListClassName,
  tabTriggerClassName,
  activeTabTriggerClassName,
  inactiveTabTriggerClassName,
  sectionsContainerClassName,
  sectionColumns = 1,
  resolveSectionContainer,
}: SectionHostProps<TEntity>) {
  const [entity, setEntity] = React.useState<TEntity | undefined>(runtime.entity);
  const [sectionStates, setSectionStates] = React.useState<
    Record<string, SectionState<unknown>>
  >({});
  const sectionStatesRef = React.useRef(sectionStates);
  const sectionCacheRef = React.useRef<Map<string, unknown>>(new Map());
  const sectionMetaRef = React.useRef<Map<string, SectionMeta>>(new Map());
  const inFlightControllersRef = React.useRef<Map<string, AbortController>>(new Map());
  const inFlightPromisesRef = React.useRef<Map<string, Promise<void>>>(new Map());
  const [entityStatus, setEntityStatus] = React.useState<"idle" | "loading" | "ready" | "error">(
    entityLoader ? "loading" : "ready",
  );

  React.useEffect(() => {
    sectionStatesRef.current = sectionStates;
  }, [sectionStates]);

  React.useEffect(() => {
    const validation = validateDetailsPageSchema(schema);
    if (!validation.valid) {
      console.error("Invalid details schema", validation.errors);
    }
  }, [schema]);

  const runtimeCtx = React.useMemo<SectionRuntimeCtx<TEntity>>(
    () => ({
      ...runtime,
      entity,
    }),
    [entity, runtime],
  );

  React.useEffect(() => {
    if (!entityLoader) {
      setEntity(runtime.entity);
      setEntityStatus("ready");
      return;
    }
    const controller = new AbortController();
    setEntityStatus("loading");
    void entityLoader({ runtime: runtimeCtx, abortSignal: controller.signal })
      .then((loadedEntity) => {
        if (controller.signal.aborted) return;
        setEntity(loadedEntity);
        setEntityStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted && isAbortLikeError(error)) return;
        setEntityStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [entityLoader, runtime.entity, runtime.entityId]);

  const loadSection = React.useCallback(
    async (section: SectionDefinition, tabId?: string, force = false): Promise<void> => {
      const visibility = evaluateSectionVisibility(section, runtimeCtx, noAccessBehavior);
      if (!visibility.visible || !visibility.hasAccess) return;

      const instanceKey = getSectionInstanceKey(section, runtimeCtx, tabId);
      const existingState = sectionStatesRef.current[instanceKey];
      if (
        !force &&
        existingState &&
        (existingState.status === "success" || existingState.status === "empty")
      ) {
        return;
      }

      const activePromise = inFlightPromisesRef.current.get(instanceKey);
      if (!force && activePromise) {
        await activePromise;
        return;
      }

      const previousController = inFlightControllersRef.current.get(instanceKey);
      if (previousController) previousController.abort();

      const controller = new AbortController();
      inFlightControllersRef.current.set(instanceKey, controller);
      sectionMetaRef.current.set(instanceKey, { tabId });

      setSectionStates((current) => ({
        ...current,
        [instanceKey]: { status: "loading" },
      }));

      const execute = (async () => {
        try {
          const loadCtx = {
            runtime: runtimeCtx,
            abortSignal: controller.signal,
            cache: createSectionCacheApi(sectionCacheRef.current),
            api: runtimeCtx.api ?? {},
            sectionId: instanceKey,
            tabId,
          };
          const loaded = await loadSectionData(section, loadCtx, retryOptions);
          if (controller.signal.aborted) return;
          const nextStatus = isSectionDataEmpty(loaded) ? "empty" : "success";
          setSectionStates((current) => ({
            ...current,
            [instanceKey]: {
              status: nextStatus,
              data: loaded,
            },
          }));
        } catch (error) {
          if (controller.signal.aborted && isAbortLikeError(error)) {
            const activeController =
              inFlightControllersRef.current.get(instanceKey);
            if (activeController === controller) {
              setSectionStates((current) => {
                const existing = current[instanceKey];
                if (!existing || existing.status !== "loading") {
                  return current;
                }
                return {
                  ...current,
                  [instanceKey]: { status: "idle" },
                };
              });
            }
            return;
          }
          setSectionStates((current) => ({
            ...current,
            [instanceKey]: {
              status: "error",
              error: safeSectionError(error as Error),
            },
          }));
        } finally {
          inFlightPromisesRef.current.delete(instanceKey);
          const currentController = inFlightControllersRef.current.get(instanceKey);
          if (currentController === controller) {
            inFlightControllersRef.current.delete(instanceKey);
          }
        }
      })();

      inFlightPromisesRef.current.set(instanceKey, execute);
      await execute;
    },
    [noAccessBehavior, retryOptions, runtimeCtx],
  );

  React.useEffect(() => {
    return () => {
      for (const controller of inFlightControllersRef.current.values()) {
        controller.abort();
      }
      inFlightControllersRef.current.clear();
      inFlightPromisesRef.current.clear();
    };
  }, []);

  const visibleHeaderSections = React.useMemo(() => {
    return sortByOrder(schema.header ?? []).filter(
      (section) => evaluateSectionVisibility(section, runtimeCtx, noAccessBehavior).visible,
    );
  }, [noAccessBehavior, runtimeCtx, schema.header]);

  const visibleBodySections = React.useMemo(() => {
    return sortByOrder(schema.body ?? []).filter(
      (section) => evaluateSectionVisibility(section, runtimeCtx, noAccessBehavior).visible,
    );
  }, [noAccessBehavior, runtimeCtx, schema.body]);

  const visibleTabs = React.useMemo(() => {
    return sortByOrder(schema.tabs ?? [])
      .filter((tab) => evaluateTabVisibility(tab, runtimeCtx).visible)
      .map((tab) => ({
        ...tab,
        sections: sortByOrder(tab.sections).filter(
          (section) =>
            evaluateSectionVisibility(section, runtimeCtx, noAccessBehavior).visible,
        ),
      }))
      .filter((tab) => tab.sections.length > 0);
  }, [noAccessBehavior, runtimeCtx, schema.tabs]);

  const tabHostTabs = React.useMemo<TabHostTab[]>(
    () =>
      visibleTabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        icon: tab.icon,
        loadingStrategy: resolveTabLoadingStrategy(tab),
      })),
    [visibleTabs],
  );

  const [internalActiveTab, setInternalActiveTab] = React.useState<string>(
    initialTabId ?? tabHostTabs[0]?.id ?? "",
  );
  const resolvedActiveTab = activeTabId ?? internalActiveTab;

  React.useEffect(() => {
    if (!resolvedActiveTab) return;
    for (const [instanceKey, meta] of sectionMetaRef.current.entries()) {
      if (!meta.tabId || meta.tabId === resolvedActiveTab) continue;
      const controller = inFlightControllersRef.current.get(instanceKey);
      controller?.abort();
    }
  }, [resolvedActiveTab]);

  React.useEffect(() => {
    if (entityStatus !== "ready") return;
    for (const section of visibleHeaderSections) {
      if (resolveSectionLoadingStrategy(section) === "eager") {
        void loadSection(section);
      }
    }
    for (const section of visibleBodySections) {
      if (resolveSectionLoadingStrategy(section) === "eager") {
        void loadSection(section);
      }
    }
  }, [entityStatus, loadSection, visibleBodySections, visibleHeaderSections]);

  const contextValue = React.useMemo<SectionHostContextValue<TEntity>>(
    () => ({
      runtime: runtimeCtx,
      schema,
      sectionStates,
      reloadSection: (section, tabId) => loadSection(section, tabId, true),
    }),
    [loadSection, runtimeCtx, schema, sectionStates],
  );

  if (entityStatus === "error") {
    return (
      <div className={cn("space-y-4", className)}>
        <SectionErrorState
          title="Unable to load details"
          description="The details record could not be loaded."
        />
      </div>
    );
  }

  const resolveGridClasses = (columns: number) => {
    const normalized = Math.max(1, Math.min(columns, 4));
    const classes = ["grid grid-cols-1 gap-4"];
    if (normalized >= 2) classes.push("md:grid-cols-2");
    if (normalized >= 3) classes.push("xl:grid-cols-3");
    if (normalized >= 4) classes.push("2xl:grid-cols-4");
    return classes.join(" ");
  };

  const renderSectionList = (sections: SectionDefinition[], tabId?: string) => (
    <div
      className={cn(
        sectionColumns > 1 ? resolveGridClasses(sectionColumns) : "space-y-4",
        sectionsContainerClassName,
      )}
    >
      {sections.map((section) => {
        const sectionKey = getSectionInstanceKey(section, runtimeCtx, tabId);
        const sectionState = sectionStates[sectionKey] ?? { status: "idle" };
        const container = resolveSectionContainer?.(section, tabId);
        return (
          <ManagedSection
            key={sectionKey}
            section={section}
            runtime={runtimeCtx}
            tabId={tabId}
            noAccessBehavior={noAccessBehavior}
            sectionsContainerClassName={sectionsContainerClassName}
            sectionContainerClassName={container?.className}
            sectionContainerStyle={container?.style}
            sectionState={sectionState}
            loadSection={loadSection}
          />
        );
      })}
    </div>
  );

  return (
    <SectionHostContext.Provider value={contextValue}>
      <div className={cn("space-y-8 animate-in fade-in duration-700", className)}>
        {renderSectionList(visibleHeaderSections)}
        {visibleBodySections.length > 0 ? renderSectionList(visibleBodySections) : null}
        {visibleTabs.length > 0 ? (
          <TabHost
            tabs={tabHostTabs}
            activeTab={resolvedActiveTab}
            defaultActiveTab={initialTabId ?? tabHostTabs[0]?.id}
            onActiveTabChange={(tabId) => {
              setInternalActiveTab(tabId);
              onActiveTabChange?.(tabId);
            }}
            onTabActivated={(tabId) => {
              const tab = visibleTabs.find((entry) => entry.id === tabId);
              if (!tab) return;
              const tabStrategy = resolveTabLoadingStrategy(tab);
              for (const section of tab.sections) {
                const sectionStrategy = resolveSectionLoadingStrategy(section);
                if (tabStrategy === "eager" || sectionStrategy === "eager") {
                  void loadSection(section, tab.id);
                }
              }
            }}
            renderContent={(tab, isVisited) => {
              if (!isVisited) {
                return <SectionSkeleton lines={2} />;
              }
              const tabDefinition = visibleTabs.find((entry) => entry.id === tab.id);
              if (!tabDefinition) return null;
              return renderSectionList(tabDefinition.sections, tabDefinition.id);
            }}
            renderTabList={renderTabList}
            tabListClassName={tabListClassName}
            tabTriggerClassName={tabTriggerClassName}
            activeTabTriggerClassName={activeTabTriggerClassName}
            inactiveTabTriggerClassName={inactiveTabTriggerClassName}
          />
        ) : null}
      </div>
    </SectionHostContext.Provider>
  );
}

export type SectionTabDefinition = TabDefinition;

export function sectionRuntimeFromEntity(
  entityId: string | number,
  entity: unknown,
): SectionRuntimeCtx {
  return {
    entityId,
    entity: toRecord(entity),
  };
}
