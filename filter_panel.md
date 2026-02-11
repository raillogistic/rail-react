# User-Friendly Filter Panel - Technical Implementation Plan

## Executive Summary

This document outlines a multi-phase technical plan to redesign the filter UI from the current "builder-style" approach to a streamlined **"Click → Select → Type"** user-friendly experience. The goal is to minimize cognitive load while maintaining power-user capabilities.

---

## Current State Analysis

### Existing Architecture

```
FilterPanel.tsx          → Main orchestrator
├── FilterGroupComponent       → AND/OR nesting (recursive)
│   └── FilterConditionComponent → Field path + operator + value row
│       └── ScalarFilterInput  → Type-specific value input
└── FieldSelector              → Popover with field navigation
```

### Current Strengths

- Robust recursive AND/OR logic
- Deep relationship traversal (up to `maxDepth`)
- Polymorphic inputs for all field types
- Preset/saved filter management
- Full GraphQL serialization

### Current Pain Points

- Two-step process (add → then configure) feels clunky
- Operators take too much visual space
- AND/OR grouping is visually confusing
- No quick presets for common operations
- No keyboard-first workflow

---

## Target Design: "Click → Select → Type"

### Core Principles

1. **Single-row filters**: Field + Operator + Value in one inline row
2. **Auto-focus**: Selecting a field immediately focuses the value input
3. **Smart defaults**: Pre-select the most common operator per field type
4. **Progressive disclosure**: Simple by default, advanced on demand
5. **Keyboard navigation**: Tab/Enter/Escape for power users

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Filters                                                    [Clear All] │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Customer Name ▼] [contains ▼] [_________________] [×]              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Amount ▼]        [> ▼]        [$_1,000__________] [×]              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ [+ Add Filter]                                                          │
│                                                                         │
│ ─── Match ANY (OR group) ──────────────────────────────────────────── │
│ │ [Status ▼] [is ▼] [Pending ▼] [×]                                   │ │
│ │ [Status ▼] [is ▼] [Review ▼]  [×]                                   │ │
│ │ [+ Add OR condition]                                                 │ │
│ └───────────────────────────────────────────────────────────────────── │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ 💾 Saved: [My Filters ▼]                     [Save Current] [Apply]    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# Phase 1: Backend Metadata Enhancements

## Objective

Extend Django metadata to provide richer UI hints for optimal filter rendering.

## 1.1 Extended FilterUIHints Schema

### Current Schema (types.ts)

```typescript
interface FilterUIHints {
  widget: string;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  dateFormat?: string;
  allowClear?: boolean;
}
```

### Extended Schema

```typescript
interface FilterUIHints {
  // Existing
  widget: string;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  dateFormat?: string;
  allowClear?: boolean;

  // NEW: Smart defaults
  defaultOperator?: string; // Pre-select most common operator
  preferredOperators?: string[]; // Order operators by frequency

  // NEW: Quick presets for dates
  datePresets?: DatePreset[]; // ["today", "thisWeek", "thisMonth", "thisQuarter"]

  // NEW: Autocomplete hints
  autocompleteEndpoint?: string; // For typeahead suggestions
  recentValuesKey?: string; // localStorage key for recent values

  // NEW: Display hints
  displayWidth?: "sm" | "md" | "lg" | "full";
  showInQuickFilter?: boolean; // Show in compact toolbar mode
  priority?: number; // Sort order in field list

  // NEW: Validation
  pattern?: string; // Regex pattern
  patternMessage?: string; // Validation error message
}

interface DatePreset {
  key: string; // "today", "thisWeek", etc.
  label: string; // "Today", "This Week"
  getValue: () => [string, string?]; // Returns date(s)
}
```

### Checklist - Phase 1.1

- [x] Update `FilterUIHints` interface in `types.ts`
- [x] Add `DatePreset` interface
- [x] Add default operator mapping per base type

---

## 1.2 Django Backend Changes

### File: `rail_django/extensions/metadata/filter_extractor.py`

Add new fields to the extracted metadata:

