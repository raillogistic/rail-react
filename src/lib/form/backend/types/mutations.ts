// AI-GENERATED: Review required
// Purpose: Reusable GraphQL mutation builders and related TypeScript types

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type MutationError = {
  field?: string | null;
  message: string;
};

export type CreateMutationResponse<TModel> = {
  ok: boolean;
  object: TModel | null;
  errors: MutationError[] | null;
};

export type UpdateMutationResponse<TModel> = CreateMutationResponse<TModel>;
export type DeleteMutationResponse<TModel> = CreateMutationResponse<TModel>;
export type BulkCreateMutationResponse<TModel> = { ok: boolean; objects: TModel[]; errors: MutationError[] | null };
export type BulkUpdateMutationResponse<TModel> = BulkCreateMutationResponse<TModel>;
export type BulkDeleteMutationResponse<TModel> = BulkCreateMutationResponse<TModel>;
export type MethodMutationResponse<TResult> = { ok: boolean; result: TResult | null; errors: MutationError[] | null };

export type CreateMutationVariables<TInput extends Record<string, JsonValue>> = { input: TInput };
export type UpdateMutationVariables<TInput extends Record<string, JsonValue>> = {
  id: string;
  input: TInput;
};
export type BulkCreateMutationVariables<TInput extends Record<string, JsonValue>> = { inputs: TInput[] };
export type BulkUpdateItem<TInput extends Record<string, JsonValue>> = { id: string; data: TInput };
export type BulkUpdateMutationVariables<TInput extends Record<string, JsonValue>> = { inputs: BulkUpdateItem<TInput>[] };
export type BulkDeleteMutationVariables = { ids: string[] };
export type MethodMutationVariables<TInput extends Record<string, JsonValue> | undefined = undefined> =
  TInput extends Record<string, JsonValue>
    ? { id: string; input: TInput }
    : { id: string };

/**
 * Normalizes a model name to the GraphQL mutation field identifier.
 * Ensures consistency between mutation builders and runtime payload lookups.
 */
export function toOperationField(modelName: string): string {
  return modelName.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}
function toPascalCase(value: string): string {
  const hasUpper = /[A-Z]/.test(value);
  if (hasUpper && !value.includes('_')) return value;
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
function getInputType(prefix: 'Create' | 'Update', modelName: string): string {
  return `${prefix}${modelName}Input`;
}

export function build_create_mutation(modelName: string, selection = 'id'): string {
  const field = toOperationField(modelName);
  const inputType = getInputType('Create', modelName);
  const operation = `create_${field}`;
  return (
    `mutation ${operation}($input: ${inputType}!) {\n` +
    `  response: create_${field}(input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_update_mutation(modelName: string, selection = 'id'): string {
  const field = toOperationField(modelName);
  const inputType = getInputType('Update', modelName);
  const operation = `update_${field}`;
  return (
    `mutation ${operation}($id: ID!, $input: ${inputType}!) {\n` +
    `  response: update_${field}(id: $id, input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_delete_mutation(modelName: string, selection = 'id'): string {
  const field = toOperationField(modelName);
  const operation = `delete_${field}`;
  const objectSelection = selection.trim()
    ? `    object { ${selection} }\n`
    : "";
  return (
    `mutation ${operation}($id: ID!) {\n` +
    `  response: delete_${field}(id: $id) {\n` +
    `    ok\n` +
    objectSelection +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_create_mutation(modelName: string, selection = 'id'): string {
  const field = toOperationField(modelName);
  const inputType = getInputType('Create', modelName);
  const operation = `bulk_create_${field}`;
  return (
    `mutation ${operation}($inputs: [${inputType}!]!) {\n` +
    `  response: bulk_create_${field}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_update_mutation(modelName: string, selection = 'id', bulkInputType = 'BulkUpdateInput'): string {
  const field = toOperationField(modelName);
  const operation = `bulk_update_${field}`;
  return (
    `mutation ${operation}($inputs: [${bulkInputType}!]!) {\n` +
    `  response: bulk_update_${field}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_delete_mutation(modelName: string, selection = 'id'): string {
  const field = toOperationField(modelName);
  const operation = `bulk_delete_${field}`;
  return (
    `mutation ${operation}($ids: [ID!]!) {\n` +
    `  response: bulk_delete_${field}(ids: $ids) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message }\n` +
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
  const field = toOperationField(modelName);
  const pascalModel = toPascalCase(modelName);
  const includeInput = options.include_input === true;
  const inputType = options.input_type_name || `${pascalModel}${toPascalCase(methodName)}Input`;
  const resultBlock = options.result_selection ? `result { ${options.result_selection} }` : `result`;
  const operation = options.field_name || `${field}_${methodName}`;
  const mutationField = options.field_name || `${field}_${methodName}`;

  const varDefs = includeInput ? `($id: ID!, $input: ${inputType}!)` : `($id: ID!)`;
  const argDefs = includeInput ? `(id: $id, input: $input)` : `(id: $id)`;

  return (
    `mutation ${operation}${varDefs} {\n` +
    `  response: ${mutationField}${argDefs} {\n` +
    `    ok\n` +
    `    ${resultBlock}\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}
