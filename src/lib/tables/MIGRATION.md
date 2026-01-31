# ModelTable V2 Migration Guide

## Overview

This guide describes how to migrate from the legacy ModelTable implementation to the new V2 implementation that uses the `metadata_v2` API and `FilterPanel` system.

## Breaking Changes

### Removed Props

| Prop | Replacement | Notes |
|------|--------------|---------|
| `columnFiltersProp` | `filterConfig` | Use the unified `filterConfig` object |
| `onAdvancedFiltersApply` | `filterConfig` with FilterPanel's `onApply` | Filter application now handled internally |
| `quickFilters` | `filterConfig.showPresets` | Use the preset system in FilterPanel |

### Type Changes

| Old Type | New Type | Notes |
|-----------|------------|---------|
| `ModelTableType` | `ModelTableMetadataV2` | Extended with V2-specific fields |
| `filters: FilterFieldType[]` | `filterSchema: FilterSchemaV2[]` | Enhanced filter metadata with operators |

## New Props

### `filterConfig`

Unified configuration object for FilterPanel integration:

```typescript
filterConfig?: {
  /** Layout mode for filter UI */
  layout?: "panel" | "popover" | "inline";
  
  /** Show preset selector (static + saved filters) */
  showPresets?: boolean;
  
  /** Show distinct field selector */
  showDistinct?: boolean;
  
  /** Allow saving new filters */
  allowSaveFilter?: boolean;
  
  /** Maximum nesting depth for relation filters */
  maxDepth?: number;
  
  /** Enable inline relation filter expansion */
  enableInlineRelationFilters?: boolean;
  
  /** Custom title for filter panel */
  title?: string;
  
  /** Show keyboard shortcuts hint */
  showKeyboardHints?: boolean;
};
```

### Metadata Version

The metadata now uses V2 format from `metadata_v2` API:

```typescript
{
  app: string;
  model: string;
  metadataVersion: "v2"; // NEW: indicates V2 metadata
  fields: TableFieldMetadataType[];
  filterSchema: FilterSchemaV2[]; // NEW: enhanced filter metadata
  filterConfig: FilterConfigTypeV2; // NEW: filter configuration
  fieldGroups: FieldGroupType[]; // NEW: field grouping
  relationFilters: RelationFilterSchemaV2[]; // NEW: relation filter info
  // ... rest of properties
}
```

## Migration Examples

### Example 1: Basic Table

**Before:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  quickFilters={["category", "status"]}
  columnFiltersProp={{ mode: "ag-grid", debounce_ms: 300 }}
  onAdvancedFiltersApply={(filters) => console.log(filters)}
/>
```

**After:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  filterConfig={{
    layout: "popover",
    showPresets: true,
    showDistinct: true,
    allowSaveFilter: true,
    maxDepth: 3,
  }}
/>
```

### Example 2: Custom Filter Layout

**Before:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  columnFiltersProp={{
    mode: "devextreme",
    debounce_ms: 500,
  }}
/>
```

**After:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  filterConfig={{
    layout: "panel", // Full panel instead of popover
    showPresets: true,
    showDistinct: false,
    allowSaveFilter: true,
    title: "Product Filters",
  }}
/>
```

### Example 3: Inline Filters

**Before:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  quickFilters={["category"]}
  onAdvancedFiltersApply={(filters) => {
    // Custom filter handling
  }}
/>
```

**After:**
```tsx
<ModelTable
  appName="inventory"
  modelName="Product"
  filterConfig={{
    layout: "inline", // Inline filters directly in toolbar
    showPresets: true,
    showKeyboardHints: false, // Hide keyboard hints for inline
  }}
/>
```

## Benefits

### Single Metadata Query

**Before:** 4 separate queries
1. `modelSchema` (basic fields)
2. `model_table` (mutations)
3. `model_table` (templates)
4. `filterSchema` (filters)

**After:** 1 unified query
- `ModelTableMetadataV2` returns all data in one request

### Unified Filter State Management

**Before:** Three separate filter states
```typescript
const [advancedFiltersState, setAdvancedFiltersState] = useState<ComplexFilterInput<string> | null>(null);
const [columnFiltersPayload, setColumnFiltersPayload] = useState<ComplexFilterInput<string> | null>(null);
const [quickFiltersState, setQuickFiltersState] = useState<Record<string, string[]>>({});
```

**After:** Single filter state with full features
```typescript
const { state: filterState, actions: filterActions } = useNestedFilterForm({
  schema: filterSchema,
  initialState: null,
});
```

### Built-in Preset System

**Before:** Manual implementation or no presets
- Need to build custom preset selector
- Need to implement saved filter management

**After:** Presets out of the box
- Static presets from backend (`filterConfig.presets`)
- Saved filters from database (`savedFilters` query)
- Shared filters across users
- Built-in preset management UI

### Enhanced Filter Capabilities

**New features:**
- Nested filter conditions (AND/OR/NOT logic)
- Relation filters with depth control
- DISTINCT ON support
- Multiple layout modes (panel, popover, inline)
- Keyboard shortcuts (⌘↵ to apply, ⌘S to save, ⇧Esc to reset)
- Auto-apply with configurable debounce
- Field grouping for better UX

## Hook Changes

### useModelTableMetadata → useModelTableMetadataV2

**Before:**
```typescript
const {
  metadata,
  loading,
  error,
  refetch,
  loadingFilters,
  loadingMutations,
  loadingPdfTemplates,
} = useModelTableMetadata(appName, modelName, filtersOptions, { skip });
```

**After:**
```typescript
const {
  metadata, // Now ModelTableMetadataV2 type
  loading,
  error,
  refetch,
} = useModelTableMetadataV2(appName, modelName, { skip });
// No separate loading states - all data in single query
```

### Filter Schema Conversion

Use `mapTableMetadataToFilterSchema` to bridge table metadata to filter schema:

```typescript
import { mapTableMetadataToFilterSchema } from "@/lib/tables/hooks";

