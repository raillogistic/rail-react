import type React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { FilterFieldType } from "../table/compat/types";
import type { ModelFormProps } from "../form";
import type {
  UnitFieldDensity,
  UnitFieldInput,
  UnitFieldMode,
} from "./units/unitFieldTypes";

export type DetailFieldConfig = {
  name: string;
  label?: string;
  description?: string;
  render?: (value: unknown, data: Record<string, unknown>) => React.ReactNode;
  colSpan?: number;
  type?: "text" | "table" | "unit";
  unitField?: UnitFieldInput;
  unitMode?: UnitFieldMode;
  unitDensity?: UnitFieldDensity;
  unitDefaultLocale?: string;
  unitDefaultTimezone?: string;
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
  id?: string;
  type: "list";
  title?: string;
  description?: string;
  order?: number;
  span?: number;
  containerClassName?: string;
  contentClassName?: string;
  panels: DetailPanelConfig[];
};

export type DetailTabSectionTable = {
  id?: string;
  type: "table";
  title?: string;
  description?: string;
  order?: number;
  span?: number;
  containerClassName?: string;
  contentClassName?: string;
  columns: ColumnDef<unknown>[];
  rows?: unknown[];
  dataPath?: string;
  actions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
    on_click?: (ctx: { data: Record<string, unknown>; rows: unknown[] }) => void;
  }>;
  enable_quick_search?: boolean;
  enable_sorting?: boolean;
  initial_page_size?: number;
};

export type DetailTabSectionUnits = {
  id?: string;
  type: "units";
  title?: string;
  description?: string;
  order?: number;
  span?: number;
  containerClassName?: string;
  contentClassName?: string;
  fields: UnitFieldInput[];
  columns?: number;
  mode?: UnitFieldMode;
  density?: UnitFieldDensity;
  defaultLocale?: string;
  defaultTimezone?: string;
};

export type DetailTabSectionCustom = {
  id?: string;
  type: Exclude<string, "list" | "table" | "units">;
  title?: string;
  description?: string;
  order?: number;
  span?: number;
  containerClassName?: string;
  contentClassName?: string;
  [key: string]: unknown;
};

export type DetailTabSectionConfig =
  | DetailTabSectionList
  | DetailTabSectionTable
  | DetailTabSectionUnits
  | DetailTabSectionCustom;

export type DetailTabConfig = {
  key: string;
  label: string;
  sections: DetailTabSectionConfig[];
  sectionsContainerClassName?: string;
};

export type BaseDetailTabListRenderContext = {
  tabs: DetailTabConfig[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  defaultTabList: () => React.ReactNode;
};

export type BaseDetailSectionRenderContext<
  TData = Record<string, unknown>,
  TSection extends DetailTabSectionConfig = DetailTabSectionConfig,
> = {
  tab: DetailTabConfig;
  section: TSection;
  sectionIndex: number;
  data: TData;
  activeTab: string;
  defaultSection: () => React.ReactNode;
};

export type BaseDetailSectionRenderer<TData = Record<string, unknown>> = (
  context: BaseDetailSectionRenderContext<TData>
) => React.ReactNode | undefined;

export type BaseDetailProps<TData = Record<string, unknown>> = {
  data: TData;
  tabs: DetailTabConfig[];
  className?: string;
  initialTab?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (tab: string) => void;
  showTabs?: boolean;
  sectionsColumns?: number;
  sectionsContainerClassName?: string;
  tabListClassName?: string;
  tabTriggerClassName?: string;
  activeTabTriggerClassName?: string;
  inactiveTabTriggerClassName?: string;
  renderTabList?: (
    context: BaseDetailTabListRenderContext
  ) => React.ReactNode | undefined;
  renderSection?: (
    context: BaseDetailSectionRenderContext<TData>
  ) => React.ReactNode | undefined;
  sectionRenderers?: Partial<Record<string, BaseDetailSectionRenderer<TData>>>;
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
  updateForm?: Partial<ModelFormProps<Record<string, unknown>>>;
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
  /**
   * Optional compatibility flag to route to the v2 metadata-driven renderer.
   */
  useV2?: boolean;
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
  simple?: RelatedTableSimpleConfig;
  modelTableProps?: {
    hookOptions?: {
      initVariables?: Record<string, unknown>;
      initialPageSize?: number;
      order_by?: string | string[];
      per_page?: number;
      page?: number;
      filters?: Record<string, unknown>;
    };
  };
};
