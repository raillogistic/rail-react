import React, { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  EyeOff,
  Filter,
  GripVertical,
  Layers,
  MoreVertical,
  RotateCcw,
  Scaling,
  Sigma,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { FieldSchema } from "../types";
import { cn } from "@/lib/utils";
import { getSyntheticRelationCountSource } from "../utils";

interface TableColumnMenuProps {
  columnId: string;
  title: React.ReactNode;
  field?: FieldSchema;
  disabled?: boolean;
  fullWidthTrigger?: boolean;
}

const HEADER_RELATION_FILTERS_KEY = "__headerRelationFilters";
const HEADER_BASE_WHERE_KEY = "__baseWhere";

type RelationFunctionMode = "some" | "none" | "every" | "count" | "agg";

type AggFunction = "sum" | "avg" | "min" | "max" | "count" | "countDistinct";

type RelationFieldOption = {
  name: string;
  label: string;
  graphqlType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function isScalarFilterInputType(typeName: string): boolean {
  if (!typeName || !typeName.includes("FilterInput")) return false;
  if (typeName.includes("WhereInput")) return false;
  if (typeName.includes("AggregationFilterInput")) return false;
  if (typeName.includes("ConditionalAggregationFilterInput")) return false;
  return true;
}

function operatorOptionsForGraphqlType(typeName: string): string[] {
  const normalized = (typeName || "").toLowerCase();
  if (normalized.includes("boolean")) {
    return ["eq", "isNull"];
  }
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("count") ||
    normalized.includes("date") ||
    normalized.includes("datetime")
  ) {
    return ["eq", "neq", "gt", "gte", "lt", "lte", "isNull"];
  }
  return [
    "eq",
    "neq",
    "icontains",
    "contains",
    "startsWith",
    "endsWith",
    "isNull",
  ];
}

function parseScalarValue(
  rawValue: string,
  graphqlType: string,
  operator: string,
): unknown {
  if (operator === "isNull") {
    return rawValue === "" ? true : rawValue === "true";
  }

  const normalized = (graphqlType || "").toLowerCase();
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("count")
  ) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }

  if (normalized.includes("boolean")) {
    return rawValue === "true";
  }

  return rawValue;
}