```python
# New default operators per field type
DEFAULT_OPERATORS = {
    'CharField': 'icontains',
    'TextField': 'icontains',
    'IntegerField': 'eq',
    'DecimalField': 'eq',
    'FloatField': 'eq',
    'BooleanField': 'eq',
    'DateField': 'eq',
    'DateTimeField': 'gte',
    'ForeignKey': 'eq',
    'ManyToManyField': '_some',
}

# Preferred operator ordering
PREFERRED_OPERATORS = {
    'String': ['icontains', 'eq', 'startsWith', 'endsWith', 'in'],
    'Number': ['eq', 'gte', 'lte', 'between', 'in'],
    'Date': ['eq', 'gte', 'lte', 'between', 'year', 'month'],
    'DateTime': ['gte', 'lte', 'between', 'eq', 'year', 'month'],
    'Boolean': ['eq'],
    'Relationship': ['eq', 'in', 'isNull'],
}
```

### New GraphQL Fields

```graphql
type FilterUIHints {
  widget: String!
  placeholder: String
  minValue: Float
  maxValue: Float
  step: Float
  dateFormat: String
  allowClear: Boolean

  # NEW
  defaultOperator: String
  preferredOperators: [String!]
  datePresets: [DatePresetType!]
  showInQuickFilter: Boolean
  priority: Int
}

type DatePresetType {
  key: String!
  label: String!
  days: Int # Relative days (negative for past)
  startOfPeriod: String # "day", "week", "month", "quarter", "year"
}
```

### Checklist - Phase 1.2

- [x] Add `DEFAULT_OPERATORS` mapping in `filter_extractor.py`
- [x] Add `PREFERRED_OPERATORS` mapping
- [x] Add `DatePresetType` GraphQL type
- [x] Update `FilterUIHints` GraphQL type with new fields
- [x] Implement `_get_default_operator()` method
- [x] Implement `_get_preferred_operators()` method
- [x] Add `showInQuickFilter` based on field importance
- [x] Add `priority` based on field ordering in model

---

## 1.3 Metadata Merger Updates

### File: `metadataMerger.ts`

Update the merger to handle new metadata fields:

```typescript
function mergeUIHints(
  modelField: ModelSchemaField,
  filterField: FilterSchemaField,
): FilterUIHints {
  return {
    widget: filterField.widget ?? inferWidget(modelField),
    placeholder: filterField.placeholder ?? generatePlaceholder(modelField),

    // NEW: Smart defaults
    defaultOperator:
      filterField.defaultOperator ?? getDefaultOperator(modelField.baseType),
    preferredOperators:
      filterField.preferredOperators ??
      getPreferredOperators(modelField.baseType),
    datePresets:
      modelField.baseType === "Date" || modelField.baseType === "DateTime"
        ? getDatePresets()
        : undefined,
    showInQuickFilter: filterField.showInQuickFilter ?? false,
    priority: filterField.priority ?? 999,

    // Existing
    minValue: filterField.minValue,
    maxValue: filterField.maxValue,
    step: filterField.step,
    dateFormat: filterField.dateFormat,
    allowClear: filterField.allowClear ?? true,
  };
}

const DEFAULT_DATE_PRESETS: DatePreset[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisWeek", label: "This Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear", label: "This Year" },
  { key: "last30Days", label: "Last 30 Days" },
  { key: "last90Days", label: "Last 90 Days" },
];
```

### Checklist - Phase 1.3

- [x] Update `mergeUIHints` function
- [x] Add `getDefaultOperator()` helper
- [x] Add `getPreferredOperators()` helper
- [x] Add `getDatePresets()` helper
- [x] Add `DEFAULT_DATE_PRESETS` constant
- [x] Update `FilterableField` interface usage

---

# Phase 2: Core Component Redesign

## 2.1 FilterRow Component (NEW)

### Purpose

Single inline row combining field selector, operator, and value input.

### File: `components/FilterRow.tsx`

```typescript
interface FilterRowProps {
  condition: FilterCondition;
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  onFieldChange: (
    fieldPath: string[],
    fieldName: string,
    operator: string,
  ) => void;
  autoFocus?: boolean;
  isNew?: boolean; // Just added, focus value input
}
```

### Key Features

- **Inline field selector**: Click field badge to change
- **Compact operator dropdown**: Grouped by category
- **Auto-focus value**: When `isNew=true`, focus value input immediately
- **Remove on hover**: X button appears on hover
- **Keyboard shortcuts**: Tab between elements, Enter to confirm

### Visual States

```
Default:     [Customer Name ▼] [contains ▼] [Acme Corp] [×]
Editing:     [Customer Name ▼] [contains ▼] [|_________] [×]  ← cursor
New:         [Select field... ▼]                               ← popover open
Error:       [Amount ▼] [between ▼] [100] to [___] [×]  ← red border, missing value
```

