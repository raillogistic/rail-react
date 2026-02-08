// AI-GENERATED: Review required
// Purpose: Reusable GraphQL mutation builders and related TypeScript types

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type MutationError = {
  field?: string | null;
  message: string;
  code?: string | null;
  severity?: "error" | "warning" | "info" | string;
  details?: Record<string, any> | null;
};

export type CreateMutationResponse<TModel> = {
  ok: boolean;
  object: TModel | null;
  errors: MutationError[] | null;
};

export type UpdateMutationResponse<TModel> = CreateMutationResponse<TModel>;
export type DeleteMutationResponse<TModel> = CreateMutationResponse<TModel>;
export type BulkCreateMutationResponse<TModel> = {
  ok: boolean;
  objects: TModel[];
  errors: MutationError[] | null;
};
export type BulkUpdateMutationResponse<TModel> =
  BulkCreateMutationResponse<TModel>;
export type BulkDeleteMutationResponse<TModel> =
  BulkCreateMutationResponse<TModel>;
export type MethodMutationResponse<TResult> = {
  ok: boolean;
  result: TResult | null;
  errors: MutationError[] | null;
};

export type CreateMutationVariables<TInput extends Record<string, JsonValue>> =
  { input: TInput };
export type UpdateMutationVariables<TInput extends Record<string, JsonValue>> =
  {
    id: string;
    input: TInput;
  };
export type BulkCreateMutationVariables<TInput extends Record<string, JsonValue>> =
  { inputs: TInput[] };
export type BulkUpdateItem<TInput extends Record<string, JsonValue>> = {
  id: string;
  data: TInput;
};
export type BulkUpdateMutationVariables<TInput extends Record<string, JsonValue>> =
  { inputs: BulkUpdateItem<TInput>[] };
export type BulkDeleteMutationVariables = { ids: string[] };
export type MethodMutationVariables<
  TInput extends Record<string, JsonValue> | undefined = undefined,
> = TInput extends Record<string, JsonValue>
  ? { id: string; input: TInput }
  : { id: string };

/**
 * Normalizes a model name to the GraphQL operation field base identifier.
 * (e.g. "order_item" -> "orderItem").
 */
export function toOperationField(modelName: string): string {
  const pascal = toPascalCase(modelName);
  if (!pascal) return "";
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toPascalCase(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const hasUpper = /[A-Z]/.test(normalized);
  const hasSeparator = /[_\s-]/.test(normalized);
  if (hasUpper && !hasSeparator) return normalized;
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function getInputType(prefix: "Create" | "Update", modelName: string): string {
  const pascal = toPascalCase(modelName);
  return `${prefix}${pascal}Input`;
}

function getMutationField(prefix: string, modelName: string): string {
  const pascal = toPascalCase(modelName);
  return pascal ? `${prefix}${pascal}` : prefix;
}

export function getMutationFieldName(
  modelName: string,
  mode:
    | "create"
    | "update"
    | "delete"
    | "bulkCreate"
    | "bulkUpdate"
    | "bulkDelete",
): string {
  return getMutationField(mode, modelName);
}

export function build_create_mutation(
  modelName: string,
  selection = "id",
): string {
  const field = getMutationField("create", modelName);
  const inputType = getInputType("Create", modelName);
  const operation = field || "create";
  return (
    `mutation ${operation}($input: ${inputType}!) {\n` +
    `  response: ${field}(input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export function build_update_mutation(
  modelName: string,
  selection = "id",
): string {
  const field = getMutationField("update", modelName);
  const inputType = getInputType("Update", modelName);
  const operation = field || "update";
  return (
    `mutation ${operation}($id: ID!, $input: ${inputType}!) {\n` +
    `  response: ${field}(id: $id, input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export function build_delete_mutation(
  modelName: string,
  selection = "id",
): string {
  const field = getMutationField("delete", modelName);
  const operation = field || "delete";
  const objectSelection = selection.trim()
    ? `    object { ${selection} }\n`
    : "";
  return (
    `mutation ${operation}($id: ID!) {\n` +
    `  response: ${field}(id: $id) {\n` +
    `    ok\n` +
    objectSelection +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_create_mutation(
  modelName: string,
  selection = "id",
): string {
  const field = getMutationField("bulkCreate", modelName);
  const inputType = getInputType("Create", modelName);
  const operation = field || "bulkCreate";
  return (
    `mutation ${operation}($inputs: [${inputType}!]!) {\n` +
    `  response: ${field}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_update_mutation(
  modelName: string,
  selection = "id",
  bulkInputType = "BulkUpdateInput",
): string {
  const field = getMutationField("bulkUpdate", modelName);
  const operation = field || "bulkUpdate";
  return (
    `mutation ${operation}($inputs: [${bulkInputType}!]!) {\n` +
    `  response: ${field}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_delete_mutation(
  modelName: string,
  selection = "id",
): string {
  const field = getMutationField("bulkDelete", modelName);
  const operation = field || "bulkDelete";
  return (
    `mutation ${operation}($ids: [ID!]!) {\n` +
    `  response: ${field}(ids: $ids) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}

export type MethodMutationBuilderOptions = {
  include_input?: boolean;
  input_type_name?: string;
  result_selection?: string;
  field_name?: string;
};

export function build_method_mutation(
  modelName: string,
  methodName: string,
  options: MethodMutationBuilderOptions = {},
): string {
  const baseField = toOperationField(modelName);
  const method = toPascalCase(methodName);
  const includeInput = options.include_input === true;
  const inputType =
    options.input_type_name ||
    `${toPascalCase(modelName)}${toPascalCase(methodName)}Input`;
  const resultBlock = options.result_selection
    ? `result { ${options.result_selection} }`
    : `result`;
  const fieldName = options.field_name || `${baseField}${method}`;
  const operation = fieldName || `${baseField}${method}`;

  const varDefs = includeInput ? `($id: ID!, $input: ${inputType}!)` : `($id: ID!)`;
  const argDefs = includeInput ? `(id: $id, input: $input)` : `(id: $id)`;

  return (
    `mutation ${operation}${varDefs} {\n` +
    `  response: ${fieldName}${argDefs} {\n` +
    `    ok\n` +
    `    ${resultBlock}\n` +
    `    errors { field message code severity details }\n` +
    `  }\n` +
    `}`
  );
}
