export type ModelFormMode = "CREATE" | "UPDATE" | "VIEW";

export type ModelFormFieldKind =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DECIMAL"
  | "BOOLEAN"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "CHOICE"
  | "MULTI_CHOICE"
  | "JSON"
  | "FILE"
  | "RELATION"
  | "CUSTOM";

export type ModelFormNestedAction =
  | "CONNECT"
  | "CREATE"
  | "UPDATE"
  | "DISCONNECT"
  | "DELETE"
  | "SET"
  | "CLEAR";

export type ModelFormErrorSource = "OPERATION" | "EXECUTION" | "TRANSPORT";

export type ModelFormRuntimeOverride = {
  path: string;
  value?: unknown;
  action?: "REPLACE" | "MERGE" | "UNSET";
};

export type ModelFormValidator = {
  type: string;
  message?: string | null;
  params?: Record<string, unknown> | null;
};

export type ModelFormContractField = {
  path: string;
  fieldName: string;
  label: string;
  kind: ModelFormFieldKind;
  graphqlType: string;
  pythonType: string;
  required: boolean;
  nullable: boolean;
  readOnly: boolean;
  hidden: boolean;
  defaultValue?: unknown;
  constraints?: Record<string, unknown> | null;
  validators: ModelFormValidator[];
  ui?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type ModelFormContractSection = {
  id: string;
  title?: string | null;
  description?: string | null;
  fieldPaths: string[];
  order?: number | null;
  layout?: Record<string, unknown> | null;
  visible: boolean;
};

export type ModelFormRelationActionPolicy = {
  path: string;
  allowedActions: ModelFormNestedAction[];
  blockedActions: ModelFormNestedAction[];
  nestedEnabled: boolean;
};

export type ModelFormContractRelation = {
  path: string;
  label: string;
  relationType?: string;
  toMany: boolean;
  relatedAppLabel: string;
  relatedModelName: string;
  policy: ModelFormRelationActionPolicy;
  nestedForm?: Record<string, unknown> | null;
};

export type ModelFormMutationBindings = {
  createOperation: string;
  updateOperation: string;
  bulkCreateOperation: string;
  bulkUpdateOperation: string;
  updateIdentifierKey?: string | null;
  updateTargetPolicy: "PRIMARY_KEY_ONLY";
  bulkCommitPolicy: "ATOMIC";
  conflictPolicy: "REJECT_STALE";
};

export type ModelFormSubmitBindings = {
  createOperation: string;
  updateOperation: string;
  defaultIdentifierKey: string;
  formErrorKey: string;
};

export type ModelFormSubmitContract = {
  appLabel: string;
  modelName: string;
  bindings: ModelFormSubmitBindings;
};

export type ModelFormErrorPolicy = {
  canonicalFormErrorKey: string;
  fieldPathNotation: string;
  bulkRowPrefixPattern: string;
};

export type ModelFormContract = {
  id: string;
  appLabel: string;
  modelName: string;
  mode: ModelFormMode;
  version: string;
  configVersion: string;
  generatedAt: string;
  fields: ModelFormContractField[];
  sections: ModelFormContractSection[];
  relations: ModelFormContractRelation[];
  mutationBindings: ModelFormMutationBindings;
  errorPolicy: ModelFormErrorPolicy;
};

export type ModelFormContractPage = {
  page: number;
  perPage: number;
  total: number;
  results: ModelFormContract[];
};

export type ModelFormInitialData = {
  appLabel: string;
  modelName: string;
  objectId: string;
  values: Record<string, unknown>;
  readonlyValues?: Record<string, unknown> | null;
  loadedAt: string;
};

export type NormalizedModelFormError = {
  field: string;
  message: string;
  code?: string | null;
  source: ModelFormErrorSource;
  conflict?: boolean;
  rowIndex?: number | null;
  meta?: Record<string, unknown> | null;
};

export type ModelFormMutationOutcome = {
  ok: boolean;
  errors: NormalizedModelFormError[];
  conflict: boolean;
  formErrorKey: string;
};