### Checklist - Phase 2.1

- [x] Create `FilterRow.tsx` component
- [x] Implement inline field selector trigger
- [x] Implement compact operator dropdown
- [x] Implement auto-focus on new filter
- [x] Add hover state for remove button
- [x] Add keyboard navigation (Tab, Enter, Escape)
- [x] Add validation error display
- [x] Add animation for new filter appearance
- [x] Write unit tests

---

## 2.2 InlineFieldSelector Component (NEW)

### Purpose

Dropdown for selecting/changing a field without opening a modal.

### File: `components/InlineFieldSelector.tsx`

```typescript
interface InlineFieldSelectorProps {
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  currentPath?: string[];
  onSelect: (
    fieldPath: string[],
    fieldName: string,
    defaultOperator: string,
  ) => void;
  trigger: React.ReactNode;
  recentFields?: string[][];
  favoriteFields?: string[][];
}
```

### Sections

1. **Recent** (last 5 used fields)
2. **Favorites** (pinned by user)
3. **Quick Filters** (fields with `showInQuickFilter: true`)
4. **All Fields** (grouped by relation)

### Visual Layout

```
┌──────────────────────────────────────┐
│ 🔍 Search fields...                  │
├──────────────────────────────────────┤
│ ⭐ Favorites                          │
│   └ Status                           │
│   └ Created Date                     │
├──────────────────────────────────────┤
│ 🕐 Recent                             │
│   └ Customer → Name                  │
│   └ Amount                           │
├──────────────────────────────────────┤
│ ⚡ Quick Filters                      │
│   └ Status                           │
│   └ Date                             │
│   └ Assigned To                      │
├──────────────────────────────────────┤
│ 📋 Customer                           │
│   └ Name                             │
│   └ Email                            │
│   └ Company ›                        │
├──────────────────────────────────────┤
│ 📋 Invoice                            │
│   └ Amount                           │
│   └ Date                             │
└──────────────────────────────────────┘
```

### Checklist - Phase 2.2

- [x] Create `InlineFieldSelector.tsx`
- [x] Implement search filtering
- [x] Implement Recent fields section
- [x] Implement Favorites section (with localStorage)
- [x] Implement Quick Filters section
- [x] Implement grouped All Fields section
- [x] Add relation navigation (drill-down)
- [x] Add keyboard navigation
- [x] Write unit tests

---

## 2.3 CompactOperatorSelect Component (NEW)

### Purpose

Minimal operator dropdown with smart grouping.

### File: `components/CompactOperatorSelect.tsx`

```typescript
interface CompactOperatorSelectProps {
  field: FilterableField;
  value: string;
  onChange: (operator: string) => void;
  disabled?: boolean;
}
```

### Grouped Operators Display

```
┌─────────────────────────┐
│ = Equals                │  ← Most common first
│ ≠ Not equals            │
├─────────────────────────┤
│ Text                    │
│   ⊃ Contains            │
│   ⊃ Contains (exact)    │
│   ⊂ Starts with         │
│   ⊃ Ends with           │
├─────────────────────────┤
│ List                    │
│   ∈ Is one of           │
│   ∉ Is not one of       │
├─────────────────────────┤
│ Empty                   │
│   ∅ Is empty            │
└─────────────────────────┘
```

### Operator Icons/Symbols

| Operator   | Symbol | Label            |
| ---------- | ------ | ---------------- |
| eq         | =      | Equals           |
| neq        | ≠      | Not equals       |
| gt         | >      | Greater than     |
| gte        | ≥      | Greater or equal |
| lt         | <      | Less than        |
| lte        | ≤      | Less or equal    |
| contains   | ⊃      | Contains         |
| icontains  | ⊃      | Contains         |
| startsWith | ⊂      | Starts with      |
| endsWith   | ⊃      | Ends with        |
| in         | ∈      | Is one of        |
| notIn      | ∉      | Is not one of    |
| between    | ↔      | Between          |
| isNull     | ∅      | Is empty         |

### Checklist - Phase 2.3

- [x] Create `CompactOperatorSelect.tsx`
- [x] Implement operator grouping
- [x] Add operator icons/symbols
- [x] Implement preferred operators ordering
- [x] Add keyboard support
- [x] Write unit tests

---

## 2.4 SmartValueInput Component (REFACTOR)

### Purpose

