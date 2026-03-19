import { gql, type ApolloClient, type FetchResult } from "@apollo/client";
import type {
  FormFieldConfig,
  FormSchema,
} from "@/widgets/model-form/inputs/types";
import { buildModelMethodInputType } from "@/shared/api/graphql/graphql/mutations/naming";
import type {
  MutationInputField,
  MutationMetadata,
} from "@/shared/api/graphql/graphql/metadata/types";
import { toGraphqlFieldName } from "@/widgets/model-table";

export type MutationActionMode = "confirm" | "form";

export type MutationActionIdentifierConfig = {
  argumentName?: string;
  variableName?: string;
  variableType?: string;
  value?: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonObject(
  value: unknown,
): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseDefaultValue(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(?:\.\d+)?$/.test(trimmed) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message || fallback;
  }
  if (typeof error === "string") {
    const message = error.trim();
    return message || fallback;
  }
  return fallback;
}

export function humanizeLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();

  if (!withSpaces) return value;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function resolveFormFieldType(
  field: MutationInputField,
): FormSchema["fields"][number]["type"] {
  const normalized = String(
    field.graphqlType || field.fieldType || "",
  ).toLowerCase();

  if (Array.isArray(field.choices) && field.choices.length > 0) {
    return "select";
  }
  if (normalized.includes("bool")) return "checkbox";
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("number")
  ) {
    return "number";
  }
  if (normalized.includes("datetime")) return "datetime-local";
  if (normalized.includes("date")) return "date";
  if (normalized.includes("time")) return "time";
  if (normalized.includes("json")) return "json";
  return "text";
}

export function normalizeMutationInputFields(
  mutation: MutationMetadata,
): MutationInputField[] {
  const source = Array.isArray(mutation.inputFields) ? mutation.inputFields : [];

  return source
    .filter((field): field is MutationInputField => isRecord(field))
    .map((field, index) => {
      const fieldNameRaw =
        typeof field.name === "string"
          ? field.name
          : typeof field.fieldName === "string"
            ? field.fieldName
            : `field${index + 1}`;
      const fieldName = toGraphqlFieldName(fieldNameRaw) || fieldNameRaw;

      const rawChoices = Array.isArray(field.choices) ? field.choices : [];
      const choices = rawChoices
        .map((choice) => {
          if (!isRecord(choice)) return null;
          const value = choice.value;
          if (value === undefined || value === null) return null;

          return {
            value: String(value),
            label: String(choice.label ?? value),
          };
        })
        .filter(
          (choice): choice is { value: string; label: string } =>
            Boolean(choice),
        );

      return {
        ...field,
        name: fieldName,
        fieldName,
        choices,
        required: Boolean(field.required),
      };
    });
}

export function buildMutationSchema(
  fields: MutationInputField[],
): FormSchema | null {
  if (fields.length === 0) return null;

  return {
    fields: fields.map(
      (field) =>
        ({
          name: field.name || "",
          label: humanizeLabel(field.name || field.fieldName || "Field"),
          type: resolveFormFieldType(field),
          required: Boolean(field.required),
          description: field.description || undefined,
          choices: (field.choices ?? []).map((choice) => ({
            value: String(choice.value),
            label: String(choice.label),
          })),
        }) as unknown as FormFieldConfig,
    ),
  };
}

export function applyFieldOverrides(
  schema: FormSchema | null,
  overrides?: Record<string, Partial<FormFieldConfig>>,
): FormSchema | null {
  if (!schema || !overrides || Object.keys(overrides).length === 0) {
    return schema;
  }

  return {
    ...schema,
    fields: schema.fields.map((field) => {
      const name = String(field.name ?? "").trim();
      if (!name) return field;

      const override = overrides[name];
      if (!override) return field;

      return {
        ...field,
        ...override,
        name,
      } as typeof field;
    }),
  };
}

export function buildMutationDefaults(
  fields: MutationInputField[],
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const name = field.name || field.fieldName;
    if (!name || field.defaultValue === undefined) {
      return acc;
    }

    acc[name] = parseDefaultValue(field.defaultValue);
    return acc;
  }, {});
}

export function resolveMutationActionMode(
  mutation: MutationMetadata,
  inputFields: MutationInputField[],
): MutationActionMode {
  const actionPayload = parseJsonObject(mutation.action);
  const declaredMode = String(actionPayload?.mode ?? "").trim().toLowerCase();

  if (declaredMode === "confirm") return "confirm";
  if (declaredMode === "form") return inputFields.length > 0 ? "form" : "confirm";
  return inputFields.length > 0 ? "form" : "confirm";
}

export function buildMutationOperationNames(
  mutation: MutationMetadata,
  fallbackModelName: string,
): string[] {
  const names = new Set<string>();

  const directName = String(mutation.name ?? "").trim();
  if (directName) {
    names.add(directName);
  }

  const methodToken = mutation.methodName
    ? toGraphqlFieldName(mutation.methodName)
    : "";
  const modelToken = String(
    mutation.modelName ?? fallbackModelName ?? "",
  ).trim();

  if (methodToken && modelToken) {
    names.add(`${methodToken}${modelToken}`);
  }

  return [...names].filter((entry) => entry.length > 0);
}

function resolveMutationInputType(
  mutation: MutationMetadata,
  fallbackModelName: string,
): string | null {
  const explicitInputType = String(mutation.inputType ?? "").trim();
  if (explicitInputType) {
    return explicitInputType;
  }

  const methodName = String(mutation.methodName ?? "").trim();
  const modelName = String(
    mutation.modelName ?? fallbackModelName ?? "",
  ).trim();
  if (!methodName || !modelName) {
    return null;
  }

  return buildModelMethodInputType(modelName, methodName);
}

