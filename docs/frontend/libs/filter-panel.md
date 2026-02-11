# Filter Panel V2

## Overview
Filter Panel V2 provides the new inline, popover, panel, and toolbar filter experiences built on the unified filter schema. It is designed to keep the same query output while improving usability and speed.

## Usage

### Basic (panel)
```tsx
import { FilterPanel } from "@/lib/filters";

<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  layout="panel"
/>
```

### Default Filters (preselected)
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  defaultFilters={[
    "status",
    { name: "customer.name" },
    { name: "total", operator: "gte", value: 1000 },
  ]}
/>
```

**Default filter spec**:
- `string`: field path (e.g. `"status"` or `"customer.name"`)
- `{ name, path?, operator?, value? }`
  - `name`: field path
  - `path`: explicit path array (optional)
  - `operator`: overrides default operator (e.g. `"gte"`, `"contains"`)
  - `value`: optional initial value

### Control Field Picker (only / exclude / order)
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  fieldSelector={{
    only: ["status", "customer.name", "total"],
    exclude: ["internalNotes"],
    requireChoices: false,
    includeRelations: true,
    includeAdvanced: false,
    order: "alpha",
  }}
/>
```

**Field selector options**:
- `only`: allowlist of fields (string paths)
- `exclude`: denylist of fields (string paths)
- `requireChoices`: only show fields with predefined options
- `includeRelations`: show relation filters in picker
- `includeAdvanced`: show advanced/computed filters
- `order`: `"alpha"` or `"model"`

### Popover
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  layout="popover"
/>
```

### Toolbar (chips)
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  layout="toolbar"
/>
```

## Keyboard Shortcuts
- `Ctrl+Enter` / `Cmd+Enter`: Apply filters
- `Ctrl+N`: Add filter
- `Escape`: Clear filters

## Accessibility
- All interactive elements include `aria-label` or text equivalents.
- Popovers, dropdowns, and toggles use keyboard-accessible Radix primitives.
- Focus rings are preserved via the shared UI component styles.

## Migration Guide

### 1) Keep FilterPanel, enable the new UI
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  useNewFilterUI
/>
```

### 2) Move directly to FilterPanel
```tsx
<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  persistKey="invoice_filters"
/>
```

## Notes
- The serialized GraphQL `where` output remains unchanged.
- Saved filters and presets continue to use the same JSON format.
- `defaultFilters` apply once when there is no `initialState`/persisted state.

## Metadata Cache (cache-first)
Filter metadata is cached and persisted in `localStorage` per user. On app start you can warm the metadata cache, then the FilterPanel reads from cache-first storage and refreshes in the background.

```tsx
import { MetadataWarmupIndicator } from "@/lib/metadata/MetadataWarmupIndicator";
import { useMetadataWarmup } from "@/lib/metadata/useMetadataWarmup";

const { warming } = useMetadataWarmup({
  enabled: !!user?.token,
  userKey: user?.id ?? null,
});

return <MetadataWarmupIndicator active={warming} />;
```
