export type FieldType =
  | "CharField"
  | "TextField"
  | "IntegerField"
  | "BooleanField"
  | "DateField"
  | "DateTimeField"
  | "EnumField"
  | "RelationField"
  | "JSONField"
  | "DecimalField";

// Base interface for table field metadata
export interface TableFieldMetadataType {
  /** Field name */
  name: string;
  /** Field accessor */
  accessor: string;
  /** Field display accessor */
  display: string;
  /** Whether field is editable */
  editable: boolean;
  /** Field data type */
  field_type: FieldType;
  /** Whether field is filterable */
  filterable: boolean;
  /** Whether field is sortable */
  sortable: boolean;
  /** Field title (verbose name) */
  title: string;
  /** Help text or description */
  helpText: string;
  /** Whether field is a property */
  is_property: boolean;
  /** Whether field is related */
  is_related: boolean;
  permissions?: FieldPermissionSnapshot | null;
}
export interface FieldPermissionSnapshot {
  can_read: boolean;
  can_write: boolean;
  visibility: "visible" | "hidden" | "masked" | "redacted";
  access_level: string;
  mask_value?: string | null;
  reason?: string | null;
}

export interface ModelPermissionMatrix {
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_read: boolean;
  can_list: boolean;
  can_history: boolean;
  reasons?: Record<string, string | null> | null;
}

export interface ModelPdfTemplateMetadata {
  /** Unique identifier combining app, model and method */
  key: string;
  /** Model method name registered via decorator */
  methodName: string;
  /** Display title for dropdowns */
  title: string;
  /** Full endpoint prefix under /api for this template */
  endpoint: string;
  /** Raw template path registered on the backend */
  urlPath: string;
  /** Guard name enforced on the backend */
  guard?: string | null;
  /** Whether authentication is required */
  requireAuthentication: boolean;
  /** RBAC roles required to access the template */
  roles: string[];
  /** Django permissions required to access the template */
  permissions: string[];
  /** Whether the current user passed static authorization checks */
  allowed: boolean;
  /** Optional denial reason for debugging purposes */
  denialReason?: string | null;
  /** Whether the backend allows client-provided data */
  allowClientData?: boolean;
  /** Whitelisted client data fields accepted by backend */
  clientDataFields?: string[];
  /** Structured client data schema with name/type */
  clientDataSchema?: Array<{ name: string; type?: string | null }> | null;
}

export type MutationInputFieldMeta = {
  /** Field name as exposed by the mutation input */
  name: string;
  /** GraphQL input type (raw) used to help build widgets */
  field_type: string;
  /** Whether the field is required */
  required: boolean;
  /** Default value to seed the form */
  default_value?: unknown;
  /** Human description/label for the field */
  description?: string | null;
  /** Static choices, if any, from backend metadata */
  choices?: Array<Record<string, unknown>> | null;
  /** Validation rules to enforce on the frontend */
  validation_rules?: Record<string, unknown> | null;
  /** Suggested widget type (input, select...) */
  widget_type?: string | null;
  /** Placeholder text for the control */
  placeholder?: string | null;
  /** Helper text displayed below the field */
  help_text?: string | null;
  /** Minimum string length constraint */
  min_length?: number | null;
  /** Maximum string length constraint */
  max_length?: number | null;
  /** Minimum numeric value constraint */
  min_value?: number | null;
  /** Maximum numeric value constraint */
  max_value?: number | null;
  /** Regex validation pattern */
  pattern?: string | null;
  /** Related model name when the input is a relation */
  related_model?: string | null;
  /** Whether multiple values are accepted */
  multiple?: boolean;
};

export type MutationMetadata = {
  /** Mutation field name (server-side) */
  name: string;
  /** Optional model method name when derived from a model method */
  method_name?: string | null;
  /** Mutation description for tooltips */
  description?: string | null;
  /** Input fields composing the generated form */
  input_fields: MutationInputFieldMeta[];
  /** GraphQL input type name (for custom inputs) */
  input_type?: string | null;
  /** Expected return type */
  return_type?: string | null;
  /** Whether authentication is required */
  requires_authentication: boolean;
  /** Permissions enforced server-side */
  required_permissions: string[];
  /** Mutation category (create, update, delete, custom) */
  mutation_type: string;
  /** Name of the backing model */
  model_name?: string | null;
  /** Server-specified form configuration hints */
  form_config?: Record<string, unknown> | null;
  /** Validation schema hints from the backend */
  validation_schema?: Record<string, unknown> | null;
  /** Success message supplied by the backend */
  success_message?: string | null;
  /** Error message templates supplied by the backend */
  error_messages?: Record<string, string> | null;
  /** UI metadata used to render row actions automatically */
  action?: Record<string, unknown> | null;
};

// Interface for individual option choices
export interface FilterOptionChoiceType {
  /** Option value (e.g., '1' for 'Active') */
  value: string;
  /** Option label in French (e.g., 'Actif') */
  label: string;
}

