/**
 * InlineFieldSelector - Field selector with recent, favorites, and quick filters.
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ChevronRight,
  Link2,
  Star,
  Clock,
  Zap,
  SlidersHorizontal,
  GitBranch,
  Layers,
} from "lucide-react";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  UnifiedFilterSchema,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
  FieldSelectorOptions,
} from "../types";
import { FieldTypeIcon } from "./InlineFieldSelectorIcons";

export interface InlineFieldSelectorProps {
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  currentPath?: string[];
  onSelect: (
    fieldPath: string[],
    fieldName: string,
    defaultOperator: string,
  ) => void;
  trigger: React.ReactNode;
  recentFields?: string[][];
  favoriteFields?: string[][];
  fieldSelector?: FieldSelectorOptions;
  onLoadRelationSchema?: (
    relation: RelationFilter,
  ) => Promise<UnifiedFilterSchema | null>;
  getRelationSchema?: (relation: RelationFilter) => UnifiedFilterSchema | null;
}

interface ResolvedPathField {
  field: FilterableField;
  path: string[];
  labelPath: string[];
}

interface RelationEntry {
  relation: RelationFilter;
  path: string[];
  scalarFields: FilterableField[];
  filteredScalars: FilterableField[];
  childRelations: RelationEntry[];
  matches: boolean;
}

export const InlineFieldSelector: React.FC<InlineFieldSelectorProps> = ({
  schema,
  config,
  currentPath = [],
  onSelect,
  trigger,
  recentFields = [],
  favoriteFields = [],
  fieldSelector,
  onLoadRelationSchema,
  getRelationSchema,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedRelations, setExpandedRelations] = useState<
    Record<string, boolean>
  >({});
  const [loadingRelations, setLoadingRelations] = useState<
    Record<string, boolean>
  >({});

  const selectorConfig = useMemo(
    () => ({
      only: fieldSelector?.only ?? [],
      exclude: fieldSelector?.exclude ?? [],
      requireChoices: fieldSelector?.requireChoices ?? false,
      includeRelations: fieldSelector?.includeRelations ?? true,
      includeAdvanced: fieldSelector?.includeAdvanced ?? true,
      order: fieldSelector?.order ?? "schema",
    }),
    [fieldSelector],
  );

  const allowedOnly = useMemo(
    () => new Set(selectorConfig.only.map((name) => name.trim().toLowerCase())),
    [selectorConfig.only],
  );
  const allowedExclude = useMemo(
    () =>
      new Set(selectorConfig.exclude.map((name) => name.trim().toLowerCase())),
    [selectorConfig.exclude],
  );

  const matchesAllowed = useCallback(
    (candidates: string[]) => {
      const normalized = candidates
        .filter(Boolean)
        .map((name) => name.toLowerCase());
      if (allowedOnly.size > 0) {
        const hit = normalized.some((name) => allowedOnly.has(name));
        if (!hit) return false;
      }
      if (allowedExclude.size > 0) {
        const blocked = normalized.some((name) => allowedExclude.has(name));
        if (blocked) return false;
      }
      return true;
    },
    [allowedExclude, allowedOnly],
  );

  const sortFields = useCallback(
    (fields: FilterableField[]) => {
      if (selectorConfig.order === "schema") {
        return fields;
      }
      const sorted = [...fields];
      if (selectorConfig.order === "priority") {
        sorted.sort(
          (a, b) => (a.uiHints.priority ?? 999) - (b.uiHints.priority ?? 999),
        );
        return sorted;
      }
      if (selectorConfig.order === "name") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
      }
      sorted.sort((a, b) => a.fieldLabel.localeCompare(b.fieldLabel));
      return sorted;
    },
    [selectorConfig.order],
  );

  const allowAdvanced = selectorConfig.includeAdvanced;
  const allowRelations = selectorConfig.includeRelations;
  const effectiveShowAdvanced = allowAdvanced && showAdvanced;

  const quickFilters = useMemo(() => {
    const filtered = schema.fields
      .filter((field) => field.uiHints.showInQuickFilter && !field.isRelation)
      .filter((field) => {
        if (selectorConfig.requireChoices && !field.choices?.length) {
          return false;
        }
        return matchesAllowed([
          field.name,
          field.fieldName,
          field.fieldLabel,
          field.name,
        ]);
      });
    return sortFields(filtered);
  }, [
    schema.fields,
    matchesAllowed,
    selectorConfig.requireChoices,
    sortFields,
  ]);

  const getNestedSchema = useCallback(
    (relation: RelationFilter) => {
      return relation.nestedSchema ?? getRelationSchema?.(relation) ?? null;
    },
    [getRelationSchema],
  );

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearch("");
      setShowAdvanced(false);
      setExpandedRelations({});
      setLoadingRelations({});
    }
  }, []);

  const handleQuickSelect = useCallback(
    (field: FilterableField) => {
      onSelect([field.name], field.name, field.defaultOperator);
      setOpen(false);
      setSearch("");
      setShowAdvanced(false);
      setExpandedRelations({});
      setLoadingRelations({});
    },
    [onSelect],
  );

  const resolvePathFields = useCallback(
    (paths: string[][]) => {
      return paths
        .map((path) => {
          if (path.length === 0) return null;
          let current: UnifiedFilterSchema | undefined = schema;
          const labelPath: string[] = [];

          for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i];
            const relation = current?.relationFilters.find(
              (r) => r.name === segment || r.fieldName === segment,
            );
            const nestedSchema = relation ? getNestedSchema(relation) : null;
            if (!nestedSchema) return null;
            labelPath.push(relation.fieldLabel);
            current = nestedSchema;
          }

          const fieldName = path[path.length - 1];
          const field = current?.fields.find(
            (f) => f.name === fieldName || f.fieldName === fieldName,
          );
          if (!field) return null;
          labelPath.push(field.fieldLabel);
          return { field, path, labelPath };
        })
        .filter(Boolean) as ResolvedPathField[];
    },
    [schema, getNestedSchema],
  );

  const recentResolved = useMemo(
    () => resolvePathFields(recentFields),
    [resolvePathFields, recentFields],
  );
  const favoriteResolved = useMemo(
    () => resolvePathFields(favoriteFields),
    [resolvePathFields, favoriteFields],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const hasSearch = normalizedSearch.length > 0;

  const matchesField = useCallback(
    (field: FilterableField) => {
      if (!hasSearch) return true;
      const lower = normalizedSearch;
      return (
        field.name.toLowerCase().includes(lower) ||
        field.fieldName.toLowerCase().includes(lower) ||
        field.fieldLabel.toLowerCase().includes(lower) ||
        field.graphqlType.toLowerCase().includes(lower)
      );
    },
    [hasSearch, normalizedSearch],
  );

  const matchesRelation = useCallback(
    (relation: RelationFilter) => {
      if (!hasSearch) return true;
      const lower = normalizedSearch;
      return (
        relation.name.toLowerCase().includes(lower) ||
        relation.fieldName.toLowerCase().includes(lower) ||
        relation.fieldLabel.toLowerCase().includes(lower) ||
        relation.relatedModel.toLowerCase().includes(lower)
      );
    },
    [hasSearch, normalizedSearch],
  );

  const matchesResolved = useCallback(
    (item: ResolvedPathField) => {
      if (!hasSearch) return true;
      const lower = normalizedSearch;
      const label = item.labelPath.join(" ").toLowerCase();
      return (
        label.includes(lower) ||
        item.field.name.toLowerCase().includes(lower) ||
        item.field.fieldName.toLowerCase().includes(lower) ||
        item.field.graphqlType.toLowerCase().includes(lower)
      );
    },
    [hasSearch, normalizedSearch],
  );

  const isDateField = useCallback((field: FilterableField) => {
    return field.baseType === "Date" || field.baseType === "DateTime";
  }, []);

  const isDateHelperField = useCallback((field: FilterableField) => {
    const name = field.name.toLowerCase();
    const fieldName = field.fieldName.toLowerCase();
    const label = field.fieldLabel.toLowerCase();
    return (
      fieldName.endsWith("_trunc") ||
      fieldName.endsWith("_extract") ||
      name.endsWith("trunc") ||
      name.endsWith("extract") ||
      label.includes("truncated date") ||
      label.includes("date extraction")
    );
  }, []);

  const isAdvancedField = useCallback((field: FilterableField) => {
    const name = field.name;
    const fieldName = field.fieldName;
    const lowerName = name.toLowerCase();
    const lowerFieldName = fieldName.toLowerCase();
    const inputType = field.filterInputType ?? "";
    const isAggregationInput =
      inputType.includes("Aggregation") ||
      inputType.includes("CountFilterInput");
    const advancedNames = new Set([
      "include",
      "quick",
      "quicksearch",
      "search",
      "fulltextsearch",
      "fulltext",
      "fts",
    ]);

    if (advancedNames.has(lowerName) || advancedNames.has(lowerFieldName)) {
      return true;
    }

    if (lowerName.startsWith("_") || lowerFieldName.startsWith("_")) {
      return true;
    }

    if (
      lowerName.includes("subquery") ||
      lowerFieldName.includes("subquery") ||
      lowerName.includes("window") ||
      lowerFieldName.includes("window") ||
      lowerName.includes("compare") ||
      lowerFieldName.includes("compare") ||
      lowerName.includes("exists") ||
      lowerFieldName.includes("exists") ||
      lowerName.includes("fulltext") ||
      lowerFieldName.includes("fulltext")
    ) {
      return true;
    }

    if (lowerFieldName.endsWith("_agg") || name.endsWith("Agg")) {
      return true;
    }

    if (
      (lowerFieldName.endsWith("_count") || name.endsWith("Count")) &&
      isAggregationInput
    ) {
      return true;
    }

    if (
      lowerFieldName.endsWith("_some") ||
      name.endsWith("Some") ||
      lowerFieldName.endsWith("_every") ||
      name.endsWith("Every") ||
      lowerFieldName.endsWith("_none") ||
      name.endsWith("None")
    ) {
      return true;
    }

    if (
      lowerName.includes("manytoone") ||
      lowerFieldName.includes("manytoone")
    ) {
      return true;
    }

    return false;
  }, []);

  const isRelationNestedAlias = useCallback((field: FilterableField) => {
    const lowerName = field.name.toLowerCase();
    const lowerFieldName = field.fieldName.toLowerCase();
    return lowerName.endsWith("rel") || lowerFieldName.endsWith("_rel");
  }, []);

  const normalFields = useMemo(() => {
    // Keep direct relation ID fields (e.g. `category`) selectable, but hide
    // nested relation aliases (e.g. `categoryRel` / `category_rel`) from scalar lists.
    const base = schema.fields.filter((field) => !isRelationNestedAlias(field));
    const filtered = base.filter((field) => {
      if (selectorConfig.requireChoices && !field.choices?.length) {
        return false;
      }
      return matchesAllowed([
        field.name,
        field.fieldName,
        field.fieldLabel,
        field.name,
      ]);
    });
    return sortFields(filtered);
  }, [
    schema.fields,
    isRelationNestedAlias,
    matchesAllowed,
    selectorConfig.requireChoices,
    sortFields,
  ]);

  const advancedFields = useMemo(() => {
    if (!allowAdvanced) return [];
    const filtered = schema.fields
      .filter((field) => !isRelationNestedAlias(field))
      .filter(isAdvancedField)
      .filter((field) => {
      if (selectorConfig.requireChoices && !field.choices?.length) {
        return false;
      }
      return matchesAllowed([field.name, field.fieldName, field.fieldLabel]);
    });
    return sortFields(filtered);
  }, [
    allowAdvanced,
    schema.fields,
    isRelationNestedAlias,
    isAdvancedField,
    matchesAllowed,
    selectorConfig.requireChoices,
    sortFields,
  ]);

  const standardFields = useMemo(
    () => normalFields.filter((field) => !isAdvancedField(field)),
    [normalFields, isAdvancedField],
  );

  const filteredNormal = useMemo(
    () => standardFields.filter(matchesField),
    [standardFields, matchesField],
  );

  const filteredAdvanced = useMemo(
    () => advancedFields.filter(matchesField),
    [advancedFields, matchesField],
  );

  const recentVisible = useMemo(
    () =>
      recentResolved.filter((item) => {
        if (
          !matchesAllowed([
            item.field.name,
            item.field.fieldName,
            item.labelPath.join("."),
          ])
        ) {
          return false;
        }
        if (selectorConfig.requireChoices && !item.field.choices?.length) {
          return false;
        }
        return (
          matchesResolved(item) &&
          (effectiveShowAdvanced || !isAdvancedField(item.field))
        );
      }),
    [
      recentResolved,
      matchesResolved,
      effectiveShowAdvanced,
      isAdvancedField,
      matchesAllowed,
      selectorConfig.requireChoices,
    ],
  );

  const favoriteVisible = useMemo(
    () =>
      favoriteResolved.filter((item) => {
        if (
          !matchesAllowed([
            item.field.name,
            item.field.fieldName,
            item.labelPath.join("."),
          ])
        ) {
          return false;
        }
        if (selectorConfig.requireChoices && !item.field.choices?.length) {
          return false;
        }
        return (
          matchesResolved(item) &&
          (effectiveShowAdvanced || !isAdvancedField(item.field))
        );
      }),
    [
      favoriteResolved,
      matchesResolved,
      effectiveShowAdvanced,
      isAdvancedField,
      matchesAllowed,
      selectorConfig.requireChoices,
    ],
  );

  const favoriteTopLevel = useMemo(
    () =>
      favoriteVisible.filter(
        ({ field, path }) => path.length === 1 && !field.isRelation,
      ),
    [favoriteVisible],
  );

  const recentTopLevel = useMemo(
    () =>
      recentVisible.filter(
        ({ field, path }) => path.length === 1 && !field.isRelation,
      ),
    [recentVisible],
  );

  const recentNames = useMemo(() => {
    return new Set(recentTopLevel.map((item) => item.field.name));
  }, [recentTopLevel]);

  const favoriteNames = useMemo(() => {
    return new Set(favoriteTopLevel.map((item) => item.field.name));
  }, [favoriteTopLevel]);

  const quickVisible = useMemo(
    () =>
      quickFilters
        .filter(matchesField)
        .filter((field) => !isAdvancedField(field)),
    [quickFilters, matchesField, isAdvancedField],
  );

  const quickList = useMemo(
    () =>
      quickVisible.filter(
        (field) =>
          !recentNames.has(field.name) && !favoriteNames.has(field.name),
      ),
    [quickVisible, recentNames, favoriteNames],
  );

  const pinnedNames = useMemo(() => {
    const names = new Set<string>();
    if (hasSearch) return names;
    for (const item of favoriteTopLevel) names.add(item.field.name);
    for (const item of recentTopLevel) names.add(item.field.name);
    for (const field of quickVisible) names.add(field.name);
    return names;
  }, [favoriteTopLevel, recentTopLevel, quickVisible, hasSearch]);

  const normalList = useMemo(() => {
    if (hasSearch) return filteredNormal;
    return filteredNormal.filter((field) => !pinnedNames.has(field.name));
  }, [filteredNormal, pinnedNames, hasSearch]);

  const normalDateHelpers = useMemo(
    () => normalList.filter(isDateHelperField),
    [normalList, isDateHelperField],
  );

  const normalDates = useMemo(
    () =>
      normalList.filter(
        (field) => isDateField(field) && !isDateHelperField(field),
      ),
    [normalList, isDateField, isDateHelperField],
  );

  const normalScalars = useMemo(
    () =>
      normalList.filter(
        (field) => !isDateField(field) && !isDateHelperField(field),
      ),
    [normalList, isDateField, isDateHelperField],
  );

  const relationGroups = useMemo(() => {
    const groups = {
      foreignKey: [] as RelationFilter[],
      oneToOne: [] as RelationFilter[],
      manyToOne: [] as RelationFilter[],
      manyToMany: [] as RelationFilter[],
    };
    if (!allowRelations) {
      return groups;
    }

    schema.relationFilters.forEach((relation) => {
      if (
        !matchesAllowed([
          relation.name,
          relation.fieldName,
          relation.fieldLabel,
        ])
      ) {
        return;
      }
      switch (relation.relationType) {
        case "FOREIGN_KEY":
          groups.foreignKey.push(relation);
          break;
        case "ONE_TO_ONE":
          groups.oneToOne.push(relation);
          break;
        case "REVERSE_FK":
          groups.manyToOne.push(relation);
          break;
        case "MANY_TO_MANY":
          groups.manyToMany.push(relation);
          break;
        default:
          groups.foreignKey.push(relation);
          break;
      }
    });

    return groups;
  }, [schema.relationFilters, allowRelations, matchesAllowed]);

  const buildRelationEntry = useCallback(
    (
      relation: RelationFilter,
      path: string[],
      depth: number,
    ): RelationEntry => {
      const nestedSchema = getNestedSchema(relation);
      const pathKey = path.join(".");
      const shouldExpand = hasSearch || expandedRelations[pathKey];
      const canGoDeeper = depth < config.maxDepth;

      const scalarFields =
        shouldExpand && nestedSchema
          ? sortFields(nestedSchema.fields.filter((field) => !field.isRelation))
          : [];
      const visibleScalars = effectiveShowAdvanced
        ? scalarFields
        : scalarFields.filter((field) => !isAdvancedField(field));
      const constrainedScalars = visibleScalars.filter((field) => {
        if (selectorConfig.requireChoices && !field.choices?.length) {
          return false;
        }
        const key = [...path, field.name].join(".");
        return matchesAllowed([
          field.name,
          field.fieldName,
          field.fieldLabel,
          key,
        ]);
      });
      const filteredScalars = hasSearch
        ? constrainedScalars.filter(matchesField)
        : constrainedScalars;

      const childRelations =
        shouldExpand && canGoDeeper && nestedSchema
          ? nestedSchema.relationFilters.map((child) =>
              buildRelationEntry(child, [...path, child.name], depth + 1),
            )
          : [];

      const visibleChildRelations = effectiveShowAdvanced
        ? childRelations
        : childRelations.filter(
            (child) => child.relation.relationType !== "MANY_TO_MANY",
          );

      const filteredChildren = hasSearch
        ? visibleChildRelations.filter((child) => child.matches)
        : visibleChildRelations;

      const matches =
        !hasSearch ||
        matchesRelation(relation) ||
        filteredScalars.length > 0 ||
        visibleChildRelations.some((child) => child.matches);

      return {
        relation,
        path,
        scalarFields,
        filteredScalars,
        childRelations: filteredChildren,
        matches,
      };
    },
    [
      config.maxDepth,
      expandedRelations,
      getNestedSchema,
      hasSearch,
      matchesField,
      matchesRelation,
      effectiveShowAdvanced,
      isAdvancedField,
      matchesAllowed,
      selectorConfig.requireChoices,
    ],
  );

  const foreignKeyEntries = useMemo(
    () =>
      relationGroups.foreignKey
        .map((relation) => buildRelationEntry(relation, [relation.name], 1))
        .filter((entry) => !hasSearch || entry.matches),
    [relationGroups.foreignKey, buildRelationEntry, hasSearch],
  );

  const oneToOneEntries = useMemo(
    () =>
      relationGroups.oneToOne
        .map((relation) => buildRelationEntry(relation, [relation.name], 1))
        .filter((entry) => !hasSearch || entry.matches),
    [relationGroups.oneToOne, buildRelationEntry, hasSearch],
  );

  const manyToOneEntries = useMemo(
    () =>
      relationGroups.manyToOne
        .map((relation) => buildRelationEntry(relation, [relation.name], 1))
        .filter((entry) => !hasSearch || entry.matches),
    [relationGroups.manyToOne, buildRelationEntry, hasSearch],
  );

  const manyToManyEntries = useMemo(
    () =>
      relationGroups.manyToMany
        .map((relation) => buildRelationEntry(relation, [relation.name], 1))
        .filter((entry) => !hasSearch || entry.matches),
    [relationGroups.manyToMany, buildRelationEntry, hasSearch],
  );

  const normalFieldCount =
    normalScalars.length + normalDates.length + normalDateHelpers.length;

  const visibleRelationCount =
    foreignKeyEntries.length +
    oneToOneEntries.length +
    manyToOneEntries.length +
    (showAdvanced ? manyToManyEntries.length : 0);

  const advancedHiddenCount = effectiveShowAdvanced
    ? 0
    : advancedFields.length + relationGroups.manyToMany.length;

  const hasAdvanced =
    allowAdvanced &&
    (advancedFields.length > 0 || relationGroups.manyToMany.length > 0);

  const hasAdvancedVisible =
    effectiveShowAdvanced &&
    (filteredAdvanced.length > 0 || manyToManyEntries.length > 0);

  const hasVisibleContent =
    recentVisible.length > 0 ||
    favoriteVisible.length > 0 ||
    quickList.length > 0 ||
    normalFieldCount > 0 ||
    foreignKeyEntries.length > 0 ||
    oneToOneEntries.length > 0 ||
    manyToOneEntries.length > 0 ||
    hasAdvancedVisible;

  const selectedKey = useMemo(() => currentPath.join("."), [currentPath]);

  const isSelected = useCallback(
    (path: string[]) => path.join(".") === selectedKey,
    [selectedKey],
  );

  const handleSelectField = useCallback(
    (path: string[], field: FilterableField) => {
      onSelect(path, field.name, field.defaultOperator);
      setOpen(false);
      setSearch("");
      setShowAdvanced(false);
      setExpandedRelations({});
      setLoadingRelations({});
    },
    [onSelect],
  );

  const toggleRelation = useCallback((name: string, openValue: boolean) => {
    setExpandedRelations((prev) => ({
      ...prev,
      [name]: openValue,
    }));
  }, []);

  const stopWheelPropagation = useCallback((event: React.WheelEvent) => {
    event.stopPropagation();
  }, []);

  const ensureRelationSchema = useCallback(
    async (relation: RelationFilter, key: string) => {
      if (!onLoadRelationSchema) return null;
      const existing = getNestedSchema(relation);
      if (existing) return existing;
      if (loadingRelations[key]) return null;

      setLoadingRelations((prev) => ({ ...prev, [key]: true }));
      const loaded = await onLoadRelationSchema(relation);
      setLoadingRelations((prev) => ({ ...prev, [key]: false }));
      return loaded;
    },
    [getNestedSchema, loadingRelations, onLoadRelationSchema],
  );

  useEffect(() => {
    if (!open || !onLoadRelationSchema) return;
    const nestedPaths = [...favoriteFields, ...recentFields].filter(
      (path) => path.length > 1,
    );
    if (nestedPaths.length === 0) return;

    const loadPath = async (path: string[]) => {
      let currentSchema: UnifiedFilterSchema | null = schema;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        const relation = currentSchema?.relationFilters.find(
          (r) => r.name === segment || r.fieldName === segment,
        );
        if (!relation) return;
        let nestedSchema = getNestedSchema(relation);
        if (!nestedSchema) {
          nestedSchema = await onLoadRelationSchema(relation);
        }
        if (!nestedSchema) return;
        currentSchema = nestedSchema;
      }
    };

    nestedPaths.forEach((path) => {
      void loadPath(path);
    });
  }, [
    open,
    onLoadRelationSchema,
    favoriteFields,
    recentFields,
    schema,
    getNestedSchema,
  ]);

  const getRelationVisual = useCallback((relation: RelationFilter) => {
    switch (relation.relationType) {
      case "FOREIGN_KEY":
        return { Icon: Link2, tone: "text-blue-500" };
      case "ONE_TO_ONE":
        return { Icon: Link2, tone: "text-indigo-500" };
      case "REVERSE_FK":
        return { Icon: GitBranch, tone: "text-emerald-500" };
      case "MANY_TO_MANY":
        return { Icon: Layers, tone: "text-purple-500" };
      default:
        return { Icon: Link2, tone: "text-muted-foreground" };
    }
  }, []);

  const renderRelationEntry = useCallback(
    (entry: RelationEntry, depth: number) => {
      const pathKey = entry.path.join(".");
      const nestedSchema = getNestedSchema(entry.relation);
      const isExpanded =
        expandedRelations[pathKey] ?? (hasSearch && entry.matches);
      const isLoading = loadingRelations[pathKey];
      const canExpand = Boolean(onLoadRelationSchema || nestedSchema);
      const { Icon, tone } = getRelationVisual(entry.relation);

      return (
        <div
          key={pathKey}
          style={{ marginLeft: depth * 12 }}
          className="space-y-1"
        >
          <Collapsible
            open={isExpanded}
            onOpenChange={(openValue) => {
              toggleRelation(pathKey, openValue);
              if (openValue && !nestedSchema) {
                void ensureRelationSchema(entry.relation, pathKey);
              }
            }}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                  !canExpand && "opacity-70",
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
                <Icon className={cn("h-3.5 w-3.5", tone)} />
                <span className="truncate">{entry.relation.fieldLabel}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {entry.relation.relatedModel}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {isLoading && (
                <div className="ml-6 mt-1 px-2 py-2 text-[11px] text-muted-foreground">
                  Chargement des champs…
                </div>
              )}
              {!isLoading && entry.filteredScalars.length > 0 && (
                <div className="ml-6 mt-1 space-y-1 border-l border-muted pl-3">
                  {entry.filteredScalars.map((field) => (
                    <button
                      key={`${pathKey}-${field.fieldName}`}
                      type="button"
                      onClick={() =>
                        handleSelectField([...entry.path, field.name], field)
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                        isSelected([...entry.path, field.name]) &&
                          "bg-muted/80",
                      )}
                    >
                      <FieldTypeIcon type={field.baseType} />
                      <span className="truncate">{field.fieldLabel}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {field.graphqlType}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading &&
                entry.filteredScalars.length === 0 &&
                entry.childRelations.length === 0 && (
                  <div className="ml-6 mt-1 px-2 py-2 text-[11px] text-muted-foreground">
                    {nestedSchema || !onLoadRelationSchema
                      ? "Aucun champ imbriqué disponible"
                      : "Développer pour charger les champs"}
                  </div>
                )}

              {entry.childRelations.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="ml-6 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Relations
                  </div>
                  <div className="space-y-2">
                    {entry.childRelations.map((child) =>
                      renderRelationEntry(child, depth + 1),
                    )}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    },
    [
      ensureRelationSchema,
      expandedRelations,
      getNestedSchema,
      hasSearch,
      handleSelectField,
      isSelected,
      loadingRelations,
      onLoadRelationSchema,
      getRelationVisual,
      toggleRelation,
    ],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[520px] p-0"
        align="start"
        onWheelCapture={stopWheelPropagation}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <Input
              placeholder="Rechercher des champs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Badge variant="outline" className="text-xs h-6">
              profondeur {config.maxDepth}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant={effectiveShowAdvanced ? "secondary" : "outline"}
              className="h-8 text-[11px]"
              onClick={() => setShowAdvanced((prev) => !prev)}
              disabled={!hasAdvanced}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Avancé
            </Button>
          </div>

          <ScrollArea
            className="h-[420px] overscroll-contain"
            onWheelCapture={stopWheelPropagation}
          >
            <div className="p-3 space-y-5">
              {!hasVisibleContent && (
                <div className="text-xs text-muted-foreground px-2 py-3">
                  Aucun champ trouvé
                  {advancedHiddenCount > 0 && (
                    <span className="ml-1">
                      | Activez le mode Avancé pour en voir {advancedHiddenCount} de plus
                    </span>
                  )}
                </div>
              )}

              {recentVisible.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Clock className="h-3 w-3 text-sky-500" />
                      Récents
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {recentVisible.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {recentVisible.slice(0, 5).map((item) => (
                      <button
                        key={`recent-${item.path.join(".")}`}
                        type="button"
                        onClick={() => handleSelectField(item.path, item.field)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                          isSelected(item.path) && "bg-muted/80",
                        )}
                      >
                        <FieldTypeIcon type={item.field.baseType} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">
                            {item.labelPath.join(" / ")}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.field.graphqlType}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(favoriteVisible.length > 0 || quickList.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Zap className="h-3 w-3 text-orange-500" />
                      Filtres rapides
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {favoriteVisible.length + quickList.length}
                    </Badge>
                  </div>

                  {favoriteVisible.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500" />
                        Épinglés
                      </div>
                      <div className="space-y-1">
                        {favoriteVisible.map((item) => (
                          <button
                            key={`fav-${item.path.join(".")}`}
                            type="button"
                            onClick={() =>
                              handleSelectField(item.path, item.field)
                            }
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                              isSelected(item.path) && "bg-muted/80",
                            )}
                          >
                            <FieldTypeIcon type={item.field.baseType} />
                            <span className="truncate">
                              {item.labelPath.join(" / ")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickList.length > 0 && (
                    <div className="space-y-1">
                      {quickList.map((field) => (
                        <button
                          key={`quick-${field.fieldName}`}
                          type="button"
                          onClick={() => handleQuickSelect(field)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                            isSelected([field.name]) && "bg-muted/80",
                          )}
                        >
                          <FieldTypeIcon type={field.baseType} />
                          <span className="truncate">{field.fieldLabel}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {normalFieldCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Champs
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {normalFieldCount}
                    </Badge>
                  </div>

                  {normalScalars.length > 0 && (
                    <div className="space-y-1">
                      {normalScalars.map((field) => (
                        <button
                          key={field.fieldName}
                          type="button"
                          onClick={() => handleSelectField([field.name], field)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                            isSelected([field.name]) && "bg-muted/80",
                          )}
                        >
                          <FieldTypeIcon type={field.baseType} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs">
                              {field.fieldLabel}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {field.graphqlType}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {normalDates.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 text-sky-500" />
                        Date & heure
                      </div>
                      <div className="space-y-1">
                        {normalDates.map((field) => (
                          <button
                            key={`date-${field.fieldName}`}
                            type="button"
                            onClick={() =>
                              handleSelectField([field.name], field)
                            }
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                              isSelected([field.name]) && "bg-muted/80",
                            )}
                          >
                            <FieldTypeIcon type={field.baseType} />
                            <span className="truncate">{field.fieldLabel}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {normalDateHelpers.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="uppercase tracking-wide text-[10px]">
                          Assistants de date
                        </span>
                      </div>
                      <div className="space-y-1">
                        {normalDateHelpers.map((field) => (
                          <button
                            key={`date-helper-${field.fieldName}`}
                            type="button"
                            onClick={() =>
                              handleSelectField([field.name], field)
                            }
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                              isSelected([field.name]) && "bg-muted/80",
                            )}
                          >
                            <FieldTypeIcon type={field.baseType} />
                            <span className="truncate">{field.fieldLabel}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {foreignKeyEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Link2 className="h-3 w-3 text-blue-500" />
                      Clés étrangères directes
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {foreignKeyEntries.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {foreignKeyEntries.map((entry) =>
                      renderRelationEntry(entry, 0),
                    )}
                  </div>
                </div>
              )}

              {oneToOneEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Link2 className="h-3 w-3 text-indigo-500" />
                      Relations un-à-un
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {oneToOneEntries.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {oneToOneEntries.map((entry) =>
                      renderRelationEntry(entry, 0),
                    )}
                  </div>
                </div>
              )}

              {manyToOneEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <GitBranch className="h-3 w-3 text-emerald-500" />
                      Relations plusieurs-à-un
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {manyToOneEntries.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {manyToOneEntries.map((entry) =>
                      renderRelationEntry(entry, 0),
                    )}
                  </div>
                </div>
              )}

              {hasAdvancedVisible && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                      Avancé
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {filteredAdvanced.length + manyToManyEntries.length}
                    </Badge>
                  </div>

                  {manyToManyEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Layers className="h-3 w-3 text-purple-500" />
                        Plusieurs-à-plusieurs
                      </div>
                      <div className="space-y-2">
                        {manyToManyEntries.map((entry) =>
                          renderRelationEntry(entry, 0),
                        )}
                      </div>
                    </div>
                  )}

                  {filteredAdvanced.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <SlidersHorizontal className="h-3 w-3" />
                        Champs avancés
                      </div>
                      <div className="space-y-1">
                        {filteredAdvanced.map((field) => (
                          <button
                            key={`adv-${field.fieldName}`}
                            type="button"
                            onClick={() =>
                              handleSelectField([field.name], field)
                            }
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
                              isSelected([field.name]) && "bg-muted/80",
                            )}
                          >
                            {field.baseType === "Relationship" ? (
                              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <FieldTypeIcon type={field.baseType} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">
                                {field.fieldLabel}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {field.graphqlType}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground bg-muted/20">
            {standardFields.length} champs, {visibleRelationCount} relations
            {advancedHiddenCount > 0 && (
              <span className="ml-2">
                | {advancedHiddenCount} avancés masqués
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InlineFieldSelector;
