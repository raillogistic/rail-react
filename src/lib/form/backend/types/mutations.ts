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
  /**
   * Mutation input payload containing the record identifier.
   */
  input: TInput & { id: string };
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

function toCamelCaseIdentifier(value: string): string {
  if (!value) return value;
  const hasUnderscore = value.includes("_") || value.includes(" ");
  if (!hasUnderscore) {
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized = toPascalCase(part);
      if (index === 0) {
        return normalized.charAt(0).toLowerCase() + normalized.slice(1);
      }
      return normalized;
    })
    .join("");
}
function toPascalCase(value: string): string {
  if (!value) return value;
  if (!value.includes('_') && !value.includes(' ')) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
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
  const pascalModel = toPascalCase(modelName);
  const inputType = getInputType('Create', pascalModel);
  const operation = toCamelCaseIdentifier(`create_${pascalModel}`);
  return (
    `mutation ${operation}($input: ${inputType}!) {\n` +
    `  response: ${operation}(input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_update_mutation(modelName: string, selection = 'id'): string {
  const pascalModel = toPascalCase(modelName);
  const inputType = getInputType('Update', pascalModel);
  const operation = toCamelCaseIdentifier(`update_${pascalModel}`);
  return (
    `mutation ${operation}($input: ${inputType}!) {\n` +
    `  response: ${operation}(input: $input) {\n` +
    `    ok\n` +
    `    object { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_delete_mutation(modelName: string, selection = 'id'): string {
  const pascalModel = toPascalCase(modelName);
  const operation = toCamelCaseIdentifier(`delete_${pascalModel}`);
  const objectSelection = selection.trim()
    ? `    object { ${selection} }\n`
    : "";
  return (
    `mutation ${operation}($id: ID!) {\n` +
    `  response: ${operation}(id: $id) {\n` +
    `    ok\n` +
    objectSelection +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_create_mutation(modelName: string, selection = 'id'): string {
  const pascalModel = toPascalCase(modelName);
  const inputType = getInputType('Create', pascalModel);
  const operation = toCamelCaseIdentifier(`bulk_create_${pascalModel}`);
  return (
    `mutation ${operation}($inputs: [${inputType}!]!) {\n` +
    `  response: ${operation}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_update_mutation(modelName: string, selection = 'id', bulkInputType = 'BulkUpdateInput'): string {
  const pascalModel = toPascalCase(modelName);
  const operation = toCamelCaseIdentifier(`bulk_update_${pascalModel}`);
  return (
    `mutation ${operation}($inputs: [${bulkInputType}!]!) {\n` +
    `  response: ${operation}(inputs: $inputs) {\n` +
    `    ok\n` +
    `    objects { ${selection} }\n` +
    `    errors { field message }\n` +
    `  }\n` +
    `}`
  );
}

export function build_bulk_delete_mutation(modelName: string, selection = 'id'): string {
  const pascalModel = toPascalCase(modelName);
  const operation = toCamelCaseIdentifier(`bulk_delete_${pascalModel}`);
  return (
    `mutation ${operation}($ids: [ID!]!) {\n` +
    `  response: ${operation}(ids: $ids) {\n` +
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
  const pascalModel = toPascalCase(modelName);
  const camelModel = toCamelCaseIdentifier(pascalModel);
  const includeInput = options.include_input === true;
  const inputType =
    options.input_type_name || `${pascalModel}${toPascalCase(methodName)}Input`;
  const resultBlock = options.result_selection ? `result { ${options.result_selection} }` : `result`;
  const defaultField = `${camelModel}${toPascalCase(methodName)}`;
  const mutationField = options.field_name
    ? toCamelCaseIdentifier(options.field_name)
    : defaultField;
  const operation = mutationField;

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
