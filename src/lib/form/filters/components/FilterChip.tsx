/**
 * FilterChip - Affichage compact d'un filtre actif sous forme de badge interactif.
 * Conçu pour être lisible tout en restant discret.
 */

import React, { useMemo } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { Badge } from "@/lib/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FilterCondition, UnifiedFilterSchema } from "../types";

export interface FilterChipProps {
  /** La condition de filtrage active */
  condition: FilterCondition;
  /** Schéma des filtres pour récupérer les libellés */
  schema: UnifiedFilterSchema;
  /** Callback pour supprimer ce filtre */
  onRemove: () => void;
  /** Callback lors du clic sur le chip (généralement pour ouvrir le panneau) */
  onClick: () => void;
}

/**
 * FilterChip - Un badge élégant représentant un filtre actif.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  condition,
  schema,
  onRemove,
  onClick,
}) => {
  const { fieldLabel, operatorLabel, displayValue } = useMemo(() => {
    const field = schema.fields.find((f) => f.name === condition.fieldName || f.fieldName === condition.fieldName);
    const label = field?.fieldLabel ?? condition.fieldName;
    const op = OPERATOR_LABELS[condition.operator]?.symbol ?? condition.operator;
    const val = formatValue(condition.value);
    
    return {
      fieldLabel: label,
      operatorLabel: op,
      displayValue: val
    };
  }, [condition, schema.fields]);

  const fullLabel = `${fieldLabel} ${operatorLabel} ${displayValue}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group inline-flex items-center gap-0 rounded-lg border border-primary/20 bg-primary/5 pl-2 pr-1 py-0.5 text-[11px] hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer animate-in fade-in-0 zoom-in-95 duration-200"
            )}
            onClick={onClick}
          >
            <span className="font-bold text-primary mr-1.5">{fieldLabel}</span>
            <span className="text-muted-foreground/70 font-medium mr-1.5">{operatorLabel}</span>
            <span className="font-semibold text-foreground max-w-[120px] truncate mr-1">
              {displayValue}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-medium">
          {fullLabel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Formate la valeur pour l'affichage dans le chip.
 */
function formatValue(value: any): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "empty";
    if (value.length <= 2) return value.join(", ");
    return `${value.slice(0, 2).join(", ")} +${value.length - 2}`;
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

/**
 * Mappage des opérateurs vers des symboles courts pour l'affichage.
 */
const OPERATOR_LABELS: Record<string, { symbol: string; label: string }> = {
  eq: { symbol: "=", label: "Equals" },
  neq: { symbol: "≠", label: "Not equals" },
  gt: { symbol: ">", label: "Greater than" },
  gte: { symbol: "≥", label: "Greater or equal" },
  lt: { symbol: "<", label: "Less than" },
  lte: { symbol: "≤", label: "Less or equal" },
  contains: { symbol: "contains", label: "Contains" },
  icontains: { symbol: "~", label: "Contains" },
  startsWith: { symbol: "starts", label: "Starts with" },
  endsWith: { symbol: "ends", label: "Ends with" },
  in: { symbol: "in", label: "Is one of" },
  notIn: { symbol: "∉", label: "Is not one of" },
  between: { symbol: "between", label: "Between" },
  isNull: { symbol: "is empty", label: "Is empty" },
  regex: { symbol: ".*", label: "Matches" },
};

export default FilterChip;