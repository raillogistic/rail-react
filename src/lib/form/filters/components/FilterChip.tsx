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
    if (value.length === 0) return "vide";
    if (value.length <= 2) return value.join(", ");
    return `${value.slice(0, 2).join(", ")} +${value.length - 2}`;
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }
  return String(value);
}

/**
 * Mappage des opérateurs vers des symboles courts pour l'affichage.
 */
const OPERATOR_LABELS: Record<string, { symbol: string; label: string }> = {
  eq: { symbol: "=", label: "Égal à" },
  neq: { symbol: "≠", label: "Différent de" },
  gt: { symbol: ">", label: "Supérieur à" },
  gte: { symbol: "≥", label: "Supérieur ou égal à" },
  lt: { symbol: "<", label: "Inférieur à" },
  lte: { symbol: "≤", label: "Inférieur ou égal à" },
  contains: { symbol: "contient", label: "Contient" },
  icontains: { symbol: "~", label: "Contient" },
  startsWith: { symbol: "commence par", label: "Commence par" },
  istartsWith: { symbol: "i-commence", label: "Commence par (insensible)" },
  endsWith: { symbol: "finit par", label: "Se termine par" },
  iendsWith: { symbol: "i-finit", label: "Se termine par (insensible)" },
  in: { symbol: "dans", label: "Fait partie de" },
  notIn: { symbol: "∉", label: "Ne fait pas partie de" },
  between: { symbol: "entre", label: "Entre" },
  isNull: { symbol: "est vide", label: "Est vide" },
  regex: { symbol: ".*", label: "Correspond à (Regex)" },
  iregex: { symbol: ".*~", label: "Correspond à (Regex insensible)" },
  exact: { symbol: "==", label: "Est exactement" },
  iexact: { symbol: "==~", label: "Est exactement (insensible)" },
  date: { symbol: "date", label: "Date égale à" },
  year: { symbol: "année", label: "Année égale à" },
  month: { symbol: "mois", label: "Mois égal à" },
  day: { symbol: "jour", label: "Jour égal à" },
  weekDay: { symbol: "js", label: "Jour de la semaine" },
  hour: { symbol: "heure", label: "Heure égale à" },
  today: { symbol: "auj.", label: "Aujourd'hui" },
  yesterday: { symbol: "hier", label: "Hier" },
  thisWeek: { symbol: "sem.", label: "Cette semaine" },
  pastWeek: { symbol: "sem. d", label: "La semaine dernière" },
  thisMonth: { symbol: "mois", label: "Ce mois-ci" },
  pastMonth: { symbol: "mois d", label: "Le mois dernier" },
  thisYear: { symbol: "an", label: "Cette année" },
  pastYear: { symbol: "an d", label: "L'année dernière" },
  hasKey: { symbol: "clé", label: "Possède la clé" },
  hasKeys: { symbol: "clés", label: "Possède les clés" },
  hasAnyKeys: { symbol: "clés-ou", label: "Possède l'une des clés" },
  containedBy: { symbol: "⊂", label: "Contenu dans" },
  overlaps: { symbol: "∩", label: "Chevauche" },
};

export default FilterChip;