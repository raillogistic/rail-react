/**
 * CompactOperatorSelect - Sélecteur d'opérateurs groupés par catégories.
 * Optimisé pour une utilisation intensive dans les interfaces de filtrage.
 */

import React, { useMemo } from "react";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/kit/select";
import type { FilterableField } from "../types";

export interface CompactOperatorSelectProps {
 /** Le champ pour lequel afficher les opérateurs */
 field: FilterableField;
 /** L'opérateur actuellement sélectionné */
 value: string;
 /** Callback lors du changement d'opérateur */
 onChange: (value: string) => void;
 /** Désactive la sélection */
 disabled?: boolean;
}

/**
 * CompactOperatorSelect - Un sélecteur d'opérateur compact avec groupement logique.
 */
export const CompactOperatorSelect: React.FC<CompactOperatorSelectProps> = ({
 field,
 value,
 onChange,
 disabled,
}) => {
 const groupedOperators = useMemo(() => {
 const groups: Record<string, typeof field.operators> = {
 "Égalité": [],
 "Comparaison": [],
 "Recherche texte": [],
 "Liste": [],
 "Date": [],
 "Autre": [],
 };

 const operators = applyPreferredOperatorOrdering(field);

 operators.forEach((op) => {
 const name = op.name;
 if (["eq", "neq", "isnull"].includes(name)) {
 groups["Égalité"].push(op);
 } else if (["gt", "gte", "lt", "lte", "between"].includes(name)) {
 groups["Comparaison"].push(op);
 } else if (["contains", "icontains", "startsWith", "endsWith", "regex", "iregex", "exact", "iexact"].includes(name)) {
 groups["Recherche texte"].push(op);
 } else if (["in", "notIn"].includes(name)) {
 groups["Liste"].push(op);
 } else if (["year", "month", "day", "weekDay", "hour"].includes(name)) {
 groups["Date"].push(op);
 } else {
 groups["Autre"].push(op);
 }
 });

 return Object.fromEntries(
 Object.entries(groups).filter(([_, ops]) => ops.length > 0)
 );
 }, [field]);

 return (
 <Select value={value} onValueChange={onChange} disabled={disabled}>
 <SelectTrigger 
 className="h-8 w-[130px] text-[11px] font-semibold bg-muted/40 border-transparent hover:border-border/50 hover:bg-muted/60 transition-all focus:ring-0" 
 aria-label="Operator"
 >
 <SelectValue placeholder="Opérateur" />
 </SelectTrigger>
 <SelectContent className="border-border/50 shadow-xl max-h-[400px]">
 {Object.entries(groupedOperators).map(([group, operators]) => (
 <SelectGroup key={group}>
 <SelectLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-1.5">
 {group}
 </SelectLabel>
 {operators.map((op) => (
 <SelectItem 
 key={op.name} 
 value={op.name} 
 className="text-xs font-medium py-2 focus:bg-primary/5 focus:text-primary transition-colors"
 >
 {op.label}
 </SelectItem>
 ))}
 </SelectGroup>
 ))}
 </SelectContent>
 </Select>
 );
};

/**
 * Ordonne les opérateurs selon les préférences du champ, puis les autres.
 */
function applyPreferredOperatorOrdering(field: FilterableField) {
 if (!field.preferredOperators || field.preferredOperators.length === 0) {
 return field.operators;
 }
 const order = field.preferredOperators;
 const byName = new Map(field.operators.map((op) => [op.name, op]));
 const ordered = order.map((name) => byName.get(name)).filter(Boolean) as typeof field.operators;
 const remaining = field.operators.filter((op) => !order.includes(op.name));
 return [...ordered, ...remaining];
}

export default CompactOperatorSelect;