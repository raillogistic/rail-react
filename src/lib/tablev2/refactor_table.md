# TableV2 Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring strategy for the `tablev2` module. The primary goals are:

1. **Split large files** to stay under 500 lines each
2. **Improve separation of concerns**
3. **Enhance code quality and maintainability**
4. **Preserve all existing features** - no deletions

---

## Current State Analysis

### File Line Counts

| File | Lines | Status |
|------|-------|--------|
| `index.tsx` | 1244 | **CRITICAL - Split Required** |
| `components/TableRow.tsx` | 1388 | **CRITICAL - Split Required** |
| `components/TableColumnMenu.tsx` | 931 | **CRITICAL - Split Required** |
| `hooks/useTableData.ts` | 667 | **OVER LIMIT - Split Required** |
| `components/TableToolbar.tsx` | 575 | **OVER LIMIT - Split Required** |
| `utils.tsx` | 676 | **OVER LIMIT - Split Required** |
| `types.ts` | 470 | OK |
| `hooks/useTablePersistence.ts` | 448 | OK |
| `components/ExportDialog.tsx` | 466 | OK |
| `context/TableContext.tsx` | 291 | OK |
| `components/TablePagination.tsx` | 279 | OK |
| `components/ColumnFilter.tsx` | 288 | OK |
| `components/TableHeader.tsx` | 265 | OK |
| `components/TableMobileCard.tsx` | 143 | OK |
| `context/MetadataContext.tsx` | 58 | OK |
| `components/TableFrame.tsx` | 41 | OK |
| `hooks/useTableFilters.ts` | 216 | OK |
| `queries.ts` | 11 | OK |

---

## Refactoring Strategy

### 1. `index.tsx` (1244 lines) -> Split into 5 files

**Current Issues:**
- Contains multiple components: `ModelTableV2Content`, `BaseTableContent`, `BaseModelTable`, `ModelTableV2`
- Utility functions duplicated (`toCamelCase`, `toSnakeCase`, `toGraphqlFieldName`)
- Column definition building logic mixed with UI
- Export barrel mixed with component definitions

**Proposed Structure:**

```
src/lib/tablev2/
├── index.tsx                          # Re-exports only (~50 lines)
├── components/
│   ├── ModelTableV2.tsx               # Public ModelTableV2 component (~80 lines)
│   ├── ModelTableV2Content.tsx        # Inner content with toolbar/actions (~150 lines)
│   ├── BaseModelTable.tsx             # Base table wrapper with providers (~100 lines)
│   └── BaseTableContent.tsx           # Main table content logic (~400 lines)
├── builders/
│   └── columnDefinitions.ts           # Column definition building (~300 lines)
└── config/
    └── types.ts                       # Public config types moved from index
```

**Files to create:**

#### `builders/columnDefinitions.ts` (~300 lines)
```typescript
// Extract from BaseTableContent:
// - buildColumnDef function
// - columnDefs useMemo logic
// - Relation count resolution
// - Field canonicalization helpers
export function buildColumnDefinitions(
  metadata: ModelSchema,
  normalizedFieldsConfig: ResolvedBaseModelTableFieldsConfig,
  relations?: Record<string, BaseModelTableRelationConfig>,
): BaseModelTableColumnDef[]
```

#### `components/ModelTableV2Content.tsx` (~150 lines)
```typescript
// Extract ModelTableV2Content component
// - Title rendering
// - Top actions resolution
// - Add action button logic
export function ModelTableV2Content(props: {...})
```

#### `components/BaseTableContent.tsx` (~400 lines)
```typescript
// Core table rendering logic
// - Column ordering/visibility management
// - Persistence handling
// - DnD context setup
// - Infinite scroll handling
export function BaseTableContent(props: BaseTableContentProps)
```

#### `components/BaseModelTable.tsx` (~100 lines)
```typescript
// Provider wrapper component
export function BaseModelTable(props: BaseModelTableProps)
```

#### `components/ModelTableV2.tsx` (~80 lines)
```typescript
// Public facade component
export function ModelTableV2(props: ModelTableV2Props)
```

#### Updated `index.tsx` (~50 lines)
```typescript
// Pure re-exports barrel file
export * from "./types";
export * from "./context/MetadataContext";
export * from "./context/TableContext";
// ... etc
export { ModelTableV2 } from "./components/ModelTableV2";
export { BaseModelTable } from "./components/BaseModelTable";
```

---

### 2. `components/TableRow.tsx` (1388 lines) -> Split into 6 files

