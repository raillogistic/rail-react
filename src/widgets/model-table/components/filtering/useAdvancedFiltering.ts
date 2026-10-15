import * as React from "react";
import { ComplexFilterInput, FilterFieldType, FilterOptionType } from "../../compat/types";
import { findRelatedValueLabel } from "./relatedValueLabelCache";
import {
 AdvancedFilteringController,
 AdvancedFilteringOptions,
 FilterChip,
 FilterCondition,
 FilterGroup,
 FlattenedFilterField,
 FilterSeedSpec,
 FilterValue,
} from "./types";

type FieldOptionMeta = {
 field: FilterFieldType;
 option: FilterOptionType;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

const flattenFilterFields = (
 fields: FilterFieldType[],
 parents: string[] = [],
): FlattenedFilterField[] =>
 fields.flatMap((field) => {
 const label = field.field_label || field.field_name;
 const path = [...parents, label];
 const groupLabel = parents[0] ?? "Champs simples";
 const current: FlattenedFilterField = {
 field_name: field.field_name,
 display_label: path.join("▸ "),
 field,
 path_labels: path,
 group_label: groupLabel,
 };
 const nested = field.nested ? flattenFilterFields(field.nested, path) : [];
 return [current, ...nested];
 });

const buildFieldIndex = (fields: FilterFieldType[]): Map<string, FilterFieldType> => {
 const map = new Map<string, FilterFieldType>();
 const walk = (list: FilterFieldType[]) => {
 list.forEach((field) => {
 map.set(field.field_name, field);
 if (field.nested) walk(field.nested);
 });
 };
 walk(fields);
 return map;
};

const buildOptionIndex = (fields: FilterFieldType[]): Map<string, FieldOptionMeta> => {
 const map = new Map<string, FieldOptionMeta>();
 const walk = (list: FilterFieldType[]) => {
 list.forEach((field) => {
 field.options?.forEach((option) => {
 map.set(option.name, { field, option });
 });
 if (field.nested) walk(field.nested);
 });
 };
 walk(fields);
 return map;
};

const resolveOptionMeta = (
 fieldName: string,
 lookup: string,
 optionIndex: Map<string, FieldOptionMeta>,
 fieldIndex: Map<string, FilterFieldType>,
): FieldOptionMeta | undefined => {
 const optionName =`${fieldName}__${lookup}`;
 const direct = optionIndex.get(optionName);
 if (direct) return direct;
 const fieldMeta = fieldIndex.get(fieldName);
 if (!fieldMeta || !fieldMeta.options || fieldMeta.options.length === 0) {
 return undefined;
 }
 const fallback =
 fieldMeta.options.find(
 (opt) => opt.lookup_expr === lookup || opt.name === optionName,
 ) ?? fieldMeta.options[0];
 if (!fallback) return undefined;
 return { field: fieldMeta, option: fallback };
};

const parseScalarValue = (raw: string): string | number => {
 const trimmed = raw.trim();
 if (/^[-+]?\d+$/.test(trimmed)) return Number(trimmed);
 if (/^[-+]?\d*\.\d+$/.test(trimmed)) return Number(trimmed);
 return trimmed;
};

const normalizeChoiceValue = (choice: string | number, option: FilterOptionType) => {
 if (option.filter_type === "NumberFilter") return Number(choice);
 return choice;
};

const determineValueForOption = (option: FilterOptionType, raw: FilterValue): FilterValue | undefined => {
 if (option.lookup_expr === "range" && raw && typeof raw === "object" && !Array.isArray(raw)) {
 const { start, end } = raw as { start?: string; end?: string };
 if (!start && !end) return undefined;
 return [start ?? "", end ?? ""];
 }
 if (option.filter_type === "MultipleChoiceFilter") {
 if (!Array.isArray(raw) || raw.length === 0) return undefined;
 return raw.map((v) => normalizeChoiceValue(v, option));
 }
 if (option.filter_type === "BooleanFilter") {
 if (typeof raw !== "boolean") return undefined;
 return raw;
 }
 if (Array.isArray(raw)) {
 return raw.map((v) => normalizeChoiceValue(v, option));
 }
 if (typeof raw === "string") return parseScalarValue(raw);
 return raw;
};

const cloneGroup = (group: FilterGroup): FilterGroup => ({
 ...group,
 conditions: group.conditions.map((condition) => ({ ...condition })),
 groups: group.groups.map((child) => cloneGroup(child)),
});

const updateGroupTree = (
 group: FilterGroup,
 targetId: string,
 updater: (group: FilterGroup) => FilterGroup,
): FilterGroup => {
 if (group.id === targetId) {
 return updater(cloneGroup(group));
 }
 return {
 ...group,
 groups: group.groups.map((child) => updateGroupTree(child, targetId, updater)),
 };
};

const removeGroupFromTree = (group: FilterGroup, targetId: string): FilterGroup => ({
 ...group,
 groups: group.groups
 .filter((child) => child.id !== targetId)
 .map((child) => removeGroupFromTree(child, targetId)),
});

const buildConditionPayload = (
 condition: FilterCondition,
 optionIndex: Map<string, FieldOptionMeta>,
): ComplexFilterInput<string> | null => {
 if (!condition.option_name) return null;
 const optionMeta = optionIndex.get(condition.option_name);
 if (!optionMeta) return null;
 const value = determineValueForOption(optionMeta.option, condition.value as FilterValue);
 if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
 return { [optionMeta.option.name]: value } as ComplexFilterInput<string>;
};

const buildGroupPayload = (
 group: FilterGroup,
 optionIndex: Map<string, FieldOptionMeta>,
): ComplexFilterInput<string> | null => {
 const parts: ComplexFilterInput<string>[] = [];
 group.conditions.forEach((condition) => {
 const payload = buildConditionPayload(condition, optionIndex);
 if (payload) parts.push(payload);
 });
 group.groups.forEach((child) => {
 const nested = buildGroupPayload(child, optionIndex);
 if (nested) parts.push(nested);
 });
 if (!parts.length) return null;

 let payload: ComplexFilterInput<string>;
 if (parts.length === 1) {
 payload = parts[0];
 } else if (group.combinator === "AND") {
 payload = { AND: parts } as ComplexFilterInput<string>;
 } else {
 payload = { OR: parts } as ComplexFilterInput<string>;
 }

 if (group.negated) {
 return { NOT: payload } as ComplexFilterInput<string>;
 }
 return payload;
};

const flattenActiveFilters = (
 payload: ComplexFilterInput<string> | null,
 optionMeta: Map<string, FieldOptionMeta>,
): FilterChip[] => {
 if (!payload) return [];
 const chips: FilterChip[] = [];
 const isGroupKey = (key: string) => key === "AND" || key === "OR" || key === "NOT";

 const appendChip = (key: string, value: any, group: FilterChip["group"], depth: number, path: Array<string | number>) => {
 const meta = optionMeta.get(key);
 const labelBase =
 meta?.option.help_text ||
`${meta?.field.field_label ?? meta?.field.field_name ?? key} (${meta?.option.lookup_expr ?? ""})`.trim();
 const formatValue = (cell: any) => {
 if (cell === undefined || cell === null) return "";
 if (meta?.field.related_model) {
 const override =
 findRelatedValueLabel(meta.field.field_name, cell) ?? undefined;
 if (override) return override;
 }
 return String(cell);
 };
 const valueLabel = Array.isArray(value)
 ? value.length === 2
 ?`${formatValue(value[0])} – ${formatValue(value[1])}`
 : value.map((cell) => formatValue(cell)).join(", ")
 : formatValue(value);
 const label = group === "ROOT" ? labelBase :`[${group}] ${labelBase}`;
 chips.push({ key, value: valueLabel, label, group, depth, path });
 };

 const walk = (
 node: ComplexFilterInput<string>,
 group: FilterChip["group"],
 depth: number,
 path: Array<string | number>,
 ) => {
 Object.entries(node)
 .filter(([key]) => !isGroupKey(key))
 .forEach(([key, value]) => appendChip(key, value, group, depth, [...path, "COND", key]));

 if (Array.isArray(node.AND)) {
 node.AND.forEach((sub, idx) => walk(sub, "AND", depth + 1, [...path, "AND", idx]));
 }
 if (Array.isArray(node.OR)) {
 node.OR.forEach((sub, idx) => walk(sub, "OR", depth + 1, [...path, "OR", idx]));
 }
 if (node.NOT) {
 walk(node.NOT as ComplexFilterInput<string>, "NOT", depth + 1, [...path, "NOT"]);
 }
 };

 walk(payload, "ROOT", 0, []);
 return chips;
};

const removeChipFromPayload = (payload: ComplexFilterInput<string>, chip: FilterChip): ComplexFilterInput<string> | null => {
 const path = chip.path;
 let node: any = payload;

 for (let i = 0; i < path.length; i++) {
 const segment = path[i];
 if (segment === "COND") {
 const key = path[i + 1] as string;
 if (node && typeof node === "object") delete node[key];
 break;
 }

 if (segment === "AND" || segment === "OR") {
 const index = path[i + 1] as number;
 const arr = node?.[segment];
 if (!Array.isArray(arr) || !arr[index]) break;
 node = arr[index];
 i += 1;
 } else if (segment === "NOT") {
 if (!node?.NOT) break;
 node = node.NOT;
 }
 }

 const prune = (input: any): any => {
 if (!input || typeof input !== "object") return input;
 ["AND", "OR"].forEach((key) => {
 if (Array.isArray(input[key])) {
 input[key] = input[key].map((item: any) => prune(item)).filter((item: any) => item && Object.keys(item).length > 0);
 if (!input[key].length) delete input[key];
 }
 });
 if (input.NOT) {
 input.NOT = prune(input.NOT);
 if (!input.NOT || Object.keys(input.NOT).length === 0) delete input.NOT;
 }
 const hasConditions = Object.keys(input).some((key) => key !== "AND" && key !== "OR" && key !== "NOT");
 if (!hasConditions && !input.AND && !input.OR && !input.NOT) {
 return null;
 }
 return input;
 };

 const cleaned = prune(payload);
 if (!cleaned || Object.keys(cleaned).length === 0) return null;
 return cleaned;
};

export const useAdvancedFiltering = ({
 filtersMeta,
 chipFiltersMeta,
 onApply,
 title = "Filtres avancés",
 displayMode = "dialog",
}: AdvancedFilteringOptions): AdvancedFilteringController => {
 const flattenedFields = React.useMemo(() => flattenFilterFields(filtersMeta ?? []), [filtersMeta]);
 const fieldGroups = React.useMemo(() => {
 const groups = new Map<string, { key: string; label: string; items: FlattenedFilterField[] }>();
 flattenedFields.forEach((item) => {
 const key = item.group_label || "Champs simples";
 if (!groups.has(key)) {
 groups.set(key, { key, label: key, items: [] });
 }
 groups.get(key)!.items.push(item);
 });
 return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
 }, [flattenedFields]);
 const fieldIndex = React.useMemo(() => buildFieldIndex(filtersMeta ?? []), [filtersMeta]);
 const optionIndex = React.useMemo(() => buildOptionIndex(filtersMeta ?? []), [filtersMeta]);
 const chipOptionIndex = React.useMemo(
 () => buildOptionIndex(chipFiltersMeta && chipFiltersMeta.length ? chipFiltersMeta : filtersMeta ?? []),
 [chipFiltersMeta, filtersMeta],
 );

 const [isOpen, setIsOpen] = React.useState(false);
 const [rootGroup, setRootGroup] = React.useState<FilterGroup>({
 id: "root",
 combinator: "AND",
 negated: false,
 conditions: [],
 groups: [],
 });
 const [activeFilters, setActiveFilters] = React.useState<ComplexFilterInput<string> | null>(null);

 const createCondition = React.useCallback((): FilterCondition => {
 const defaultField = flattenedFields[0]?.field;
 const defaultOption =
 defaultField?.options?.find((opt) => opt.lookup_expr === "icontains") ?? defaultField?.options?.[0];
 return {
 id: generateId(),
 field_name: defaultField?.field_name,
 option_name: defaultOption?.name,
 value: undefined,
 };
 }, [flattenedFields]);

 const addCondition = React.useCallback(
 (groupId: string) => {
 setRootGroup((group) =>
 updateGroupTree(group, groupId, (target) => ({
 ...target,
 conditions: [...target.conditions, createCondition()],
 })),
 );
 },
 [createCondition],
 );

 const updateCondition = React.useCallback((groupId: string, conditionId: string, next: Partial<FilterCondition>) => {
 setRootGroup((group) =>
 updateGroupTree(group, groupId, (target) => ({
 ...target,
 conditions: target.conditions.map((condition) => (condition.id === conditionId ? { ...condition, ...next } : condition)),
 })),
 );
 }, []);

 const removeCondition = React.useCallback((groupId: string, conditionId: string) => {
 setRootGroup((group) =>
 updateGroupTree(group, groupId, (target) => ({
 ...target,
 conditions: target.conditions.filter((condition) => condition.id !== conditionId),
 })),
 );
 }, []);

 const addGroup = React.useCallback((parentGroupId: string, combinator: "AND" | "OR" = "AND") => {
 setRootGroup((group) =>
 updateGroupTree(group, parentGroupId, (target) => ({
 ...target,
 groups: [
 ...target.groups,
 {
 id: generateId(),
 combinator,
 negated: false,
 conditions: [],
 groups: [],
 },
 ],
 })),
 );
 }, []);

 const removeGroup = React.useCallback((groupId: string) => {
 if (groupId === "root") return;
 setRootGroup((group) => removeGroupFromTree(group, groupId));
 }, []);

 const setGroupOperator = React.useCallback((groupId: string, combinator: "AND" | "OR") => {
 setRootGroup((group) =>
 updateGroupTree(group, groupId, (target) => ({
 ...target,
 combinator,
 })),
 );
 }, []);

 const toggleGroupNegation = React.useCallback((groupId: string) => {
 setRootGroup((group) =>
 updateGroupTree(group, groupId, (target) => ({
 ...target,
 negated: !target.negated,
 })),
 );
 }, []);

 const applyFilters = React.useCallback(() => {
 const payload = buildGroupPayload(rootGroup, optionIndex);
 if (payload) {
 setActiveFilters(payload);
 onApply?.(payload);
 } else {
 setActiveFilters(null);
 onApply?.({} as ComplexFilterInput<string>);
 }
 setIsOpen(false);
 }, [onApply, optionIndex, rootGroup]);

 const resetBuilder = React.useCallback(() => {
 setRootGroup({
 id: "root",
 combinator: "AND",
 negated: false,
 conditions: [],
 groups: [],
 });
 setActiveFilters(null);
 onApply?.({} as ComplexFilterInput<string>);
 }, [onApply]);

 const seedFromSpecs = React.useCallback(
 (specs: FilterSeedSpec[]) => {
 if (!specs || specs.length === 0) {
 resetBuilder();
 return;
 }
 const root: FilterGroup = {
 id: "root",
 combinator: "AND",
 negated: false,
 conditions: [],
 groups: [],
 };
 let currentOrGroup: FilterGroup | null = null;
 specs.forEach((spec) => {
 const fieldName = spec.field;
 if (!fieldName) return;
 const lookup = spec.lookup ?? "exact";
 const optionMeta = resolveOptionMeta(fieldName, lookup, optionIndex, fieldIndex);
 if (!optionMeta) return;
 const targetOptionName =
 optionMeta.option.name ||
`${fieldName}__${optionMeta.option.lookup_expr ?? lookup}`;
 const condition: FilterCondition = {
 id: generateId(),
 field_name: fieldName,
 option_name: targetOptionName,
 value: spec.value as FilterValue,
 };
 const connector = (spec.connector || "and").toLowerCase();
 if (connector === "or") {
 if (!currentOrGroup) {
 currentOrGroup = {
 id:`or-${generateId()}`,
 combinator: "OR",
 negated: false,
 conditions: [],
 groups: [],
 };
 root.groups.push(currentOrGroup);
 }
 currentOrGroup.conditions.push(condition);
 } else {
 currentOrGroup = null;
 root.conditions.push(condition);
 }
 });
 setRootGroup(root);
 setActiveFilters(null);
 },
 [fieldIndex, optionIndex, resetBuilder],
 );

 const chips = React.useMemo(() => flattenActiveFilters(activeFilters, chipOptionIndex), [activeFilters, chipOptionIndex]);

 const removeChip = React.useCallback(
 (chip: FilterChip) => {
 if (!activeFilters) return;
 const cloned = JSON.parse(JSON.stringify(activeFilters)) as ComplexFilterInput<string>;
 const nextPayload = removeChipFromPayload(cloned, chip);
 setActiveFilters(nextPayload);
 onApply?.(nextPayload ?? ({} as ComplexFilterInput<string>));
 },
 [activeFilters, onApply],
 );

 const clearFilters = React.useCallback(() => {
 resetBuilder();
 }, [resetBuilder]);

 return {
 filtersMeta,
 flattenedFields,
 fieldGroups,
 getFieldMeta: (fieldName?: string) => (fieldName ? fieldIndex.get(fieldName) : undefined),
 getOptionMeta: (optionName?: string) => (optionName ? optionIndex.get(optionName) : undefined),
 isOpen,
 hasActiveFilters: chips.length > 0,
 rootGroup,
 chips,
 title,
 displayMode,
 openDialog: () => setIsOpen(true),
 closeDialog: () => setIsOpen(false),
 setDialogOpen: setIsOpen,
 addCondition,
 updateCondition,
 removeCondition,
 addGroup,
 removeGroup,
 setGroupOperator,
 toggleGroupNegation,
 applyFilters,
 resetBuilder,
 removeChip,
 clearFilters,
 seedFromSpecs,
 };
};


