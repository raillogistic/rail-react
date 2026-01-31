# ModelTableV2

A metadata-driven, headless-capable data table for Rail React, built on top of Shadcn UI and Apollo Client.

## Features

- **Metadata Driven**: Automatically configures columns, labels, and types based on `ModelMetadataV2`.
- **GraphQL Integrated**: Auto-generates GraphQL queries (`useTableData`).
- **Advanced Filtering**: Supports complex nested filters via `FilterPanel`.
- **Responsive**: Switches to card view on mobile devices (`TableMobileCard`).
- **Persisted State**: Saves column order, visibility, and sorting to `localStorage`.
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

## Architecture

The table is composed of several contexts and components:

- **MetadataContext**: Fetches and provides the model schema.
- **TableContext**: Manages state (pagination, sorting, filters, data).
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
