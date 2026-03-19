import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState as DynamicPaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { createInitialFilterState } from "@/widgets/model-table/filtering/state";
import type {
  BaseModelTableFieldsInput,
  TableBootstrapInitialState,
} from "../types";
import type {
  DynamicModelTableDevtoolsConfig,
  DynamicModelTableInitVariables,
} from "../config/types";
import type { PersistedTableState } from "../hooks/useTablePersistence";
import type { ModelTableContentSectionVisibility } from "./content/types";

const DEFAULT_SECTION_VISIBILITY: Required<ModelTableContentSectionVisibility> = {
  header: true,
  topActions: true,
  toolbar: true,
  bulkActionsBar: true,
  footer: false,
  dialogs: true,
};

const DEFAULT_BACKEND_ORDER_BY = ["-id"] as const;

type GraphqlLikeError = {
  message?: string | null;
  graphQLErrors?: Array<{ message?: string | null }> | null;
  errors?: Array<{ message?: string | null }> | null;
  networkError?: {
    statusCode?: number | null;
    result?: {
      errors?: Array<{ message?: string | null }>;
    } | null;
  } | null;
};

export type ResolvedInitialTableState = {
  page: number;
  perPage: number;
  filterVariables: Record<string, unknown>;
  advancedFilters: ReturnType<typeof createInitialFilterState>;
};

export function resolveDevtoolsEnabled(
  devtools?: boolean | DynamicModelTableDevtoolsConfig,
): boolean {
  if (typeof devtools === "boolean") {
    return devtools;
  }
  return devtools?.enabled ?? false;
}

