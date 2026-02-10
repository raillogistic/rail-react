/**
 * ActiveFiltersBar - Barre horizontale affichant les filtres actifs sous forme de chips.
 * Permet une visualisation rapide et une suppression directe des conditions.
 */

import React, { useMemo } from "react";
import { Plus, X, ListFilter, RotateCcw } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/lib/components/ui/tooltip";
import { FilterChip } from "./FilterChip";
import type { FilterFormState, UnifiedFilterSchema, FilterCondition } from "../types";

export interface ActiveFiltersBarProps {
  /** État actuel des filtres */
  state: FilterFormState;
  /** Schéma des filtres */
  schema: UnifiedFilterSchema;
  /** Callback pour supprimer une condition par son ID */
  onRemoveCondition: (id: string) => void;
  /** Callback pour réinitialiser tous les filtres */
  onClearAll: () => void;
  /** Callback pour ajouter un nouveau filtre (ouvre le panneau) */
  onAddFilter: () => void;
  /** Nombre maximum de filtres visibles avant l'affichage du "+X more" */
  maxVisible?: number;
}

/**
 * ActiveFiltersBar - Composant de barre d'outils pour gérer les filtres actifs.
 */
export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  state,
  schema,
  onRemoveCondition,
  onClearAll,
  onAddFilter,
  maxVisible = 6,
}) => {
  const conditions = useMemo(() => flattenConditions(state.root), [state.root]);
  const visible = conditions.slice(0, maxVisible);
  const overflow = conditions.length - visible.length;

  if (conditions.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1 animate-in fade-in duration-300">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddFilter}
          className="h-8 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5 mr-2 text-muted-foreground/60" />
          Ajouter un filtre
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-2 py-1">
      <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/60">
        <ListFilter className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filtres actifs</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {visible.map((condition) => (
          <FilterChip
            key={condition.id}
            condition={condition}
            schema={schema}
            onRemove={() => onRemoveCondition(condition.id)}
            onClick={onAddFilter}
          />
        ))}

        {overflow > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="h-6 rounded-lg bg-muted/50 text-[10px] font-bold cursor-help px-2 border-transparent hover:bg-muted transition-colors">
                  +{overflow} de plus
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="text-[11px] font-medium">
                {overflow} filtre{overflow > 1 ? "s supplémentaires sont" : " supplémentaire est"} actuellement appliqué{overflow > 1 ? "s" : ""}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/60">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onAddFilter}
          className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-all p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearAll}
                className="h-8 w-8 rounded-lg hover:bg-destructive/5 hover:text-destructive transition-all p-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Effacer tous les filtres</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

/**
 * Aplatit l'arbre des conditions pour l'affichage en liste simple.
 */
function flattenConditions(group: any): FilterCondition[] {
  const items: FilterCondition[] = [];
  if (!group || !group.conditions) return items;
  
  group.conditions.forEach((item: any) => {
    if (item.type === "condition") {
      items.push(item);
    } else {
      items.push(...flattenConditions(item));
    }
  });
  return items;
}

export default ActiveFiltersBar;