import type {
  NoAccessBehavior,
  ResolvedSectionAction,
  RetryOptions,
  SectionAction,
  SectionActionCtx,
  SectionDefinition,
  SectionLoadCacheApi,
  SectionLoadCtx,
  SectionLoadingStrategy,
  SectionRuntimeCtx,
  SectionState,
  SectionStatus,
  TabDefinition,
} from "./sectionTypes";
import { hasRequiredPermissions } from "./sectionTypes";

export const DEFAULT_SECTION_LOADING_STRATEGY_BY_KIND: Record<
  SectionDefinition["kind"],
  SectionLoadingStrategy
> = {
  header: "eager",
  general: "eager",
  metrics: "lazy",
  table: "lazy",
  list: "lazy",
  timeline: "lazy",
  attachments: "lazy",
  settings: "lazy",
  model: "eager",
  custom: "lazy",
};

export const DEFAULT_TAB_LOADING_STRATEGY: SectionLoadingStrategy = "lazy";
export const DEFAULT_NO_ACCESS_BEHAVIOR: NoAccessBehavior = "hide";

export type SectionVisibilityResult = {
  visible: boolean;
  hasAccess: boolean;
  disabledState?: { disabled: boolean; reason?: string };
  noAccessBehavior: NoAccessBehavior;
};

export type TabVisibilityResult = {
  visible: boolean;
  hasAccess: boolean;
};

export function createSectionCacheApi(
  map: Map<string, unknown>,
): SectionLoadCacheApi {
  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    has: (key) => map.has(key),
    delete: (key) => {
      map.delete(key);
    },
  };
}

export function resolveSectionLoadingStrategy(
  section: SectionDefinition,
): SectionLoadingStrategy {
  return (
    section.loadingStrategy ?? DEFAULT_SECTION_LOADING_STRATEGY_BY_KIND[section.kind]
  );
}

export function resolveTabLoadingStrategy(
  tab: TabDefinition,
): SectionLoadingStrategy {
  return tab.loadingStrategy ?? DEFAULT_TAB_LOADING_STRATEGY;
}

export function resolveSectionNoAccessBehavior(
  section: SectionDefinition,
  fallback: NoAccessBehavior = DEFAULT_NO_ACCESS_BEHAVIOR,
): NoAccessBehavior {
  return section.noAccessBehavior ?? fallback;
}

export function getSectionInstanceKey(
  section: Pick<SectionDefinition, "id" | "cacheKey">,
  runtime: Pick<SectionRuntimeCtx, "entityId">,
  tabId?: string,
): string {
  const stable = section.cacheKey || section.id;
  const scope = tabId ? `tab:${tabId}` : "root";
  return `${scope}|entity:${String(runtime.entityId)}|section:${stable}`;
}

function hasAbortMessage(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("abort");
}

function isAbortErrorInternal(error: unknown, visited: Set<unknown>): boolean {
  if (!error) return false;

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") return true;
    if (hasAbortMessage(error.message)) return true;
  }

  if (typeof error !== "object") return false;
  if (visited.has(error)) return false;
  visited.add(error);

  const candidate = error as {
    name?: unknown;
    message?: unknown;
    cause?: unknown;
    networkError?: unknown;
    originalError?: unknown;
  };

  if (typeof candidate.name === "string" && candidate.name === "AbortError") {
    return true;
  }
  if (typeof candidate.message === "string" && hasAbortMessage(candidate.message)) {
    return true;
  }

  return (
    isAbortErrorInternal(candidate.networkError, visited) ||
    isAbortErrorInternal(candidate.cause, visited) ||
    isAbortErrorInternal(candidate.originalError, visited)
  );
}

export function isAbortLikeError(error: unknown): boolean {
  return isAbortErrorInternal(error, new Set<unknown>());
}

function toSafeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error("Section data load failed.");
}

function resolveSelectedData<TData>(
  section: SectionDefinition<TData>,
  runtime: SectionRuntimeCtx,
): TData | undefined {
  if (section.select) return section.select(runtime);
  if (section.dataSource === "entity") return runtime.entity as TData;
  if (section.kind === "header" || section.kind === "general") {
    return runtime.entity as TData;
  }
  return undefined;
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

function isEmptyObject(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.keys(value as Record<string, unknown>).length === 0;
}

export function isSectionDataEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  if (isEmptyArray(value)) return true;
  if (isEmptyObject(value)) return true;
  return false;
}

