import type { SortingState } from "@tanstack/react-table";
import type { DynamicTableOrderByEntry } from "../types";

/**
 * Describes how a visual column id maps to an external sort key.
 */
export interface DynamicTableSortDescriptor {
  /** Visual table column id. */
  id: string;
  /** Optional external sort key used in `orderBy` payloads. */
  sortKey?: string;
}

/**
 * Normalizes a sort key by converting dotted notation to GraphQL-style segments.
 */
function normalizeSortKey(value: string): string {
  return value.replace(/\./g, "__");
}

/**
 * Removes the descending prefix from an `orderBy` entry.
 */
function stripDescendingPrefix(value: string): string {
  return value.startsWith("-") ? value.slice(1) : value;
}

/**
 * Converts an external `orderBy` state into TanStack `SortingState`.
 */
export function orderByToSortingState(
  orderBy: ReadonlyArray<DynamicTableOrderByEntry>,
  descriptors: ReadonlyArray<DynamicTableSortDescriptor>,
): SortingState {
  const descriptorBySortKey = new Map<string, DynamicTableSortDescriptor>();
  const descriptorByColumnId = new Map<string, DynamicTableSortDescriptor>();

  descriptors.forEach((descriptor) => {
    descriptorByColumnId.set(descriptor.id, descriptor);
    descriptorBySortKey.set(normalizeSortKey(descriptor.sortKey ?? descriptor.id), descriptor);
    descriptorBySortKey.set(normalizeSortKey(descriptor.id), descriptor);
  });

  const sorting: SortingState = [];
  const seenIds = new Set<string>();

  orderBy.forEach((entry) => {
    const rawKey = stripDescendingPrefix(entry);
    const normalizedRawKey = normalizeSortKey(rawKey);
    const descriptor =
      descriptorBySortKey.get(normalizedRawKey) ??
      descriptorBySortKey.get(normalizedRawKey.replace(/__/g, ".")) ??
      descriptorByColumnId.get(rawKey);

    if (!descriptor || seenIds.has(descriptor.id)) {
      return;
    }

    sorting.push({
      id: descriptor.id,
      desc: entry.startsWith("-"),
    });
    seenIds.add(descriptor.id);
  });

  return sorting;
}

/**
 * Converts TanStack `SortingState` into an external `orderBy` payload.
 */
export function sortingStateToOrderBy(
  sorting: SortingState,
  descriptors: ReadonlyArray<DynamicTableSortDescriptor>,
): DynamicTableOrderByEntry[] {
  const descriptorByColumnId = new Map<string, DynamicTableSortDescriptor>();
  descriptors.forEach((descriptor) => {
    descriptorByColumnId.set(descriptor.id, descriptor);
  });

  return sorting.map((entry) => {
    const descriptor = descriptorByColumnId.get(entry.id);
    const sortKey = descriptor?.sortKey ?? entry.id;
    return entry.desc ? `-${sortKey}` : sortKey;
  });
}