Enhanced version of `ScalarFilterInput` with better UX.

### File: `components/SmartValueInput.tsx`

### Enhancements over ScalarFilterInput

#### Text Fields

- Autocomplete from recent values
- Typeahead suggestions (if `autocompleteEndpoint` provided)
- Clear button on hover

#### Number Fields

- Increment/decrement buttons
- Range slider option for bounded values
- Currency formatting support

#### Date Fields

- Quick preset buttons (Today, This Week, etc.)
- Natural language input ("last week", "2 days ago")
- Relative date toggle

#### Relationship Fields

- Recent selections at top
- Inline create option (if permitted)
- Multi-select with pill display

#### Boolean Fields

- Toggle switch instead of dropdown
- Yes/No button group option

### Checklist - Phase 2.4

- [x] Create `SmartValueInput.tsx` (or refactor `ScalarFilterInput`)
- [x] Add recent values autocomplete
- [x] Add quick date presets
- [x] Add number increment buttons
- [x] Add toggle switch for booleans
- [x] Add clear button on hover
- [x] Preserve existing polymorphic behavior
- [x] Write unit tests

---

## 2.5 DatePresetPicker Component (NEW)

### Purpose

Quick date selection with presets.

### File: `components/DatePresetPicker.tsx`

```typescript
interface DatePresetPickerProps {
  value: string | [string, string] | undefined;
  onChange: (value: string | [string, string]) => void;
  operator: "eq" | "gte" | "lte" | "between";
  presets: DatePreset[];
  includeTime?: boolean;
  disabled?: boolean;
}
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Quick Select:                                               │
│ [Today] [Yesterday] [This Week] [This Month] [Custom...]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ 📅 Jan 15    │ to │ 📅 Jan 31    │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Checklist - Phase 2.5

- [x] Create `DatePresetPicker.tsx`
- [x] Implement preset buttons
- [x] Implement custom date picker fallback
- [x] Support single date and date range modes
- [x] Add keyboard navigation
- [x] Write unit tests

---

# Phase 3: Filter Group UX Redesign

## 3.1 FilterGroupContainer Component (REFACTOR)

### Purpose

Simplified visual container for AND/OR groups.

### Current Problem

- Nested groups are visually confusing
- AND/OR toggle placement is unclear
- Adding subgroups is not intuitive

### New Design

```
┌─ Match ALL (AND) ────────────────────────────────────────────┐
│  [Customer Name ▼] [contains ▼] [Acme] [×]                   │
│  [Amount ▼] [> ▼] [1000] [×]                                 │
│                                                              │
│  ┌─ Match ANY (OR) ────────────────────────────────────────┐ │
│  │  [Status ▼] [is ▼] [Pending ▼] [×]                      │ │
│  │  [Status ▼] [is ▼] [Review ▼]  [×]                      │ │
│  │                                     [+ Add OR condition] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Add filter] [+ Add OR group]                             │
└──────────────────────────────────────────────────────────────┘
```

### Key Changes

- Clear "Match ALL" / "Match ANY" labels
- Visual distinction between AND (default) and OR (indented, different bg)
- Simpler add buttons at bottom

### Checklist - Phase 3.1

- [x] Refactor `FilterGroupComponent` to `FilterGroupContainer`
- [x] Add "Match ALL/ANY" header labels
- [x] Improve visual distinction for nested groups
- [x] Simplify add condition/group buttons
- [x] Add collapse/expand for large groups
- [x] Add drag-and-drop reordering (optional)
- [x] Write unit tests

---

## 3.2 Quick OR Toggle

### Purpose

Allow quick OR conditions on the same field without creating a full group.

### Behavior

When user has `[Status] [is] [Pending]` and clicks "+ or", show:

```
[Status ▼] [is ▼] [Pending ▼]  or  [Review ▼] [×]
```

This internally creates an OR group but displays inline for simplicity.

### Checklist - Phase 3.2

- [x] Add "+ or" button next to filter rows for enum fields
- [x] Implement inline OR display for same-field conditions
- [x] Auto-convert to full OR group when fields differ
- [x] Write unit tests

---

# Phase 4: Container & Layout Modes

## 4.1 FilterPanel Component (NEW)

### Purpose

Main container with multiple layout modes.

### File: `components/FilterPanel.tsx`

```typescript
interface FilterPanelProps {
  schema: UnifiedFilterSchema;
  value: FilterFormState;
  onChange: (state: FilterFormState) => void;
  onApply: (variables: FilterQueryVariables) => void;

