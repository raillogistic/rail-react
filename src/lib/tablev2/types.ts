import type { ReactNode } from "react";
import { FilterFormState } from "../form/filters/types";

// ============================================================================
// GraphQL Metadata Types (Mirrors rail-django/extensions/metadata/types.py)
// ============================================================================

export interface Choice {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

export interface ValidatorInfo {
  type: string;
  params?: string; // JSON string
  message?: string;
}

export interface FSMTransition {
  name: string;
  source: string[];
  target: string;
  label?: string;
  description?: string;
  permission?: string;
  allowed: boolean;
}

export interface FieldSchema {
  // Identity
  name: string;
  fieldName: string;
  verboseName: string;
  helpText?: string;

  // Type info
  fieldType: string; // e.g. "String", "Date", "Boolean"
  graphqlType: string;
  pythonType?: string;

  // Constraints
  required: boolean;
  nullable: boolean;
  blank: boolean;
  editable: boolean;
  unique: boolean;

  // Value constraints
  maxLength?: number;
  minLength?: number;
  maxValue?: number;
  minValue?: number;
  decimalPlaces?: number;
  maxDigits?: number;

  // Choices
  choices?: Choice[];

  // Default
  defaultValue?: string; // JSON string
  hasDefault: boolean;
  autoNow: boolean;
  autoNowAdd: boolean;

  // Validators
  validators?: ValidatorInfo[];
  regexPattern?: string;

  // Permissions
  readable: boolean;
  writable: boolean;
  visibility: string;

  // Classification flags
  isPrimaryKey: boolean;
  isIndexed: boolean;
  isRelation: boolean;
  isComputed: boolean;
  isFile: boolean;
  isImage: boolean;
  isJson: boolean;
  isDate: boolean;
  isDatetime: boolean;
  isNumeric: boolean;
  isBoolean: boolean;
  isText: boolean;
  isRichText: boolean;
  isFsmField: boolean;

  // Relation hints (for relationship fields synthesized in the client)
  relationLookupField?: string;

  // FSM
  fsmTransitions?: FSMTransition[];

  // Custom metadata
  customMetadata?: string; // JSON string
}

export interface RelationshipSchema {
  name: string;
  fieldName: string;
  verboseName: string;
  helpText?: string;

  // Related model
  relatedApp: string;
  relatedModel: string;
  relatedModelVerbose: string;

  // Relationship type
  relationType: string;
  isReverse: boolean;
  isToOne: boolean;
  isToMany: boolean;

  // Config
  onDelete?: string;
  relatedName?: string;
  throughModel?: string;

  // Constraints
  required: boolean;
  nullable: boolean;
  editable: boolean;

  // Lookup
  lookupField: string;
  searchFields?: string[];

  // Permissions
  readable: boolean;
  writable: boolean;
  canCreateInline: boolean;

  // Nested operations metadata (JSON string)
  relationOperations?: string;

  // Custom
  customMetadata?: string; // JSON string
}

export interface FilterOptionSchema {
  name: string;
  lookup: string;
  label: string;
  helpText?: string;
  choices?: Choice[];
  graphqlType?: string;
  isList?: boolean;
}

export interface FilterSchema {
  name: string;
  fieldName: string;
  fieldLabel: string;
  baseType?: string;
  isNested: boolean;
  relatedModel?: string;
  options: FilterOptionSchema[];

  // Nested filter style
  filterInputType?: string;
  availableOperators?: string[];
}

export interface FilterConfig {
  style: "flat" | "nested";
  argumentName: string;
  inputTypeName: string;
  supportsAnd: boolean;
  supportsOr: boolean;
  supportsNot: boolean;
  supportsQuick?: boolean;
  dualModeEnabled: boolean;
  supportsFts: boolean;
  supportsAggregation: boolean;
  presets?: unknown[]; // Defined more specifically if needed
  computedFilters?: unknown[];
}

export interface MutationSchema {
  name: string;
  operation: string;
  description?: string;
  methodName?: string | null;
  inputFields?: unknown[];
  allowed: boolean;
  requiredPermissions?: string[];
  reason?: string | null;
  mutationType?: string | null;
  modelName?: string | null;
  requiresAuthentication?: boolean | null;
}

export interface RowMutationPermissions {
  canUpdate?: boolean | null;
  canDelete?: boolean | null;
  updateReason?: string | null;
  deleteReason?: string | null;
}

export interface ModelPermissions {
  canList: boolean;
  canRetrieve: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canBulkCreate: boolean;
  canBulkUpdate: boolean;
  canBulkDelete: boolean;
  canExport: boolean;
  denialReasons?: string; // JSON string
}

export interface ModelSchema {
  // Identity
  app: string;
  model: string;
  verboseName: string;
  verboseNamePlural: string;

  // Structure
  primaryKey: string;
  ordering?: string[];
  uniqueTogether?: string[][];

  // Fields
  fields: FieldSchema[];
  relationships: RelationshipSchema[];

  // Filters
  filters: FilterSchema[];
  filterConfig?: FilterConfig;
  relationFilters?: unknown[]; // Define recursively if needed

  // Mutations
  mutations: MutationSchema[];