const filterSchema = mapTableMetadataToFilterSchema(metadata);
```

## Testing Migration

1. Verify metadata loading:
```typescript
const { result } = renderHook(() =>
  useModelTableMetadataV2("app", "Model")
);

expect(result.current.metadata?.metadataVersion).toBe("v2");
```

2. Verify filter schema mapping:
```typescript
const filterSchema = mapTableMetadataToFilterSchema(metadata);

expect(filterSchema?.fields).toBeDefined();
expect(filterSchema?.presets).toBeDefined();
```

3. Verify UI rendering:
```typescript
render(
  <ModelTable
    appName="app"
    modelName="Model"
    filterConfig={{
      layout: "popover",
      showPresets: true,
    }}
  />
);

// Check FilterPanel is rendered
expect(screen.getByText(/filters/i)).toBeInTheDocument();
```

## Component Removal

These components are no longer needed and can be removed:

- `QuickFilterLoader` - replaced by `PresetSelector` in FilterPanel
- `QuickFilter` - replaced by FilterPanel presets
- `ModelAdvancedFiltersControl` - replaced by FilterPanel
- `AdvancedFiltersDialog` - replaced by FilterPanel dialogs
- `ColumnFilterInput` - replaced by FilterPanel conditions
- `FilterFieldSelector` - replaced by FilterPanel field selector
- `useColumnFilters` - replaced by FilterPanel state management
- `useAdvancedFiltering` - replaced by FilterPanel

## File Changes Summary

### Files to Modify

1. **`@rail-react/src/lib/tables/types.ts`**
   - Add V2 metadata types
   - Add `ModelTableMetadataV2` interface

2. **`@rail-react/src/lib/tables/hooks.tsx`**
   - Add `MODEL_TABLE_METADATA_V2_QUERY`
   - Add `useModelTableMetadataV2` hook
   - Add `mapV2MetadataToTableMetadata` function
   - Add `mapTableMetadataToFilterSchema` function

3. **`@rail-react/src/lib/tables/ModelTable.tsx`**
   - Add FilterPanel imports
   - Replace filter state management
   - Replace quick filter rendering
   - Replace advanced filter rendering
   - Add `filterConfig` prop
   - Remove deprecated props

### Files to Remove

1. **`@rail-react/src/lib/tables/components/QuickFilterLoader.tsx`**
2. **`@rail-react/src/lib/tables/components/QuickFilter.tsx`**
3. **`@rail-react/src/lib/tables/components/filtering/`** (entire directory)

### Files to Create

1. **`@rail-react/src/lib/tables/__tests__/ModelTableV2Migration.test.tsx`**
2. **`@rail-react/src/lib/tables/MIGRATION.md`** (this file)

## Rollback Plan

If issues arise, rollback steps:

1. Revert `hooks.tsx` to use `useModelTableMetadata` instead of `useModelTableMetadataV2`
2. Revert `ModelTable.tsx` to use old filter state management
3. Restore `QuickFilterLoader` and `ModelAdvancedFiltersControl` components
4. Remove `filterConfig` prop usage

## Support

For issues or questions about migration:

- Check test files in `__tests__/ModelTableV2Migration.test.tsx`
- Review FilterPanel documentation in `@rail-react/src/lib/form/filters/`
- Check metadata V2 API docs in `@rail-django/rail_django/extensions/metadata_v2/`

## Checklist

Before migrating, ensure:

- [ ] Backend has `metadata_v2` GraphQL API deployed
- [ ] Backend returns `filterSchema` and `modelSchema` queries
- [ ] `FilterPanel` component is available in codebase
- [ ] All ModelTable usages are identified
- [ ] Tests are updated for new behavior
- [ ] Documentation is updated

After migrating, verify:

- [ ] Tables load without errors
- [ ] Filters work correctly (quick, advanced, presets)
- [ ] Mutations work correctly (create, update, delete)
- [ ] Templates work correctly
- [ ] Permissions are respected
- [ ] Column visibility still works
- [ ] Sorting still works
- [ ] Pagination still works
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes
