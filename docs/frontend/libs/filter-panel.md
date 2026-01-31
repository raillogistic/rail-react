# Filter Panel V2

## Overview
Filter Panel V2 provides the new inline, popover, panel, and toolbar filter experiences built on the unified filter schema. It is designed to keep the same query output while improving usability and speed.

## Usage

### Basic (panel)
```tsx
import { FilterPanel } from "@/lib/form/filters";

<FilterPanel
  app="sales"
  model="Invoice"
  onApply={(variables) => console.log(variables)}
  layout="panel"
/>
```

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
