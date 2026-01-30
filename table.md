# Rail React Tables Feature Documentation

This document outlines the comprehensive feature set of the `@rail-react/tables` library, a powerful system for building data-driven tables with automatic metadata integration.

## 1. Core Architecture

### **ModelTable (High-Level Component)**
- **Automatic Metadata Integration**: Fetches `ModelMetadataV2` to automatically configure columns, filters, and permissions.
- **GraphQL Integration**:
  - Auto-generates GraphQL queries based on visible columns and metadata.
  - Handles pagination, sorting, and filtering servers-side.
  - Supports custom selection sets and additional fields.
- **Context-Based State**: Uses `ModelTableContext` to share state (data, loading, filters, selection) across sub-components.
- **Compound Component Pattern**: Exports `ModelTableCompound` (as `ModelTable`) with sub-components:
  - `ModelTable.Toolbar`
  - `ModelTable.Content`
  - `ModelTable.Filters`
  - `ModelTable.Pagination`
  - `ModelTable.Tabs` (Data/History)
  - `ModelTable.Header`

### **CompositionTable (Low-Level Blocks)**
- **Flexible Layouts**: Provides atomic blocks (`TableRoot`, `TableHeaderSection`, `TableContent`) to build custom table layouts.
- **TanStack Table Wrapper**: Built on top of `@tanstack/react-table` v8.
- **Drag & Drop**: Integrates `@dnd-kit` for column reordering.

## 2. Table Features

### **Columns**
- **Auto-Generation**: Columns created from metadata fields (Text, Number, Date, Boolean, Relation).
- **Formatters**:
  - **Dates**: Auto-formats `DateField` (DD-MM-YYYY) and `DateTimeField` (DD-MM-YYYY HH:mm).
  - **Numbers**: Locale-aware formatting for Integer, Decimal, and Float fields.
  - **Booleans**: Visual indicators (✅/❌).
  - **Relations**: Displays related object descriptions or descriptors.
- **Visibility Control**:
  - Dropdown menu to toggle column visibility.
  - **Persistence**: Saves visibility state to `localStorage`.
- **Reordering**: Drag-and-drop column headers to reorder (persisted to `localStorage`).
- **Resizing**: Supported via TanStack table core.

### **Sorting & Grouping**
- **Multi-Sort**: Support for sorting by multiple columns (Shift+Click).
- **Ordering Persistence**: URL-based or state-based ordering.
- **Grouping (`useModelGrouping`)**:
  - **Bucketing**: Server-side aggregation queries (`group_by`).
  - **UI**: Collapsible group rows with counts.
  - **Multi-Level**: Supports nested or multiple open groups.
  - **Sorting**: Sort groups by key or count (asc/desc).

### **Pagination**
- **Server-Side**: Fully integrated with GraphQL pagination (`page`, `perPage`).
- **Controls**: Page size selector (10, 20, 50, 100), First/Prev/Next/Last navigation.
- **Summary**: Displays "Page X of Y" and total row count.

### **Selection**
- **Row Selection**: Checkboxes for single or multi-row selection.
- **Batch Actions**: Toolbar actions triggered when rows are selected.

## 3. Filtering System

### **Quick Search**
- **Global Search**: Text input for "quick search" across configured backend fields.
- **Debounced**: Automatic debouncing (250ms) to reduce network requests.

### **Column Filters**
- **Modes**:
  - **Ag-Grid Style**: Header menu triggers.
  - **DevExtreme Style**: Inline filter row below headers.
- **Types**: Text, Number, Date, Boolean, Choice.

### **Advanced Filtering (`DynamicFilterForm`)**
- **Complex Logic**: Supports nested `AND` / `OR` / `NOT` groups.
- **Deep Relations**: Filter by fields on related models (e.g., `author.company.name`).
- **Presets**:
  - **Static Presets**: Defined in backend metadata.
  - **Saved Filters**: User-defined saved filter sets (if configured).
- **Distinct Field Support**: Filter by distinct values.

## 4. CRUD & Data Operations

### **Creation**
- **Forms**: Integrated `ModelForm` for creating new records.
- **Modes**:
  - **Modal**: Popup dialog.
  - **Drawer**: Side panel (Right/Left).
  - **Page**: Navigation to a dedicated create page.
- **Metadata**: Uses `mutation` metadata to auto-generate form fields.

### **Update/Edit**
- **Row Actions**: "Edit" button on rows.
- **Modes**: Modal or Drawer editing.
- **Auto-Population**: Pre-fills form with row data.
- **Permissions**: Checks `can_update` before allowing access.

### **Deletion**
- **Confirmation**: `DeleteConfirmationDialog` with safety checks.
- **Feedback**: Success/Error toasts (handles database constraints).
- **Permissions**: Checks `can_delete`.

### **Custom Actions**
- **GraphQL Mutations**: Execute arbitrary mutations defined in metadata.
- **Action Dialogs**:
  - **Confirm**: Simple confirmation prompt.
  - **Form**: Dynamic form for mutation input arguments.
- **Row Menus**: "More" (three dots) menu for extra actions.

## 5. Exporting & Reporting

### **Export Drawer (`ModelTableExportDrawer`)**
- **Formats**: Excel (`.xlsx`) and CSV (`.csv`).
- **Field Selection**: Pick specific columns to export.
- **Filters**: Respects current table filters and sorting in the export.
- **Security**: Uses secure headers for export requests.

### **Printing / PDF**
- **Templates**: Backend-defined PDF templates (`ModelPdfTemplateMetadata`).
- **Client Data**: Collects extra data before printing (e.g., "Printed By", "Notes") via `PrintDialog`.
- **Dynamic Schema**: Auto-generates input forms based on template requirements.

### **Business Intelligence (BI)**
- **ModelBiPanel**: Integration for reporting and visualization tabs (Datasets/Visualizations).

## 6. History & Auditing

### **History Panel (`ModelHistoryPanel`)**
- **Audit Log**: dedicated tab showing history of changes.
- **Metadata**: Displays who changed what and when.
- **Permissions**: guarded by `can_history` permission.

## 7. Security & Permissions

### **RBAC Integration**
- **Field Level**: Hides/masks columns based on field visibility permissions.
- **Action Level**: Disables Create/Edit/Delete buttons if user lacks permissions (`canCreate`, `canUpdate`, `canDelete`).
- **Strategies**: Supports custom `permissionStrategy` overrides.

## 8. Developer Experience (DX)

### **Hooks**
- `useGraphQLModelTable`: The brain handling data fetching and state.
- `useModelGrouping`: Manages grouping state and queries.
- `useColumnFilters`: Manages simple column filter state.
- `useUIConfig`: Persists UI preferences (column order/visibility) to backend or local storage.

### **Customization**
- **Column Overrides**: Inject custom renderers for specific columns.
- **Slot Props**: Customize Creation/Update forms, Delete config, etc.
- **Expandable Rows**: Render custom content in expanded row sections.
