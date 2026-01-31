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
export { FilterPanel } from "./FilterPanel";
export type { FilterPanelProps } from "./FilterPanel";

// Types
export type {
  UnifiedFilterSchema,
  FilterConfig,
  FilterableField,
  FilterBaseType,
  FilterOperator,
  FilterChoice,
  FilterUIHints,
  DatePreset,
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

export { useFilterPanel } from "./hooks/useFilterPanel";
export type { UseFilterPanelOptions, UseFilterPanelReturn } from "./hooks/useFilterPanel";

export { useFilterKeyboard } from "./hooks/useFilterKeyboard";
export type { UseFilterKeyboardOptions } from "./hooks/useFilterKeyboard";

export { useFilterPersistence } from "./hooks/useFilterPersistence";
export type { UseFilterPersistenceOptions } from "./hooks/useFilterPersistence";

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
export { FilterGroupContainer } from "./components/FilterGroupContainer";
export type { FilterGroupContainerProps } from "./components/FilterGroupContainer";

export { FilterRow } from "./components/FilterRow";
export type { FilterRowProps } from "./components/FilterRow";

export { InlineFieldSelector } from "./components/InlineFieldSelector";
export type { InlineFieldSelectorProps } from "./components/InlineFieldSelector";

export { CompactOperatorSelect } from "./components/CompactOperatorSelect";
export type { CompactOperatorSelectProps } from "./components/CompactOperatorSelect";

export { SmartValueInput } from "./components/SmartValueInput";
export type { SmartValueInputProps } from "./components/SmartValueInput";

export { DatePresetPicker } from "./components/DatePresetPicker";
export type { DatePresetPickerProps } from "./components/DatePresetPicker";

export { FilterConditionComponent } from "./components/FilterCondition";
export type { FilterConditionProps } from "./components/FilterCondition";

export { FieldSelector } from "./components/FieldSelector";
export type { FieldSelectorProps } from "./components/FieldSelector";

export { ScalarFilterInput } from "./components/ScalarFilterInput";
export type { ScalarFilterInputProps } from "./components/ScalarFilterInput";

export { PresetSelector } from "./components/PresetSelector";
export type { PresetSelectorProps } from "./components/PresetSelector";

export { PresetManager } from "./components/PresetManager";
export type { PresetManagerProps } from "./components/PresetManager";

export { FilterChip } from "./components/FilterChip";
export type { FilterChipProps } from "./components/FilterChip";

export { ActiveFiltersBar } from "./components/ActiveFiltersBar";
export type { ActiveFiltersBarProps } from "./components/ActiveFiltersBar";

export { DistinctOnSelector } from "./components/DistinctOnSelector";
export type { DistinctOnSelectorProps } from "./components/DistinctOnSelector";

export { SaveFilterDialog } from "./components/SaveFilterDialog";
export type { SaveFilterDialogProps } from "./components/SaveFilterDialog";

export { FilterErrorBoundary } from "./components/FilterErrorBoundary";
