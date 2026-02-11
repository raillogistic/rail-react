/**
 * FilterRow - Ligne de filtre individuelle avec champ, opérateur et valeur.
 * Conçu pour s'intégrer dans une interface ERP moderne et épurée.
 */

import React, { useMemo } from "react";
import { X, AlertCircle, ChevronRight, Hash, Type, Calendar, CheckSquare, Search, Tag } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Badge } from "@/lib/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  FilterCondition,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
  UnifiedFilterSchema,
  FieldSelectorOptions,
} from "../types";
import { InlineFieldSelector } from "./InlineFieldSelector";
import { CompactOperatorSelect } from "./CompactOperatorSelect";
import { SmartValueInput } from "./SmartValueInput";

export interface FilterRowProps {
  /** La condition de filtrage à afficher et éditer */
  condition: FilterCondition;
  /** Schéma global des filtres */
  schema: UnifiedFilterSchema;
  /** Configuration du panneau de filtrage */
  config: NestedFilterConfig;
  /** Callback lors d'une modification de la condition */
  onChange: (updates: Partial<FilterCondition>) => void;
  /** Callback pour supprimer cette ligne */
  onRemove: () => void;
  /** Callback lors du changement de champ cible */
  onFieldChange: (fieldPath: string[], fieldName: string, operator: string) => void;
  /** Focus automatique au montage */
  autoFocus?: boolean;
  /** Indique si la ligne vient d'être ajoutée */
  isNew?: boolean;
  /** Désactive l'édition */
  disabled?: boolean;
  /** Message d'erreur de validation éventuel */
  validationError?: string;
  /** Liste des champs récemment utilisés */
  recentFields?: string[][];
  /** Liste des champs favoris */
  favoriteFields?: string[][];
  /** Options de personnalisation du sélecteur de champs */
  fieldSelector?: FieldSelectorOptions;
  /** Fonction asynchrone pour charger le schéma d'une relation */
  onLoadRelationSchema?: (
    relation: RelationFilter
  ) => Promise<UnifiedFilterSchema | null>;
  /** Fonction pour obtenir le schéma déjà chargé d'une relation */
  getRelationSchema?: (relation: RelationFilter) => UnifiedFilterSchema | null;
}

/**
 * FilterRow - Représente une condition unique dans le constructeur de filtres.
 */
