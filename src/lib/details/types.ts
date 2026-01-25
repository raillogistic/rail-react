import type React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { FilterFieldType } from "../tables/types";
import type {
  ModelTableCreationFormProps,
  ModelTableProps,
} from "../tables/ModelTable";
import type { ModelFormProps } from "../form/backend/ModelForm";

export type DetailFieldConfig = {
  name: string;
  label?: string;
  description?: string;
  render?: (value: unknown, data: Record<string, unknown>) => React.ReactNode;
  colSpan?: number;
  type?: "text" | "table";
  table?: {
    columns: ColumnDef<unknown>[];
    rows?: unknown[];
    dataPath?: string;
    title?: string;
    available_filters?: FilterFieldType[];
    enable_quick_search?: boolean;
    enable_sorting?: boolean;
    selection?: {
      on_selection_change?: (
        selected_rows: unknown[],
        selection_state: Record<string, boolean>
      ) => void;
      enabled?: boolean;
      position?: "start" | "end";
      header_title?: string;
    };
    row_actions?: {
      on_edit?: (row: unknown) => void;
      on_delete?: (row: unknown) => void;
      menu_items?: Array<{
        key: string;
        label: string;
        icon?: React.ReactNode;
        variant?: "default" | "destructive";
        on_click: (row: unknown) => void;
      }>;
      render_cell?: (row: unknown) => React.ReactNode;
      header_title?: string;
      position?: "start" | "end";
    };
    top_actions?: Array<{
      key: string;
      label: string;
      icon?: React.ReactNode;
      variant?: "default" | "outline" | "destructive";
      size?: "sm" | "md" | "lg" | "icon";
      order?: number;
      show_when?: "always" | "has_selection";
      on_click: (ctx: {
        selected_rows: unknown[];
        selection_state: Record<string, boolean>;
      }) => void;
    }>;
    initial_page_size?: number;
    page_size_options?: number[];
  };
};

export type DetailSectionConfig = {
  id?: string;
  title?: string;
  description?: string;
  columns?: number;
  fields: DetailFieldConfig[];
};

export type DetailPanelConfig = {
  id?: string;
  title?: string;
  sections: DetailSectionConfig[];
  actions?: Array<{
    key: string;
    label: string;
    on_click: (ctx: { data: Record<string, unknown> }) => void;
  }>;
};

export type DetailTabSectionList = {
  type: "list";
  panels: DetailPanelConfig[];
};

export type DetailTabSectionTable = {
  type: "table";
  title?: string;
  description?: string;
  columns: ColumnDef<unknown>[];
};

export type DetailTabConfig = {
  key: string;
  label: string;
  sections: Array<DetailTabSectionList | DetailTabSectionTable>;
};

export type BaseDetailProps<TData = Record<string, unknown>> = {
  data: TData;
  tabs: DetailTabConfig[];
  className?: string;
  initialTab?: string;
};

export type NestedDetailConfig = {
  title?: string;
  modalTitle?: string;
  mode?: "drawer" | "modal";
  drawerDirection?: "left" | "right" | "top" | "bottom";
  width?: string;
  height?: string;
  fields?: string[];
  allowUpdate?: boolean;
  updateForm?: ModelTableCreationFormProps<Record<string, unknown>>;
};

export type NestedDetailReference = string | Record<string, NestedDetailConfig>;

/**
 * Runtime configuration applied to the default update form rendered within {@link ModelDetail}.
 */
export type ModelDetailUpdateFormConfig = {
  /** Completely disable the update trigger when set to {@code false}. */
  enabled?: boolean;
  /** Switch between a modal dialog or a drawer layout. */
  mode?: "modal" | "drawer";
  /** Custom label displayed on the update trigger button. */
  triggerLabel?: string;
  /** Optional icon rendered before the trigger label. */
  triggerIcon?: React.ReactNode;
  /** Header/title shown inside the modal or drawer. */
  title?: string;
  /** Optional helper text displayed below the main title. */
  description?: string;
  /** Explicit width applied to the dialog/drawer container. */
  width?: string;
  /** Explicit height applied to the dialog/drawer container. */
  height?: string;
  /** Drawer opening direction when {@link mode} equals {@code drawer}. */
  drawerDirection?: "left" | "right" | "top" | "bottom";
  /**
   * Automatically exclude relationships already displayed elsewhere in the detail view.
   * Enabled by default.
   */
  autoExcludeDisplayedRelationships?: boolean;
  /** Convenience helper mapped to {@link ModelFormProps.only} for field names. */
  includeFields?: string[];
  /** Convenience helper merged with {@link ModelFormProps.exclude} for field names. */
  excludeFields?: string[];
  /** Convenience helper mapped to {@link ModelFormProps.onlyRelationships}. */
  includeRelationships?: string[];
  /** Convenience helper merged with {@link ModelFormProps.excludeRelationships}. */
  excludeRelationships?: string[];
  /** Direct access to the underlying {@link ModelForm} props for full control. */
  formProps?: Partial<ModelFormProps<Record<string, unknown>>>;
};

export type ModelDetailProps = {
  appName: string;
  modelName: string;
  id: string | number;
  className?: string;
  includeSections?: string[];
  excludeSections?: string[];
  onEdit?: (data: Record<string, unknown>) => void;
  onUpdate?: (data: Record<string, unknown>) => void;
  relatedTableConfigs?: Record<string, RelatedTableConfig>;
  nested?: NestedDetailReference[];
  /** Overrides applied to the default update form renderer. */
  updateForm?: ModelDetailUpdateFormConfig;
};

export type RelatedTableActionConfig = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  onClick: (ctx: {
    relation: string;
    row?: Record<string, unknown>;
    reload: () => void;
  }) => void;
};

export type RelatedTableSimpleRowActions = {
  enableEdit?: boolean;
  enableDelete?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  onEdit?: (ctx: {
    relation: string;
    row: Record<string, unknown>;
    reload: () => void;
  }) => void;
  onDelete?: (ctx: {
    relation: string;
    row: Record<string, unknown>;
    reload: () => void;
  }) => void;
  custom?: RelatedTableActionConfig[];
};

export type RelatedTableSimpleConfig = {
  fields?: string[];
  maxColumns?: number;
  enableQuickSearch?: boolean;
  sortable?: boolean;
  pageSize?: number;
  headerActions?: RelatedTableActionConfig[];
  rowActions?: RelatedTableSimpleRowActions;
};

export type RelatedTableConfig = {
  mode?: "simple" | "model-table";
  simple?: RelatedTableSimpleConfig;
  modelTableProps?: Partial<ModelTableProps<Record<string, unknown>>>;
};
