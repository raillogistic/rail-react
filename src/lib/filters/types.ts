/**
 * Dynamic Filters - Type Definitions
 * 
 * Comprehensive types for the unified filter system combining
 * modelSchema, filterSchema, and savedFilters.
 */

/**
 * Unified schema combining modelSchema + filterSchema data.
 */
export interface UnifiedFilterSchema {
  // Model identity
  app: string;
  model: string;
  verboseName: string;
  verboseNamePlural: string;
  
  // Filter configuration
  config: FilterConfig;
  
  // All filterable fields (merged from both APIs)
  fields: FilterableField[];
  
  // Relation filters with nested support
  relationFilters: RelationFilter[];
  
  // All presets (static + saved)
  presets: FilterPreset[];
  
  // Fields available for DISTINCT ON
  distinctFields: DistinctField[];
  
  // UI grouping
  fieldGroups: FieldGroup[];
}

export interface FilterConfig {
  inputTypeName: string;
  supportsAnd: boolean;
  supportsOr: boolean;
  supportsNot: boolean;
  supportsFts: boolean;
  supportsAggregation: boolean;
  supportsDistinct: boolean;
}

export interface FilterableField {
  // Identity
  name: string;             // camelCase (GraphQL schema name)
  fieldName: string;        // snake_case (Backend DB name)
  fieldLabel: string;       // Human readable
  helpText?: string;
  
  // Type information
  baseType: FilterBaseType;
  graphqlType: string;
  filterInputType: string;
  
  // Operators
  operators: FilterOperator[];
  defaultOperator: string;
  preferredOperators?: string[];
  
  // For choice fields
  choices?: FilterChoice[];
  
  // For relation fields
  isRelation: boolean;
  relationConfig?: {
    relatedApp: string;
    relatedModel: string;
    lookupField: string;
    searchFields: string[];
  };
  
  // UI hints
  uiHints: FilterUIHints;
  
  // Grouping
  group?: string;
}

export type FilterBaseType = 
  | "String" 
  | "Number" 
  | "Boolean" 
  | "Date" 
  | "DateTime"
  | "Relationship" 
  | "JSON";

export interface FilterOperator {
  name: string;           // eq, neq, contains, etc.
  label: string;          // "Equals", "Contains"
  helpText?: string;
  graphqlType: string;    // Expected input type
  isList: boolean;        // Accepts array?
  choices?: FilterChoice[]; // For enum operators
}

export interface FilterChoice {
  value: string;
  label: string;
  group?: string;
}

export interface FilterUIHints {
  widget: string;         // text, number, date, select, etc.
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  dateFormat?: string;
  allowClear?: boolean;
  defaultOperator?: string;
  preferredOperators?: string[];
  datePresets?: DatePreset[];
  autocompleteEndpoint?: string;
  recentValuesKey?: string;
  displayWidth?: "sm" | "md" | "lg" | "full";
  showInQuickFilter?: boolean;
  priority?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface DatePreset {
  key: string;
  label: string;
  days?: number;
  startOfPeriod?: "day" | "week" | "month" | "quarter" | "year";
  getValue?: () => [string, string?];
}

export interface RelationFilter {
  name: string;             // camelCase
  fieldName: string;        // snake_case
  fieldLabel: string;
  relationType: "FOREIGN_KEY" | "MANY_TO_MANY" | "REVERSE_FK" | "ONE_TO_ONE";
  relatedApp: string;
  relatedModel: string;
  nestedFilterType: string;
  
  // Available operators
  supportsDirectFilter: boolean;
  supportsSome: boolean;
  supportsEvery: boolean;
  supportsNone: boolean;
  supportsCount: boolean;
  supportsIsNull: boolean;
  
  // Nested schema (for depth-limited recursion)
  nestedSchema?: UnifiedFilterSchema;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filterJson: Record<string, any>;
  
  // Source information
  source: "static" | "saved" | "shared";
  