function mergeWhereWithRelationFragments(
  baseWhere: Record<string, unknown> | undefined,
  fragmentsMap: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const clauses: Record<string, unknown>[] = [];

  if (baseWhere && Object.keys(baseWhere).length > 0) {
    clauses.push(baseWhere);
  }

  Object.values(fragmentsMap).forEach((entry) => {
    if (!isRecord(entry)) return;
    if (Object.keys(entry).length === 0) return;
    clauses.push(entry);
  });

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

export function TableColumnMenu({
  columnId,
  title,
  field,
  disabled,
  fullWidthTrigger = false,
}: TableColumnMenuProps) {
  const triggerTitle =
    typeof title === "string" ? title : "Options de colonne";

  const { metadata } = useMetadata();
  const {
    advancedFilters,
    filterVariables,
    setAdvancedFilters,
    columnVisibility,
    setColumnVisibility,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    setColumnOrder,
    setActiveColumnFilter,
    dragModeEnabled,
    setDragModeEnabled,
  } = useTable();
  const metadataFilters = metadata?.filters ?? [];

  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) => f.name === columnId || f.fieldName === columnId,
    );
  }, [field, metadata, columnId]);

  const normalizeSortKey = (value: string) => {
    return value.replace(/^-/, "").replace(/\./g, "__");
  };

  const sortKey = resolvedField?.name || columnId;
  const normalizedKey = normalizeSortKey(sortKey);

  const currentSort = useMemo(() => {
    const entry = advancedFilters.orderBy.find(
      (e) => normalizeSortKey(e) === normalizedKey,
    );
    if (!entry) return null;
    return entry.startsWith("-") ? "desc" : "asc";
  }, [advancedFilters.orderBy, normalizedKey]);

  const handleSort = (direction: "asc" | "desc" | null) => {
    let nextOrderBy = advancedFilters.orderBy.filter(
      (e) => normalizeSortKey(e) !== normalizedKey,
    );

    if (direction) {
      const prefix = direction === "desc" ? "-" : "";
      nextOrderBy = [`${prefix}${sortKey}`, ...nextOrderBy];
    }

    setAdvancedFilters(
      { ...advancedFilters, orderBy: nextOrderBy },
      {
        ...(filterVariables ?? {}),
        orderBy: nextOrderBy.length ? nextOrderBy : undefined,
      },
    );
  };

  const isGrouped =
    groupingField === (resolvedField?.fieldName || resolvedField?.name);
  const canGroup =
    resolvedField &&
    !["DateField", "DateTimeField", "TextField"].includes(
      resolvedField.fieldType,
    );

  const handleGroup = () => {
    const key = resolvedField?.fieldName || resolvedField?.name;
    if (!key) return;

    if (isGrouped) {
      setGroupingField(null);
      setGroupCollapsed({});
    } else {
      setGroupingField(key);
      setGroupCollapsed({});
    }
  };

  const handleHide = () => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: false,
    });
  };

  const handleResetColumns = () => {
    setColumnVisibility({});
    setColumnOrder([]);
  };

  const handleToggleDragMode = () => {
    setDragModeEnabled(!dragModeEnabled);
  };

  const filterSchema = useMemo(() => {
    if (!metadata) return null;

    return metadataFilters.find(
      (f) =>
        f.fieldName === resolvedField?.fieldName ||
        f.name === resolvedField?.name ||
        f.fieldName === columnId ||
        f.name === columnId,
    );
  }, [metadata, metadataFilters, resolvedField, columnId]);

  const handleOpenFilter = () => {
    setActiveColumnFilter(columnId);
  };

  const relationSource = useMemo(() => {
    if (!resolvedField) return null;
    if (resolvedField.isRelation) return resolvedField.name || resolvedField.fieldName;
    return getSyntheticRelationCountSource(resolvedField) ?? null;
  }, [resolvedField]);

  const relationSchema = useMemo(() => {
    if (!metadata?.relationships) return undefined;
    const source = relationSource || columnId;
    return metadata.relationships.find(
      (relation) =>
        relation.name === source ||
        relation.fieldName === source ||
        relation.name === columnId ||
        relation.fieldName === columnId,
    );
  }, [metadata?.relationships, relationSource, columnId]);

  const relationType = (relationSchema?.relationType || "").toUpperCase();
  const supportsRelationFunctions =
    relationType === "MANY_TO_MANY" || relationType === "REVERSE_FK";

  const relationBaseName = relationSchema?.name || relationSchema?.fieldName;
  const relationFunctionKeys = useMemo(() => {
    if (!relationBaseName) return null;
    return {
      some: `${relationBaseName}Some`,
      none: `${relationBaseName}None`,
      every: `${relationBaseName}Every`,
      count: `${relationBaseName}Count`,
      agg: `${relationBaseName}Agg`,
    } as const;
  }, [relationBaseName]);

  const resolveFilterSchemaByName = (name?: string) => {
    if (!metadata || !name) return undefined;
    const snakeName = toSnakeCase(name);
    return metadataFilters.find(
      (f) =>
        f.name === name ||
        f.fieldName === name ||
        f.name === snakeName ||
        f.fieldName === snakeName,
    );
  };

  const relationSomeFilter = resolveFilterSchemaByName(relationFunctionKeys?.some);
  const relationCountFilter = resolveFilterSchemaByName(relationFunctionKeys?.count);

  const relationFieldOptions = useMemo<RelationFieldOption[]>(() => {
    if (!relationSomeFilter) return [];
    const excluded = new Set(["AND", "OR", "NOT", "quick", "include"]);
    return relationSomeFilter.options
      .filter((option) => !excluded.has(option.name))
      .filter((option) => isScalarFilterInputType(option.graphqlType || ""))
      .map((option) => ({
        name: option.name,
        label: option.label || option.name,
        graphqlType: option.graphqlType || "StringFilterInput",
      }));
  }, [relationSomeFilter]);

  const relationCountOperators = useMemo(() => {
    if (!relationCountFilter || relationCountFilter.options.length === 0) {
      return ["eq", "neq", "gt", "gte", "lt", "lte"];
    }
    return relationCountFilter.options
      .map((option) => option.lookup || option.name)
      .filter((entry): entry is string => !!entry);
  }, [relationCountFilter]);

  const currentVariables = isRecord(filterVariables) ? filterVariables : {};
  const relationFragmentsMap = isRecord(currentVariables[HEADER_RELATION_FILTERS_KEY])
    ? (currentVariables[HEADER_RELATION_FILTERS_KEY] as Record<string, unknown>)
    : {};
  const hasActiveRelationFilters = relationFunctionKeys
    ? Object.values(relationFunctionKeys).some((key) => !!relationFragmentsMap[key])
    : false;

  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [relationMode, setRelationMode] = useState<RelationFunctionMode>("count");
  const [relationFieldName, setRelationFieldName] = useState("");
  const [relationOperator, setRelationOperator] = useState("eq");
  const [relationValue, setRelationValue] = useState("");
  const [aggField, setAggField] = useState("");
  const [aggFunction, setAggFunction] = useState<AggFunction>("count");
  const [aggOperator, setAggOperator] = useState("gte");
  const [aggValue, setAggValue] = useState("1");

  const selectedRelationField = relationFieldOptions.find(
    (entry) => entry.name === relationFieldName,
  );
  const relationOperatorOptions =
    relationMode === "count"
      ? relationCountOperators
      : operatorOptionsForGraphqlType(
          selectedRelationField?.graphqlType || "StringFilterInput",
        );

  const relationValueType = (selectedRelationField?.graphqlType || "").toLowerCase();
  const relationValueIsBoolean = relationValueType.includes("boolean");
  const relationValueIsNumeric =
    relationValueType.includes("int") ||
    relationValueType.includes("float") ||
    relationValueType.includes("decimal") ||
    relationValueType.includes("count");

  const openRelationDialog = (mode: RelationFunctionMode) => {
    setRelationMode(mode);
    if (mode === "count") {
      setRelationOperator(relationCountOperators[0] || "eq");
      setRelationValue("1");
    } else if (mode === "agg") {
      const firstField = relationFieldOptions[0]?.name || "id";
      setAggField(firstField);
      setAggFunction("count");
      setAggOperator("gte");
      setAggValue("1");
    } else {
      const firstField = relationFieldOptions[0];
      const firstOperator = operatorOptionsForGraphqlType(
        firstField?.graphqlType || "StringFilterInput",
      )[0];
      setRelationFieldName(firstField?.name || "id");
      setRelationOperator(firstOperator || "eq");
      setRelationValue("");
    }
    setRelationDialogOpen(true);
  };

  const applyRelationFragment = (
    functionKey: string,
    fragment: Record<string, unknown>,
  ) => {
    const existingVariables = isRecord(filterVariables) ? filterVariables : {};
    const nextRelationFragments = isRecord(existingVariables[HEADER_RELATION_FILTERS_KEY])
      ? { ...(existingVariables[HEADER_RELATION_FILTERS_KEY] as Record<string, unknown>) }
      : {};

    nextRelationFragments[functionKey] = fragment;

    const baseWhere = isRecord(existingVariables[HEADER_BASE_WHERE_KEY])
      ? (existingVariables[HEADER_BASE_WHERE_KEY] as Record<string, unknown>)
      : isRecord(existingVariables.where)
        ? (existingVariables.where as Record<string, unknown>)
        : undefined;

    const mergedWhere = mergeWhereWithRelationFragments(baseWhere, nextRelationFragments);

    setAdvancedFilters(
      { ...advancedFilters },
      {
        ...existingVariables,
        [HEADER_BASE_WHERE_KEY]: baseWhere ?? {},
        [HEADER_RELATION_FILTERS_KEY]: nextRelationFragments,
        where: mergedWhere,
      },
    );
  };

  const clearRelationFragments = () => {
    if (!relationFunctionKeys) return;
    const existingVariables = isRecord(filterVariables) ? filterVariables : {};
    const nextRelationFragments = isRecord(existingVariables[HEADER_RELATION_FILTERS_KEY])
      ? { ...(existingVariables[HEADER_RELATION_FILTERS_KEY] as Record<string, unknown>) }
      : {};

    delete nextRelationFragments[relationFunctionKeys.some];
    delete nextRelationFragments[relationFunctionKeys.none];
    delete nextRelationFragments[relationFunctionKeys.every];
    delete nextRelationFragments[relationFunctionKeys.count];
    delete nextRelationFragments[relationFunctionKeys.agg];

    const baseWhere = isRecord(existingVariables[HEADER_BASE_WHERE_KEY])
      ? (existingVariables[HEADER_BASE_WHERE_KEY] as Record<string, unknown>)
      : undefined;
    const mergedWhere = mergeWhereWithRelationFragments(baseWhere, nextRelationFragments);

    const nextVariables: Record<string, unknown> = { ...existingVariables };
    if (Object.keys(nextRelationFragments).length === 0) {
      delete nextVariables[HEADER_RELATION_FILTERS_KEY];
      delete nextVariables[HEADER_BASE_WHERE_KEY];
      if (mergedWhere) {
        nextVariables.where = mergedWhere;
      } else {
        delete nextVariables.where;
      }
    } else {
      nextVariables[HEADER_RELATION_FILTERS_KEY] = nextRelationFragments;
      nextVariables[HEADER_BASE_WHERE_KEY] = baseWhere ?? {};
      nextVariables.where = mergedWhere;
    }

    setAdvancedFilters({ ...advancedFilters }, nextVariables);
  };

  const applyRelationDialog = () => {
    if (!relationFunctionKeys) return;

    if (relationMode === "count") {
      const parsedValue = Number(relationValue);
      if (Number.isNaN(parsedValue)) return;
      applyRelationFragment(relationFunctionKeys.count, {
        [relationFunctionKeys.count]: {
          [relationOperator]: parsedValue,
        },
      });
      setRelationDialogOpen(false);
      return;
    }

    if (relationMode === "agg") {
      const parsedValue = Number(aggValue);
      if (Number.isNaN(parsedValue) || !aggField) return;
      applyRelationFragment(relationFunctionKeys.agg, {
        [relationFunctionKeys.agg]: {
          field: aggField,
          [aggFunction]: {
            [aggOperator]: parsedValue,
          },
        },
      });
      setRelationDialogOpen(false);
      return;
    }

    if (!relationFieldName) return;
    const functionKey =
      relationMode === "some"
        ? relationFunctionKeys.some
        : relationMode === "none"
          ? relationFunctionKeys.none
          : relationFunctionKeys.every;

    const parsedValue = parseScalarValue(
      relationValue,
      selectedRelationField?.graphqlType || "StringFilterInput",
      relationOperator,
    );
    if (parsedValue === undefined) return;

    applyRelationFragment(functionKey, {
      [functionKey]: {
        [relationFieldName]: {
          [relationOperator]: parsedValue,
        },
      },
    });
    setRelationDialogOpen(false);
  };

  const canApplyRelationDialog = (() => {
    if (!relationFunctionKeys) return false;

    if (relationMode === "count") {
      return relationValue !== "" && !Number.isNaN(Number(relationValue));
    }

    if (relationMode === "agg") {
      return !!aggField && aggValue !== "" && !Number.isNaN(Number(aggValue));
    }

    if (!relationFieldName) return false;
    if (relationOperator === "isNull") return true;

    if (relationValueIsBoolean) {
      return relationValue === "true" || relationValue === "false";
    }

    if (relationValueIsNumeric) {
      return relationValue !== "" && !Number.isNaN(Number(relationValue));
    }

    return relationValue.trim() !== "";
  })();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {fullWidthTrigger ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-full w-full min-h-0 m-0 self-stretch rounded-none justify-between px-0 py-0 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                "font-medium",
                currentSort
                  ? "text-primary"
                  : "text-foreground hover:text-foreground",
              )}
            >
              <span className="truncate text-left px-2">{triggerTitle}</span>
              {currentSort && (
                <span className="px-2 text-xs font-semibold" aria-hidden="true">
                  {currentSort === "asc" ? "^" : "v"}
                </span>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground ml-1",
                currentSort
                  ? "text-primary"
                  : "text-muted-foreground/50 hover:text-foreground",
              )}
            >
              {currentSort === "asc" && <ArrowUpAZ className="h-3.5 w-3.5" />}
              {currentSort === "desc" && <ArrowDownAZ className="h-3.5 w-3.5" />}
              {!currentSort && <MoreVertical className="h-3.5 w-3.5" />}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70 border-b border-border/50 mb-1">
            {triggerTitle}
          </div>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Trier</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleSort("asc")}>
                <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Croissant (A-Z)</span>
                {currentSort === "asc" && (
                  <Check className="ml-auto h-3.5 w-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("desc")}>
                <ArrowDownAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Decroissant (Z-A)</span>
                {currentSort === "desc" && (
                  <Check className="ml-auto h-3.5 w-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSort(null)}
                disabled={!currentSort}
              >
                <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Effacer le tri</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {filterSchema && filterSchema.options.length > 0 && (
            <DropdownMenuItem onClick={handleOpenFilter}>
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Filtrer</span>
            </DropdownMenuItem>
          )}

          {supportsRelationFunctions && relationFunctionKeys && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sigma className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Fonctions relation</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRelationDialog("some");
                  }}
                >
                  Some
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRelationDialog("none");
                  }}
                >
                  None
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRelationDialog("every");
                  }}
                >
                  Every
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRelationDialog("count");
                  }}
                >
                  Count
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRelationDialog("agg");
                  }}
                >
                  Agg
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    clearRelationFragments();
                  }}
                  disabled={!hasActiveRelationFilters}
                >
                  Effacer fonctions relation
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleToggleDragMode}>
            <GripVertical className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {dragModeEnabled
                ? "Desactiver glisser-deposer"
                : "Activer glisser-deposer"}
            </span>
            {dragModeEnabled && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {canGroup && (
            <DropdownMenuItem onClick={handleGroup}>
              <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>{isGrouped ? "Degrouper" : "Grouper par"}</span>
              {isGrouped && <Check className="ml-auto h-3.5 w-3.5" />}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => console.log("Auto resize")}>
            <Scaling className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Ajuster la largeur</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleHide}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Masquer</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetColumns}>
            <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Reinitialiser les colonnes</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={relationDialogOpen} onOpenChange={setRelationDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Filtre relation: {relationMode.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Appliquer un filtre via {relationBaseName ?? columnId} avec les fonctions rail-django.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {relationMode === "agg" ? (
              <>
                <div className="space-y-1">
                  <Label>Champ</Label>
                  <Select value={aggField} onValueChange={setAggField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un champ" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationFieldOptions.map((option) => (
                        <SelectItem key={`agg-field-${option.name}`} value={option.name}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Fonction</Label>
                  <Select
                    value={aggFunction}
                    onValueChange={(value) => setAggFunction(value as AggFunction)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">sum</SelectItem>
                      <SelectItem value="avg">avg</SelectItem>
                      <SelectItem value="min">min</SelectItem>
                      <SelectItem value="max">max</SelectItem>
                      <SelectItem value="count">count</SelectItem>
                      <SelectItem value="countDistinct">countDistinct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Operateur</Label>
                    <Select value={aggOperator} onValueChange={setAggOperator}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">eq</SelectItem>
                        <SelectItem value="neq">neq</SelectItem>
                        <SelectItem value="gt">gt</SelectItem>
                        <SelectItem value="gte">gte</SelectItem>
                        <SelectItem value="lt">lt</SelectItem>
                        <SelectItem value="lte">lte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Valeur</Label>
                    <Input
                      type="number"
                      value={aggValue}
                      onChange={(event) => setAggValue(event.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : relationMode === "count" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Operateur</Label>
                  <Select value={relationOperator} onValueChange={setRelationOperator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {relationCountOperators.map((operator) => (
                        <SelectItem key={`count-op-${operator}`} value={operator}>
                          {operator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Valeur</Label>
                  <Input
                    type="number"
                    value={relationValue}
                    onChange={(event) => setRelationValue(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label>Champ</Label>
                  <Select
                    value={relationFieldName}
                    onValueChange={(value) => {
                      setRelationFieldName(value);
                      const targetField = relationFieldOptions.find((entry) => entry.name === value);
                      const firstOperator = operatorOptionsForGraphqlType(
                        targetField?.graphqlType || "StringFilterInput",
                      )[0];
                      if (firstOperator) {
                        setRelationOperator(firstOperator);
                      }
                      setRelationValue("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un champ" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationFieldOptions.map((option) => (
                        <SelectItem key={`rel-field-${option.name}`} value={option.name}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Operateur</Label>
                    <Select value={relationOperator} onValueChange={setRelationOperator}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {relationOperatorOptions.map((operator) => (
                          <SelectItem key={`rel-op-${operator}`} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Valeur</Label>
                    {relationOperator === "isNull" || relationValueIsBoolean ? (
                      <Select value={relationValue || "true"} onValueChange={setRelationValue}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={relationValueIsNumeric ? "number" : "text"}
                        value={relationValue}
                        onChange={(event) => setRelationValue(event.target.value)}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRelationDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={applyRelationDialog} disabled={!canApplyRelationDialog}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
