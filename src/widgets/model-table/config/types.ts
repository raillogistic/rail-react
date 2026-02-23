import type React from "react";
import type { DynamicTableExpandConfig } from "@/widgets/dynamic-table";
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
  Partial<import("../../filters/FilterPanel").FilterPanelProps>;

export type ModelTableV2TopAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
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
 * Expansion config forwarded to DynamicTable from DynamicModelTable.
 */
export type ModelTableV2ExpandConfig =
  DynamicTableExpandConfig<Record<string, unknown>>;

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
  baseTable?: Omit<BaseModelTableProps, "app" | "model" | "children">;
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
   * Rows currently selected from `data`.
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
   * Rows currently selected from `data`.
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