// Interface for individual filter options
export interface FilterOptionType {
  /** Filter option name (e.g., 'slug__iexact') */
  name: string;
  /** Django lookup expression (e.g., 'iexact') */
  lookup_expr:
    | "in"
    | "exact"
    | "contains"
    | "icontains"
    | "startswith"
    | "istartswith"
    | "endswith"
    | "iendswith"
    | "range"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "iregex"
    | "regex"
    | "count"
    | "count_gt"
    | "count_gte"
    | "count_lt"
    | "count_lte";
  /** Filter help text in French using field verbose_name */
  help_text: string;
  /** Filter class type (e.g., 'CharFilter') */
  filter_type:
    | "CharFilter"
    | "NumberFilter"
    | "BooleanFilter"
    | "DateFilter"
    | "DateTimeFilter"
    | "MultipleChoiceFilter"
    | "DateRangeFilter";
  /** Optional finite list of acceptable values */
  choices?: FilterOptionChoiceType[];
}

// Interface for grouped filter field metadata
export interface FilterFieldType {
  /** Target model field name */
  field_name: string;
  /** Whether this is a nested filter */
  is_nested: boolean;
  /** Related model name for nested filters */
  related_model?: string;
  /** Whether this includes custom filters */
  is_custom: boolean;
  /** List of filter options for this field */
  options: FilterOptionType[];
  /** Label for the filter field in French */
  field_label: string;
  /** List of choices for multiple choice filters */
  choices?: FilterOptionChoiceType[];
  /** Nested filter fields */
  nested?: FilterFieldType[];
}

// Main interface for comprehensive table metadata
export interface ModelTableType {
  /** Application name */
  app: string;
  /** Model name */
  model: string;
  /** Metadata version returned by the backend */
  metadataVersion: string;
  /** Singular verbose name */
  verboseName: string;
  /** Plural verbose name */
  verboseNamePlural: string;
  /** Database table name */
  tableName: string;
  /** Primary key field name */
  primaryKey: string;
  /** Default ordering fields */
  ordering: string[];
  /** Fallback ordering fields */
  defaultOrdering: string[];
  /** Field used by 'latest' manager */
  get_latest_by?: string;
  /** Manager names */
  managers: string[];
  /** Whether Django manages the table */
  managed: boolean;
  /** All field metadata */
  fields: TableFieldMetadataType[];
  /** Permission metadata for this model */
  permissions?: ModelPermissionMatrix | null;
  /** Available filters with field structure */
  filters: FilterFieldType[];
  /** Available GraphQL mutations (CRUD + custom) */
  mutations?: MutationMetadata[];
  /** Printable templates registered for this model */
  pdfTemplates?: ModelPdfTemplateMetadata[];
}

export interface ModelTableQueryResponse {
  response: ModelTableType;
}

export type GraphQLTableVars = {
  /** Application name */
  app_name: string;
  /** Model name */
  model_name: string;
  /** List of field names to exclude */
  exclude?: string[];
  /** List of field names to include */
  only?: string[];
  /** Whether to include nested fields */
  include_nested?: boolean;
  /** List of lookup expressions to include */
  only_lookup?: string[];
  /** List of lookup expressions to exclude */
  exclude_lookup?: string[];
};

// TypeScript types aligning with rail-django-graphql built-in queries

export type FilterScalar = string | number | boolean | Date | null;
export type FilterArg = FilterScalar | Array<string | number>;

export type ComplexFilterInput<FilterKey extends string = string> = Partial<
  Record<FilterKey, FilterArg>
> & {
  AND?: ComplexFilterInput<FilterKey>[];
  OR?: ComplexFilterInput<FilterKey>[];
  NOT?: ComplexFilterInput<FilterKey>;
};

export interface ModelVariables<FilterKey extends string = string> {
  filters?: ComplexFilterInput<FilterKey>;
  order_by?: string[];
  offset?: number;
  limit?: number;
  basicFilters?: Record<FilterKey, FilterArg>;
}

export interface ModelPaginatedVariables<FilterKey extends string = string> {
  filters?: ComplexFilterInput<FilterKey>;
  order_by?: string[];
  page?: number;
  per_page?: number;
  basicFilters?: Record<FilterKey, FilterArg>;
}

