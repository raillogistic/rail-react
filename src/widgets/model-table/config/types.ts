import type React from "react";
import type { DynamicTableExpandConfig } from "../dynamic-table";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import type { ModelDynamicDetailConfig } from "@/widgets/model-details/config/types";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  PaginationState,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
  ModelSchema,
  TableDensity,
} from "../types";
import type { ModelTableContentConfig } from "../components/content/types";

export type FilterPanelMode = "drawer" | "modal";

export interface FilterPanelOptions {
  mode?: FilterPanelMode;
  defaultOpen?: boolean;
  title?: string;
  widthClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export type ModelTableFilterPanelProps = FilterPanelOptions &
  Partial<
    import("@/widgets/model-table/filtering/FilterPanel").FilterPanelProps
  >;

/**
 * Supported update-action presentation modes.
 */
export type ModelTableUpdatePresentation = "drawer" | "modal" | "link";

/**
 * Supported create-action presentation modes.
 */
export type ModelTableCreatePresentation = "drawer" | "modal" | "link";

/**
 * Supported detail-action presentation modes.
 */
export type ModelTableDetailPresentation = "drawer" | "modal" | "link";

/**
 * Drawer direction options for update overlays.
 */
export type ModelTableUpdateDrawerDirection =
  | "left"
  | "right"
  | "top"
  | "bottom";

/**
 * Drawer direction options for create overlays.
 */
export type ModelTableCreateDrawerDirection =
  | "left"
  | "right"
  | "top"
  | "bottom";

/**
 * Drawer direction options for detail overlays.
 */
export type ModelTableDetailDrawerDirection =
  | "left"
  | "right"
  | "top"
  | "bottom";

/**
 * Runtime context supplied to update configuration callbacks.
 */
export type ModelTableUpdateContext = {
  app: string;
  model: string;
  row: Record<string, unknown>;
  rowId: string;
  metadata?: ModelSchema;
};

/**
 * Runtime context supplied to create configuration callbacks.
 */
export type ModelTableCreateContext = {
  app: string;
  model: string;
  metadata?: ModelSchema;
  selectedRows: Record<string, unknown>[];
  selectionState: Record<string, boolean>;
};

/**
 * Runtime context supplied to detail configuration callbacks.
 */
export type ModelTableDetailContext = {
  app: string;
  model: string;
  row: Record<string, unknown>;
  rowId: string;
  metadata?: ModelSchema;
};

/**
 * ModelForm override surface accepted by table row update popups.
 */
export type ModelTableUpdateFormOverrides = Omit<
  ModelFormProps<Record<string, unknown>>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * ModelForm override surface accepted by table create popups.
 */
export type ModelTableCreateFormOverrides = Omit<
  ModelFormProps<Record<string, unknown>>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * ModelForm override surface accepted by table row detail popups.
 */
export type ModelTableDetailFormOverrides = Omit<
  ModelFormProps<Record<string, unknown>>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * Update-action configuration used by DynamicModelTable row edit behavior.
 */
export type ModelTableUpdateConfig = {
  /**
   * Overlay type for update action.
   * - "drawer" (default)
   * - "modal"
   * - "link"
   */
  type?: ModelTableUpdatePresentation;
  /**
   * Popup title or title resolver.
   */
  title?: React.ReactNode | ((ctx: ModelTableUpdateContext) => React.ReactNode);
  /**
   * Overlay width CSS value (e.g. "50vw", "900px", "min(90vw, 960px)").
   */
  width?: string;
  /**
   * Overlay height CSS value.
   */
  height?: string;
  /**
   * Drawer direction when`type` is "drawer".
   */
  drawerDirection?: ModelTableUpdateDrawerDirection;
  /**
   * Link template for`type: "link"` (e.g. "/orders/:id/edit").
   */
  hrefTemplate?: string;
  /**
   * Static object id override passed to ModelForm update mode.
   */
  objectId?: string | number | null;
  /**
   * Row-aware object id resolver passed to ModelForm update mode.
   */
  resolveObjectId?: (
    ctx: ModelTableUpdateContext,
  ) => string | number | null | undefined;
  /**
   * Global ModelForm overrides for popup update mode.
   */
  form?: ModelTableUpdateFormOverrides;
  /**
   * Row-specific ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableUpdateContext,
  ) => ModelTableUpdateFormOverrides | undefined;
  /**
   * Close popup automatically after successful update submit.
   * Defaults to true.
   */
  closeOnSuccess?: boolean;
  /**
   * Refetch table data automatically after successful update submit.
   * Defaults to true.
   */
  refetchOnSuccess?: boolean;
};

/**
 * Create-action configuration used by DynamicModelTable top add behavior.
 */
export type ModelTableCreateConfig = {
  /**
   * Overlay type for create action.
   * - "drawer" (default)
   * - "modal"
   * - "link"
   */
  type?: ModelTableCreatePresentation;
  /**
   * Popup title or title resolver.
   */
  title?: React.ReactNode | ((ctx: ModelTableCreateContext) => React.ReactNode);
  /**
   * Overlay width CSS value (e.g. "50vw", "900px", "min(90vw, 960px)").
   */
  width?: string;
  /**
   * Overlay height CSS value.
   */
  height?: string;
  /**
   * Drawer direction when`type` is "drawer".
   */
  drawerDirection?: ModelTableCreateDrawerDirection;
  /**
   * Link template for`type: "link"` (e.g. "/orders/create").
   */
  hrefTemplate?: string;
  /**
   * Global ModelForm overrides for popup create mode.
   */
  form?: ModelTableCreateFormOverrides;
  /**
   * Runtime ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableCreateContext,
  ) => ModelTableCreateFormOverrides | undefined;
  /**
   * Close popup automatically after successful create submit.
   * Defaults to true.
   */
  closeOnSuccess?: boolean;
  /**
   * Refetch table data automatically after successful create submit.
   * Defaults to true.
   */
  refetchOnSuccess?: boolean;
};

/**
 * Detail-action configuration used by DynamicModelTable row view behavior.
 */
export type ModelTableDetailConfig = {
  /**
   * Overlay type for detail action.
   * - "drawer" (default)
   * - "modal"
   * - "link"
   */
  type?: ModelTableDetailPresentation;
  /**
   * Popup title or title resolver.
   */
  title?: React.ReactNode | ((ctx: ModelTableDetailContext) => React.ReactNode);
  /**
   * Overlay width CSS value (e.g. "50vw", "900px", "min(90vw, 960px)").
   */
  width?: string;
  /**
   * Overlay height CSS value.
   */
  height?: string;
  /**
   * Drawer direction when`type` is "drawer".
   */
  drawerDirection?: ModelTableDetailDrawerDirection;
  /**
   * Link template for`type: "link"` (e.g. "/orders/:id").
   */
  hrefTemplate?: string;
  /**
   * Static object id override passed to ModelForm view mode.
   */
  objectId?: string | number | null;
  /**
   * Row-aware object id resolver passed to ModelForm view mode.
   */
  resolveObjectId?: (
    ctx: ModelTableDetailContext,
  ) => string | number | null | undefined;
  /**
   * Global ModelForm overrides for popup detail mode.
   */
  form?: ModelTableDetailFormOverrides;
  /**
   * Row-specific ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableDetailContext,
  ) => ModelTableDetailFormOverrides | undefined;
  /**
   * Global ModelDynamicDetail configuration overrides.
   */
  baseDetail?: ModelDynamicDetailConfig;
  /**
   * Row-specific ModelDynamicDetail configuration resolver.
   */
  resolveBaseDetail?: (
    ctx: ModelTableDetailContext,
  ) => ModelDynamicDetailConfig | undefined;
};

export type ModelTableV2TopAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  order?: number;
  show_when?: "always" | "has_selection";
  disabled?: boolean;
  disabledReason?: string;
  dataAttributes?: Record<string, string | number | boolean | undefined>;
  on_click: (ctx: {
    selected_rows: Record<string, unknown>[];
    selection_state: Record<string, boolean>;
  }) => void;
};

