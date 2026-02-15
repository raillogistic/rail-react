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

export interface FieldMetadata {
  name: string;
  fieldName?: string;
  verboseName: string;
  helpText?: string;
  
  fieldType: string;
  graphqlType: string;
  pythonType?: string;
  
  required: boolean;
  nullable: boolean;
  blank: boolean;
  editable: boolean;
  unique: boolean;
  
  maxLength?: number;
  minLength?: number;
  maxValue?: number;
  minValue?: number;
  decimalPlaces?: number;
  maxDigits?: number;
  
  choices?: Choice[];
  
  defaultValue?: string; // JSON string
  hasDefault: boolean;
  autoNow: boolean;
  autoNowAdd: boolean;
  
  validators?: ValidatorInfo[];
  regexPattern?: string;
  
  readable: boolean;
  writable: boolean;
  visibility: string;
  
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
  
  fsmTransitions?: FSMTransition[];
  
  customMetadata?: string; // JSON string
}

export interface RelationshipMetadata {
  name: string;
  fieldName?: string;
  verboseName: string;
  helpText?: string;
  
  relatedApp: string;
  relatedModel: string;
  relatedModelVerbose: string;
  
  relationType: string;
  isReverse: boolean;
  isToOne: boolean;
  isToMany: boolean;
  
  onDelete?: string;
  relatedName?: string;
  throughModel?: string;
  
  required: boolean;
  nullable: boolean;
  editable: boolean;
  
  lookupField: string;
  searchFields?: string[];
  
  readable: boolean;
  writable: boolean;
  canCreateInline: boolean;
  
  customMetadata?: string; // JSON string
}

export interface MutationInputField {
  name: string;
  fieldName?: string;
  fieldType: string;
  graphqlType: string;
  required: boolean;
  defaultValue?: string; // JSON string
  description?: string;
  choices?: Choice[];
  relatedModel?: string;
  
  // Extra fields from tables/types.ts that might be useful or need matching
  validationRules?: Record<string, unknown>;
  widgetType?: string;
  placeholder?: string;
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  multiple?: boolean;
}

export interface MutationMetadata {
  name: string;
  operation: string;
  description?: string;
  methodName?: string;
  inputFields: MutationInputField[];
  inputType?: string;
  returnType?: string;
  allowed: boolean;
  requiredPermissions?: string[];
  reason?: string;
  
  // Extra fields from tables/types.ts
  mutationType?: string; // Deprecated or alias for operation?
  modelName?: string;
  formConfig?: string; // JSON string
  successMessage?: string;
  errorMessages?: Record<string, string>;
  action?: string | Record<string, unknown> | null; // JSON string or parsed object
  requiresAuthentication?: boolean;
}

export interface FilterOption {
  name: string;
  lookup: string;
  label: string;
  helpText?: string;
  choices?: Choice[];
  graphqlType?: string;
  isList?: boolean;
}

export interface FilterSchema {
  name?: string;
  fieldName: string;
  fieldLabel: string;
  baseType?: string;
  isNested: boolean;
  relatedModel?: string;
  options: FilterOption[];
  
  filterInputType?: string;
  availableOperators?: string[];
}

export interface FilterPreset {
  name: string;
  presetName?: string;
  description?: string;
  filterJson: string; // JSON string
}

export interface ComputedFilter {
  name: string;
  fieldName?: string;
  filterType: string;
  description?: string;
}

export interface FilterConfig {
  style: string;
  argumentName: string;
  inputTypeName: string;
  supportsAnd: boolean;
  supportsOr: boolean;
  supportsNot: boolean;
  dualModeEnabled: boolean;
  supportsQuick?: boolean;
  supportsFts: boolean;
  supportsAggregation: boolean;
  presets?: FilterPreset[];
  computedFilters?: ComputedFilter[];
}

export interface RelationFilter {
  name?: string;
  fieldName?: string;
  relationName?: string;
  relationType: string;
  supportsSome: boolean;
  supportsEvery: boolean;
  supportsNone: boolean;
  supportsCount: boolean;
  nestedFilterType?: string;
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
  
  // Aliases for compatibility
  canRead?: boolean;
  canHistory?: boolean;
}

export interface FieldGroup {
  key: string;
  label: string;
  description?: string;
  fields: string[];
  collapsed?: boolean;
}

export interface TemplateInfo {
  key: string;
  templateType?: string;
  title: string;
  description?: string;
  endpoint: string;
  
  // Extra fields from tables/types.ts
  urlPath?: string;
  guard?: string;
  requireAuthentication?: boolean;
  roles?: string[];
  permissions?: string[];
  allowed?: boolean;
  denialReason?: string;
  allowClientData?: boolean;
  clientDataFields?: string[];
  clientDataSchema?:
    | string
    | Array<{ name: string; type?: string | null }>
    | null;
}

export interface ModelMetadata {
  app: string;
  model: string;
  verboseName: string;
  verboseNamePlural: string;
  
  primaryKey: string;
  ordering?: string[];
  uniqueTogether?: string[][];
  
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
  
  filters: FilterSchema[];
  filterConfig?: FilterConfig;
  relationFilters?: RelationFilter[];
  
  mutations: MutationMetadata[];
  
  permissions: ModelPermissions;
  
  fieldGroups?: FieldGroup[];
  
  templates?: TemplateInfo[];
  
  metadataVersion: string;
  customMetadata?: string; // JSON string
}
