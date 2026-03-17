import { mergeWhereClauses } from "@/widgets/model-table/filtering/engine";
import type {
  ModelTableNavFiltersConfig,
  ModelTableNavFilterVariables,
} from "../config/types";
import type { NavFilterSelectionState } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.length > 0 ? entries : undefined;
}

function normalizeSelectionValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function resolveInitialNavFilterSelections(
  navFilters?: ModelTableNavFiltersConfig,
): NavFilterSelectionState {
  const selections: NavFilterSelectionState = {};

  navFilters?.groups.forEach((group) => {
    const defaultItem =
      group.items.find((item) => item.key === group.defaultItemKey) ??
      group.items.find((item) => item.clear);
    selections[group.key] = defaultItem?.key ?? null;
  });

  return selections;
}

export function getActiveNavFilterCount(
  navFilters: ModelTableNavFiltersConfig | undefined,
  selections: NavFilterSelectionState | undefined,
): number {
  if (!navFilters?.groups.length || !selections) {
    return 0;
  }

  return navFilters.groups.reduce((count, group) => {
    const selectedKey = normalizeSelectionValue(selections[group.key]);
    if (!selectedKey) {
      return count;
    }

    const selectedItem = group.items.find((item) => item.key === selectedKey);
    if (!selectedItem || selectedItem.clear) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function mergeModelTableQueryVariables(
  base?: Record<string, unknown> | null,
  extra?: Record<string, unknown> | null,
): Record<string, unknown> {
  const left = isRecord(base) ? base : {};
  const right = isRecord(extra) ? extra : {};
  const result: Record<string, unknown> = { ...left };

  const mergedWhere = mergeWhereClauses([
    isRecord(left.where) ? left.where : undefined,
    isRecord(right.where) ? right.where : undefined,
  ]);
  if (mergedWhere) {
    result.where = mergedWhere;
  } else {
    delete result.where;
  }

  const mergedPresets = Array.from(
    new Set([
      ...(toStringArray(left.presets) ?? []),
      ...(toStringArray(right.presets) ?? []),
    ]),
  );
  if (mergedPresets.length > 0) {
    result.presets = mergedPresets;
  } else {
    delete result.presets;
  }

  const distinctOn = toStringArray(right.distinctOn);
  if (distinctOn?.length) {
    result.distinctOn = distinctOn;
  } else if (!toStringArray(left.distinctOn)?.length) {
    delete result.distinctOn;
  }

  const orderBy = toStringArray(right.orderBy);
  if (orderBy?.length) {
    result.orderBy = orderBy;
  } else if (!toStringArray(left.orderBy)?.length) {
    delete result.orderBy;
  }

  Object.entries(right).forEach(([key, value]) => {
    if (
      key === "where" ||
      key === "presets" ||
      key === "distinctOn" ||
      key === "orderBy"
    ) {
      return;
    }
    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

export function resolveNavFilterVariables(
  navFilters: ModelTableNavFiltersConfig | undefined,
  selections: NavFilterSelectionState | undefined,
): ModelTableNavFilterVariables | undefined {
  if (!navFilters?.groups.length || !selections) {
    return undefined;
  }

  let merged: Record<string, unknown> = {};

  navFilters.groups.forEach((group) => {
    const selectedKey = normalizeSelectionValue(selections[group.key]);
    if (!selectedKey) {
      return;
    }

    const selectedItem = group.items.find((item) => item.key === selectedKey);
    if (!selectedItem || selectedItem.clear) {
      return;
    }

    const resolved = selectedItem.resolveVariables?.({
      groupKey: group.key,
      itemKey: selectedItem.key,
      selections,
    });
    const itemVariables = mergeModelTableQueryVariables(
      selectedItem.variables,
      resolved,
    );
    merged = mergeModelTableQueryVariables(merged, itemVariables);
  });

  return Object.keys(merged).length > 0 ? merged : undefined;
}
