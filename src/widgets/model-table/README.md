# ModelTableV2

A metadata-driven, headless-capable data table for Rail React, built on top of Shadcn UI and Apollo Client.

## Features

- **Metadata Driven**: Automatically configures columns, labels, and types based on `ModelMetadataV2`.
- **GraphQL Integrated**: Auto-generates GraphQL queries (`useTableData`).
- **Advanced Filtering**: Supports complex nested filters via `FilterPanel`.
- **Responsive**: Switches to card view on mobile devices (`TableMobileCard`).
- **Persisted State**: Saves column order, visibility, and page size to `localStorage`.
- **High-Volume Ready**: Optional virtualized row rendering for large pages, density controls, and wrapped-cell mode.
- **Enhanced UX**: Refresh action, view options, page jump input, and richer status chips.
- **Compound Components**: Fully composable architecture.

## Usage

### Basic

```tsx
import { ModelTableV2 } from "@rail-react/table";

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
    include: ["number", "customer.name", "total", "status"],
    add: [{ accessor: "createdAt", title: "Creation", order: { after: "status" } }],
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
- `include` defines visible columns.
- `add` appends/inserts extra columns into `include` (or defaults when `include` is omitted).
- `exclude` removes fields/relations by accessor or root key.
- `render` overrides cell rendering by column accessor/root.

Control reverse/M2M hover stats behavior with `relationStats`:

```tsx
<BaseModelTable
  app="store"
  model="Product"
  relationStats={{
    enabled: true,
    exclude: ["tags"],
    overrides: {
      orderItems: (data) => (
        <>
          <div className="font-semibold">Custom Stats</div>
          <div>Total: {String(data.stats?.totalCount ?? 0)}</div>
        </>
      ),
    },
  }}
/>
```

### View + Performance Options

```tsx
<BaseModelTable
  app="sales"
  model="Invoice"
  view={{
    defaultDensity: "comfortable",
    defaultWrapCells: false,
    maxBodyHeightClassName: "max-h-[72vh]",
  }}
  performance={{
    enableVirtualization: true,
    virtualizeThreshold: 80,
    overscan: 8,
    dataMode: "pagination", // default
  }}
/>
```

Notes:
- `view` controls row density, wrap behavior, and scroll viewport size.
- `performance` controls table body virtualization for large datasets.
- `performance.dataMode` can be `"pagination"` (default) or `"infinite"`.
- In `"infinite"` mode, scrolling near the bottom loads the next page and rows are appended.
- Grouped rows and wrapped-cell mode automatically disable virtualization for correct layout.

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
- Shadcn UI components installed in `@/widgets/components/ui`.
- `lucide-react` for icons.