async function sleep(ms: number, abortSignal: AbortSignal): Promise<void> {
  if (abortSignal.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    abortSignal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function loadSectionData<TData>(
  section: SectionDefinition<TData>,
  loadCtx: SectionLoadCtx,
  options: RetryOptions = {},
): Promise<TData | undefined> {
  const retries = Math.max(0, options.retries ?? 0);
  const backoffMs = Math.max(0, options.backoffMs ?? 200);
  const backoffMultiplier = Math.max(1, options.backoffMultiplier ?? 2);
  // Some transport stacks can emit abort-like errors without this section's signal being aborted.
  // Allow one implicit retry for that transient path.
  const implicitAbortLikeRetries = 1;

  const cached = loadCtx.cache.get<TData>(loadCtx.sectionId);
  if (cached !== undefined) return cached;

  if (!section.load) {
    return resolveSelectedData(section, loadCtx.runtime);
  }

  let attempt = 0;
  let delayMs = backoffMs;
  let abortLikeRetryCount = 0;

  while (true) {
    if (loadCtx.abortSignal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      const data = await section.load(loadCtx);
      loadCtx.cache.set(loadCtx.sectionId, data);
      return data;
    } catch (error) {
      const abortLike = isAbortLikeError(error);
      if (loadCtx.abortSignal.aborted && abortLike) throw error;

      const canRetryConfigured = attempt < retries;
      const canRetryAbortLike =
        abortLike && abortLikeRetryCount < implicitAbortLikeRetries;
      if (!canRetryConfigured && !canRetryAbortLike) throw toSafeError(error);

      attempt += 1;
      if (canRetryAbortLike) {
        abortLikeRetryCount += 1;
      }
      await sleep(delayMs, loadCtx.abortSignal);
      delayMs = Math.ceil(delayMs * backoffMultiplier);
    }
  }
}

export function toSectionState<TData>(
  status: SectionStatus,
  data?: TData,
  error?: Error,
): SectionState<TData> {
  return { status, data, error };
}

export function evaluateSectionVisibility(
  section: SectionDefinition,
  runtime: SectionRuntimeCtx,
  fallbackNoAccess: NoAccessBehavior = DEFAULT_NO_ACCESS_BEHAVIOR,
): SectionVisibilityResult {
  const visibleByPredicate = section.visibleIf ? section.visibleIf(runtime) : true;
  if (!visibleByPredicate) {
    return {
      visible: false,
      hasAccess: true,
      noAccessBehavior: resolveSectionNoAccessBehavior(section, fallbackNoAccess),
    };
  }

  const hasAccess = hasRequiredPermissions(section.permissions, runtime);
  const noAccessBehavior = resolveSectionNoAccessBehavior(section, fallbackNoAccess);
  if (!hasAccess && noAccessBehavior === "hide") {
    return { visible: false, hasAccess, noAccessBehavior };
  }

  const disabledState = section.disabledIf?.(runtime);
  return {
    visible: true,
    hasAccess,
    disabledState,
    noAccessBehavior,
  };
}

export function evaluateTabVisibility(
  tab: TabDefinition,
  runtime: SectionRuntimeCtx,
): TabVisibilityResult {
  const visibleByPredicate = tab.visibleIf ? tab.visibleIf(runtime) : true;
  if (!visibleByPredicate) return { visible: false, hasAccess: true };
  const hasAccess = hasRequiredPermissions(tab.permissions, runtime);
  return { visible: hasAccess, hasAccess };
}

export function resolveSectionActions<TData>(
  section: SectionDefinition<TData>,
  runtime: SectionRuntimeCtx,
  state: SectionState<TData>,
  reload: () => Promise<void>,
): ResolvedSectionAction<TData>[] {
  const configured = section.actions?.(runtime) ?? [];
  const actionCtx: SectionActionCtx<TData> = {
    section,
    runtime,
    state,
    reload,
  };
  const visibleActions = configured.filter((action) =>
    hasRequiredPermissions(action.permissions, runtime),
  );

  return visibleActions.map((action) => {
    const isDisabled =
      typeof action.disabled === "function"
        ? action.disabled(actionCtx)
        : Boolean(action.disabled);
    const reason =
      typeof action.disabledReason === "function"
        ? action.disabledReason(actionCtx)
        : action.disabledReason;

    return {
      ...action,
      disabled: isDisabled,
      disabledReason: reason,
    };
  });
}

export function safeSectionError(error: Error): Error {
  const message = error?.message ? "Section load failed." : "Section load failed.";
  const safe = new Error(message);
  safe.name = error.name || "SectionError";
  return safe;
}

export function asSectionActionArray<TData>(
  actions: SectionAction<TData>[] | undefined,
): SectionAction<TData>[] {
  return Array.isArray(actions) ? actions : [];
}
