/**
 * Dynamic Filters - Public API
 * 
 * Main entry point for the dynamic filter system.
 * 
 * Features:
 * - Auto-generated filter UI from GraphQL metadata
 * - Complex nested filtering with AND/OR/NOT
 * - Filter presets (static, saved, shared)
 * - DISTINCT ON support
 * - Multiple layout modes
 * - Keyboard shortcuts
 */

// Main component
export { DynamicFilterForm } from "./DynamicFilterForm";
export type { DynamicFilterFormProps } from "./DynamicFilterForm";

// Types
export type {
  UnifiedFilterSchema,
  FilterConfig,
  FilterableField,
  FilterBaseType,
  FilterOperator,
  FilterChoice,
  FilterUIHints,
  RelationFilter,
  FilterPreset,
  DistinctField,
  FieldGroup,
  FilterCondition,
  FilterGroup,
  FilterFormState,
  NestedFilterConfig,
  FilterQueryVariables,
} from "./types";

export { DEFAULT_NESTED_CONFIG } from "./types";

// Utilities
export {
  createInitialFilterState,
  generateId,
  countConditions,
  cloneFilterGroup,
  findItemById,
  removeItemById,
  updateItemById,
  validateFilterState,
} from "./state";

// Hooks
export { useFilterMetadata } from "./hooks/useFilterMetadata";
export type { UseFilterMetadataOptions, UseFilterMetadataResult } from "./hooks/useFilterMetadata";

export { useNestedFilterForm } from "./hooks/useNestedFilterForm";
export type { UseNestedFilterFormOptions } from "./hooks/useNestedFilterForm";

// Serialization
export { serializeFilterToGraphQL } from "./serializer";
export { buildQueryVariables, generateQueryString } from "./queryBuilder";
export type { QueryBuilderOptions } from "./queryBuilder";

// Preset management
export { applyPresetToFilterState, graphqlWhereToFilterGroup } from "./presetApplicator";

// Metadata
export { mergeFilterMetadata } from "./metadataMerger";

// Components (for advanced customization)
export { FilterGroupComponent } from "./components/FilterGroup";
export type { FilterGroupProps } from "./components/FilterGroup";

export { FilterConditionComponent } from "./components/FilterCondition";
export type { FilterConditionProps } from "./components/FilterCondition";

export { FieldSelector } from "./components/FieldSelector";
export type { FieldSelectorProps } from "./components/FieldSelector";

export { ScalarFilterInput } from "./components/ScalarFilterInput";
export type { ScalarFilterInputProps } from "./components/ScalarFilterInput";

export { PresetSelector } from "./components/PresetSelector";
export type { PresetSelectorProps } from "./components/PresetSelector";

export { DistinctOnSelector } from "./components/DistinctOnSelector";
export type { DistinctOnSelectorProps } from "./components/DistinctOnSelector";

export { SaveFilterDialog } from "./components/SaveFilterDialog";
export type { SaveFilterDialogProps } from "./components/SaveFilterDialog";

export { FilterErrorBoundary } from "./components/FilterErrorBoundary";