  // Layout
  mode: "panel" | "popover" | "inline" | "toolbar";

  // Features
  showPresets?: boolean;
  showSaveButton?: boolean;
  showClearButton?: boolean;
  showApplyButton?: boolean; // false for auto-apply

  // Auto-apply
  autoApply?: boolean;
  autoApplyDelay?: number;

  // Callbacks
  onPresetSelect?: (preset: FilterPreset) => void;
  onSave?: (name: string, isShared: boolean) => void;
}
```

### Layout Modes

#### Panel Mode (Sidebar)

```
┌─────────────────────────────┐
│ 🔍 Filters          [Clear] │
├─────────────────────────────┤
│ [Filter rows...]            │
│                             │
│ [+ Add Filter]              │
├─────────────────────────────┤
│ 💾 Presets: [Dropdown]      │
├─────────────────────────────┤
│        [Apply Filters]      │
└─────────────────────────────┘
```

#### Popover Mode (Button trigger)

```
[🔍 Filters (3)] → Opens popover with panel content
```

#### Inline Mode (Embedded)

```
Filters: [row] [row] [row] [+ Add]
```

#### Toolbar Mode (Compact chips)

```
[Customer: Acme ×] [Status: Active ×] [Amount > 1000 ×] [+]
```

### Checklist - Phase 4.1

- [x] Create `FilterPanel.tsx`
- [x] Implement Panel mode
- [x] Implement Popover mode
- [x] Implement Inline mode
- [x] Implement Toolbar mode (compact chips)
- [x] Add mode-specific styling
- [x] Add responsive breakpoints
- [x] Write unit tests

---

## 4.2 FilterChip Component (NEW)

### Purpose

Compact display of active filter for toolbar mode.

### File: `components/FilterChip.tsx`

```typescript
interface FilterChipProps {
  condition: FilterCondition;
  schema: UnifiedFilterSchema;
  onRemove: () => void;
  onClick: () => void; // Edit inline
}
```

### Display Format

```
[Field: Value ×]
[Customer: Acme ×]
[Amount > 1000 ×]
[Date: This Month ×]
[Status: Active, Pending ×]  // Multiple values
```

### Checklist - Phase 4.2

- [x] Create `FilterChip.tsx`
- [x] Implement compact display format
- [x] Add click to edit behavior
- [x] Add remove button
- [x] Add tooltip with full details
- [x] Write unit tests

---

## 4.3 ActiveFiltersBar Component (NEW)

### Purpose

Horizontal bar showing active filters as chips.

### File: `components/ActiveFiltersBar.tsx`

```typescript
interface ActiveFiltersBarProps {
  state: FilterFormState;
  schema: UnifiedFilterSchema;
  onRemoveCondition: (id: string) => void;
  onClearAll: () => void;
  onAddFilter: () => void; // Opens filter panel
  maxVisible?: number; // Show "+N more" for overflow
}
```

### Visual Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Customer: Acme ×] [Status: Active ×] [+2 more] [+ Add] [Clear All]   │
└────────────────────────────────────────────────────────────────────────┘
```

### Checklist - Phase 4.3

- [x] Create `ActiveFiltersBar.tsx`
- [x] Implement chip rendering
- [x] Add overflow handling (+N more)
- [x] Add clear all button
- [x] Add "Add filter" button
- [x] Write unit tests

---

# Phase 5: State Management & Hooks

## 5.1 useFilterPanel Hook (NEW)

### Purpose

Centralized hook for filter panel state management.

### File: `hooks/useFilterPanel.ts`

```typescript
interface UseFilterPanelOptions {
  schema: UnifiedFilterSchema;
  config?: Partial<NestedFilterConfig>;
  initialState?: FilterFormState;
  autoApply?: boolean;
  autoApplyDelay?: number;
  onApply?: (variables: FilterQueryVariables) => void;
  persistKey?: string; // localStorage key for persistence
}

interface UseFilterPanelReturn {
  // State
  state: FilterFormState;
  activeCount: number;
  hasChanges: boolean;

  // Actions
  addCondition: (
    fieldPath: string[],
    fieldName: string,
    operator: string,
  ) => void;
  updateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  removeCondition: (id: string) => void;
  addGroup: (parentId: string, logic: "AND" | "OR") => void;
  setGroupLogic: (groupId: string, logic: "AND" | "OR") => void;

  // Bulk actions
  clearAll: () => void;
  applyPreset: (preset: FilterPreset) => void;
  reset: () => void;

  // Apply
  apply: () => void;
  getVariables: () => FilterQueryVariables;

  // Favorites & Recent
  recentFields: string[][];
  addToRecent: (fieldPath: string[]) => void;
  favoriteFields: string[][];
  toggleFavorite: (fieldPath: string[]) => void;
}
```