function normalizeGraphqlType(
  rawType: string | undefined,
  required: boolean,
): string {
  const base = String(rawType ?? "String")
    .replace(/\s+/g, "")
    .replace(/!$/, "");

  if (!base) {
    return required ? "String!" : "String";
  }

  return required ? `${base}!` : base;
}

export function buildMutationDocument(options: {
  operationName: string;
  inputType?: string | null;
  inputFields: MutationInputField[];
  useInputObject: boolean;
  identifier?: MutationActionIdentifierConfig;
}): ReturnType<typeof gql> {
  const variableDefinitions: string[] = [];
  const argumentMappings: string[] = [];

  if (options.identifier?.value) {
    const variableName = options.identifier.variableName?.trim() || "id";
    const argumentName =
      options.identifier.argumentName?.trim() || variableName;
    const variableType =
      options.identifier.variableType?.trim() || "ID!";

    variableDefinitions.push(`$${variableName}: ${variableType}`);
    argumentMappings.push(`${argumentName}: $${variableName}`);
  }

  if (
    options.inputFields.length > 0 &&
    options.useInputObject &&
    options.inputType
  ) {
    const inputTypeName = normalizeGraphqlType(options.inputType, true);
    variableDefinitions.push(`$input: ${inputTypeName}`);
    argumentMappings.push("input: $input");
  } else if (options.inputFields.length > 0) {
    options.inputFields.forEach((field) => {
      const variableName = String(field.name ?? field.fieldName ?? "").trim();
      if (!variableName) return;

      const variableType = normalizeGraphqlType(
        String(field.graphqlType ?? field.fieldType ?? "String"),
        Boolean(field.required),
      );
      variableDefinitions.push(`$${variableName}: ${variableType}`);
      argumentMappings.push(`${variableName}: $${variableName}`);
    });
  }

  const variableBlock =
    variableDefinitions.length > 0 ? `(${variableDefinitions.join(", ")})` : "";
  const argumentBlock =
    argumentMappings.length > 0 ? `(${argumentMappings.join(", ")})` : "";

  return gql`
    mutation ${options.operationName}${variableBlock} {
      response: ${options.operationName}${argumentBlock} {
        ok
        errors {
          field
          message
          code
          severity
          details
        }
      }
    }
  `;
}

function extractGraphqlErrors(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((entry): entry is { message?: string } => isRecord(entry))
    .map((entry) => String(entry.message ?? "").trim())
    .filter(Boolean);
}

export async function executeCustomMutationAction(options: {
  client: ApolloClient<unknown>;
  mutation: MutationMetadata;
  modelName: string;
  payload: Record<string, unknown>;
  identifier?: MutationActionIdentifierConfig;
  buildVariables?: (context: {
    baseVariables: Record<string, unknown>;
    payload: Record<string, unknown>;
    useInputObject: boolean;
    operationName: string;
    mutation: MutationMetadata;
  }) => Record<string, unknown>;
}): Promise<FetchResult<Record<string, unknown>>> {
  const operationNames = buildMutationOperationNames(
    options.mutation,
    options.modelName,
  );
  if (operationNames.length === 0) {
    throw new Error("Mutation operation could not be resolved.");
  }

  const inputFields = normalizeMutationInputFields(options.mutation);
  const hasInputPayload = inputFields.length > 0;
  const inputPayload = hasInputPayload ? options.payload : {};
  const inputType = hasInputPayload
    ? resolveMutationInputType(options.mutation, options.modelName)
    : null;
  if (hasInputPayload && !inputType) {
    throw new Error("Mutation input type could not be resolved.");
  }
  const errors: string[] = [];

  for (const operationName of operationNames) {
    const plans = hasInputPayload ? [true] : [false];

    for (const useInputObject of plans) {
      const document = buildMutationDocument({
        operationName,
        inputType,
        inputFields,
        useInputObject,
        identifier: options.identifier,
      });

      const baseVariables: Record<string, unknown> = {};
      if (options.identifier?.value) {
        const variableName = options.identifier.variableName?.trim() || "id";
        baseVariables[variableName] = options.identifier.value;
      }

      if (hasInputPayload && useInputObject) {
        baseVariables.input = inputPayload;
      } else if (hasInputPayload) {
        Object.assign(baseVariables, inputPayload);
      }

      const variables = options.buildVariables
        ? options.buildVariables({
            baseVariables,
            payload: inputPayload,
            useInputObject,
            operationName,
            mutation: options.mutation,
          })
        : baseVariables;

      try {
        const result = await options.client.mutate<Record<string, unknown>>({
          mutation: document,
          variables,
          errorPolicy: "all",
        });

        const response = (
          result.data as {
            response?: {
              ok?: boolean;
              errors?: Array<{ message?: string }>;
            };
          } | null
        )?.response;

        if (response?.ok) {
          return result;
        }

        const responseError = (response?.errors ?? []).find(
          (item) =>
            typeof item?.message === "string" && Boolean(item.message),
        );
        if (responseError?.message) {
          throw new Error(responseError.message);
        }

        const requestErrors = extractGraphqlErrors(result.errors);
        if (requestErrors.length > 0) {
          errors.push(...requestErrors);
        }
      } catch (error) {
        errors.push(getErrorMessage(error, "Mutation execution failed."));
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors[errors.length - 1]);
  }

  throw new Error("Mutation execution failed.");
}
