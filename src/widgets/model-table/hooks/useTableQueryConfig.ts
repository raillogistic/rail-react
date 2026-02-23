import React, { useMemo } from "react";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import {
  getSyntheticRelationCountSource,
  isAccessorExcluded,
  mergeBaseModelTableFields,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import type {
  BaseModelTableFieldsInput,
  BaseModelTableRelationConfig,
} from "../types";
import type { ModelTableV2PerformanceOptions } from "../config/types";

interface UseTableQueryConfigOptions {
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  queryManager?: string;
  skipCount?: boolean;
  performance?: ModelTableV2PerformanceOptions;
  normalizedFieldsConfig: any;
  excludedAccessors: Set<string>;
  defaultHiddenColumnIds: Set<string>;
  persistedVisibility?: Record<string, boolean>;
}

/**
 * Resolve query configuration from current metadata and table state.
 */
export function useTableQueryConfig({
  fields,
  relations,
  queryManager,
  skipCount,
  performance,
  normalizedFieldsConfig,
  excludedAccessors,
  defaultHiddenColumnIds,
  persistedVisibility = {},
}: UseTableQueryConfigOptions) {
  const { metadata } = useMetadata();
  const { columnVisibility, groupingField } = useTable();

  const queryVisibleAccessors = useMemo(() => {
    if (!metadata) return undefined;

    const visibilitySource =
      Object.keys(columnVisibility).length > 0
        ? columnVisibility
        : persistedVisibility;
    const hasVisibilityOverrides = Object.keys(visibilitySource).length > 0;

    const fieldCanonicalByKey = new Map<string, string>();
    metadata.fields.forEach((field) => {
      const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
      if (!canonicalName) return;
      fieldCanonicalByKey.set(field.name, canonicalName);
      if (field.fieldName)
        fieldCanonicalByKey.set(field.fieldName, canonicalName);
      fieldCanonicalByKey.set(canonicalName, canonicalName);
    });

    const relationCanonicalByKey = new Map<string, string>();
    metadata.relationships.forEach((relation) => {
      const canonicalName = toGraphqlFieldName(
        relation.name || relation.fieldName,
      );
      if (!canonicalName) return;
      relationCanonicalByKey.set(relation.name, canonicalName);
      if (relation.fieldName)
        relationCanonicalByKey.set(relation.fieldName, canonicalName);
      relationCanonicalByKey.set(canonicalName, canonicalName);
    });

    const canonicalizeRoot = (root: string) =>
      relationCanonicalByKey.get(root) ??
      fieldCanonicalByKey.get(root) ??
      toGraphqlFieldName(root);

    const canonicalizeAccessor = (accessor: string) => {
      const parts = accessor.replace(/__/g, ".").split(".").filter(Boolean);
      if (parts.length === 0) return "";
      const [root, ...rest] = parts;
      const normalizedRoot = canonicalizeRoot(root);
      if (!normalizedRoot) return "";
      const normalizedRest = rest.map((segment) => toGraphqlFieldName(segment));
      return [normalizedRoot, ...normalizedRest.filter(Boolean)].join(".");
    };

    const defaultDisplay = metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .map((field) => toGraphqlFieldName(field.name || field.fieldName))
      .filter(Boolean)
      .filter((accessor) => !isAccessorExcluded(accessor, excludedAccessors));

    const includeEntries = mergeBaseModelTableFields({
      include: normalizedFieldsConfig.include,
      defaults: defaultDisplay,
      add: normalizedFieldsConfig.add,
      excludedAccessors,
    })
      .map((entry) =>
        canonicalizeAccessor(typeof entry === "string" ? entry : entry.accessor),
      )
      .filter(Boolean);

    const uniqueAccessors = Array.from(new Set(includeEntries));

    const resolveVisibility = (accessor: string): boolean | undefined => {
      const root = accessor.split(".")[0];
      const candidates = [
        accessor,
        toSnakeCase(accessor),
        toCamelCase(accessor),
        root,
        toSnakeCase(root),
        toCamelCase(root),
      ];
      for (const candidate of candidates) {
        const value = visibilitySource[candidate];
        if (typeof value === "boolean") return value;
      }
      return undefined;
    };

    const hasConfiguredInclude = normalizedFieldsConfig.include !== undefined;

    return uniqueAccessors.filter((accessor) => {
      const explicitVisibility = resolveVisibility(accessor);
      if (explicitVisibility === false) return false;
      if (explicitVisibility === true) return true;
      if (hasVisibilityOverrides) return true;
      if (hasConfiguredInclude) return true;
      return !defaultHiddenColumnIds.has(accessor);
    });
  }, [
    columnVisibility,
    defaultHiddenColumnIds,
    excludedAccessors,
    metadata,
    normalizedFieldsConfig,
    persistedVisibility,
  ]);

  const requiredDataAccessors = useMemo(() => {
    const required = new Set<string>();

    const primaryKeyAccessor =
      toGraphqlFieldName(metadata?.primaryKey || "id") || "id";
    required.add(primaryKeyAccessor);

    if (groupingField) {
      required.add(groupingField);
    }

    if (!metadata || !queryVisibleAccessors?.length) {
      return Array.from(required);
    }

    const visibleRoots = new Set(
      queryVisibleAccessors.map((accessor) => accessor.split(".")[0]),
    );
    const groupedRoot = groupingField?.split(".")[0] ?? null;

    metadata.fields.forEach((field) => {
      const source = getSyntheticRelationCountSource(field);
      if (!source) return;

      const countAccessor = toGraphqlFieldName(field.name || field.fieldName);
      const sourceAccessor = toGraphqlFieldName(source);
      if (!countAccessor || !sourceAccessor) return;

      if (visibleRoots.has(countAccessor) || groupedRoot === countAccessor) {
        required.add(sourceAccessor);
      }
    });

    return Array.from(required);
  }, [groupingField, metadata, queryVisibleAccessors]);

  const queryConfig = useMemo(
    () => ({
      fields,
      relations,
      queryManager,
      skipCount: skipCount ?? true,
      dataMode: performance?.dataMode ?? "pagination",
      visibleAccessors: queryVisibleAccessors,
      requiredAccessors: requiredDataAccessors,
    }),
    [
      fields,
      performance?.dataMode,
      queryVisibleAccessors,
      relations,
      queryManager,
      requiredDataAccessors,
      skipCount,
    ],
  );

  return { queryConfig, queryVisibleAccessors, requiredDataAccessors };
}
