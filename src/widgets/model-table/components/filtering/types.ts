import { ComplexFilterInput, FilterFieldType } from "../../compat/types";

export type FilterValue =
 | string
 | number
 | boolean
 | Array<string | number>
 | {
 start?: string;
 end?: string;
 };

export type FilterCondition = {
 id: string;
 field_name?: string;
 option_name?: string;
 value?: FilterValue;
};

export type FilterGroup = {
 id: string;
 combinator: "AND" | "OR";
 negated?: boolean;
 conditions: FilterCondition[];
 groups: FilterGroup[];
};

export type FilterChip = {
 key: string;
 value: any;
 label: string;
 group: "ROOT" | "AND" | "OR" | "NOT";
 depth: number;
 path: Array<string | number>;
};

export type AdvancedFilteringDisplayMode = "dialog" | "drawer";

export type AdvancedFilteringOptions = {
 filtersMeta: FilterFieldType[];
 chipFiltersMeta?: FilterFieldType[];
 onApply?: (filters: ComplexFilterInput<string>) => void;
 title?: string;
 displayMode?: AdvancedFilteringDisplayMode;
};

export type FlattenedFilterField = {
 field_name: string;
 display_label: string;
 field: FilterFieldType;
 path_labels: string[];
 group_label: string;
};

export type FilterFieldGroup = {
 key: string;
 label: string;
 items: FlattenedFilterField[];
};

export type FilterSeedSpec = {
 field: string;
 lookup?: string;
 value?: FilterValue;
 connector?: "and" | "or";
};

export interface AdvancedFilteringController {
 filtersMeta: FilterFieldType[];
 flattenedFields: FlattenedFilterField[];
 fieldGroups: FilterFieldGroup[];
 getFieldMeta: (fieldName?: string) => FilterFieldType | undefined;
 getOptionMeta: (
 optionName?: string,
 ) =>
 | {
 field: FilterFieldType;
 option: FilterFieldType["options"][number];
 }
 | undefined;
 isOpen: boolean;
 hasActiveFilters: boolean;
 rootGroup: FilterGroup;
 chips: FilterChip[];
 title: string;
 displayMode: AdvancedFilteringDisplayMode;
 openDialog: () => void;
 closeDialog: () => void;
 setDialogOpen: (next: boolean) => void;
 addCondition: (groupId: string) => void;
 updateCondition: (groupId: string, conditionId: string, next: Partial<FilterCondition>) => void;
 removeCondition: (groupId: string, conditionId: string) => void;
 addGroup: (parentGroupId: string, combinator?: "AND" | "OR") => void;
 removeGroup: (groupId: string) => void;
 setGroupOperator: (groupId: string, combinator: "AND" | "OR") => void;
 toggleGroupNegation: (groupId: string) => void;
 applyFilters: () => void;
 resetBuilder: () => void;
 removeChip: (chip: FilterChip) => void;
 clearFilters: () => void;
 seedFromSpecs: (specs: FilterSeedSpec[]) => void;
}

