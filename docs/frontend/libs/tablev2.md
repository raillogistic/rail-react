# ModelTableV2

A metadata-driven, headless-capable data table for Rail React, built on top of Shadcn UI and Apollo Client.

## Features

- **Metadata Driven**: Automatically configures columns, labels, and types based on `ModelMetadataV2`.
- **GraphQL Integrated**: Auto-generates GraphQL queries (`useTableData`).
  For standalone query generation without table UI, see
  [GraphQL model query hooks](./graphql-model-query-hooks.md).
- **Advanced Filtering**: Supports complex nested filters via `FilterPanel`.
- **Filter Panel V2**: New inline/panel/toolbar modes via `useNewFilterUI` or `FilterPanel`.
- **Responsive**: Switches to card view on mobile devices (`TableMobileCard`).
- **Persisted State**: Saves column order, visibility, and page size to `localStorage`.
- **Compound Components**: Fully composable architecture.

## Usage

### Basic

```tsx
import { ModelTableV2 } from "@/lib/table";

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

### With Filter Panel Controls (drawer/modal + FilterPanel props)
```tsx
<ModelTableV2
  app="sales"
  model="Invoice"
  filterPanel={{
    mode: "drawer",
    defaultOpen: true,
    title: "Advanced Filters",
    widthClassName: "w-[50%]",
    side: "right",
    defaultFilters: ["status", { name: "customer.name" }],
    fieldSelector: { exclude: ["internalNotes"], includeAdvanced: false },
    showDistinct: true,
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

Row selection is disabled by default. Enable it explicitly when needed:

```tsx
<BaseModelTable app="sales" model="Invoice" enableSelection />
```

`fields` supports helper object syntax:

```tsx
<BaseModelTable
  app="sales"
  model="Invoice"
  fields={{
    include: ["number", "customer.name", "total", "status"],
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
- `include` sets visible accessors.
- `exclude` removes fields/relations by accessor or root key.
- `render` overrides column cell rendering by accessor/root key.

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

**Notes**:
- `filterPanel` merges FilterPanel props (e.g. `defaultFilters`, `fieldSelector`) with UI controls (`mode`, `side`, `widthClassName`, `defaultOpen`, `title`).
- Drawer default width: full width on small screens, `50%` on `sm+` unless overridden.

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

## Metadata Warmup (cache-first)
ModelTableV2 uses metadata caching under the hood. You can warm metadata at app startup to make filters/snappy loads instant.

```tsx
import { MetadataWarmupIndicator } from "@/lib/metadata/MetadataWarmupIndicator";
import { useMetadataWarmup } from "@/lib/metadata/useMetadataWarmup";

const { warming } = useMetadataWarmup({
  enabled: !!user?.token,
  userKey: user?.id ?? null,
});

return <MetadataWarmupIndicator active={warming} />;
```

## Requirements

- Apollo Client provider wrapping the app.
- Shadcn UI components installed in `@/lib/components/ui`.
- `lucide-react` for icons.

## Migration

If you are migrating from the previous `ModelTable` implementation, please refer to the [Migration Guide](./tablev2-migration.md).
