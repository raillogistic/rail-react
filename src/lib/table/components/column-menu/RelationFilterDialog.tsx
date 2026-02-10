import React, { useMemo, useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { Sigma } from "lucide-react";
import { isRecord } from "../../utils";
import type { FilterSchema } from "../../types";
import {
  HEADER_BASE_WHERE_KEY,
  HEADER_RELATION_FILTERS_KEY,
  isScalarFilterInputType,
  mergeWhereWithRelationFragments,
  operatorOptionsForGraphqlType,
  parseScalarValue,
  resolveFilterSchemaByName,
} from "./columnMenuHelpers";
import type {
  AggFunction,
  RelationFieldOption,
  RelationFilterDialogProps,
  RelationFunctionMode,
} from "./types";
import { formatLookupLabelFr } from "../filtering/operatorLabels";

export function RelationFilterDialog({
  columnId,
  metadataFilters,
  relationBaseName,
  relationFunctionKeys,
  filterVariables,
  advancedFilters,
  setAdvancedFilters,
}: RelationFilterDialogProps) {
  const relationSomeFilter = resolveFilterSchemaByName(
    metadataFilters,
    relationFunctionKeys.some,
  ) as FilterSchema | undefined;
  const relationCountFilter = resolveFilterSchemaByName(
    metadataFilters,
    relationFunctionKeys.count,
  ) as FilterSchema | undefined;

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
  const hasActiveRelationFilters = Object.values(relationFunctionKeys).some(
    (key) => !!relationFragmentsMap[key],
  );

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
            Au moins un (SOME)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openRelationDialog("none");
            }}
          >
            Aucun (NONE)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openRelationDialog("every");
            }}
          >
            Tous (EVERY)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openRelationDialog("count");
            }}
          >
            Compte (COUNT)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openRelationDialog("agg");
            }}
          >
            Agrégation (AGG)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              clearRelationFragments();
            }}
            disabled={!hasActiveRelationFilters}
          >
            Effacer les fonctions de relation
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <Dialog open={relationDialogOpen} onOpenChange={setRelationDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Filtre de relation : {relationMode.toUpperCase()}</DialogTitle>
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
                      <SelectValue placeholder="Sélectionner un champ" />
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
                      <SelectItem value="sum">somme (sum)</SelectItem>
                      <SelectItem value="avg">moyenne (avg)</SelectItem>
                      <SelectItem value="min">minimum (min)</SelectItem>
                      <SelectItem value="max">maximum (max)</SelectItem>
                      <SelectItem value="count">compte (count)</SelectItem>
                      <SelectItem value="countDistinct">compte distinct (countDistinct)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Opérateur</Label>
                    <Select value={aggOperator} onValueChange={setAggOperator}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">égal à (eq)</SelectItem>
                        <SelectItem value="neq">différent de (neq)</SelectItem>
                        <SelectItem value="gt">supérieur à (gt)</SelectItem>
                        <SelectItem value="gte">supérieur ou égal à (gte)</SelectItem>
                        <SelectItem value="lt">inférieur à (lt)</SelectItem>
                        <SelectItem value="lte">inférieur ou égal à (lte)</SelectItem>
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
                  <Label>Opérateur</Label>
                  <Select value={relationOperator} onValueChange={setRelationOperator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {relationCountOperators.map((operator) => (
                        <SelectItem key={`count-op-${operator}`} value={operator}>
                          {formatLookupLabelFr(operator)}
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
                      <SelectValue placeholder="Sélectionner un champ" />
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
                    <Label>Opérateur</Label>
                    <Select value={relationOperator} onValueChange={setRelationOperator}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {relationOperatorOptions.map((operator) => (
                          <SelectItem key={`rel-op-${operator}`} value={operator}>
                            {formatLookupLabelFr(operator)}
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
                          <SelectItem value="true">Vrai (true)</SelectItem>
                          <SelectItem value="false">Faux (false)</SelectItem>
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