**Current Issues:**
- Contains multiple distinct features: RelationStatsHover, RowActions, TableRows
- Stats query building is complex and self-contained
- Helper functions mixed with components
- Value formatting/resolving logic duplicated

**Proposed Structure:**

```
src/lib/tablev2/components/
├── TableRow.tsx                       # Main export, TableRows component (~350 lines)
├── row/
│   ├── index.ts                       # Barrel export
│   ├── RowActions.tsx                 # Row action menu & delete (~220 lines)
│   ├── RelationStatsHover.tsx         # Stats tooltip (~250 lines)
│   ├── DataRow.tsx                    # Single row rendering (~200 lines)
│   └── GroupedRow.tsx                 # Group header row (~80 lines)
└── row/utils/
    └── statsHelpers.ts                # Stats query building & formatting (~150 lines)
```

**Files to create:**

#### `row/utils/statsHelpers.ts` (~150 lines)
```typescript
// Extract:
// - STAT_METRIC_META
// - parseStatEntry
// - formatStatValue
// - buildStatsQueryDocument
// - ParsedStatEntry type
export function buildStatsQueryDocument(...)
export function parseStatEntry(...)
export function formatStatValue(...)
```

#### `row/RelationStatsHover.tsx` (~250 lines)
```typescript
// Complete RelationStatsHover component
// Uses statsHelpers for query/formatting
export function RelationStatsHover(props: RelationStatsHoverProps)
```

#### `row/RowActions.tsx` (~220 lines)
```typescript
// Row action dropdown menu
// Delete mutation handling
// Custom actions rendering
export function RowActions(props: RowActionsProps)
```

#### `row/DataRow.tsx` (~200 lines)
```typescript
// Single data row rendering
// Cell rendering logic
// Selection checkbox
export function DataRow(props: DataRowProps)
```

#### `row/GroupedRow.tsx` (~80 lines)
```typescript
// Group header row with expand/collapse
export function GroupedRow(props: GroupedRowProps)
```

#### Updated `TableRow.tsx` (~350 lines)
```typescript
// Main TableRows component
// Virtual scrolling logic
// Loading/empty states
// Orchestrates DataRow/GroupedRow
export { TableRows } from "./TableRows";
```

---

### 3. `components/TableColumnMenu.tsx` (931 lines) -> Split into 4 files

**Current Issues:**
- Large relation filter dialog logic
- Sort/group/hide actions bundled together
- Filter fragment management complex
- Many helper functions

**Proposed Structure:**

```
src/lib/tablev2/components/
├── TableColumnMenu.tsx                # Main menu (~300 lines)
├── column-menu/
│   ├── index.ts
│   ├── RelationFilterDialog.tsx       # Relation function dialog (~350 lines)
│   ├── columnMenuHelpers.ts           # Helper functions (~150 lines)
│   └── types.ts                       # Menu-specific types (~50 lines)
```

**Files to create:**

#### `column-menu/types.ts` (~50 lines)
```typescript
export type RelationFunctionMode = "some" | "none" | "every" | "count" | "agg";
export type AggFunction = "sum" | "avg" | "min" | "max" | "count" | "countDistinct";
export type RelationFieldOption = {...};
```

#### `column-menu/columnMenuHelpers.ts` (~150 lines)
```typescript
// Extract:
// - isScalarFilterInputType
// - operatorOptionsForGraphqlType
// - parseScalarValue
// - mergeWhereWithRelationFragments
// - toSnakeCase (import from shared utils)
export function operatorOptionsForGraphqlType(typeName: string): string[]
export function parseScalarValue(raw: string, type: string, op: string): unknown
```

#### `column-menu/RelationFilterDialog.tsx` (~350 lines)
```typescript
// Complete relation filter dialog
// Includes form state and apply/clear logic
export function RelationFilterDialog(props: RelationFilterDialogProps)
```

#### Updated `TableColumnMenu.tsx` (~300 lines)
```typescript
// Main dropdown menu
// Sort/group/hide actions
// Opens RelationFilterDialog
export function TableColumnMenu(props: TableColumnMenuProps)
```

---

### 4. `hooks/useTableData.ts` (667 lines) -> Split into 3 files

**Current Issues:**
- Query building logic is very complex
- Field/relation canonicalization duplicated
- Variables preparation mixed with query execution

**Proposed Structure:**

```
src/lib/tablev2/hooks/
├── useTableData.ts                    # Main hook (~200 lines)
└── data/
    ├── index.ts
    ├── queryBuilder.ts                # buildDynamicQuery (~300 lines)
    └── variableBuilder.ts             # Variable preparation (~100 lines)
```

**Files to create:**

