import React, { useMemo, useState } from "react";
import {
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/shared/ui/kit/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/kit/select";
import { Sigma } from "lucide-react";
import type { FilterSchema } from "../../types";
import {
 isScalarFilterInputType,
 operatorOptionsForGraphqlType,
 parseScalarValue,
 resolveFilterSchemaByName,
} from "./columnMenuHelpers";
import {
 removeRelationFunctionsByRelation,
 upsertRelationFunction,
} from "@/widgets/model-table/filtering/engine";
import type { RelationFunctionFilter } from "@/widgets/model-table/filtering/types";
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

 const relationFunctions = advancedFilters.relationFunctions ?? [];
 const hasActiveRelationFilters = relationFunctions.some((entry) => {
 const path =
 entry.relationPath && entry.relationPath.length > 0
 ? entry.relationPath
 : [entry.relationName];
 return path[path.length - 1] === relationBaseName;
 });

 const [relationDialogOpen, setRelationDialogOpen] = useState(false);
 const [relationMode, setRelationMode] =
 useState<RelationFunctionMode>("count");
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

 const relationValueType = (
 selectedRelationField?.graphqlType || ""
 ).toLowerCase();
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

 const applyRelationFunction = (relationFilter: RelationFunctionFilter) => {
 const nextRelationFilters = upsertRelationFunction(
 relationFunctions,
 relationFilter,
 );
 setAdvancedFilters({
 ...advancedFilters,
 relationFunctions: nextRelationFilters,
 });
 };

 const clearRelationFragments = () => {
 const nextRelationFilters = removeRelationFunctionsByRelation(
 relationFunctions,
 relationBaseName,
 );
 setAdvancedFilters({
 ...advancedFilters,
 relationFunctions: nextRelationFilters,
 });
 };

 const applyRelationDialog = () => {
 if (relationMode === "count") {
 const parsedValue = Number(relationValue);
 if (Number.isNaN(parsedValue)) return;
 applyRelationFunction({
 id:`${relationBaseName}:count`,
 relationName: relationBaseName,
 relationPath: [relationBaseName],
 mode: "count",
 operator: relationOperator,
 value: parsedValue,
 });
 setRelationDialogOpen(false);
 return;
 }

 if (relationMode === "agg") {
 const parsedValue = Number(aggValue);
 if (Number.isNaN(parsedValue) || !aggField) return;
 applyRelationFunction({
 id:`${relationBaseName}:agg`,
 relationName: relationBaseName,
 relationPath: [relationBaseName],
 mode: "agg",
 fieldName: aggField,
 aggFunction,
 operator: aggOperator,
 value: parsedValue,
 });
 setRelationDialogOpen(false);
 return;
 }

 if (!relationFieldName) return;
 const parsedValue = parseScalarValue(
 relationValue,
 selectedRelationField?.graphqlType || "StringFilterInput",
 relationOperator,
 );
 if (parsedValue === undefined) return;

 applyRelationFunction({
 id:`${relationBaseName}:${relationMode}`,
 relationName: relationBaseName,
 relationPath: [relationBaseName],
 mode:
 relationMode === "none"
 ? "none"
 : relationMode === "every"
 ? "every"
 : "some",
 fieldName: relationFieldName,
 operator: relationOperator,
 value: parsedValue,
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
 AgrÃ©gation (AGG)
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
 <DialogContent className="sm:max-w-[480px] border-border/30 shadow-2xl backdrop-blur-xl bg-background/95">
 <DialogHeader>
 <DialogTitle className="font-bold text-lg">
 Filtre de relation : {relationMode.toUpperCase()}
 </DialogTitle>
 <DialogDescription className="text-[11px] text-muted-foreground/60">
 Appliquer un filtre via {relationBaseName ?? columnId} avec les
 fonctions rail-django.
 </DialogDescription>
 </DialogHeader>

 <div className="grid gap-3 py-2">
 {relationMode === "agg" ? (
 <>
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Champ
 </Label>
 <Select value={aggField} onValueChange={setAggField}>
 <SelectTrigger>
 <SelectValue placeholder="SÃ©lectionner un champ" />
 </SelectTrigger>
 <SelectContent>
 {relationFieldOptions.map((option) => (
 <SelectItem
 key={`agg-field-${option.name}`}
 value={option.name}
 >
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Fonction
 </Label>
 <Select
 value={aggFunction}
 onValueChange={(value) =>
 setAggFunction(value as AggFunction)
 }
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
 <SelectItem value="countDistinct">
 compte distinct (countDistinct)
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 OpÃ©rateur
 </Label>
 <Select value={aggOperator} onValueChange={setAggOperator}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="eq">Ã©gal Ã  (eq)</SelectItem>
 <SelectItem value="neq">diffÃ©rent de (neq)</SelectItem>
 <SelectItem value="gt">supÃ©rieur Ã  (gt)</SelectItem>
 <SelectItem value="gte">
 supÃ©rieur ou Ã©gal Ã  (gte)
 </SelectItem>
 <SelectItem value="lt">infÃ©rieur Ã  (lt)</SelectItem>
 <SelectItem value="lte">
 infÃ©rieur ou Ã©gal Ã  (lte)
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Valeur
 </Label>
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
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 OpÃ©rateur
 </Label>
 <Select
 value={relationOperator}
 onValueChange={setRelationOperator}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {relationCountOperators.map((operator) => (
 <SelectItem
 key={`count-op-${operator}`}
 value={operator}
 >
 {formatLookupLabelFr(operator)}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Valeur
 </Label>
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
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Champ
 </Label>
 <Select
 value={relationFieldName}
 onValueChange={(value) => {
 setRelationFieldName(value);
 const targetField = relationFieldOptions.find(
 (entry) => entry.name === value,
 );
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
 <SelectValue placeholder="SÃ©lectionner un champ" />
 </SelectTrigger>
 <SelectContent>
 {relationFieldOptions.map((option) => (
 <SelectItem
 key={`rel-field-${option.name}`}
 value={option.name}
 >
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 OpÃ©rateur
 </Label>
 <Select
 value={relationOperator}
 onValueChange={setRelationOperator}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {relationOperatorOptions.map((operator) => (
 <SelectItem
 key={`rel-op-${operator}`}
 value={operator}
 >
 {formatLookupLabelFr(operator)}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1">
 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
 Valeur
 </Label>
 {relationOperator === "isNull" || relationValueIsBoolean ? (
 <Select
 value={relationValue || "true"}
 onValueChange={setRelationValue}
 >
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
 onChange={(event) =>
 setRelationValue(event.target.value)
 }
 />
 )}
 </div>
 </div>
 </>
 )}
 </div>

 <DialogFooter className="gap-2">
 <Button
 variant="outline"
 onClick={() => setRelationDialogOpen(false)}
 className="h-9 text-xs font-semibold border-border/30"
 >
 Annuler
 </Button>
 <Button
 onClick={applyRelationDialog}
 disabled={!canApplyRelationDialog}
 className="h-9 text-xs font-bold"
 >
 Appliquer
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </>
 );
}
