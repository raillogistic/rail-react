import { useMemo } from "react";
import type { FormFieldConfig, FormSchema, FormSectionConfig } from "../types/schema";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormRuntimeOverride,
} from "../types/generatedContract";
import { asRecord, parseJsonValue } from "../utils/jsonCoercion";
import {
  getValueByPath,
  mergeValueByPath,
  setValueByPath,
  unsetValueByPath,
} from "../utils/objectPath";

type UseGeneratedModelFormOptions = {
  contract?: ModelFormContract | null;
  initialData?: ModelFormInitialData | null;
  runtimeOverrides?: ModelFormRuntimeOverride[];
  generatedEnabled?: boolean;
  legacySchema?: FormSchema<Record<string, any>>;
};

function mapKindToInputType(kind: string): FormFieldConfig["type"] {
  switch (kind) {
    case "TEXTAREA":
      return "textarea";
    case "NUMBER":
      return "number";
    case "DECIMAL":
      return "decimal";
    case "BOOLEAN":
      return "switch";
    case "DATE":
      return "date";
    case "TIME":
      return "time";
    case "DATETIME":
      return "datetime-local";
    case "CHOICE":
      return "select";
    case "MULTI_CHOICE":
      return "select";
    case "JSON":
      return "json";
    case "FILE":
      return "file";
    default:
      return "text";
  }
}

function applyOverrides(
  input: Record<string, any>,
  overrides: ModelFormRuntimeOverride[] = [],
): Record<string, any> {
  return (overrides ?? []).reduce((state, override) => {
    if (!override?.path) return state;
    const action = (override.action ?? "REPLACE").toUpperCase();
    if (action === "UNSET") {
      return unsetValueByPath(state, override.path);
    }
    if (action === "MERGE" && override.value && typeof override.value === "object") {
      return mergeValueByPath(
        state,
        override.path,
        override.value as Record<string, unknown>,
      );
    }
    return setValueByPath(state, override.path, override.value);
  }, { ...(input ?? {}) });
}

function toCamelToken(token: string): string {
  return token.replace(/_([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase());
}

function toSnakeToken(token: string): string {
  return token
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function transformPathTokens(path: string, transformer: (token: string) => string): string {
  return path
    .split(".")
    .map((token) => {
      if (/^\d+$/.test(token)) return token;
      return transformer(token);
    })
    .join(".");
}

function resolveInitialPathValue(
  values: Record<string, any>,
  path: string,
): unknown {
  const candidates = Array.from(
    new Set([
      path,
      transformPathTokens(path, toCamelToken),
      transformPathTokens(path, toSnakeToken),
    ]),
  );

  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(values, candidate)) {
      return values[candidate];
    }

    const nestedValue = getValueByPath(values, candidate);
    if (nestedValue !== undefined) {
      return nestedValue;
    }
  }

  return undefined;
}

function normalizeInitialValuesByContract(
  values: Record<string, any>,
  contract?: ModelFormContract | null,
): Record<string, any> {
  if (!contract) {
    return { ...values };
  }

  let nextValues: Record<string, any> = { ...values };

  for (const field of contract.fields ?? []) {
    const resolved = resolveInitialPathValue(values, field.path);
    if (resolved === undefined) continue;
    nextValues = setValueByPath(nextValues, field.path, resolved);
  }

  for (const relation of contract.relations ?? []) {
    const resolved = resolveInitialPathValue(values, relation.path);
    if (resolved === undefined) continue;
    nextValues = setValueByPath(nextValues, relation.path, resolved);
  }

  return nextValues;
}

function isGeneratedIdentifierField(field: {
  path: string;
  fieldName?: string;
}): boolean {
  const fieldName = String(field.fieldName ?? "").trim().toLowerCase();
  const leafToken = String(field.path ?? "")
    .split(".")
    .filter(Boolean)
    .at(-1)
    ?.toLowerCase();
  return fieldName === "id" || leafToken === "id";
}

function buildSchema(contract: ModelFormContract): FormSchema<Record<string, any>> {
  const fieldsByPath = new Map<string, FormFieldConfig>();
  for (const field of contract.fields) {
    // Generated contracts should not render non-editable fields in the frontend.
    if (field.hidden || field.readOnly || isGeneratedIdentifierField(field)) continue;
    const type = mapKindToInputType(field.kind);
    const uiConfig = asRecord(field.ui);
    const metadata = asRecord(field.metadata);
    const baseConfig: FormFieldConfig = {
      name: field.path,
      type,
      label: field.label,
      required: field.required,
      readOnly: field.readOnly,
      defaultValue: parseJsonValue(field.defaultValue),
      inputProps: (uiConfig as Record<string, any>) ?? undefined,
      meta: { graphqlType: field.graphqlType, pythonType: field.pythonType },
    } as FormFieldConfig;

    if (type === "select") {
      const choices = (metadata as Record<string, any>)?.choices;
      (baseConfig as any).options = Array.isArray(choices)
        ? choices.map((choice: any) => ({
            label: String(choice.label ?? choice.value),
            value: choice.value,
          }))
        : [];
      if (field.kind === "MULTI_CHOICE") {
        (baseConfig as any).multiple = true;
      }
    }
    fieldsByPath.set(field.path, baseConfig);
  }

  const sections: FormSectionConfig[] = (contract.sections ?? [])
    .filter((section) => section.visible)
    .map((section) => {
      const sectionFields = section.fieldPaths
        .map((path) => fieldsByPath.get(path))
        .filter(Boolean) as FormFieldConfig[];
      return {
        id: section.id,
        title: section.title ?? undefined,
        description: section.description ?? undefined,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const fallbackFields = Array.from(fieldsByPath.values());
  return {
    id: contract.id,
    sections: sections.length ? sections : [{ id: "default", fields: fallbackFields }],
  };
}

export function useGeneratedModelForm(options: UseGeneratedModelFormOptions) {
  const {
    contract,
    initialData,
    runtimeOverrides = [],
    generatedEnabled = true,
    legacySchema,
  } = options;

  const usingGenerated = Boolean(generatedEnabled && contract);

  const baseValues = useMemo(() => {
    const parsedValues = parseJsonValue(initialData?.values);
    if (!parsedValues || typeof parsedValues !== "object" || Array.isArray(parsedValues)) {
      return {};
    }

    return normalizeInitialValuesByContract(
      parsedValues as Record<string, any>,
      contract,
    );
  }, [initialData, contract]);

  const runtimeValues = useMemo(
    () => applyOverrides(baseValues, runtimeOverrides),
    [baseValues, runtimeOverrides],
  );

  const schema = useMemo<FormSchema<Record<string, any>>>(() => {
    if (!usingGenerated || !contract) {
      return legacySchema ?? { sections: [], fields: [] };
    }
    const generated = buildSchema(contract);
    generated.initialValues = runtimeValues;
    return generated;
  }, [usingGenerated, contract, legacySchema, runtimeValues]);

  const buildSubmissionValues = (values: Record<string, any>) =>
    applyOverrides(values, runtimeOverrides);

  return {
    usingGenerated,
    schema,
    mutationBindings: contract?.mutationBindings,
    errorPolicy: contract?.errorPolicy,
    initialValues: runtimeValues,
    buildSubmissionValues,
  };
}