#### `data/queryBuilder.ts` (~300 lines)
```typescript
// Extract buildDynamicQuery function
// Selection tree building
// Field resolution
export function buildDynamicQuery(
  app: string,
  model: string,
  fields: FieldSchema[],
  relationships: RelationshipSchema[] | undefined,
  filterConfig?: FilterConfig,
  fieldConfig?: {...},
): DocumentNode
```

#### `data/variableBuilder.ts` (~100 lines)
```typescript
// Variable preparation logic
// Order by normalization
// Filter variable merging
export function buildQueryVariables(...)
```

#### Updated `useTableData.ts` (~200 lines)
```typescript
// Main hook orchestration
// Uses queryBuilder and variableBuilder
// Handles data sync to context
export function useTableData(config?: TableDataConfig)
```

---

### 5. `components/TableToolbar.tsx` (575 lines) -> Split into 4 files

**Current Issues:**
- Multiple distinct sections: search, columns menu, filters, grouping, export
- Duplicated column visibility logic
- Filter panel rendering mixed with toolbar

**Proposed Structure:**

```
src/lib/tablev2/components/
├── TableToolbar.tsx                   # Main toolbar layout (~150 lines)
├── toolbar/
│   ├── index.ts
│   ├── QuickSearch.tsx                # Search input (~80 lines)
│   ├── ColumnsMenu.tsx                # Columns dropdown (~180 lines)
│   ├── GroupingMenu.tsx               # Grouping dropdown (~120 lines)
│   └── ViewOptionsMenu.tsx            # Density/wrap settings (~100 lines)
```

**Files to create:**

#### `toolbar/QuickSearch.tsx` (~80 lines)
```typescript
export function QuickSearch(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
})
```

#### `toolbar/ColumnsMenu.tsx` (~180 lines)
```typescript
// Column visibility dropdown
// Select all/default actions
export function ColumnsMenu(props: ColumnsMenuProps)
```

#### `toolbar/GroupingMenu.tsx` (~120 lines)
```typescript
// Grouping field selector
// Expand/collapse all
export function GroupingMenu(props: GroupingMenuProps)
```

#### `toolbar/ViewOptionsMenu.tsx` (~100 lines)
```typescript
// Density options
// Wrap cells toggle
export function ViewOptionsMenu(props: ViewOptionsMenuProps)
```

#### Updated `TableToolbar.tsx` (~150 lines)
```typescript
// Composes toolbar sections
// Filter panel trigger
// Export dialog trigger
export function TableToolbar(props: TableToolbarProps)
```

---

### 6. `utils.tsx` (676 lines) -> Split into 4 files

**Current Issues:**
- Mixed concerns: formatting, field merging, schema manipulation, grouping
- JSX in utility file (formatCellValue returns React nodes)
- Some functions are only used internally

**Proposed Structure:**

```
src/lib/tablev2/
├── utils.tsx                          # Re-exports all utils (~30 lines)
├── utils/
│   ├── index.ts
│   ├── formatting.tsx                 # formatCellValue & display utils (~120 lines)
│   ├── caseConversion.ts              # toCamelCase, toSnakeCase, etc (~50 lines)
│   ├── fieldMerging.ts                # Field config merging (~150 lines)
│   ├── schemaHelpers.ts               # Schema manipulation (~180 lines)
│   └── groupingHelpers.ts             # Grouping resolution (~100 lines)
```

**Files to create:**

#### `utils/caseConversion.ts` (~50 lines)
```typescript
// Single source of truth for case conversion
// Remove duplicates from other files
export function toCamelCase(value: string): string
export function toSnakeCase(value: string): string
export function toGraphqlFieldName(value: string): string
```

#### `utils/formatting.tsx` (~120 lines)
```typescript
// Cell value formatting (has JSX)
// Date/boolean/choice rendering
export function formatCellValue(value: any, field: FieldSchema): ReactNode
```

#### `utils/fieldMerging.ts` (~150 lines)
```typescript
// Field configuration normalization and merging
export function normalizeBaseModelTableFieldsInput(...)
export function mergeBaseModelTableFields(...)
export function isAccessorExcluded(...)
```

#### `utils/schemaHelpers.ts` (~180 lines)
```typescript
// Schema manipulation
export function mergeModelSchemaWithRelationships(...)
export function normalizeModelSchemaAccessors(...)
export function getDefaultHiddenColumnIds(...)
export function getSyntheticRelationCountSource(...)
```

#### `utils/groupingHelpers.ts` (~100 lines)
```typescript
// Grouping value/key/label resolution
export function resolveGroupingValue(...)
export function resolveGroupingKey(...)
export function resolveGroupingLabel(...)
export function resolveFieldValue(...)
```

