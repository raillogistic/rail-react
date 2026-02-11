import { getTreeStats } from "./tree/operations";
import type {
  FilterFormState,
  RelationAggFunction,
  RelationFunctionFilter,
  RelationFunctionMode,
} from "./types";

export const LEGACY_HEADER_RELATION_FILTERS_KEY = "__headerRelationFilters";
export const LEGACY_HEADER_BASE_WHERE_KEY = "__baseWhere";

const MODE_SUFFIX: Record<RelationFunctionMode, string> = {
  some: "Some",
  none: "None",
  every: "Every",
  count: "Count",
  agg: "Agg",
};

const SUFFIX_MODE: Array<[string, RelationFunctionMode]> = [
  ["Some", "some"],
  ["None", "none"],
  ["Every", "every"],
  ["Count", "count"],
  ["Agg", "agg"],
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

function parseModeFromLegacyKey(
  key: string,
): { relationName: string; mode: RelationFunctionMode } | null {
  for (const [suffix, mode] of SUFFIX_MODE) {
    if (!key.endsWith(suffix)) continue;
    const relationName = key.slice(0, -suffix.length);
    if (!relationName) return null;
    return { relationName, mode };
  }
  return null;
}

function parseLegacyAggFunction(payload: UnknownRecord): {
  aggFunction: RelationAggFunction;
  operator: string;
  value: unknown;
} | null {
  const entries = Object.entries(payload).filter(([key]) => key !== "field");
  for (const [aggFunction, rawCondition] of entries) {
    if (!isRecord(rawCondition)) continue;
    const [operator, value] = Object.entries(rawCondition)[0] ?? [];
    if (!operator) continue;
    return {
      aggFunction: aggFunction as RelationAggFunction,
      operator,
      value,
    };
  }
  return null;
}

function parseLegacyRelationFunctionEntry(
  legacyKey: string,
  fragment: unknown,
): RelationFunctionFilter | null {
  const parsedKey = parseModeFromLegacyKey(legacyKey);
  if (!parsedKey) return null;
  if (!isRecord(fragment)) return null;
  const payload = isRecord(fragment[legacyKey])
    ? (fragment[legacyKey] as UnknownRecord)
    : fragment;

  if (parsedKey.mode === "count") {
    const [operator, value] = Object.entries(payload)[0] ?? [];
    if (!operator) return null;
    return {
      id: `${parsedKey.relationName}:count`,
      relationName: parsedKey.relationName,
      relationPath: [parsedKey.relationName],
      mode: "count",
      operator,
      value,
    };
  }

  if (parsedKey.mode === "agg") {
    const fieldName =
      typeof payload.field === "string" && payload.field.trim().length > 0
        ? payload.field
        : undefined;
    if (!fieldName) return null;
    const agg = parseLegacyAggFunction(payload);
    if (!agg) return null;
    return {
      id: `${parsedKey.relationName}:agg`,
      relationName: parsedKey.relationName,
      relationPath: [parsedKey.relationName],
      mode: "agg",
      fieldName,
      aggFunction: agg.aggFunction,
      operator: agg.operator,
      value: agg.value,
    };
  }

  const [fieldName, rawCondition] = Object.entries(payload)[0] ?? [];
  if (!fieldName || !isRecord(rawCondition)) return null;
  const [operator, value] = Object.entries(rawCondition)[0] ?? [];
  if (!operator) return null;
  return {
    id: `${parsedKey.relationName}:${parsedKey.mode}`,
    relationName: parsedKey.relationName,
    relationPath: [parsedKey.relationName],
    mode: parsedKey.mode,
    fieldName,
    operator,
    value,
  };
}

export function extractLegacyRelationFunctions(
  variables: Record<string, unknown> | undefined,
): RelationFunctionFilter[] {
  if (!variables) return [];
  const legacy = variables[LEGACY_HEADER_RELATION_FILTERS_KEY];
  if (!isRecord(legacy)) return [];
  const parsed = Object.entries(legacy)
    .map(([key, fragment]) => parseLegacyRelationFunctionEntry(key, fragment))
    .filter((entry): entry is RelationFunctionFilter => !!entry);

  if (parsed.length === 0) return [];
  return parsed.reduce<RelationFunctionFilter[]>(
    (acc, entry) => upsertRelationFunction(acc, entry),
    [],
  );
}

export function hasLegacyRelationVariables(
  variables: Record<string, unknown> | undefined,
): boolean {
  if (!variables) return false;
  if (LEGACY_HEADER_RELATION_FILTERS_KEY in variables) return true;
  if (LEGACY_HEADER_BASE_WHERE_KEY in variables) return true;
  return false;
}

export function stripLegacyRelationVariables(
  variables: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!variables) return undefined;
  if (!hasLegacyRelationVariables(variables)) return variables;
  const nextVariables = { ...variables };
  delete nextVariables[LEGACY_HEADER_RELATION_FILTERS_KEY];
  delete nextVariables[LEGACY_HEADER_BASE_WHERE_KEY];
  return nextVariables;
}

export function migrateLegacyRelationState(options: {
  state: FilterFormState;
  variables?: Record<string, unknown>;
}): {
  state: FilterFormState;
  variables?: Record<string, unknown>;
  migrated: boolean;
} {
  const { state, variables } = options;
  const legacyRelations = extractLegacyRelationFunctions(variables);
  const cleanedVariables = stripLegacyRelationVariables(variables);

  if (legacyRelations.length === 0) {
    return {
      state,
      variables: cleanedVariables,
      migrated: cleanedVariables !== variables,
    };
  }

  const current = state.relationFunctions ?? [];
  const merged = legacyRelations.reduce<RelationFunctionFilter[]>(
    (acc, entry) => upsertRelationFunction(acc, entry),
    current,
  );

  return {
    state: {
      ...state,
      relationFunctions: merged,
    },
    variables: cleanedVariables,
    migrated: true,
  };
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