  // For saved filters
  createdBy?: { id: string; username: string };
  isShared?: boolean;
  useCount?: number;
  lastUsedAt?: string;
}

export interface DistinctField {
  name: string;             // camelCase
  fieldName: string;        // snake_case
  fieldLabel: string;
  fieldType: string;
  requiresOrderBy: boolean;  // Must be prefix of orderBy
}

export interface FieldGroup {
  key: string;
  label: string;
  description?: string;
  fields: string[];
  collapsed?: boolean;
}

export type DefaultFilterSpec =
  | string
  | {
      name: string;
      path?: string[];
      operator?: string;
      value?: unknown;
    };

export interface FieldSelectorOptions {
  /** Only allow these field names/paths (e.g. "name" or "category.name") */
  only?: string[];
  /** Exclude these field names/paths */
  exclude?: string[];
  /** Only show fields with choices/options */
  requireChoices?: boolean;
  /** Show relations in selector */
  includeRelations?: boolean;
  /** Allow advanced fields/relations */
  includeAdvanced?: boolean;
  /** Sorting strategy for field lists */
  order?: "schema" | "alpha" | "priority" | "name";
}

/**
 * Filter state types
 */

/**
 * Single filter condition (leaf node).
 */
export interface FilterCondition {
  id: string;
  type: "condition";
  fieldPath: string[];        // e.g., ["category", "parent", "name"]
  fieldName: string;          // Leaf field name: "name"
  operator: string;           // e.g., "contains", "eq"
  value: any;                 // The filter value
  relationOperator?: string;  // For M2M: "_some", "_every", "_none"
}

export type RelationFunctionMode =
  | "some"
  | "none"
  | "every"
  | "count"
  | "agg";

export type RelationAggFunction =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "countDistinct";

/**
 * First-class relation function filter stored in canonical filter state.
 */
export interface RelationFunctionFilter {
  id: string;
  relationName: string;
  relationPath?: string[];
  mode: RelationFunctionMode;
  operator: string;
  value?: unknown;
  fieldName?: string;
  aggFunction?: RelationAggFunction;
}

/**
 * Logical group (AND/OR) containing conditions or nested groups.
 */
export interface FilterGroup {
  id: string;
  type: "group";
  logic: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
  negated: boolean;           // If true, wrap in NOT
}

/**
 * Complete filter form state.
 */
export interface FilterFormState {
  root: FilterGroup;
  selectedPresets: string[];
  distinctOn: string[];
  orderBy: string[];
  relationFunctions: RelationFunctionFilter[];
}

/**
 * Nested filter configuration options.
 */
export interface NestedFilterConfig {
  /** Maximum nesting depth allowed in UI */
  maxDepth: number;
  /** Whether to show AND/OR logical operators */
  enableLogicalOperators: boolean;
  /** Whether to show NOT negation */
  enableNot: boolean;
  /** Default relation operator for M2M */
  defaultM2MOperator: "_some" | "_every" | "_none";
  /** Whether to allow expanding relation filters inline */
  enableInlineRelationFilters: boolean;
  /** Maximum number of filters in a single group */
  maxFiltersPerGroup: number;
  /** Auto-apply filters on change */
  autoApply: boolean;
  /** Auto-apply debounce delay in ms */
  autoApplyDelay: number;
}

/**
 * Default nested filter configuration.
 */
export const DEFAULT_NESTED_CONFIG: NestedFilterConfig = {
  maxDepth: 3,
  enableLogicalOperators: true,
  enableNot: true,
  defaultM2MOperator: "_some",
  enableInlineRelationFilters: true,
  maxFiltersPerGroup: 20,
  autoApply: false,
  autoApplyDelay: 500,
};

/**
 * Query builder result types
 */
export interface FilterQueryVariables {
  where?: Record<string, any>;
  presets?: string[];
  distinctOn?: string[];
  orderBy?: string[];
  limit?: number;
  offset?: number;
}