---

## Shared Utilities Consolidation

### Problem: Duplicated Helper Functions

The following functions are duplicated across multiple files:

| Function | Files Where Duplicated |
|----------|------------------------|
| `toCamelCase` | index.tsx, utils.tsx, useTableData.ts, TableRow.tsx, TableColumnMenu.tsx |
| `toSnakeCase` | index.tsx, utils.tsx, useTableData.ts, TableRow.tsx, TableColumnMenu.tsx |
| `toGraphqlFieldName` | index.tsx, utils.tsx, useTableData.ts, TableRow.tsx |
| `isRecord` | TableColumnMenu.tsx, useTableFilters.ts |

### Solution

Create `utils/caseConversion.ts` as single source of truth and update all imports:

```typescript
// utils/caseConversion.ts
export function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function toSnakeCase(value: string): string {
  return value.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

export function toGraphqlFieldName(value: string): string {
  const camel = toCamelCase(value || "");
  if (!camel) return "";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
```

---

## Type Improvements

### Current `types.ts` is well-organized, but consider:

1. **Split into domain-specific type files** if it grows beyond 500 lines:
   ```
   types/
   ├── index.ts            # Re-exports
   ├── metadata.ts         # GraphQL metadata types
   ├── state.ts            # Component state types
   └── config.ts           # Configuration types
   ```

2. **Move public config types** from `index.tsx` to dedicated file:
   ```typescript
   // types/publicConfig.ts
   export type FilterPanelMode = "drawer" | "modal";
   export interface FilterPanelOptions {...}
   export type ModelTableV2TopAction = {...}
   export type ModelTableV2TableConfig = {...}
   export type ModelTableV2PerformanceOptions = {...}
   export type ModelTableV2ViewOptions = {...}
   ```

---

## Proposed Final Directory Structure

```
src/lib/tablev2/
├── index.tsx                              # Barrel exports (~50 lines)
├── queries.ts                             # GraphQL queries (~15 lines)
│
├── types/
│   ├── index.ts                           # Type re-exports
│   ├── metadata.ts                        # GraphQL metadata types (~150 lines)
│   ├── state.ts                           # Component state types (~100 lines)
│   ├── config.ts                          # Configuration types (~150 lines)
│   └── publicConfig.ts                    # Public API config types (~100 lines)
│
├── utils/
│   ├── index.ts                           # Utility re-exports
│   ├── caseConversion.ts                  # Case conversion helpers (~50 lines)
│   ├── formatting.tsx                     # Cell formatting (~120 lines)
│   ├── fieldMerging.ts                    # Field config merging (~150 lines)
│   ├── schemaHelpers.ts                   # Schema manipulation (~180 lines)
│   └── groupingHelpers.ts                 # Grouping helpers (~100 lines)
│
├── builders/
│   ├── index.ts
│   └── columnDefinitions.ts               # Column def building (~300 lines)
│
├── context/
│   ├── MetadataContext.tsx                # Metadata provider (~60 lines)
│   └── TableContext.tsx                   # Table state context (~300 lines)
│
├── hooks/
│   ├── useDebouncedValue.ts               # Debounce utility (~30 lines)
│   ├── useTableData.ts                    # Data fetching (~200 lines)
│   ├── useTableFilters.ts                 # Filter management (~220 lines)
│   ├── useTableMetadata.ts                # Metadata fetching (~80 lines)
│   ├── useTablePersistence.ts             # State persistence (~450 lines)
│   └── data/
│       ├── index.ts
│       ├── queryBuilder.ts                # Query construction (~300 lines)
│       └── variableBuilder.ts             # Variable preparation (~100 lines)
│
└── components/
    ├── ModelTableV2.tsx                   # Public component (~80 lines)
    ├── ModelTableV2Content.tsx            # Content with toolbar (~150 lines)
    ├── BaseModelTable.tsx                 # Provider wrapper (~100 lines)
    ├── BaseTableContent.tsx               # Table content logic (~400 lines)
    ├── TableFrame.tsx                     # Table wrapper (~45 lines)
    ├── TableHeader.tsx                    # Header row (~270 lines)
    ├── TablePagination.tsx                # Pagination controls (~280 lines)
    ├── TableMobileCard.tsx                # Mobile card view (~145 lines)
    ├── ColumnFilter.tsx                   # Column filter popover (~290 lines)
    ├── ExportDialog.tsx                   # Export dialog (~470 lines)
    ├── ExportFieldTree.tsx                # Export field selector (~existing)
    │
    ├── TableRow.tsx                       # Row orchestration (~350 lines)
    ├── row/
    │   ├── index.ts
    │   ├── DataRow.tsx                    # Single row (~200 lines)
    │   ├── GroupedRow.tsx                 # Group header (~80 lines)
    │   ├── RowActions.tsx                 # Action menu (~220 lines)
    │   ├── RelationStatsHover.tsx         # Stats tooltip (~250 lines)
    │   └── utils/
    │       └── statsHelpers.ts            # Stats utilities (~150 lines)
    │
    ├── TableToolbar.tsx                   # Toolbar layout (~150 lines)
    ├── toolbar/
    │   ├── index.ts
    │   ├── QuickSearch.tsx                # Search input (~80 lines)
    │   ├── ColumnsMenu.tsx                # Columns dropdown (~180 lines)
    │   ├── GroupingMenu.tsx               # Grouping menu (~120 lines)
    │   └── ViewOptionsMenu.tsx            # View options (~100 lines)
    │
    ├── TableColumnMenu.tsx                # Column menu (~300 lines)
    └── column-menu/
        ├── index.ts
        ├── RelationFilterDialog.tsx       # Relation dialog (~350 lines)
        ├── columnMenuHelpers.ts           # Menu helpers (~150 lines)
        └── types.ts                       # Menu types (~50 lines)
```

