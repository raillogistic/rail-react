import React, { useState, useCallback } from "react";
import { Plus, X, ChevronDown, Layers, Info, Filter } from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { Switch } from "@/lib/components/ui/switch";
import { Badge } from "@/lib/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { InlineFieldSelector } from "./InlineFieldSelector";
import { FilterRow } from "./FilterRow";
import type {
  FilterGroup as FilterGroupType,
  FilterCondition,
  RelationFilter,
  UnifiedFilterSchema,
  NestedFilterConfig,
  FieldSelectorOptions,
} from "../types";

/**
 * Interface pour les propriétés du composant FilterGroupComponent.
 */
export interface FilterGroupProps {
  /** Le groupe de filtres à afficher */
  group: FilterGroupType;
  /** Schéma de métadonnées des filtres */
  schema: UnifiedFilterSchema;
  /** Configuration de profondeur et limites */
  config: NestedFilterConfig;
  /** Callback lors d'une modification du groupe */
  onChange: (updates: Partial<FilterGroupType>) => void;
  /** Callback pour supprimer ce groupe */
  onRemove?: () => void;
  /** Callback pour ajouter une condition au groupe */
  onAddCondition: (
    groupId: string,
    fieldPath: string[],
    fieldName: string,
    operator: string,
  ) => void;
  /** Callback pour ajouter un sous-groupe */
  onAddGroup: (parentId: string, logic: "AND" | "OR") => void;
  /** Callback pour mettre à jour une condition spécifique */
  onUpdateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  /** Callback pour supprimer un élément (condition ou groupe) par son ID */
  onRemoveItem: (id: string) => void;
  /** Indique si c'est le groupe racine */
  isRoot?: boolean;
  /** Profondeur actuelle dans l'arbre */
  depth?: number;
  /** Chemin actuel des relations */
  currentPath?: string[];
  /** Liste des champs récemment utilisés */
  recentFields?: string[][];
  /** Liste des champs favoris */
  favoriteFields?: string[][];
  /** Options de personnalisation du sélecteur de champs */
  fieldSelector?: FieldSelectorOptions;
  /** Fonction asynchrone pour charger le schéma d'une relation */
  onLoadRelationSchema?: (
    relation: RelationFilter,
  ) => Promise<UnifiedFilterSchema | null>;
  /** Fonction pour obtenir le schéma déjà chargé d'une relation */
  getRelationSchema?: (relation: RelationFilter) => UnifiedFilterSchema | null;
}

/**
 * FilterGroupComponent - Affiche un groupe de conditions (AND/OR).
 * Gère l'imbrication récursive des filtres avec une interface ERP moderne.
 */