### Checklist - Phase 5.1

- [x] Create `useFilterPanel.ts`
- [x] Implement state management
- [x] Implement auto-apply with debounce
- [x] Implement localStorage persistence
- [x] Implement recent fields tracking
- [x] Implement favorite fields
- [x] Write unit tests

---

## 5.2 useFilterKeyboard Hook (NEW)

### Purpose

Keyboard navigation for filter panel.

### File: `hooks/useFilterKeyboard.ts`

### Keyboard Shortcuts

| Key              | Action                              |
| ---------------- | ----------------------------------- |
| `Tab`            | Move to next filter element         |
| `Shift+Tab`      | Move to previous element            |
| `Enter`          | Confirm current input / Add filter  |
| `Escape`         | Cancel current edit / Close popover |
| `Ctrl+Enter`     | Apply filters                       |
| `Ctrl+Backspace` | Remove current filter               |
| `Ctrl+N`         | Add new filter                      |

### Checklist - Phase 5.2

- [x] Create `useFilterKeyboard.ts`
- [x] Implement Tab navigation
- [x] Implement Enter/Escape handling
- [x] Implement shortcut keys
- [x] Add focus management
- [x] Write unit tests

---

## 5.3 useFilterPersistence Hook (NEW)

### Purpose

Persist filter state to localStorage or URL.

### File: `hooks/useFilterPersistence.ts`

```typescript
interface UseFilterPersistenceOptions {
  key: string;
  storage?: "localStorage" | "sessionStorage" | "url";
  debounce?: number;
}
```

### Checklist - Phase 5.3

- [x] Create `useFilterPersistence.ts`
- [x] Implement localStorage persistence
- [x] Implement URL query string persistence
- [x] Implement debounced save
- [x] Handle storage quota errors
- [x] Write unit tests

---

# Phase 6: Presets & Saved Filters

## 6.1 PresetManager Component (REFACTOR)

### Purpose

Unified preset and saved filter management.

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 💾 Saved Filters                                            │
├─────────────────────────────────────────────────────────────┤
│ ⭐ My Filters                                                │
│   [★ Urgent Items        ] [Apply] [Edit] [Delete]         │
│   [★ This Quarter        ] [Apply] [Edit] [Delete]         │
│   [★ High Value Customers] [Apply] [Edit] [Delete]         │
├─────────────────────────────────────────────────────────────┤
│ 🌐 Shared Filters                                           │
│   [Open Invoices         ] [Apply]                          │
│   [VIP Customers         ] [Apply]                          │
├─────────────────────────────────────────────────────────────┤
│ [+ Save Current Filters...]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Checklist - Phase 6.1

- [x] Refactor `PresetSelector.tsx` to `PresetManager.tsx`
- [x] Add edit/delete for owned filters
- [x] Add shared filter section
- [x] Add usage count display
- [x] Add last used date
- [x] Write unit tests

---

## 6.2 SaveFilterDialog (REFACTOR)

### Enhancements

- Add filter preview
- Add share toggle with permission check
- Add duplicate detection

### Checklist - Phase 6.2

- [x] Add filter preview to dialog
- [x] Add duplicate name warning
- [x] Add sharing permissions check
- [x] Improve validation feedback
- [x] Write unit tests

---

# Phase 7: Integration & Migration

## 7.1 FilterPanel Migration

### Strategy

1. Create new components alongside existing
2. Add feature flag to switch between old/new
3. Gradually migrate usage
4. Deprecate old components

### Checklist - Phase 7.1

- [x] Create `FilterPanel` entry point
- [x] Add feature flag (`useNewFilterUI`)
- [x] Update `FilterPanel` to conditionally render
- [x] Migrate one table as pilot
- [x] Gather feedback
- [x] Migrate remaining tables
- [x] Remove old components

---

## 7.2 API Compatibility

### Ensure backward compatibility:

- Same `FilterFormState` structure
- Same `FilterQueryVariables` output
- Same preset JSON format
- Same serialization logic