---

## Implementation Order

### Phase 1: Shared Utilities (Low Risk)
1. Create `utils/caseConversion.ts`
2. Create `utils/` subdirectory structure
3. Split `utils.tsx` into domain-specific files
4. Update all imports across codebase

### Phase 2: Query Building (Medium Risk)
1. Create `hooks/data/queryBuilder.ts`
2. Create `hooks/data/variableBuilder.ts`
3. Refactor `useTableData.ts`
4. Test data fetching thoroughly

### Phase 3: Row Components (Medium Risk)
1. Create `row/utils/statsHelpers.ts`
2. Create `row/RelationStatsHover.tsx`
3. Create `row/RowActions.tsx`
4. Create `row/DataRow.tsx` and `row/GroupedRow.tsx`
5. Refactor `TableRow.tsx`

### Phase 4: Column Menu (Medium Risk)
1. Create `column-menu/types.ts`
2. Create `column-menu/columnMenuHelpers.ts`
3. Create `column-menu/RelationFilterDialog.tsx`
4. Refactor `TableColumnMenu.tsx`

### Phase 5: Toolbar (Low Risk)
1. Create `toolbar/QuickSearch.tsx`
2. Create `toolbar/ColumnsMenu.tsx`
3. Create `toolbar/GroupingMenu.tsx`
4. Create `toolbar/ViewOptionsMenu.tsx`
5. Refactor `TableToolbar.tsx`

### Phase 6: Main Components (High Risk)
1. Create `builders/columnDefinitions.ts`
2. Create `components/ModelTableV2Content.tsx`
3. Create `components/BaseTableContent.tsx`
4. Create `components/BaseModelTable.tsx`
5. Create `components/ModelTableV2.tsx`
6. Update `index.tsx` to be pure re-exports

---

## Testing Strategy

1. **Unit Tests**: Add/update tests for each new utility file
2. **Integration Tests**: Ensure `ModelTableV2.integration.test.tsx` passes after each phase
3. **Visual Testing**: Manually verify table rendering after each phase
4. **Feature Checklist**:
   - [ ] Basic table rendering
   - [ ] Sorting
   - [ ] Filtering (quick search & advanced)
   - [ ] Column visibility
   - [ ] Column reordering (drag & drop)
   - [ ] Grouping
   - [ ] Pagination
   - [ ] Infinite scroll
   - [ ] Row selection
   - [ ] Row actions (edit/delete)
   - [ ] Export
   - [ ] Relation stats hover
   - [ ] Persistence (localStorage + backend)
   - [ ] Mobile card view

---

## Best Practices Applied

1. **Single Responsibility**: Each file has one clear purpose
2. **DRY**: Shared utilities extracted and reused
3. **Barrel Exports**: Index files for clean imports
4. **Colocation**: Related files grouped in subdirectories
5. **Testability**: Pure functions extracted for easy testing
6. **Type Safety**: All public APIs have explicit TypeScript types
7. **No Feature Deletion**: All existing functionality preserved
8. **Progressive Enhancement**: Can be implemented incrementally

---

## Migration Notes

- All existing imports from `@/lib/tablev2` will continue to work
- Internal imports may need updates as files are split
- Add deprecation warnings if public API changes (unlikely needed)
- Run linter after each phase to catch any import issues
