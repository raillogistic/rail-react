import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import { toGraphqlFieldName } from "../utils";
import type {
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
} from "../types";

interface UseTableLayoutOptions {
  columnDefs: BaseModelTableColumnDef[] | null;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  defaultHiddenColumnIds: Set<string>;
  persistedState?: any;
}

export function useTableLayout({
  columnDefs,
  columnOrdering,
  defaultHiddenColumnIds,
  persistedState,
}: UseTableLayoutOptions) {
  const { metadata } = useMetadata();
  const {
    columnOrder,
    setColumnOrder,
    setColumnVisibility,
    columnVisibility,
  } = useTable();

  const hasConsumedPersistedOrderRef = useRef(false);

  const sortableColumnIds = useMemo(() => {
    if (!columnDefs || columnDefs.length === 0) return columnOrder;
    const ids = columnDefs.map((column) => column.id);
    if (columnOrder.length === 0) return ids;
    const ordered = columnOrder.filter((id) => ids.includes(id));
    const orderedSet = new Set(ordered);
    const missing = ids.filter((id) => !orderedSet.has(id));
    return [...ordered, ...missing];
  }, [columnDefs, columnOrder]);

  const allowColumnDrag = columnOrdering?.draggable !== false;
  const lockedColumns = useMemo(
    () => new Set(columnOrdering?.locked ?? []),
    [columnOrdering?.locked]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowColumnDrag) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (lockedColumns.has(activeId) || lockedColumns.has(overId)) return;
    if (activeId === overId) return;

    const orderSource =
      sortableColumnIds.length > 0 ? sortableColumnIds : columnOrder;
    if (orderSource.length === 0) return;

    const oldIndex = orderSource.indexOf(activeId);
    const newIndex = orderSource.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;

    setColumnOrder(arrayMove(orderSource, oldIndex, newIndex));
  };

  const resolveColumnOrder = useCallback(
    (availableIds: string[]) => {
      const mode = columnOrdering?.mode ?? "persisted";
      const append = columnOrdering?.append ?? "end";
      const configOrder = columnOrdering?.order ?? [];

      const persistedOrder = persistedState?.columnOrder;
      const canUsePersistedFallback =
        mode === "persisted" &&
        !hasConsumedPersistedOrderRef.current &&
        columnOrder.length === 0 &&
        !!persistedOrder &&
        persistedOrder.length > 0;
      const effectiveColumnOrder = canUsePersistedFallback
        ? persistedOrder
        : columnOrder;

      const baseOrder =
        mode === "persisted" && effectiveColumnOrder.length > 0
          ? effectiveColumnOrder
          : configOrder.length > 0
            ? configOrder
            : availableIds;
      const availableSet = new Set(availableIds);
      
      const normalize = (entries: string[], valid: Set<string>) => {
        const next: string[] = [];
        const seen = new Set<string>();
        entries.forEach((id) => {
          if (!valid.has(id) || seen.has(id)) return;
          next.push(id);
          seen.add(id);
        });
        return next;
      };

      const baseNormalized = normalize(baseOrder, availableSet);
      const baseSet = new Set(baseNormalized);
      const missing = availableIds.filter((id) => !baseSet.has(id));
      const missingSet = new Set(missing);
      const preferredMissing = normalize(configOrder, missingSet);
      const preferredSet = new Set(preferredMissing);
      const remainingMissing = missing.filter((id) => !preferredSet.has(id));
      
      const combined =
        append === "start"
          ? [...preferredMissing, ...remainingMissing, ...baseNormalized]
          : [...baseNormalized, ...preferredMissing, ...remainingMissing];

      const same =
        combined.length === columnOrder.length &&
        combined.every((id, index) => columnOrder[index] === id);
      if (!same) {
        setColumnOrder(combined);
      }
      if (canUsePersistedFallback) {
        hasConsumedPersistedOrderRef.current = true;
      }
    },
    [columnOrder, columnOrdering, setColumnOrder, persistedState]
  );

  useEffect(() => {
    if (!metadata?.fields) return;

    const persistedVisibility = persistedState?.columnVisibility;
    const persistedVisibilityVersion = persistedState?.visibilityVersion ?? 0;
    const shouldHydrateFromPersistedVisibility =
      !!persistedVisibility &&
      Object.keys(persistedVisibility).length > 0 &&
      Object.keys(columnVisibility).length === 0;
    const effectiveVisibility = shouldHydrateFromPersistedVisibility
      ? persistedVisibility
      : columnVisibility;
    const shouldForceLegacyHiddenDefaults =
      shouldHydrateFromPersistedVisibility && persistedVisibilityVersion < 3;

    const targetColumns = columnDefs;
    if (targetColumns && targetColumns.length > 0) {
      const columnIds = targetColumns.map((column) => column.id);
      resolveColumnOrder(columnIds);

      const nextVisibility: Record<string, boolean> = {
        ...effectiveVisibility,
      };
      let visibilityChanged = false;
      columnIds.forEach((id) => {
        if (nextVisibility[id] === undefined) {
          nextVisibility[id] = !defaultHiddenColumnIds.has(id);
          visibilityChanged = true;
          return;
        }
        if (
          shouldForceLegacyHiddenDefaults &&
          defaultHiddenColumnIds.has(id) &&
          nextVisibility[id] !== false
        ) {
          nextVisibility[id] = false;
          visibilityChanged = true;
        }
      });
      const needsUpdate =
        visibilityChanged || shouldHydrateFromPersistedVisibility;
      if (needsUpdate) {
        setColumnVisibility(nextVisibility);
      }
      return;
    }

    const visibleFields = metadata.fields.filter((f) => f.visibility !== "hidden");
    const visibleNames = visibleFields.map((field) =>
      toGraphqlFieldName(field.name || field.fieldName)
    );
    resolveColumnOrder(visibleNames);

    const nextVisibility: Record<string, boolean> = { ...effectiveVisibility };
    let visibilityChanged = false;
    visibleFields.forEach((field) => {
      const accessor = toGraphqlFieldName(field.name || field.fieldName);
      if (nextVisibility[accessor] === undefined) {
        nextVisibility[accessor] = !defaultHiddenColumnIds.has(accessor);
        visibilityChanged = true;
        return;
      }
      if (
        shouldForceLegacyHiddenDefaults &&
        defaultHiddenColumnIds.has(accessor) &&
        nextVisibility[accessor] !== false
      ) {
        nextVisibility[accessor] = false;
        visibilityChanged = true;
      }
    });
    const needsUpdate =
      visibilityChanged || shouldHydrateFromPersistedVisibility;
    if (needsUpdate) {
      setColumnVisibility(nextVisibility);
    }
  }, [
    metadata,
    columnDefs,
    columnVisibility,
    setColumnVisibility,
    resolveColumnOrder,
    defaultHiddenColumnIds,
    persistedState,
  ]);

  return { sortableColumnIds, handleDragEnd, allowColumnDrag, lockedColumns };
}