export const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  schema,
  config,
  onChange,
  onRemove,
  onAddCondition,
  onAddGroup,
  onUpdateCondition,
  onRemoveItem,
  isRoot = false,
  depth = 0,
  currentPath = [],
  recentFields,
  favoriteFields,
  fieldSelector,
  onLoadRelationSchema,
  getRelationSchema,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const canAddMore = group.conditions.length < config.maxFiltersPerGroup;

  const handleLogicChange = useCallback(
    (logic: "AND" | "OR") => {
      onChange({ logic });
    },
    [onChange],
  );

  const handleAddCondition = useCallback(
    (fieldPath: string[], fieldName: string, operator: string) => {
      onAddCondition(group.id, fieldPath, fieldName, operator);
    },
    [group.id, onAddCondition],
  );

  const hasConditions = group.conditions.length > 0;
  const canAddGroup = depth < config.maxDepth;
  const showNegationWarning = config.enableNot && group.negated;

  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
      <div
        className={cn(
          "relative transition-all duration-200 group/filter-group",
          depth > 0 && "ml-4 pl-4 border-l-2 border-primary/10 py-2 my-2",
          showNegationWarning &&
            "border border-destructive/30 bg-destructive/5 rounded-xl p-4 shadow-sm ring-1 ring-destructive/10",
          !showNegationWarning && depth > 0 && "hover:border-primary/30",
          isRoot && "space-y-4",
        )}
        data-testid="filter-group"
      >
        {/* Decorative Line for nested groups */}
        {depth > 0 && (
          <div className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-primary/20 rounded-full" />
        )}

        {/* Group Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/40">
            <ToggleGroup
              type="single"
              size="sm"
              value={group.logic}
              onValueChange={(value) =>
                value && handleLogicChange(value as "AND" | "OR")
              }
              className="h-7"
              aria-label="Group logic"
            >
              <ToggleGroupItem
                value="AND"
                className="text-[10px] font-bold px-2.5 h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                ET
              </ToggleGroupItem>
              <ToggleGroupItem
                value="OR"
                className="text-[10px] font-bold px-2.5 h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                OU
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Badge
            variant="outline"
            className="h-6 px-2 text-[10px] font-medium border-primary/20 bg-primary/5 text-primary"
          >
            {group.logic === "AND" ? "Tout vérifier" : "Vérifier au moins un"}
          </Badge>

          <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover/filter-group:opacity-100 transition-opacity">
            {config.enableNot && (
              <div className="flex items-center gap-2 mr-2 bg-muted/30 px-2 py-1 rounded-md">
                <span className="text-[10px] font-bold text-muted-foreground">
                  NON
                </span>
                <Switch
                  checked={group.negated}
                  onCheckedChange={(checked) => onChange({ negated: checked })}
                  className="scale-75"
                  aria-label="Toggle NOT"
                />
              </div>
            )}

            {!isRoot && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
                aria-label="Supprimer le groupe"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}

            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Réduire/Agrandir le groupe"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    collapsed && "-rotate-90",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {showNegationWarning && (
          <div className="flex items-center gap-2 mb-3 text-[11px] font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
            <Info className="h-3 w-3" />
            Tout ce qui se trouve dans ce groupe est actuellement nié (inversé).
          </div>
        )}

        <CollapsibleContent className="space-y-3 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in duration-200">
          {!hasConditions ? (
            <div className="pt-2">
              <InlineFieldSelector
                schema={schema}
                config={config}
                currentPath={currentPath}
                onSelect={handleAddCondition}
                onLoadRelationSchema={onLoadRelationSchema}
                getRelationSchema={getRelationSchema}
                fieldSelector={fieldSelector}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full h-11 border-dashed border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold">
                      Commencer à construire des filtres
                    </span>
                  </Button>
                }
                recentFields={recentFields}
                favoriteFields={favoriteFields}
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {group.conditions.map((item) => (
                <div
                  key={item.id}
                  className="relative animate-in fade-in slide-in-from-left-1"
                >
                  {item.type === "condition" ? (
                    <FilterRow
                      condition={item}
                      schema={schema}
                      config={config}
                      onChange={(updates) =>
                        onUpdateCondition(item.id, updates)
                      }
                      onRemove={() => onRemoveItem(item.id)}
                      onFieldChange={(fieldPath, fieldName, operator) =>
                        onUpdateCondition(item.id, {
                          fieldPath,
                          fieldName,
                          operator,
                          value: undefined,
                        })
                      }
                      recentFields={recentFields}
                      favoriteFields={favoriteFields}
                      fieldSelector={fieldSelector}
                      onLoadRelationSchema={onLoadRelationSchema}
                      getRelationSchema={getRelationSchema}
                    />
                  ) : (
                    <FilterGroupComponent
                      group={item}
                      schema={schema}
                      config={config}
                      onChange={(updates) => {
                        const updatedConditions = group.conditions.map((c) =>
                          c.id === item.id ? { ...c, ...updates } : c,
                        );
                        onChange({ conditions: updatedConditions });
                      }}
                      onRemove={() => onRemoveItem(item.id)}
                      onAddCondition={onAddCondition}
                      onAddGroup={onAddGroup}
                      onUpdateCondition={onUpdateCondition}
                      onRemoveItem={onRemoveItem}
                      depth={depth + 1}
                      currentPath={currentPath}
                      recentFields={recentFields}
                      favoriteFields={favoriteFields}
                      fieldSelector={fieldSelector}
                      onLoadRelationSchema={onLoadRelationSchema}
                      getRelationSchema={getRelationSchema}
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                {canAddMore && (
                  <InlineFieldSelector
                    schema={schema}
                    config={config}
                    currentPath={currentPath}
                    onSelect={handleAddCondition}
                    onLoadRelationSchema={onLoadRelationSchema}
                    getRelationSchema={getRelationSchema}
                    fieldSelector={fieldSelector}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-9 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        {group.logic === "OR"
                          ? "Ajouter une condition OU"
                          : "Ajouter une condition"}
                      </Button>
                    }
                    recentFields={recentFields}
                    favoriteFields={favoriteFields}
                  />
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => onAddGroup(group.id, "OR")}
                        disabled={!canAddGroup}
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Ajouter un groupe de filtres imbriqué
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default FilterGroupComponent;
