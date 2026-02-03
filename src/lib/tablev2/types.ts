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
}

export interface SortingState {
  id: string; // field name
  desc: boolean;
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
  sorting: SortingState[];
  columnVisibility: ColumnVisibilityState;
  columnOrder: string[];
  rowSelection: Record<string, boolean>;
  refreshKey: number;

  // Filters
  quickSearch: string;
  advancedFilters: FilterFormState;
  filterVariables?: Record<string, unknown>; // FilterQueryVariables

  // Actions
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSorting: (sorting: SortingState[]) => void;
  setColumnVisibility: (visibility: ColumnVisibilityState) => void;
  setColumnOrder: (order: string[]) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  setQuickSearch: (term: string) => void;
  setAdvancedFilters: (filters: FilterFormState, variables?: Record<string, unknown>) => void;
  refresh: () => void;

  // Internal Data Fetching Hooks
  _setTotal: (total: number) => void;
  _setData: (data: Record<string, unknown>[], loading: boolean, error?: Error) => void;
}