### Checklist - Phase 7.2

- [x] Verify `FilterFormState` compatibility
- [x] Verify serializer output unchanged
- [x] Verify preset applicator unchanged
- [x] Add integration tests
- [x] Document breaking changes (if any)

---

## 7.3 Documentation & Examples

### Checklist - Phase 7.3

- [x] Update component Storybook stories
- [x] Add usage examples
- [x] Document keyboard shortcuts
- [x] Document accessibility features
- [x] Create migration guide

---

# Phase 8: Polish & Accessibility

## 8.1 Animations

### Checklist

- [x] Add filter row enter animation (fade + slide)
- [x] Add filter row exit animation
- [x] Add popover open/close animation
- [x] Add chip removal animation
- [x] Use `framer-motion` or CSS transitions

---

## 8.2 Accessibility

### Checklist

- [x] Add proper ARIA labels to all interactive elements
- [x] Ensure keyboard navigation works
- [x] Add screen reader announcements for filter changes
- [x] Test with screen readers (NVDA, VoiceOver)
- [x] Ensure color contrast meets WCAG AA
- [x] Add focus indicators

---

## 8.3 Performance

### Checklist

- [x] Memoize expensive computations
- [x] Virtualize long field lists
- [x] Debounce auto-apply
- [x] Lazy load relationship options
- [x] Add loading states
- [x] Profile and optimize re-renders

---

# Implementation Timeline

| Phase | Description      | Priority | Dependencies |
| ----- | ---------------- | -------- | ------------ |
| 1     | Backend Metadata | High     | None         |
| 2     | Core Components  | High     | Phase 1      |
| 3     | Filter Groups    | Medium   | Phase 2      |
| 4     | Layout Modes     | Medium   | Phase 2, 3   |
| 5     | State Hooks      | High     | Phase 2      |
| 6     | Presets          | Medium   | Phase 5      |
| 7     | Integration      | High     | Phase 1-6    |
| 8     | Polish           | Low      | Phase 7      |

---

# File Structure (Final)

```
src/lib/filters/
├── index.ts                        # Public exports
├── types.ts                        # Updated types
├── state.ts                        # State utilities
├── serializer.ts                   # GraphQL serialization
├── queryBuilder.ts                 # Query variable builder
├── presetApplicator.ts             # Preset parsing
├── metadataMerger.ts               # Schema merging (updated)
│
├── components/
│   ├── FilterPanel.tsx             # NEW: Main container
│   ├── FilterRow.tsx               # NEW: Inline filter row
│   ├── FilterGroupContainer.tsx    # REFACTOR: Group container
│   ├── FilterChip.tsx              # NEW: Compact chip
│   ├── ActiveFiltersBar.tsx        # NEW: Toolbar bar
│   ├── InlineFieldSelector.tsx     # NEW: Field dropdown
│   ├── CompactOperatorSelect.tsx   # NEW: Operator dropdown
│   ├── SmartValueInput.tsx         # REFACTOR: Value input
│   ├── DatePresetPicker.tsx        # NEW: Date presets
│   ├── PresetManager.tsx           # REFACTOR: Preset UI
│   ├── SaveFilterDialog.tsx        # REFACTOR: Save dialog
│   └── FilterErrorBoundary.tsx     # Existing
│
├── hooks/
│   ├── useFilterPanel.ts           # NEW: Main state hook
│   ├── useFilterKeyboard.ts        # NEW: Keyboard nav
│   ├── useFilterPersistence.ts     # NEW: Persistence
│   ├── useFilterMetadata.ts        # Existing
│   └── useNestedFilterForm.ts      # Existing (deprecated)
│
└── __tests__/
    ├── components/
    ├── hooks/
    └── integration/
```

---

# Summary Checklist

## Phase 1: Backend Metadata

- [x] Update `FilterUIHints` interface
- [x] Add Django `DEFAULT_OPERATORS` mapping
- [x] Add `PREFERRED_OPERATORS` mapping
- [x] Add `DatePresetType` GraphQL type
- [x] Update metadata extractor
- [x] Update `metadataMerger.ts`

## Phase 2: Core Components

- [x] Create `FilterRow.tsx`
- [x] Create `InlineFieldSelector.tsx`
- [x] Create `CompactOperatorSelect.tsx`
- [x] Create/refactor `SmartValueInput.tsx`
- [x] Create `DatePresetPicker.tsx`
- [x] Write unit tests for all new components

