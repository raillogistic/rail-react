import type React from "react";
import type { DynamicTableExpandConfig } from "../dynamic-table";
import type {
  ModelFormProps,
  ModelFormValueShape,
} from "@/widgets/model-form/types.model";
import type { ModelDynamicDetailConfig } from "@/widgets/model-details/config/types";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnOrderingConfig,
  DynamicModelTableRow,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  PaginationState,
  BaseModelTableRelationConfig,
  ModelTableAccessorPath,
  ModelTableRelationKey,
  BaseModelTableRelationStatsConfig,
  ModelSchema,
  TableDensity,
} from "../types";
import type { ModelTableContentConfig } from "../components/content/types";

type ResolvedModelTableFormValues<TSource extends object> =
  ModelFormValueShape<TSource> extends Record<string, unknown>
    ? ModelFormValueShape<TSource>
    : Record<string, unknown>;

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

export type ModelTableNavFilterVariables = Record<string, unknown>;

export type ModelTableNavFilterResolverContext = {
  groupKey: string;
  itemKey: string;
  selections: Record<string, string | null>;
};

export type ModelTableNavFilterItem = {
  key: string;
  label: string;
  clear?: boolean;
  variables?: ModelTableNavFilterVariables;
  resolveVariables?: (
    context: ModelTableNavFilterResolverContext,
  ) => ModelTableNavFilterVariables | undefined;
};

export type ModelTableNavFilterGroup = {
  key: string;
  label?: string;
  defaultItemKey?: string;
  items: ModelTableNavFilterItem[];
};

export type ModelTableNavFiltersConfig = {
  groups: ModelTableNavFilterGroup[];
};

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
export type ModelTableUpdateContext<
  TSource extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  row: DynamicModelTableRow<TSource>;
  rowId: string;
  metadata?: ModelSchema;
};

/**
 * Runtime context supplied to create configuration callbacks.
 */
export type ModelTableCreateContext<
  TSource extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  metadata?: ModelSchema;
  selectedRows: DynamicModelTableRow<TSource>[];
  selectionState: Record<string, boolean>;
};

/**
 * Runtime context supplied to detail configuration callbacks.
 */
export type ModelTableDetailContext<
  TSource extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  row: DynamicModelTableRow<TSource>;
  rowId: string;
  metadata?: ModelSchema;
};

/**
 * ModelForm override surface accepted by table row update popups.
 */
export type ModelTableUpdateFormOverrides<
  TSource extends object = Record<string, unknown>,
> = Omit<
  ModelFormProps<ResolvedModelTableFormValues<TSource>, TSource>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * ModelForm override surface accepted by table create popups.
 */
export type ModelTableCreateFormOverrides<
  TSource extends object = Record<string, unknown>,
> = Omit<
  ModelFormProps<ResolvedModelTableFormValues<TSource>, TSource>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * ModelForm override surface accepted by table row detail popups.
 */
export type ModelTableDetailFormOverrides<
  TSource extends object = Record<string, unknown>,
> = Omit<
  ModelFormProps<ResolvedModelTableFormValues<TSource>, TSource>,
  "app" | "model" | "mode" | "objectId"
>;

/**
 * Update-action configuration used by DynamicModelTable row edit behavior.
 */
export type ModelTableUpdateConfig<
  TSource extends object = Record<string, unknown>,
