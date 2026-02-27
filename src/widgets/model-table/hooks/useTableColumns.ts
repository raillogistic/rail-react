import React, { useMemo } from "react";
import {
  BaseModelTableColumnDef,
  BaseModelTableField,
  BaseModelTableFieldsInput,
  BaseModelTableRelationConfig,
  FieldSchema,
  ModelSchema,
  RelationshipSchema,
} from "../types";
import {
  getSyntheticRelationCountSource,
  isAccessorExcluded,
  mergeBaseModelTableFields,
  normalizeBaseModelTableFieldsInput,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import { buildAccessorPath, resolveValueOptimized } from "../utils/valueResolution";

interface UseTableColumnsOptions {
  metadata?: ModelSchema;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  columnVisibility: Record<string, boolean>;
  persistedVisibility?: Record<string, boolean>;
}

export function useTableColumns({
  metadata,
  fields,
  relations,
  columnVisibility,
  persistedVisibility = {},
}: UseTableColumnsOptions) {
  const normalizedFieldsConfig = useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );

  const excludedAccessors = useMemo(
    () => new Set(normalizedFieldsConfig.exclude),
    [normalizedFieldsConfig.exclude],
  );

  const columnDefs = useMemo(() => {
    if (!metadata) return null;

    const fieldLookup = new Map<string, FieldSchema>();
    const fieldCanonicalByKey = new Map<string, string>();
    metadata.fields.forEach((field) => {
      const canonical = toGraphqlFieldName(field.name || field.fieldName);
      [
        field.name,
        field.fieldName,
        canonical,
        toSnakeCase(canonical),
        toCamelCase(canonical),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          fieldLookup.set(entry, field);
          fieldCanonicalByKey.set(entry, canonical);
        });
    });

    const relationLookup = new Map<string, RelationshipSchema>();
    const relationCanonicalByKey = new Map<string, string>();
    metadata.relationships.forEach((relation) => {
      const canonical = toGraphqlFieldName(relation.name || relation.fieldName);
      [
        relation.name,
        relation.fieldName,
        canonical,
        toSnakeCase(canonical),
        toCamelCase(canonical),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          relationLookup.set(entry, relation);
          relationCanonicalByKey.set(entry, canonical);
        });
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

    const resolveRelationCountSource = (
      accessor: string,
      field?: FieldSchema,
    ) => {
      const syntheticSource = field
        ? getSyntheticRelationCountSource(field)
        : undefined;
      if (syntheticSource) {
        return (
          relationCanonicalByKey.get(syntheticSource) ??
          toGraphqlFieldName(syntheticSource)
        );
      }
      const stripped = accessor.replace(/count$/i, "");
      if (!stripped || stripped === accessor) return null;
      const candidates = new Set<string>([
        stripped,
        toCamelCase(stripped),
        toSnakeCase(stripped),
      ]);
      for (const candidate of candidates) {
        const canonical = relationCanonicalByKey.get(candidate);
        if (canonical) return canonical;
      }
      return null;
    };

    const buildColumnDef = (
      accessor: string,
      titleOverride?: string,
      render?: BaseModelTableColumnDef["render"],
    ): BaseModelTableColumnDef => {
      const normalizedAccessor = canonicalizeAccessor(accessor);
      if (!normalizedAccessor) {
        return {
          id: accessor,
          accessor,
          title: titleOverride || accessor,
          render,
        };
      }
      const parts = normalizedAccessor.split(".");
      const root = parts[0];
      const fieldMeta = fieldLookup.get(root);
      const relationMeta = relationLookup.get(root);
      const isRelation = !!fieldMeta?.isRelation || !!relationMeta;
      const isToManyRelation = !!relationMeta?.isToMany;
      const relationCountSource = resolveRelationCountSource(
        normalizedAccessor,
        fieldMeta,
      );
      const relationConfig =
        relations?.[root] ??
        relations?.[toSnakeCase(root)] ??
        relations?.[toCamelCase(root)];
      const displayField = toGraphqlFieldName(
        relationConfig?.display ?? "desc",
      );
      const displayAccessor =
        parts.length === 1 && isRelation && !isToManyRelation
          ? `${normalizedAccessor}.${displayField}`
          : isToManyRelation && parts.length > 1
            ? root
            : normalizedAccessor;
      
      const relationCountRender: BaseModelTableColumnDef["render"] | undefined =
        relationCountSource
          ? (_value, row) => {
              const relationValue = resolveValueOptimized(row, [relationCountSource]);
              if (Array.isArray(relationValue)) return relationValue.length;
              return 0;
            }
          : undefined;
          
      const title =
        titleOverride ||
        fieldMeta?.verboseName ||
        relationMeta?.verboseName ||
        parts[parts.length - 1] ||
        normalizedAccessor;

      return {
        id: normalizedAccessor,
        accessor: displayAccessor,
        title,
        render: render ?? relationCountRender,
      };
    };

    const defaultDisplay = metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .map((field) => toGraphqlFieldName(field.name || field.fieldName))
      .filter(Boolean)
      .filter((accessor) => !isAccessorExcluded(accessor, excludedAccessors));

    const includeEntriesRaw = mergeBaseModelTableFields({
      include: normalizedFieldsConfig.include,
      defaults: defaultDisplay,
      add: normalizedFieldsConfig.add,
      excludedAccessors,
    });

    const includeEntries = includeEntriesRaw.reduce<BaseModelTableField[]>(
      (acc, entry) => {
        if (typeof entry === "string") {
          const canonicalAccessor = canonicalizeAccessor(entry);
          if (!canonicalAccessor) return acc;
          if (
            acc.some(
              (item) =>
                (typeof item === "string" ? item : item.accessor) ===
                canonicalAccessor,
            )
          ) {
            return acc;
          }
          acc.push(canonicalAccessor);
          return acc;
        }
        const canonicalAccessor = canonicalizeAccessor(entry.accessor);
        if (!canonicalAccessor) return acc;
        if (
          acc.some(
            (item) =>
              (typeof item === "string" ? item : item.accessor) ===
              canonicalAccessor,
          )
        ) {
          return acc;
        }
        acc.push({
          ...entry,
          accessor: canonicalAccessor,
        });
        return acc;
      },
      [],
    );

    return includeEntries.map((entry) => {
      if (typeof entry === "string") {
        const renderOverride =
          normalizedFieldsConfig.render[entry] ??
          normalizedFieldsConfig.render[toSnakeCase(entry)] ??
          normalizedFieldsConfig.render[entry.split(".")[0]];
        return buildColumnDef(
          entry,
          undefined,
          renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined,
        );
      }
      const renderOverride =
        normalizedFieldsConfig.render[entry.accessor] ??
        normalizedFieldsConfig.render[toSnakeCase(entry.accessor)] ??
        normalizedFieldsConfig.render[entry.accessor.split(".")[0]];
      return buildColumnDef(
        entry.accessor,
        entry.title,
        entry.render ??
          (renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined),
      );
    });
  }, [metadata, excludedAccessors, normalizedFieldsConfig, relations]);

  return {
    columnDefs,
    normalizedFieldsConfig,
    excludedAccessors,
  };
}
