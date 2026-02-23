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
import { mapTableMetadataToFilterSchema } from "@/widgets/model-tables/hooks";

const filterSchema = mapTableMetadataToFilterSchema(metadata);
```
