import { getTreeStats } from "./tree/operations";
import type {
  FilterFormState,
  RelationFunctionFilter,
  RelationFunctionMode,
} from "./types";

const MODE_SUFFIX: Record<RelationFunctionMode, string> = {
  some: "Some",
  none: "None",
  every: "Every",
  count: "Count",
  agg: "Agg",
};

export function hasMeaningfulValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function normalizeFilterFormState(
  state: FilterFormState,
): FilterFormState {
  return {
    ...state,
    relationFunctions: Array.isArray(state.relationFunctions)
      ? state.relationFunctions
      : [],
  };
}

export function mergeWhereClauses(
  clauses: Array<Record<string, unknown> | null | undefined>,
): Record<string, unknown> | undefined {
  const normalized = clauses.filter(
    (entry): entry is Record<string, unknown> =>
      !!entry && Object.keys(entry).length > 0,
  );
  if (normalized.length === 0) return undefined;
  if (normalized.length === 1) return normalized[0];
  return { AND: normalized };
}

function buildRelationFunctionLeaf(
  relationFilter: RelationFunctionFilter,
  relationKey: string,
): Record<string, unknown> | null {
  const {
    mode,
    fieldName,
    operator,
    value,
    aggFunction,
  } = relationFilter;

  if (!operator) return null;

  if (mode === "count") {
    if (!hasMeaningfulValue(value)) return null;
    return {
      [`${relationKey}${MODE_SUFFIX.count}`]: {
        [operator]: value,
      },
    };
  }

  if (mode === "agg") {
    if (!fieldName || !aggFunction || !hasMeaningfulValue(value)) return null;
    return {
      [`${relationKey}${MODE_SUFFIX.agg}`]: {
        field: fieldName,
        [aggFunction]: {
          [operator]: value,
        },
      },
    };
  }

  if (!fieldName) return null;
  if (operator !== "isNull" && !hasMeaningfulValue(value)) return null;

  return {
    [`${relationKey}${MODE_SUFFIX[mode]}`]: {
      [fieldName]: {
        [operator]: value,
      },
    },
  };
}

function wrapNestedRelationPath(
  relationPath: string[],
  leafClause: Record<string, unknown>,
): Record<string, unknown> {
  if (relationPath.length <= 1) return leafClause;
  return relationPath
    .slice(0, -1)
    .reverse()
    .reduce<Record<string, unknown>>(
      (acc, segment) => ({ [segment]: acc }),
      leafClause,
    );
}

export function relationFunctionToWhereClause(
  relationFilter: RelationFunctionFilter,
): Record<string, unknown> | null {
  const path =
    relationFilter.relationPath && relationFilter.relationPath.length > 0
      ? relationFilter.relationPath
      : [relationFilter.relationName];
  if (!path[0]) return null;
  const relationKey = path[path.length - 1];
  if (!relationKey) return null;
  const leaf = buildRelationFunctionLeaf(relationFilter, relationKey);
  if (!leaf) return null;
  return wrapNestedRelationPath(path, leaf);
}

export function buildRelationFunctionClauses(
  relationFilters: RelationFunctionFilter[] | undefined,
): Record<string, unknown>[] {
  if (!relationFilters || relationFilters.length === 0) return [];
  return relationFilters
    .map(relationFunctionToWhereClause)
    .filter((entry): entry is Record<string, unknown> => !!entry);
}

function relationFunctionKey(filter: RelationFunctionFilter): string {
  const path =
    filter.relationPath && filter.relationPath.length > 0
      ? filter.relationPath.join(".")
      : filter.relationName;
  return `${path}:${filter.mode}`;
}

export function upsertRelationFunction(
  existing: RelationFunctionFilter[],
  next: RelationFunctionFilter,
): RelationFunctionFilter[] {
  const key = relationFunctionKey(next);
  const filtered = existing.filter((entry) => relationFunctionKey(entry) !== key);
  return [...filtered, next];
}

export function removeRelationFunctionsByRelation(
  existing: RelationFunctionFilter[],
  relationName: string,
): RelationFunctionFilter[] {
  return existing.filter((entry) => {
    const path =
      entry.relationPath && entry.relationPath.length > 0
        ? entry.relationPath
        : [entry.relationName];
    return path[path.length - 1] !== relationName;
  });
}

export interface ActiveFilterStats {
  activeConditionCount: number;
  activePresetCount: number;
  activeRelationFunctionCount: number;
  activeCount: number;
  hasActiveFilters: boolean;
}

export function getActiveFilterStats(state: FilterFormState): ActiveFilterStats {
  const treeStats = getTreeStats(state.root);
  const activePresetCount = state.selectedPresets.length;
  const activeRelationFunctionCount = buildRelationFunctionClauses(
    state.relationFunctions,
  ).length;
  const activeCount =
    treeStats.activeConditionCount +
    activePresetCount +
    activeRelationFunctionCount;

  return {
    activeConditionCount: treeStats.activeConditionCount,
    activePresetCount,
    activeRelationFunctionCount,
    activeCount,
    hasActiveFilters: activeCount > 0,
  };
}