> = {
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
  title?: React.ReactNode | ((ctx: ModelTableUpdateContext<TSource>) => React.ReactNode);
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
    ctx: ModelTableUpdateContext<TSource>,
  ) => string | number | null | undefined;
  /**
   * Global ModelForm overrides for popup update mode.
   */
  form?: ModelTableUpdateFormOverrides<TSource>;
  /**
   * Row-specific ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableUpdateContext<TSource>,
  ) => ModelTableUpdateFormOverrides<TSource> | undefined;
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
export type ModelTableCreateConfig<
  TSource extends object = Record<string, unknown>,
> = {
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
  title?: React.ReactNode | ((ctx: ModelTableCreateContext<TSource>) => React.ReactNode);
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
  form?: ModelTableCreateFormOverrides<TSource>;
  /**
   * Runtime ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableCreateContext<TSource>,
  ) => ModelTableCreateFormOverrides<TSource> | undefined;
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
export type ModelTableDetailConfig<
  TSource extends object = Record<string, unknown>,
> = {
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
  title?: React.ReactNode | ((ctx: ModelTableDetailContext<TSource>) => React.ReactNode);
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
    ctx: ModelTableDetailContext<TSource>,
  ) => string | number | null | undefined;
  /**
   * Global ModelForm overrides for popup detail mode.
   */
  form?: ModelTableDetailFormOverrides<TSource>;
  /**
   * Row-specific ModelForm override resolver.
   */
  resolveFormProps?: (
    ctx: ModelTableDetailContext<TSource>,
  ) => ModelTableDetailFormOverrides<TSource> | undefined;
  /**
   * Global ModelDynamicDetail configuration overrides.
   */
  baseDetail?: ModelDynamicDetailConfig<TSource>;
  /**
   * Row-specific ModelDynamicDetail configuration resolver.
   */
  resolveBaseDetail?: (
    ctx: ModelTableDetailContext<TSource>,
  ) => ModelDynamicDetailConfig<TSource> | undefined;
};

export type ModelTableV2TopAction<
  TSource extends object = Record<string, unknown>,
> = {
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
    selected_rows: DynamicModelTableRow<TSource>[];
    selection_state: Record<string, boolean>;
  }) => void;
};

export type ModelTableV2TopActionsInput<
  TSource extends object = Record<string, unknown>,
> =
  | ModelTableV2TopAction<TSource>[]
  | ((ctx: {
      app: string;
      model: string;
      metadata?: ModelSchema;
      items: DynamicModelTableRow<TSource>[];
      selected_rows: DynamicModelTableRow<TSource>[];
      selection_state: Record<string, boolean>;
    }) => ModelTableV2TopAction<TSource>[] | undefined);

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

export interface BaseModelTableProps<
  TSource extends object = Record<string, unknown>,
> {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput<TSource>;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput<TSource>;
  showReversed?: boolean;
  showCount?: boolean;
  relations?: Partial<
    Record<ModelTableRelationKey<TSource>, BaseModelTableRelationConfig<TSource>>
  >;
  relationStats?: BaseModelTableRelationStatsConfig<TSource>;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig<ModelTableAccessorPath<TSource>>;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  columnActions?: BaseModelTableColumnActionsInput<DynamicModelTableRow<TSource>>;
  content?: ModelTableContentConfig<TSource>;
}

export interface ModelTableV2Props<
  TSource extends object = Record<string, unknown>,
> {
  app: string;
  model: string;
  navFilters?: ModelTableNavFiltersConfig;
  filterPanel?: ModelTableFilterPanelProps;
  create?: ModelTableCreateConfig<TSource>;
  update?: ModelTableUpdateConfig<TSource>;
  detail?: ModelTableDetailConfig<TSource>;
  baseTable?: Omit<BaseModelTableProps<TSource>, "app" | "model" | "children">;
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
export interface DynamicModelTableSnapshot<
  TSource extends object = Record<string, unknown>,
> {
  /**
   * Current rendered rows for the active page/query.
   */
  data: DynamicModelTableRow<TSource>[];
  /**
   * Rows currently selected from`data`.
   */
  selectedRows: DynamicModelTableRow<TSource>[];
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
export interface DynamicModelTableHandle<
  TSource extends object = Record<string, unknown>,
> {
  /**
   * Refetches table rows with optional variable overrides.
   */
  refetch: BaseModelTableRefetch;
  /**
   * Returns the latest table runtime snapshot.
   */
  getSnapshot: () => DynamicModelTableSnapshot<TSource>;
  /**
   * Current rendered rows for the active page/query.
   */
  readonly data: DynamicModelTableRow<TSource>[];
  /**
   * Rows currently selected from`data`.
   */
  readonly selectedRows: DynamicModelTableRow<TSource>[];
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
export type DynamicModelTableProps<
  TSource extends object = Record<string, unknown>,
> = ModelTableV2Props<TSource>;