  // Permissions
  permissions: ModelPermissions;

  // Hints
  fieldGroups?: unknown[];
  templates?: unknown[];

  // Cache
  metadataVersion: string;
  customMetadata?: string; // JSON string
}

// ============================================================================
// Component State Types
// ============================================================================

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  numPages: number;
  totalKnown: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type TableDensity = "compact" | "comfortable" | "spacious";

export type ColumnOrderingMode = "persisted" | "config";
export type ColumnOrderingAppend = "start" | "end";

export interface BaseModelTableColumnOrderingConfig {
  order?: string[]; // preferred column order (by column id)
  mode?: ColumnOrderingMode; // persisted (default) or config-first
  append?: ColumnOrderingAppend; // where to place unspecified columns
  draggable?: boolean; // allow drag-and-drop reordering
  locked?: string[]; // columns that cannot be dragged
}

export interface ColumnVisibilityState {
  [columnId: string]: boolean;
}

export interface TableContextState {
  // Data
  data: Record<string, unknown>[];
  loading: boolean;
  error?: Error | null;

  // Metadata
  metadata?: ModelSchema | null;
  metadataLoading: boolean;
  metadataError?: Error | null;

  // State
  pagination: PaginationState;
  columnVisibility: ColumnVisibilityState;
  columnOrder: string[];
  rowSelection: Record<string, boolean>;
  groupingField: string | null;
  groupCollapsed: Record<string, boolean>;
  activeColumnFilter: string | null;
  dragModeEnabled: boolean;
  density: TableDensity;
  wrapCells: boolean;
  refreshKey: number;

  // Filters
  quickSearch: string;
  advancedFilters: FilterFormState;
  filterVariables?: Record<string, unknown>; // FilterQueryVariables

  // Actions
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setColumnVisibility: (visibility: ColumnVisibilityState) => void;
  setColumnOrder: (order: string[]) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  setGroupingField: (field: string | null) => void;
  setGroupCollapsed: (collapsed: Record<string, boolean>) => void;
  setActiveColumnFilter: (columnId: string | null) => void;
  setDragModeEnabled: (enabled: boolean) => void;
  setDensity: (density: TableDensity) => void;
  setWrapCells: (wrap: boolean) => void;
  setQuickSearch: (term: string) => void;
  setAdvancedFilters: (filters: FilterFormState, variables?: Record<string, unknown>) => void;
  refresh: () => void;

  // Internal Data Fetching Hooks
  _setPageInfo: (info: {
    totalCount?: number | null;
    pageCount?: number | null;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
  }) => void;
  _setData: (data: Record<string, unknown>[], loading: boolean, error?: Error) => void;
}

// ============================================================================
// BaseModelTable Configuration Types
// ============================================================================

export type BaseModelTableRefetch = (
  variables?: Record<string, unknown>,
) => Promise<unknown>;

export type BaseModelTableColumnActionContext = {
  row: Record<string, unknown>;
  data: Record<string, unknown>[];
  refetch?: BaseModelTableRefetch;
};

type BaseModelTableColumnActionBase = {
  key?: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  className?: string;
  disabled?: boolean;
};

export type BaseModelTableColumnActionRender =
  BaseModelTableColumnActionBase & {
    render: (context: BaseModelTableColumnActionContext) => ReactNode;
  };

export type BaseModelTableColumnActionClick =
  BaseModelTableColumnActionBase & {
    label: string;
    onClick: (
      context: BaseModelTableColumnActionContext,
    ) => void | Promise<void>;
  };

export type BaseModelTableColumnAction =
  | BaseModelTableColumnActionRender
  | BaseModelTableColumnActionClick;

export type BaseModelTableColumnActionsInput =
  | BaseModelTableColumnAction[]
  | ((context: BaseModelTableColumnActionContext) =>
      | BaseModelTableColumnAction[]
      | undefined);

export type BaseModelTableRenderContext = {
  accessor: string;
  columnId: string;
  data: Record<string, unknown>[];
  refetch?: BaseModelTableRefetch;
};

export type BaseModelTableFieldRender = (
  value: unknown,
  row: Record<string, unknown>,
  context: BaseModelTableRenderContext,
) => ReactNode;

export type BaseModelTableFieldRenderMap = Record<
  string,
  (
    value: unknown,
    row: Record<string, unknown>,
    data: Record<string, unknown>[],
    refetch?: BaseModelTableRefetch,
  ) => ReactNode
>;

export type BaseModelTableField =
  | string
  | {
      accessor: string;
      title?: string;
      display?: string;
      render?: BaseModelTableFieldRender;
    };

export type BaseModelTableFieldsConfig = {
  display?: BaseModelTableField[];
  include?: BaseModelTableField[];
  exclude?: string[];
  render?: BaseModelTableFieldRenderMap;
};

export type BaseModelTableFieldsInput =
  | BaseModelTableField[]
  | BaseModelTableFieldsConfig;

export type BaseModelTableRelationConfig = {
  fields?: string[];
  display?: string;
};

export type BaseModelTableColumnDef = {
  id: string;
  accessor: string;
  title: string;
  render?: BaseModelTableFieldRender;
};