export type ModelTableV2TopActionsInput =
  | ModelTableV2TopAction[]
  | ((ctx: {
      app: string;
      model: string;
      metadata?: ModelSchema;
      items: Record<string, unknown>[];
      selected_rows: Record<string, unknown>[];
      selection_state: Record<string, boolean>;
    }) => ModelTableV2TopAction[] | undefined);

export type ModelTableV2TableConfig = {
  pdfPreview?: {
    /**
     * Enables inline PDF preview for PDF URL cell values.
     * Defaults to false.
     */
    enabled?: boolean;
    /**
     * Optional dialog title override.
     */
    title?: string;
    /**
     * Optional helper text displayed above the viewer.
     */
    description?: string;
    /**
     * Optional label for the fallback external-open link.
     */
    openInNewTabLabel?: string;
  };
  showTitle?: boolean;
  title?: string;
  actionsLabel?: string;
  emptyState?: string;
  loadingText?: string;
  searchPlaceholder?: string;
  resetLabel?: string;
  addLabel?: string;
  columnsLabel?: string;
  toggleColumnsLabel?: string;
  viewLabel?: string;
  wrapCellsLabel?: string;
  densityLabel?: string;
  densityOptions?: {
    compact?: string;
    comfortable?: string;
    spacious?: string;
  };
  refreshLabel?: string;
  paginationLabels?: {
    rowsPerPage?: string;
    pageStatus?: (page: number, totalPages: number) => string;
    selectionStatus?: (selected: number, total: number) => string;
    firstPageAria?: string;
    previousPageAria?: string;
    nextPageAria?: string;
    lastPageAria?: string;
  };
  exportLabels?: {
    buttonAria?: string;
    title?: string;
    description?: string;
    fieldsTitle?: string;
    selectedCount?: (count: number) => string;
    selectAll?: string;
    clear?: string;
    filenameLabel?: string;
    filenamePlaceholder?: string;
    formatLabel?: string;
    quickSearchLabel?: string;
    quickSearchActive?: string;
    quickSearchNone?: string;
    advancedFiltersLabel?: string;
    advancedFiltersNone?: string;
    orderingLabel?: string;
    orderingNone?: string;
    footerSelectedCount?: (count: number) => string;
    cancel?: string;
    download?: string;
  };
};