export const FilterRow: React.FC<FilterRowProps> = ({
  condition,
  schema,
  config,
  onChange,
  onRemove,
  onFieldChange,
  autoFocus,
  isNew,
  disabled,
  validationError,
  recentFields,
  favoriteFields,
  fieldSelector,
  onLoadRelationSchema,
  getRelationSchema,
}) => {
  const { field, relationChain } = useMemo(() => {
    let currentSchema: UnifiedFilterSchema | undefined = schema;
    const relations: RelationFilter[] = [];
    let targetField: FilterableField | undefined;

    for (let i = 0; i < condition.fieldPath.length; i++) {
      const segment = condition.fieldPath[i];
      const isLast = i === condition.fieldPath.length - 1;

      const scalarField = currentSchema?.fields.find((f) => f.name === segment);
      if (scalarField && (!scalarField.isRelation || isLast)) {
        if (isLast) {
          targetField = scalarField;
        }
        break;
      }

      const relation = currentSchema?.relationFilters.find(
        (r) => r.name === segment || r.fieldName === segment,
      );
      if (relation) {
        relations.push(relation);
        const nestedSchema =
          relation.nestedSchema ?? getRelationSchema?.(relation);
        if (nestedSchema) {
          currentSchema = nestedSchema;
        }
      }
    }

    return { field: targetField, relationChain: relations };
  }, [schema, condition.fieldPath, getRelationSchema]);

  const needsRelationOperator = useMemo(() => {
    return relationChain.some(
      (r) => r.relationType === "MANY_TO_MANY" || r.relationType === "REVERSE_FK"
    );
  }, [relationChain]);

  const selectedOperator = useMemo(() => {
    if (!field) return null;
    return field.operators.find((op) => op.name === condition.operator) ?? field.operators[0];
  }, [field, condition.operator]);

  const fieldIcon = useMemo(() => {
    if (!field) return <Search className="h-3 w-3" />;
    switch (field.type) {
      case "INT":
      case "FLOAT":
      case "DECIMAL":
        return <Hash className="h-3 w-3" />;
      case "DATE":
      case "DATETIME":
        return <Calendar className="h-3 w-3" />;
      case "BOOLEAN":
        return <CheckSquare className="h-3 w-3" />;
      case "ENUM":
        return <Tag className="h-3 w-3" />;
      default:
        return <Type className="h-3 w-3" />;
    }
  }, [field]);

  if (!field || !selectedOperator) {
    return (
      <div className="flex items-center gap-3 p-2 px-3 rounded-xl border border-destructive/20 bg-destructive/5 animate-in shake-in duration-300">
        <div className="p-1 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-destructive/80 uppercase tracking-tight leading-none">Champ inconnu</span>
          <span className="text-xs font-medium text-destructive mt-0.5">
            {condition.fieldPath.join(" → ")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto rounded-full hover:bg-destructive/10 text-destructive/60 hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/filter-row flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm",
        validationError && "border-destructive/50 bg-destructive/5",
        isNew && "animate-in fade-in-0 slide-in-from-top-1 duration-300"
      )}
    >
      {/* Field Path & Label */}
      <div className="flex items-center">
        <InlineFieldSelector
          schema={schema}
          config={config}
          currentPath={condition.fieldPath}
          onSelect={(fieldPath, fieldName, operator) => {
            onFieldChange(fieldPath, fieldName, operator);
          }}
          onLoadRelationSchema={onLoadRelationSchema}
          getRelationSchema={getRelationSchema}
          fieldSelector={fieldSelector}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 pl-1 pr-2.5 gap-2 text-xs font-semibold rounded-lg bg-muted/40 hover:bg-muted transition-colors border-transparent hover:border-border/50 border"
              disabled={disabled}
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-md bg-background text-primary/70 shadow-sm border border-border/40">
                {fieldIcon}
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden max-w-[140px] sm:max-w-[200px]">
                {relationChain.length > 0 && (
                  <span className="text-muted-foreground/60 font-medium truncate hidden sm:inline">
                    {relationChain.map(r => r.fieldLabel).join(" → ")}
                    <ChevronRight className="inline h-3 w-3 mx-0.5 opacity-50" />
                  </span>
                )}
                <span className="truncate text-foreground">
                  {condition.fieldPath.length === 0 ? "Sélectionner un champ..." : field.fieldLabel}
                </span>
              </div>
            </Button>
          }
          recentFields={recentFields}
          favoriteFields={favoriteFields}
        />
      </div>

      {/* Relation Operator (some/every/none) */}
      {needsRelationOperator && (
        <Select
          value={condition.relationOperator ?? config.defaultM2MOperator}
          onValueChange={(value) => onChange({ relationOperator: value })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-[84px] text-[10px] font-bold uppercase tracking-wider rounded-lg bg-muted/30 border-transparent hover:border-border/50 transition-all focus:ring-0" aria-label="Relation operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50 shadow-xl">
            <SelectItem value="_some" className="text-xs font-medium">AU MOINS UN</SelectItem>
            <SelectItem value="_every" className="text-xs font-medium">TOUS</SelectItem>
            <SelectItem value="_none" className="text-xs font-medium">AUCUN</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Operator Select */}
      <CompactOperatorSelect
        field={field}
        value={condition.operator}
        onChange={(newOperator) => onChange({ operator: newOperator, value: undefined })}
        disabled={disabled}
      />

      {/* Value Input */}
      <div className="flex-1 min-w-[180px] animate-in fade-in duration-500">
        <SmartValueInput
          field={field}
          operator={selectedOperator}
          value={condition.value}
          onChange={(newValue) => onChange({ value: newValue })}
          disabled={disabled}
          autoFocus={autoFocus || isNew}
          className="w-full h-8 text-xs rounded-lg transition-all focus-within:ring-1 focus-within:ring-primary/20"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover/filter-row:opacity-100 transition-all duration-200">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={onRemove}
                disabled={disabled}
                aria-label="Supprimer le filtre"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <p className="text-[10px] font-bold">Supprimer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex w-full items-center gap-2 mt-1 px-1 text-[10px] font-medium text-destructive animate-in slide-in-from-top-1">
          <AlertCircle className="h-3 w-3" />
          {validationError}
        </div>
      )}
    </div>
  );
};

export default FilterRow;