## Phase 3: Filter Groups

- [x] Refactor `FilterGroupComponent`
- [x] Add "Match ALL/ANY" labels
- [x] Add quick OR toggle
- [x] Add collapse/expand
- [x] Write unit tests

## Phase 4: Layout Modes

- [x] Create `FilterPanel.tsx`
- [x] Create `FilterChip.tsx`
- [x] Create `ActiveFiltersBar.tsx`
- [x] Implement all layout modes
- [x] Write unit tests

## Phase 5: State Hooks

- [x] Create `useFilterPanel.ts`
- [x] Create `useFilterKeyboard.ts`
- [x] Create `useFilterPersistence.ts`
- [x] Write unit tests

## Phase 6: Presets

- [x] Refactor `PresetSelector` to `PresetManager`
- [x] Enhance `SaveFilterDialog`
- [x] Write unit tests

## Phase 7: Integration

- [x] Create feature flag
- [x] Pilot migration
- [x] Full migration
- [x] Remove deprecated code
- [x] Write integration tests

## Phase 8: Polish

- [x] Add animations
- [x] Accessibility audit
- [x] Performance optimization
- [x] Documentation

---

# Appendix: Operator Labels (i18n Ready)

```typescript
export const OPERATOR_LABELS: Record<
  string,
  { symbol: string; label: string; labelFr: string }
> = {
  eq: { symbol: "=", label: "Equals", labelFr: "Égal à" },
  neq: { symbol: "≠", label: "Not equals", labelFr: "Différent de" },
  gt: { symbol: ">", label: "Greater than", labelFr: "Supérieur à" },
  gte: { symbol: "≥", label: "Greater or equal", labelFr: "Supérieur ou égal" },
  lt: { symbol: "<", label: "Less than", labelFr: "Inférieur à" },
  lte: { symbol: "≤", label: "Less or equal", labelFr: "Inférieur ou égal" },
  contains: { symbol: "⊃", label: "Contains", labelFr: "Contient" },
  icontains: { symbol: "⊃", label: "Contains", labelFr: "Contient" },
  startsWith: { symbol: "⊂", label: "Starts with", labelFr: "Commence par" },
  endsWith: { symbol: "⊃", label: "Ends with", labelFr: "Se termine par" },
  in: { symbol: "∈", label: "Is one of", labelFr: "Est parmi" },
  notIn: { symbol: "∉", label: "Is not one of", labelFr: "N'est pas parmi" },
  between: { symbol: "↔", label: "Between", labelFr: "Entre" },
  isNull: { symbol: "∅", label: "Is empty", labelFr: "Est vide" },
  regex: {
    symbol: ".*",
    label: "Matches pattern",
    labelFr: "Correspond au motif",
  },
};
```

---

# Appendix: Date Preset Calculation

```typescript
export function calculateDatePreset(key: string): [string, string?] {
  const now = new Date();
  const today = startOfDay(now);

  switch (key) {
    case "today":
      return [format(today, "yyyy-MM-dd")];
    case "yesterday":
      return [format(subDays(today, 1), "yyyy-MM-dd")];
    case "thisWeek":
      return [
        format(startOfWeek(today), "yyyy-MM-dd"),
        format(endOfWeek(today), "yyyy-MM-dd"),
      ];
    case "lastWeek":
      const lastWeek = subWeeks(today, 1);
      return [
        format(startOfWeek(lastWeek), "yyyy-MM-dd"),
        format(endOfWeek(lastWeek), "yyyy-MM-dd"),
      ];
    case "thisMonth":
      return [
        format(startOfMonth(today), "yyyy-MM-dd"),
        format(endOfMonth(today), "yyyy-MM-dd"),
      ];
    case "lastMonth":
      const lastMonth = subMonths(today, 1);
      return [
        format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      ];
    case "thisQuarter":
      return [
        format(startOfQuarter(today), "yyyy-MM-dd"),
        format(endOfQuarter(today), "yyyy-MM-dd"),
      ];
    case "thisYear":
      return [
        format(startOfYear(today), "yyyy-MM-dd"),
        format(endOfYear(today), "yyyy-MM-dd"),
      ];
    case "last30Days":
      return [
        format(subDays(today, 30), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    case "last90Days":
      return [
        format(subDays(today, 90), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    default:
      return [format(today, "yyyy-MM-dd")];
  }
}
```
