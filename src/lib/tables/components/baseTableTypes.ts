import type {
  ColumnDef,
  Row as RTRow,
  RowSelectionState,
  SortingState,
  Table as RTTable,
} from "@tanstack/react-table";
import type React from "react";
import type { ComplexFilterInput, FilterFieldType } from "../types";

/**
 * Configuration for row-level actions column.
 * @template TData Table row data type.
 * @property on_edit - Callback fired when the edit button is clicked.
 * @property on_delete - Callback fired when the delete button is clicked.
 * @property menu_items - Optional dropdown entries rendered next to edit/delete.
 * @property render_cell - Custom renderer to fully override the action cell.
 * @property header_title - Optional column header label.
 * @property position - Column placement ("start" or "end").
 */
export type RowActionsConfig<TData> = {
  on_edit?: (row: TData) => void;
  on_delete?: (row: TData) => void;
  menu_items?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
    on_click: (row: TData) => void;
  }>;
  render_cell?: (row: TData) => React.ReactNode;
  header_title?: string;
  position?: "start" | "end";
};

/**
 * Selection configuration used by BaseTable.
 * @property on_selection_change - Notifies parent when selection changes.
 * @property enabled - Toggle to render the selection column.
 * @property position - Column placement ("start" or "end").
 * @property header_title - Optional header label when not using a checkbox.
 */
export type SelectionConfig<TData> = {
  on_selection_change?: (
    selected_rows: TData[],
    selection_state: RowSelectionState
  ) => void;
  enabled?: boolean;
  position?: "start" | "end";
  header_title?: string;
};

/**
 * Expandable row configuration.
 * @template TData Table row data type.
 * @property render - Renderer called when a row is expanded.
 * @property position - Placement of the expander column.
 */
export type ExpandableConfig<TData> = {
  render: (row: TData) => React.ReactNode;
  position?: "start" | "end";
};

/**
 * Grouping configuration used by BaseTable to render grouped sections.
 * @template TData Table row data type.
 * @property groups - Row groups with labels and TanStack rows.
 * @property collapsible - Whether groups can be collapsed.
 * @property onToggle - Callback when a group header is toggled.
 */
export type GroupingConfig<TData> = {
  groups: Array<{
    key: string;
    label: React.ReactNode;
    rows: RTRow<TData>[];
    collapsed?: boolean;
  }>;
  collapsible?: boolean;
  onToggle?: (key: string) => void;
};

/**
 * Toolbar action rendered in the BaseTable title bar.
 * @template TData Table row data type.
 * @property key - Stable key for rendering.
 * @property label - Button label.
 * @property icon - Optional icon node.
 * @property variant - Button variant.
 * @property size - Button size.
 * @property order - Sorting order among actions.
 * @property show_when - Visibility condition based on selection state.
 * @property dataAttributes - Extra data-* attributes to forward.
 * @property on_click - Handler receiving current selection context.
 */
export type TopAction<TData> = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  order?: number;
  show_when?: "always" | "has_selection";
  dataAttributes?: Record<string, string | number | boolean | undefined>;
  on_click: (ctx: {
    selected_rows: TData[];
    selection_state: Record<string, boolean>;
  }) => void;
};

/**
 * Optional external pagination API forwarded from hooks.
 * @property first_page - Jump to the first page.
 * @property last_page - Jump to the last page.
 * @property previous_page - Navigate to the previous page.
 * @property next_page - Navigate to the next page.
 * @property set_page_size - Update the page size.
 * @property page_index - Zero-based page index.
 * @property page_count - Total page count.
 * @property page_size - Current page size.
 * @property page_size_options - Allowed page size choices.
 */
export type PaginationApi = {
  first_page?: () => void;
  last_page?: () => void;
  previous_page?: () => void;
  next_page?: () => void;
  set_page_size?: (size: number) => void;
  page_index?: number;
  page_count?: number;
  page_size?: number;
  page_size_options?: number[];
};

/**
 * Shared BaseTable options.
 * @property minimal - Render without chrome (toolbar/title).
 * @property compact - Use condensed padding.
 * @property enable_multi_sort - Enable multi-column sorting with modifiers.
 * @property multi_sort_on_plain_click - Allow multi-sort without modifiers.
 * @property show_sort_index - Render sort order indicators.
 * @property sort_hint_text - Tooltip shown on sortable headers.
 * @property pagination - Toggle pagination footer.
 * @property enable_column_drag - Toggle drag-and-drop column ordering.
 */
export type BaseTableOptions = {
  minimal?: boolean;
  compact?: boolean;
  enable_multi_sort?: boolean;
  multi_sort_on_plain_click?: boolean;
  show_sort_index?: boolean;
  sort_hint_text?: string;
  pagination?: boolean;
  enable_column_drag?: boolean;
};

/**
 * Column filters configuration.
 * @property mode - UI variant ("devextreme" or "ag-grid").
 * @property debounce_ms - Debounce delay for filter inputs.
 */
export type ColumnFiltersConfig = {
  mode?: "devextreme" | "ag-grid";
  debounce_ms?: number;
};

/**
 * Props shared by BaseTable UI components so they can stay type-safe.
 */
export type BaseTableUiProps<TData> = {
  table: RTTable<TData>;
  column_overrides?: Record<string, Partial<ColumnDef<TData>>>;
  row_actions?: RowActionsConfig<TData>;
  selection?: SelectionConfig<TData>;
  expandable?: ExpandableConfig<TData>;
  grouping?: GroupingConfig<TData>;
  options?: BaseTableOptions;
  top_actions?: Array<TopAction<TData>>;
  pagination_api?: PaginationApi;
  available_filters?: FilterFieldType[];
  on_advanced_filters_apply?: (filters: ComplexFilterInput<string>) => void;
};