export function resolveSectionVisibility(
  visibility?: ModelTableContentSectionVisibility,
): Required<ModelTableContentSectionVisibility> {
  return {
    ...DEFAULT_SECTION_VISIBILITY,
    ...(visibility ?? {}),
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function collectExplicitFieldAccessors(
  fields: {
    include?: Array<string | { accessor?: string }>;
    add: Array<{ accessor: string }>;
  },
): string[] {
  const explicit = new Set<string>();
  (fields.include ?? []).forEach((entry) => {
    const accessor = typeof entry === "string" ? entry : entry.accessor;
    if (accessor) {
      explicit.add(accessor);
    }
  });
  fields.add.forEach((entry) => {
    if (entry.accessor) {
      explicit.add(entry.accessor);
    }
  });
  return Array.from(explicit);
}

export function collectIncludedFieldAccessors(
  fields: {
    include?: Array<string | { accessor?: string }>;
  },
): string[] {
  const ordered = new Set<string>();
  (fields.include ?? []).forEach((entry) => {
    const accessor = typeof entry === "string" ? entry : entry.accessor;
    if (accessor) {
      ordered.add(accessor);
    }
  });
  return Array.from(ordered);
}

export function mergeManagedFieldExclusions<TSource extends object>(
  fields: BaseModelTableFieldsInput<TSource> | undefined,
  exclusions: Set<string>,
): BaseModelTableFieldsInput<TSource> | undefined {
  if (exclusions.size === 0) {
    return fields;
  }

  const nextExclude = Array.from(exclusions);
  if (!fields) {
    return { exclude: nextExclude };
  }
  if (Array.isArray(fields)) {
    return {
      include: fields,
      exclude: nextExclude,
    };
  }
  return {
    ...fields,
    exclude: Array.from(new Set([...(fields.exclude ?? []), ...nextExclude])),
  };
}

export function extractGraphqlMessages(error: unknown): string[] {
  const candidate = error as GraphqlLikeError | null | undefined;
  const messages = new Set<string>();

  const append = (value?: string | null) => {
    const trimmed = String(value || "").trim();
    if (trimmed) {
      messages.add(trimmed);
    }
  };

  append(candidate?.message);
  candidate?.graphQLErrors?.forEach((entry) => append(entry?.message));
  candidate?.errors?.forEach((entry) => append(entry?.message));
  candidate?.networkError?.result?.errors?.forEach((entry) =>
    append(entry?.message),
  );

  return Array.from(messages);
}

export function extractMissingGraphqlField(error: unknown): string | null {
  for (const message of extractGraphqlMessages(error)) {
    const match = message.match(
      /Cannot query field ['"]?([A-Za-z0-9_]+)['"]?\s+on type/i,
    );
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

export function hasRecoverableTableBadRequest(error: unknown): boolean {
  const candidate = error as GraphqlLikeError | null | undefined;
  if (candidate?.networkError?.statusCode === 400) {
    return true;
  }

  return extractGraphqlMessages(error).some((message) =>
    message.includes("Response not successful: Received status code 400"),
  );
}

function extractPermissionCodeFromMessage(message: string): string | null {
  const match = message.match(/Permission required:\s*([a-z0-9_.-]+)/i);
  return match?.[1] ?? null;
}

export function localizeTableErrorMessage(error: Error): string {
  const graphqlMessages = extractGraphqlMessages(error);
  const rawMessage =
    graphqlMessages.find(
      (message) =>
        !message.includes("Response not successful: Received status code 400"),
    ) ??
    error.message ??
    "Une erreur est survenue.";

  for (const message of graphqlMessages) {
    const permissionCode = extractPermissionCodeFromMessage(message);
    if (permissionCode) {
      return `Acces refuse : permission requise (${permissionCode}).`;
    }
  }
  return rawMessage;
}

export function toOrderByEntries(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveOrderByWithFallback(value: unknown): string[] {
  const normalized = toOrderByEntries(value);
  if (normalized.length > 0) {
    return normalized;
  }
  return [...DEFAULT_BACKEND_ORDER_BY];
}

function toStringEntries(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.floor(value);
}

export function resolveInitialTableState(
  initVariables?: DynamicModelTableInitVariables,
  fallbackPerPage?: number,
): ResolvedInitialTableState {
  const filterVariables = isRecord(initVariables) ? { ...initVariables } : {};

  const page = toPositiveInteger(filterVariables.page) ?? 1;
  const perPage =
    toPositiveInteger(filterVariables.perPage ?? filterVariables.per_page) ??
    fallbackPerPage ??
    10;
  delete filterVariables.page;
  delete filterVariables.perPage;
  delete filterVariables.per_page;

  const normalizedPresets = (() => {
    const explicitPresets = toStringEntries(filterVariables.presets);
    if (explicitPresets.length > 0) {
      return explicitPresets;
    }
    return toStringEntries(filterVariables.preset);
  })();
  if (normalizedPresets.length > 0) {
    filterVariables.presets = normalizedPresets;
  } else {
    delete filterVariables.presets;
  }
  delete filterVariables.preset;

  const normalizedDistinctOn = toStringEntries(filterVariables.distinctOn);
  if (normalizedDistinctOn.length > 0) {
    filterVariables.distinctOn = normalizedDistinctOn;
  } else {
    delete filterVariables.distinctOn;
  }

  const normalizedOrderBy = resolveOrderByWithFallback(
    filterVariables.orderBy ?? filterVariables.order_by,
  );
  filterVariables.orderBy = normalizedOrderBy;
  delete filterVariables.order_by;

  const advancedFilters = createInitialFilterState();
  advancedFilters.selectedPresets = normalizedPresets;
  advancedFilters.distinctOn = normalizedDistinctOn;
  advancedFilters.orderBy = normalizedOrderBy;

  return {
    page,
    perPage,
    filterVariables,
    advancedFilters,
  };
}

export function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

export function areBooleanMapsEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

export function getSelectedRowIds(rowSelection: RowSelectionState): string[] {
  return Object.entries(rowSelection)
    .filter(([, isSelected]) => isSelected)
    .map(([rowId]) => rowId);
}

export function areNumberMapsEqual(
  left: Record<string, number>,
  right: Record<string, number>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

export function isPersistedTableStateEqual(
  left: PersistedTableState | null,
  right: PersistedTableState | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return left === right;
  }

  return (
    areStringArraysEqual(left.columnOrder, right.columnOrder) &&
    areBooleanMapsEqual(left.columnVisibility, right.columnVisibility) &&
    areNumberMapsEqual(left.columnWidths ?? {}, right.columnWidths ?? {}) &&
    left.perPage === right.perPage &&
    left.density === right.density &&
    left.wrapCells === right.wrapCells &&
    (left.visibilityVersion ?? 0) === (right.visibilityVersion ?? 0)
  );
}

export function buildPersistedStateFromBootstrap(
  initialState: TableBootstrapInitialState | undefined,
  fallback: PersistedTableState | null,
): PersistedTableState | null {
  if (!initialState) {
    return fallback;
  }

  const hasBootstrapLayoutState =
    Array.isArray(initialState.columnOrder) ||
    (isRecord(initialState.columnVisibility) &&
      Object.keys(initialState.columnVisibility).length > 0) ||
    (isRecord(initialState.columnWidths) &&
      Object.keys(initialState.columnWidths).length > 0) ||
    typeof initialState.density === "string" ||
    typeof initialState.wrapCells === "boolean" ||
    typeof initialState.visibilityVersion === "number";

  if (!hasBootstrapLayoutState) {
    return fallback;
  }

  return {
    columnOrder: Array.isArray(initialState.columnOrder)
      ? initialState.columnOrder
      : fallback?.columnOrder ?? [],
    columnVisibility: isRecord(initialState.columnVisibility)
      ? (initialState.columnVisibility as Record<string, boolean>)
      : fallback?.columnVisibility ?? {},
    columnWidths: isRecord(initialState.columnWidths)
      ? (initialState.columnWidths as Record<string, number>)
      : fallback?.columnWidths ?? {},
    perPage: initialState.pageSize || fallback?.perPage || 10,
    density:
      initialState.density === "compact" ||
      initialState.density === "comfortable" ||
      initialState.density === "spacious"
        ? initialState.density
        : fallback?.density ?? "compact",
    wrapCells:
      typeof initialState.wrapCells === "boolean"
        ? initialState.wrapCells
        : fallback?.wrapCells ?? false,
    visibilityVersion:
      typeof initialState.visibilityVersion === "number"
        ? initialState.visibilityVersion
        : fallback?.visibilityVersion,
  };
}

export function isPaginationStateEqual(
  left: DynamicPaginationState,
  right: DynamicPaginationState,
): boolean {
  return left.pageIndex === right.pageIndex && left.pageSize === right.pageSize;
}

export function isExpandedStateEqual(
  left: ExpandedState,
  right: ExpandedState,
): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }
  return areBooleanMapsEqual(left, right);
}

export function formatFallbackCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function normalizePdfUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /\.pdf(?:[?#].*)?$/i.test(trimmed) ? trimmed : null;
}

export function getPdfLabel(pdfUrl: string): string {
  const normalizedPath = pdfUrl.split("#")[0]?.split("?")[0] ?? pdfUrl;
  const segments = normalizedPath.split("/").filter(Boolean);
  return segments[segments.length - 1] || "Preview PDF";
}

export function resolvePdfPreviewSrc(
  pdfUrl: string,
  reloadKey: number,
): string {
  if (!pdfUrl || reloadKey <= 0 || pdfUrl.startsWith("blob:")) {
    return pdfUrl;
  }

  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const parsed = new URL(pdfUrl, base);
    parsed.searchParams.set("_pdf_refresh", String(reloadKey));
    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(pdfUrl);
    if (isAbsolute) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const separator = pdfUrl.includes("?") ? "&" : "?";
    return `${pdfUrl}${separator}_pdf_refresh=${reloadKey}`;
  }
}

export function resolveRowId(
  row: Record<string, unknown>,
  index: number,
  primaryKey: string,
): string {
  const candidate = row[primaryKey] ?? row.id;
  if (typeof candidate === "string" || typeof candidate === "number") {
    return String(candidate);
  }
  return String(index);
}

export type { ColumnSizingState, DynamicPaginationState, ExpandedState };