export interface ModelPagination {
  total_count: number;
  page_count: number;
  current_page: number;
  per_page: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface ModelPaginated<T> {
  items: T[];
  page_info: ModelPagination;
}

export type ModelItems<T> = T[];

export type OrderSpec = string;

export interface ModelTableMetadata {
  app: string;
  model: string;
  verboseName: string;
  verboseNamePlural: string;
  tableName: string;
  primaryKey: string;
  ordering: string[];
  defaultOrdering: string[];
  get_latest_by: string | null;
  managers: string[];
  managed: boolean;
  fields: TableFieldMetadataType[];
  filters: FilterFieldType[];
  permissions?: ModelPermissionMatrix | null;
  mutations?: MutationMetadata[];
  pdfTemplates?: ModelPdfTemplateMetadata[];
}

/**
 * Options that scope which metadata (fields/filters) are returned by the backend `model_table` query.
 *
 * These options are used by {@link useModelTableMetadata} and {@link useGraphQLModelTable} to:
 * - exclude or include specific fields,
 * - optionally include nested related filters,
 * - optionally restrict which lookup expressions are returned.
 */
export type ModelTableFiltersOptions = {
  /** Field names to exclude from metadata. */
  exclude?: string[];
  /** Field names to include in metadata (when provided, acts as an allow-list). */
  only?: string[];
  /** When true, include nested filter fields for relations. */
  include_nested?: boolean;
  /** Lookup expressions to include (e.g. `["exact","icontains"]`). */
  only_lookup?: string[];
  /** Lookup expressions to exclude (e.g. `["regex"]`). */
  exclude_lookup?: string[];
};

// ============================================
// Metadata V2 Types (from metadata_v2 API)
// ============================================

export interface ModelSchemaV2Response {
  modelSchema: {
    app: string;
    model: string;
    verboseName: string;
    verboseNamePlural: string;
    fields: FieldSchemaV2[];
    relationships: RelationshipSchemaV2[];
    mutations: MutationSchemaV2[];
    templates: TemplateInfoType[];
    permissions: ModelPermissionsType;
    filterConfig: FilterConfigTypeV2;
    relationFilters: RelationFilterSchemaV2[];
    fieldGroups: FieldGroupType[];
  };
}

export interface FieldSchemaV2 {
  name: string;
  verboseName: string;
  helpText?: string;
  fieldType: string;
  graphqlType: string;
  required: boolean;
  nullable: boolean;
  choices?: { value: string; label: string; group?: string }[];
  minValue?: number;
  maxValue?: number;
  isRelation: boolean;
  isNumeric: boolean;
  isDate: boolean;
  isDatetime: boolean;
  isBoolean: boolean;
  isText: boolean;
  isJson: boolean;
  isIndexed: boolean;
}

export interface RelationshipSchemaV2 {
  name: string;
  verboseName: string;
  relatedApp: string;
  relatedModel: string;
  relationType: string;
  isToMany: boolean;
  lookupField: string;
  searchFields: string[];
}

export interface MutationSchemaV2 {
  name: string;
  methodName?: string;
  description?: string;
  inputType?: string;
  inputFields: MutationInputFieldMeta[];
  requiresAuthentication: boolean;
  requiredPermissions: string[];
  mutationType: string;
  modelName?: string;
  formConfig?: Record<string, unknown>;
  successMessage?: string;
}

export interface FilterConfigTypeV2 {
  style: string;
  argumentName: string;
  inputTypeName: string;
  supportsAnd: boolean;
  supportsOr: boolean;
  supportsNot: boolean;
  supportsFts: boolean;
  supportsAggregation: boolean;
  presets?: Array<{
    name: string;
    description?: string;
    filterJson: Record<string, unknown>;
  }>;
  computedFilters?: Array<{
    name: string;
    filterType: string;
    description?: string;
  }>;
}

export interface RelationFilterSchemaV2 {
  relationName: string;
  relationType: string;
  supportsSome: boolean;
  supportsEvery: boolean;
  supportsNone: boolean;
  supportsCount: boolean;
  nestedFilterType: string;
}

export interface FieldGroupType {
  key: string;
  label: string;
  description?: string;
  fields: string[];
  collapsed?: boolean;
}

export interface ModelPermissionsType {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canRead: boolean;
  canList: boolean;
  canHistory: boolean;
}

export interface TemplateInfoType {
  key: string;
  title: string;
  endpoint: string;
  urlPath: string;
  guard?: string | null;
  requireAuthentication: boolean;
  roles: string[];
  permissions: string[];
  allowed: boolean;
  denialReason?: string | null;
  allowClientData?: boolean;
  clientDataFields?: string[];
  clientDataSchema?: Array<{ name: string; type?: string | null }> | null;
}

export interface ModelTableMetadataV2 extends ModelTableType {
  metadataVersion: "v2";
  fields: TableFieldMetadataType[];
  relationships: RelationshipSchemaV2[];
  mutations: MutationMetadata[];
  templates: ModelPdfTemplateMetadata[];
  permissions: ModelPermissionMatrix;
  filterConfig: FilterConfigTypeV2;
  relationFilters: RelationFilterSchemaV2[];
  fieldGroups: FieldGroupType[];
  filterSchema: Array<{
    fieldName: string;
    fieldLabel: string;
    baseType: string;
    isNested: boolean;
    relatedModel?: string;
    filterInputType: string;
    availableOperators: string[];
    options: Array<{
      name: string;
      lookup: string;
      label: string;
      helpText?: string;
      choices?: { value: string; label: string }[];
      graphqlType: string;
      isList: boolean;
    }>;
  }>;
  // Compatibility aliases consumed by legacy callers.
  filters: FilterFieldType[];
  pdfTemplates: ModelPdfTemplateMetadata[];
}
