# ModelTableV2

A metadata-driven, headless-capable data table for Rail React, built on top of Shadcn UI and Apollo Client.

## Features

- **Metadata Driven**: Automatically configures columns, labels, and types based on `ModelMetadataV2`.
- **GraphQL Integrated**: Auto-generates GraphQL queries (`useTableData`).
- **Advanced Filtering**: Supports complex nested filters via `FilterPanel`.
- **Responsive**: Switches to card view on mobile devices (`TableMobileCard`).
- **Persisted State**: Saves column order, visibility, and page size to `localStorage`.
- **Compound Components**: Fully composable architecture.

## Usage

### Basic

```tsx
import { ModelTableV2 } from "@rail-react/tablev2";

export function UserTable() {
  return (
    <ModelTableV2
      app="auth"
      model="User"
      className="p-6"
    />
  );
}
```

### With Persistence Key Override

If you have multiple tables for the same model, provide a unique key to isolate persistence settings.

```tsx
<ModelTableV2
  app="auth"
  model="User"
  persistenceKey="user-table-dashboard"
/>
```

### Column Ordering (custom + persisted)

Use `columnOrdering` to control how columns are ordered and whether drag-and-drop
reordering is enabled. Ordering uses column ids (field names or accessors).

```tsx
<BaseModelTable
  app="sales"
  model="Invoice"
  fields={["id", "number", "customer", "total", "created_at"]}
  relations={{ customer: { fields: ["name"], display: "name" } }}
  columnOrdering={{
    order: ["number", "customer", "total", "created_at"],
    append: "end",
    mode: "persisted",
    draggable: true,
    locked: ["number"],
  }}
/>
```

Notes:
- `order` can be partial; missing columns are appended (or prepended with `append: "start"`).
- `mode: "persisted"` uses saved column order when available; `config` always uses `order`.
- `locked` columns cannot be dragged.

Row sorting via header clicks is enabled in `BaseModelTable` and updates the GraphQL `orderBy` variable (multi-sort by default). Set `disableSorting` to turn it off.

```tsx
<BaseModelTable app="sales" model="Invoice" disableSorting />
```

### Selection + Field Helpers

Row selection is now disabled by default. Enable it only when needed:

```tsx
<BaseModelTable app="sales" model="Invoice" enableSelection />
```

`fields` accepts either an array (legacy) or an object with helpers:

```tsx
<BaseModelTable
  app="sales"
  model="Invoice"
  fields={{
    display: ["number", "customer.name", "total", "status"],
    exclude: ["internalNotes", "customer.secretCode"],
    render: {
      status: (value, row, data, refetch) => (
        <StatusCell value={value} row={row} onRefresh={refetch} count={data.length} />
      ),
    },
  }}
/>
```

Notes:
- `display` defines visible columns.
- `exclude` removes fields/relations by accessor or root key.
- `render` overrides cell rendering by column accessor/root.

## Architecture

The table is composed of several contexts and components:

- **MetadataContext**: Fetches and provides the model schema.
- **TableContext**: Manages state (pagination, column order, filters, data).
- **TableFrame**: The visual shell (shadcn table).
- **TableToolbar**: Search and filter controls.

### Directory Structure

- `context/`: State management.
- `hooks/`: Logic for data, metadata, filters, and persistence.
- `components/`: UI components (Toolbar, Header, Row, Pagination, MobileCard).
- `types.ts`: TypeScript definitions.

## Requirements

- Apollo Client provider wrapping the app.
- Shadcn UI components installed in `@/lib/components/ui`.
- `lucide-react` for icons.