export type ModelTableV2PerformanceOptions = {
  enableVirtualization?: boolean;
  virtualizeThreshold?: number;
  overscan?: number;
  dataMode?: "pagination" | "infinite";
  infiniteScrollThresholdPx?: number;
};

export type ModelTableV2ViewOptions = {
  defaultDensity?: TableDensity;
  defaultWrapCells?: boolean;
  maxBodyHeightClassName?: string;
};

/**
 * Optional development helpers for DynamicModelTable.
 */
export type DynamicModelTableDevtoolsConfig = {
  /**
   * Enables the in-table diagnostics panel.
   */
  enabled?: boolean;
};

/**
 * Expansion config forwarded to DynamicTable from DynamicModelTable.
 */
export type ModelTableV2ExpandConfig = DynamicTableExpandConfig<
  Record<string, unknown>
>;

/**
 * Initial query variables supported by DynamicModelTable.
 * Unknown keys are preserved and forwarded through`filterVariables`.
 */
export type DynamicModelTableInitVariables = {
  /**
   * Initial where clause payload.
   */
  where?: unknown;
  /**
   * Single preset alias converted to`presets`.
   */
  preset?: string;
  /**
   * Initial presets payload.
   */
  presets?: string[] | string;
  /**
   * Initial distinct-on fields payload.
   */
  distinctOn?: string[] | string;
  /**
   * Initial order-by payload.
   */
  orderBy?: string[] | string;
  /**
   * Legacy snake_case order-by alias.
   */
  order_by?: string[] | string;
  /**
   * Initial 1-based page number.
   */
  page?: number;
  /**
   * Initial page size.
   */
  perPage?: number;
  /**
   * Legacy snake_case page-size alias.
   */
  per_page?: number;
} & Record<string, unknown>;

export interface BaseModelTableProps {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  showReversed?: boolean;
  showCount?: boolean;
  relations?: Record<string, BaseModelTableRelationConfig>;
  relationStats?: BaseModelTableRelationStatsConfig;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  columnActions?: BaseModelTableColumnActionsInput;
  content?: ModelTableContentConfig;
}

export interface ModelTableV2Props {
  app: string;
  model: string;
  filterPanel?: ModelTableFilterPanelProps;
  create?: ModelTableCreateConfig;
  update?: ModelTableUpdateConfig;
  detail?: ModelTableDetailConfig;
  baseTable?: Omit<BaseModelTableProps, "app" | "model" | "children">;
  /**
   * Enables simple runtime diagnostics for table bootstrap timings.
   */
  devtools?: boolean | DynamicModelTableDevtoolsConfig;
  /**
   * Initial query variables used for the first table request.
   */
  initVariables?: DynamicModelTableInitVariables;
}

/**
 * Runtime snapshot exposed by DynamicModelTable imperative refs.
 */
export interface DynamicModelTableSnapshot {
  /**
   * Current rendered rows for the active page/query.
   */
  data: Record<string, unknown>[];
  /**
   * Rows currently selected from`data`.
   */
  selectedRows: Record<string, unknown>[];
  /**
   * Current selection state keyed by row id.
   */
  rowSelection: Record<string, boolean>;
  /**
   * Data query loading state.
   */
  loading: boolean;
  /**
   * Metadata loading state.
   */
  metadataLoading: boolean;
  /**
   * Data query error when present.
   */
  dataError: Error | null;
  /**
   * Metadata query error when present.
   */
  metadataError: Error | null;
  /**
   * Current model metadata, if loaded.
   */
  metadata: ModelSchema | null;
  /**
   * Current pagination state, if initialized.
   */
  pagination: PaginationState | null;
}

/**
 * Imperative API exposed by DynamicModelTable through React refs.
 */
export interface DynamicModelTableHandle {
  /**
   * Refetches table rows with optional variable overrides.
   */
  refetch: BaseModelTableRefetch;
  /**
   * Returns the latest table runtime snapshot.
   */
  getSnapshot: () => DynamicModelTableSnapshot;
  /**
   * Current rendered rows for the active page/query.
   */
  readonly data: Record<string, unknown>[];
  /**
   * Rows currently selected from`data`.
   */
  readonly selectedRows: Record<string, unknown>[];
  /**
   * Current selection state keyed by row id.
   */
  readonly rowSelection: Record<string, boolean>;
  /**
   * Data query loading state.
   */
  readonly loading: boolean;
  /**
   * Metadata loading state.
   */
  readonly metadataLoading: boolean;
  /**
   * Data query error when present.
   */
  readonly dataError: Error | null;
  /**
   * Metadata query error when present.
   */
  readonly metadataError: Error | null;
  /**
   * Current model metadata, if loaded.
   */
  readonly metadata: ModelSchema | null;
  /**
   * Current pagination state, if initialized.
   */
  readonly pagination: PaginationState | null;
}

/**
 * Public props contract for the DynamicTable-backed model table implementation.
 */
export type DynamicModelTableProps = ModelTableV2Props;
