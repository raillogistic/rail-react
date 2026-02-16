import type React from "react";

export type SectionKind =
  | "header"
  | "general"
  | "metrics"
  | "table"
  | "list"
  | "timeline"
  | "attachments"
  | "settings"
  | "custom";

export type SectionDataSource =
  | "entity"
  | "related"
  | "activity"
  | "documents"
  | "computed";

export type SectionLoadingStrategy = "eager" | "lazy";
export type SectionStatus = "idle" | "loading" | "success" | "empty" | "error";
export type NoAccessBehavior = "hide" | "state";
export type SectionActionTone = "default" | "muted" | "danger" | "primary";
export type RetryOptions = {
  retries?: number;
  backoffMs?: number;
  backoffMultiplier?: number;
};
export type PermissionBag =
  | string[]
  | Set<string>
  | Record<string, boolean>
  | undefined;

export type SectionPermissionChecker = (
  permissionKey: string,
  ctx: SectionRuntimeCtx,
) => boolean;

export type SectionRuntimeCtx<
  TEntity = unknown,
  TUser = unknown,
> = {
  entityId: string | number;
  entity?: TEntity;
  locale?: string;
  timezone?: string;
  user?: TUser;
  permissions?: PermissionBag;
  navigate?: (to: string, options?: unknown) => void;
  router?: unknown;
  api?: Record<string, unknown>;
  can?: SectionPermissionChecker;
};

export type SectionLoadCacheApi = {
  get: <TValue = unknown>(key: string) => TValue | undefined;
  set: (key: string, value: unknown) => void;
  has: (key: string) => boolean;
  delete: (key: string) => void;
};

export type SectionLoadCtx = {
  runtime: SectionRuntimeCtx;
  abortSignal: AbortSignal;
  cache: SectionLoadCacheApi;
  api: Record<string, unknown>;
  sectionId: string;
  tabId?: string;
};

export type SectionState<TData = unknown> = {
  status: SectionStatus;
  data?: TData;
  error?: Error;
};

export type SectionDisabledState = {
  disabled: boolean;
  reason?: string;
};

export type SectionActionCtx<TData = unknown> = {
  section: SectionDefinition<TData>;
  runtime: SectionRuntimeCtx;
  state: SectionState<TData>;
  reload: () => Promise<void>;
};

export type SectionAction<TData = unknown> = {
  id: string;
  label: string;
  tone?: SectionActionTone;
  icon?: React.ReactNode;
  ariaLabel?: string;
  permissions?: string[];
  disabled?: boolean | ((ctx: SectionActionCtx<TData>) => boolean);
  disabledReason?: string | ((ctx: SectionActionCtx<TData>) => string | undefined);
  onClick: (ctx: SectionActionCtx<TData>) => void | Promise<void>;
};

export type ResolvedSectionAction<TData = unknown> = SectionAction<TData> & {
  disabled: boolean;
  disabledReason?: string;
};

export type SectionRenderArgs<TData = unknown> = {
  section: SectionDefinition<TData>;
  runtime: SectionRuntimeCtx;
  state: SectionState<TData>;
  data: TData | undefined;
  disabledState?: SectionDisabledState;
  actions: ResolvedSectionAction<TData>[];
  reload: () => Promise<void>;
};

export type SectionEmptyArgs<TData = unknown> = Omit<
  SectionRenderArgs<TData>,
  "state"
> & {
  state: SectionState<TData> & { status: "empty" };
};

export type SectionErrorArgs = {
  sectionId: string;
  runtime: SectionRuntimeCtx;
  error: Error;
  retry: () => Promise<void>;
};

export type SectionDefinition<TData = unknown> = {
  id: string;
  title?: string;
  description?: string;
  kind: SectionKind;
  order?: number;
  dataSource?: SectionDataSource;
  loadingStrategy?: SectionLoadingStrategy;
  cacheKey?: string;
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: (ctx: SectionRuntimeCtx) => SectionDisabledState;
  noAccessBehavior?: NoAccessBehavior;
  load?: (ctx: SectionLoadCtx) => Promise<TData>;
  select?: (ctx: SectionRuntimeCtx) => TData | undefined;
  render: (args: SectionRenderArgs<TData>) => React.ReactNode;
  empty?: (args: SectionEmptyArgs<TData>) => React.ReactNode;
  error?: (args: SectionErrorArgs) => React.ReactNode;
  skeleton?: () => React.ReactNode;
  actions?: (ctx: SectionRuntimeCtx) => SectionAction<TData>[];
  testId?: string;
};

export type TabDefinition = {
  id: string;
  title: string;
  order?: number;
  loadingStrategy?: SectionLoadingStrategy;
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  sections: SectionDefinition[];
};

export type DetailsPageSchema = {
  header: SectionDefinition[];
  tabs?: TabDefinition[];
  body?: SectionDefinition[];
};

export type DetailsSchemaValidationResult = {
  valid: boolean;
  errors: string[];
};

export function can(permissionKey: string, ctx: SectionRuntimeCtx): boolean {
  if (!permissionKey) return true;
  if (ctx.can) {
    return Boolean(ctx.can(permissionKey, ctx));
  }

  const source = ctx.permissions;
  if (!source) return false;
  if (Array.isArray(source)) return source.includes(permissionKey);
  if (source instanceof Set) return source.has(permissionKey);
  return Boolean(source[permissionKey]);
}

export function hasRequiredPermissions(
  required: string[] | undefined,
  ctx: SectionRuntimeCtx,
): boolean {
  if (!required || required.length === 0) return true;
  return required.every((permission) => can(permission, ctx));
}

export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER),
  );
}

export function validateDetailsPageSchema(
  schema: DetailsPageSchema,
): DetailsSchemaValidationResult {
  const errors: string[] = [];
  const knownSections = new Set<string>();
  const knownTabs = new Set<string>();

  if (!Array.isArray(schema.header)) {
    errors.push("Schema.header must be an array.");
  }

  const registerSection = (section: SectionDefinition, context: string) => {
    if (!section.id) {
      errors.push(`${context}: section id is required.`);
      return;
    }
    if (knownSections.has(section.id)) {
      errors.push(`${context}: duplicate section id "${section.id}".`);
      return;
    }
    knownSections.add(section.id);
  };

  for (const section of schema.header ?? []) {
    registerSection(section, "header");
  }
  for (const section of schema.body ?? []) {
    registerSection(section, "body");
  }

  for (const tab of schema.tabs ?? []) {
    if (!tab.id) {
      errors.push("tabs: tab id is required.");
      continue;
    }
    if (knownTabs.has(tab.id)) {
      errors.push(`tabs: duplicate tab id "${tab.id}".`);
      continue;
    }
    knownTabs.add(tab.id);
    if (!Array.isArray(tab.sections)) {
      errors.push(`tabs.${tab.id}: sections must be an array.`);
      continue;
    }
    for (const section of tab.sections) {
      registerSection(section, `tabs.${tab.id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
