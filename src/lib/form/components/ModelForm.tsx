import React from "react";
import { gql, useApolloClient, useQuery } from "@apollo/client";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_CONTRACT_PAGES_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import { cn } from "@/lib/utils";

import DynamicForm from "../inputs/form";
import {
  buildSchemaFromContract,
  useGeneratedModelForm,
} from "../hooks/useGeneratedModelForm";
import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import { buildGeneratedMutationDocument } from "../mutations";
import type {
  FormBehaviorConfig,
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
} from "../types";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMutationOutcome,
  ModelFormMode,
  ModelFormRuntimeOverride,
} from "../types/generatedContract";
import type {
  ModelFormFieldOverrideValue,
  ModelFormNestedConfig,
  ModelFormNestedDefinition,
  ModelFormNestedFieldsOrderMode,
  ModelFormProps,
  ModelFormSectionOverrideValue,
} from "../types.model";
import {
  applyErrorsToFormFields,
  normalizeGeneratedErrorsForForm,
} from "../utils/errors";
import {
  asRecord,
  serializeRuntimeOverridesForQuery,
} from "../utils/jsonCoercion";

type ContractQueryData = {
  modelFormContract: ModelFormContract | null;
};

type ContractQueryVariables = {
  appLabel: string;
  modelName: string;
  mode: ModelFormMode;
  includeNested: boolean;
};

type InitialDataQueryData = {
  modelFormInitialData: ModelFormInitialData | null;
};

type InitialDataQueryVariables = {
  appLabel: string;
  modelName: string;
  objectId: string;
  includeNested: boolean;
  nestedFields?: string[];
  runtimeOverrides?: Array<Record<string, unknown>>;
};

type ContractPagesQueryData = {
  modelFormContractPages: {
    page: number;
    perPage: number;
    total: number;
    results: ModelFormContract[];
  } | null;
};

type ContractPagesQueryVariables = {
  page: number;
  perPage: number;
  models: Array<{
    appLabel: string;
    modelName: string;
  }>;
  mode: ModelFormMode;
  includeNested: boolean;
};

type GeneratedMutationPayload = {
  ok?: boolean;
  errors?: unknown;
  conflict?: boolean;
  formErrorKey?: string;
};

type NestedControlMap<TValues extends Record<string, unknown>> = Record<
  string,
  ModelFormNestedDefinition<TValues>
>;

type RelationNestedFormConfig = {
  enabled?: boolean;
  title?: string;
  description?: string;
  fields?: string[];
  excludeFields?: string[];
  fieldsOrder?: ModelFormNestedFieldsOrderMode;
  customOrder?: string[];
  columns?: number;
  itemLabel?: string;
  addButton?: {
    enabled?: boolean;
    label?: string;
  };
  sortable?: {
    enabled?: boolean;
    orderField?: string;
  };
  minItems?: number;
  maxItems?: number;
  collapsible?: boolean;
};

const EMPTY_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [];
const EMPTY_PATHS: string[] = [];

function normalizeMode(mode?: string | null): ModelFormMode {
  const normalized = String(mode ?? "CREATE").toUpperCase();
  if (normalized === "UPDATE" || normalized === "VIEW") {
    return normalized;
  }
  return "CREATE";
}

function isModelFormModeWithInitialData(mode: ModelFormMode): boolean {
  return mode === "UPDATE" || mode === "VIEW";
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value ?? "Unknown ModelForm error."));
}

function normalizeNestedControls<TValues extends Record<string, unknown>>(
  nested?: ModelFormNestedConfig<TValues>,
): NestedControlMap<TValues> | null {
  if (!nested) return null;
  if (Array.isArray(nested)) {
    if (nested.length === 0) return null;
    return nested.reduce<NestedControlMap<TValues>>((acc, relationPath) => {
      if (!relationPath) return acc;
      acc[relationPath] = { enabled: true };
      return acc;
    }, {});
  }

  const controls: NestedControlMap<TValues> = {};
  for (const [relationPath, definition] of Object.entries(nested)) {
    if (!relationPath) continue;
    controls[relationPath] = definition ?? { enabled: true };
  }
  return Object.keys(controls).length > 0 ? controls : null;
}

function mergePathLists(...lists: Array<string[] | undefined>): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const value of list) {
      if (!value) continue;
      const normalized = String(value).trim();
      if (!normalized) continue;
      merged.add(normalized);
    }
  }
  return Array.from(merged);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalRecord(value: unknown): Record<string, unknown> | null {
  const direct = asRecord(value);
  if (direct) return direct;

  if (typeof value !== "string") return null;
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function parseFieldsOrderMode(
  value: unknown,
): ModelFormNestedFieldsOrderMode | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "contract" || normalized === "default") return "contract";
  if (
    normalized === "fields" ||
    normalized === "field" ||
    normalized === "follow-fields" ||
    normalized === "follow_fields" ||
    normalized === "followfields"
  ) {
    return "fields";
  }
  if (
    normalized === "custom" ||
    normalized === "custom-order" ||
    normalized === "custom_order" ||
    normalized === "customorder"
  ) {
    return "custom";
  }
  return undefined;
}

function parseAddButtonConfig(value: unknown):
  | {
      enabled?: boolean;
      label?: string;
    }
  | undefined {
  if (typeof value === "boolean") {
    return { enabled: value };
  }
  if (typeof value === "string") {
    const label = toOptionalString(value);
    return label ? { enabled: true, label } : { enabled: true };
  }

  const record = asRecord(value);
  if (!record) return undefined;

  const enabled = toOptionalBoolean(record.enabled ?? record.show);
  const label = toOptionalString(record.label);
  if (enabled === undefined && !label) return undefined;
  return { enabled, label };
}

function parseSortableConfig(value: unknown):
  | {
      enabled?: boolean;
      orderField?: string;
    }
  | undefined {
  if (typeof value === "boolean") {
    return { enabled: value };
  }

  const record = asRecord(value);
  if (!record) return undefined;

  const enabled = toOptionalBoolean(record.enabled ?? record.activate);
  const orderField = toOptionalString(
    record.orderField ??
      record.order_field ??
      record.toField ??
      record.to_field ??
      record.field,
  );
  if (enabled === undefined && !orderField) return undefined;
  return { enabled, orderField };
}

function mergeAddButtonConfig(
  relationValue: unknown,
  nestedValue: unknown,
):
  | {
      enabled?: boolean;
      label?: string;
    }
  | undefined {
  const relationConfig = parseAddButtonConfig(relationValue);
  const nestedConfig = parseAddButtonConfig(nestedValue);
  if (!relationConfig && !nestedConfig) return undefined;

  const merged = {
    ...(relationConfig ?? {}),
    ...(nestedConfig ?? {}),
  };
  if (merged.enabled === undefined && merged.label) {
    merged.enabled = true;
  }
  return merged;
}

function mergeSortableConfig(
  relationValue: unknown,
  nestedValue: unknown,
):
  | {
      enabled?: boolean;
      orderField?: string;
    }
  | undefined {
  const relationConfig = parseSortableConfig(relationValue);
  const nestedConfig = parseSortableConfig(nestedValue);
  if (!relationConfig && !nestedConfig) return undefined;

  const merged = {
    ...(relationConfig ?? {}),
    ...(nestedConfig ?? {}),
  };
  if (merged.enabled === undefined && merged.orderField) {
    merged.enabled = true;
  }
  return merged;
}

function parseRelationNestedFormConfig(
  nestedForm: unknown,
): RelationNestedFormConfig | null {
  const record = toOptionalRecord(nestedForm);
  if (!record) return null;

  const layout = asRecord(record.layout);
  const rawColumns = layout?.columns ?? record.columns;
  const addButton = parseAddButtonConfig(
    record.addButton ?? record.add_button,
  );
  const sortable = parseSortableConfig(
    record.sortable ?? record.ordering,
  );

  return {
    enabled: toOptionalBoolean(record.enabled),
    title: toOptionalString(record.title),
    description: toOptionalString(record.description),
    fields: toOptionalStringArray(record.fields),
    excludeFields: toOptionalStringArray(
      record.excludeFields ?? record.exclude_fields,
    ),
    fieldsOrder: parseFieldsOrderMode(
      record.fieldsOrder ??
        record.fields_order ??
        record.orderMode ??
        record.order_mode,
    ),
    customOrder: toOptionalStringArray(
      record.customOrder ??
        record.custom_order ??
        record.customOrders ??
        record.custom_orders,
    ),
    columns: toOptionalNumber(rawColumns),
    itemLabel: toOptionalString(record.itemLabel ?? record.item_label),
    addButton,
    sortable,
    minItems: toOptionalNumber(record.minItems ?? record.min_items),
    maxItems: toOptionalNumber(record.maxItems ?? record.max_items),
    collapsible: toOptionalBoolean(record.collapsible),
  };
}

function buildRelationModelKey(appLabel: string, modelName: string): string {
  return `${appLabel}.${modelName}`;
}

function collectBackReferenceRelationPaths(
  parentContract: ModelFormContract,
  relatedContract: ModelFormContract,
): Set<string> {
  const parentModelKey = buildRelationModelKey(
    parentContract.appLabel,
    parentContract.modelName,
  );
  const paths = new Set<string>();

  for (const relation of relatedContract.relations ?? []) {
    const targetModelKey = buildRelationModelKey(
      relation.relatedAppLabel,
      relation.relatedModelName,
    );
    if (targetModelKey === parentModelKey) {
      paths.add(relation.path);
    }
  }

  return paths;
}

function collectUniqueTopLevelFields(
  schema: FormSchema<Record<string, unknown>>,
): FormFieldConfig[] {
  const sourceFields =
    schema.sections?.flatMap((section) => section.fields) ??
    schema.fields ??
    [];
  const uniqueFields = new Map<string, FormFieldConfig>();

  for (const field of sourceFields) {
    if (!field.name || field.name.includes(".")) continue;
    if (uniqueFields.has(field.name)) continue;
    uniqueFields.set(field.name, { ...field });
  }

  return Array.from(uniqueFields.values());
}

function toRelativeSelector(selector: string, relationPath: string): string {
  const normalized = String(selector ?? "").trim();
  if (!normalized) return "";
  const relationPrefix = `${relationPath}.`;
  return normalized.startsWith(relationPrefix)
    ? normalized.slice(relationPrefix.length)
    : normalized;
}

function orderFieldsBySelectors(
  fields: FormFieldConfig[],
  relationPath: string,
  selectors: string[] | undefined,
): FormFieldConfig[] {
  if (!selectors?.length || fields.length < 2) return fields;

  const ranking = new Map<string, number>();
  selectors.forEach((selector, index) => {
    const relativePath = toRelativeSelector(selector, relationPath);
    if (!relativePath || ranking.has(relativePath)) return;
    ranking.set(relativePath, index);
  });

  if (ranking.size === 0) return fields;

  const ranked = fields.map((field, index) => ({
    field,
    index,
    rank: ranking.get(field.name),
  }));
  const hasRankedField = ranked.some((entry) => entry.rank !== undefined);
  if (!hasRankedField) return fields;

  return ranked
    .sort((a, b) => {
      const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
      if (rankA === rankB) return a.index - b.index;
      return rankA - rankB;
    })
    .map((entry) => entry.field);
}

function buildNestedRelationFieldConfig<
  TValues extends Record<string, unknown>,
>(
  relationField: FormFieldConfig,
  relation: ModelFormContract["relations"][number],
  nestedFields: FormFieldConfig[],
  nestedFormConfig: RelationNestedFormConfig | null,
  nestedControl: ModelFormNestedDefinition<TValues>,
): FormFieldConfig {
  const nestedTitle = nestedControl.title ?? nestedFormConfig?.title;
  const nestedDescription =
    nestedControl.description ??
    nestedFormConfig?.description ??
    relationField.description;
  const nestedColumns = nestedControl.columns ?? nestedFormConfig?.columns;
  const resolvedLabel = nestedTitle ?? relationField.label ?? relation.label;

  const base = {
    name: relationField.name,
    label: resolvedLabel,
    description: nestedDescription,
    required: relationField.required,
    readOnly: relationField.readOnly,
    disabled: relationField.disabled,
    hidden: relationField.hidden,
    className: relationField.className,
    colSpan: relationField.colSpan,
  };

  if (relation.toMany) {
    const addButtonConfig = mergeAddButtonConfig(
      nestedFormConfig?.addButton,
      nestedControl.addButton,
    );
    const sortableConfig = mergeSortableConfig(
      nestedFormConfig?.sortable,
      nestedControl.sortable,
    );
    const hasSortableConfig = sortableConfig !== undefined;
    const sortableEnabled = sortableConfig?.enabled ?? false;

    return {
      ...base,
      type: "list",
      fields: nestedFields,
      columns: nestedColumns,
      minItems: nestedControl.minItems ?? nestedFormConfig?.minItems,
      maxItems: nestedControl.maxItems ?? nestedFormConfig?.maxItems,
      itemLabel:
        nestedControl.itemLabel ?? nestedFormConfig?.itemLabel ?? resolvedLabel,
      addLabel: addButtonConfig?.label ?? `Add ${resolvedLabel}`,
      showAddButton: addButtonConfig?.enabled ?? true,
      ...(hasSortableConfig ? { sortable: sortableEnabled } : {}),
      ...(sortableEnabled && sortableConfig?.orderField
        ? {
            ordering: {
              activate: true,
              toField: sortableConfig.orderField,
            },
          }
        : {}),
    } as FormFieldConfig;
  }

  return {
    ...base,
    type: "object",
    fields: nestedFields,
    columns: nestedColumns,
    collapsible: nestedControl.collapsible ?? nestedFormConfig?.collapsible,
  } as FormFieldConfig;
}

function materializeNestedRelationFields<
  TValues extends Record<string, unknown>,
>(
  schema: FormSchema<TValues>,
  options: {
    contract: ModelFormContract | null;
    nestedControls: NestedControlMap<TValues> | null;
    relatedContractsByModel: Map<string, ModelFormContract>;
  },
): FormSchema<TValues> {
  const { contract, nestedControls, relatedContractsByModel } = options;
  if (!contract || !nestedControls) return schema;

  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;

  const relationsByPath = new Map(
    (contract.relations ?? []).map((relation) => [relation.path, relation]),
  );
  let schemaChanged = false;

  const nextSections = sections.map((section) => {
    let sectionChanged = false;

    const nextFields = section.fields.map((field) => {
      const relation = relationsByPath.get(field.name);
      if (!relation) return field;

      const nestedControl = nestedControls[relation.path];
      if (!nestedControl || nestedControl.enabled === false) {
        return field;
      }

      const modelKey = buildRelationModelKey(
        relation.relatedAppLabel,
        relation.relatedModelName,
      );
      const relatedContract = relatedContractsByModel.get(modelKey);
      if (!relatedContract) {
        return field;
      }

      const relatedSchema = buildSchemaFromContract(relatedContract);
      const relatedFields = collectUniqueTopLevelFields(relatedSchema);
      if (relatedFields.length === 0) {
        return field;
      }
      const backReferenceRelationPaths = collectBackReferenceRelationPaths(
        contract,
        relatedContract,
      );

      const nestedFormConfig = parseRelationNestedFormConfig(
        relation.nestedForm,
      );
      const includeNestedSelectors = mergePathLists(
        nestedFormConfig?.fields,
        nestedControl.onlyFields ?? nestedControl.fields,
      );
      const excludeNestedSelectors = mergePathLists(
        nestedFormConfig?.excludeFields,
        nestedControl.excludeFields,
      );
      const customOrderSelectors = mergePathLists(
        nestedControl.customOrder,
        nestedFormConfig?.customOrder,
      );
      const explicitFieldOrderMode =
        nestedControl.fieldsOrder ?? nestedFormConfig?.fieldsOrder;
      const fieldOrderMode: ModelFormNestedFieldsOrderMode =
        explicitFieldOrderMode ??
        (customOrderSelectors.length > 0 ? "custom" : "contract");

      const nestedFields = relatedFields
        .map((relatedField) => {
          if (backReferenceRelationPaths.has(relatedField.name)) {
            return null;
          }

          const fullPath = `${relation.path}.${relatedField.name}`;

          if (
            includeNestedSelectors.length > 0 &&
            !matchFieldSelectors(
              includeNestedSelectors,
              fullPath,
              relation.path,
            )
          ) {
            return null;
          }

          if (
            excludeNestedSelectors.some((selector) =>
              isFieldSelectorMatch(selector, fullPath, relation.path),
            )
          ) {
            return null;
          }

          return applyFieldOverride(
            relatedField,
            resolveFieldOverride(
              nestedControl.fieldOverrides,
              fullPath,
              relation.path,
            ),
          );
        })
        .filter(Boolean) as FormFieldConfig[];

      if (nestedFields.length === 0) {
        return field;
      }

      const orderedNestedFields =
        fieldOrderMode === "fields"
          ? orderFieldsBySelectors(
              nestedFields,
              relation.path,
              includeNestedSelectors,
            )
          : fieldOrderMode === "custom"
            ? orderFieldsBySelectors(
                nestedFields,
                relation.path,
                customOrderSelectors,
              )
            : nestedFields;

      const replacement = buildNestedRelationFieldConfig(
        field,
        relation,
        orderedNestedFields,
        nestedFormConfig,
        nestedControl,
      );
      sectionChanged = true;
      schemaChanged = true;
      return replacement;
    });

    return sectionChanged ? { ...section, fields: nextFields } : section;
  });

  if (!schemaChanged) return schema;

  return {
    ...schema,
    sections: nextSections,
  };
}

function inferRelationPath(path: string): string | null {
  const index = path.lastIndexOf(".");
  if (index <= 0) return null;
  return path.slice(0, index);
}

function isFieldSelectorMatch(
  selector: string,
  fullPath: string,
  relationPath: string | null,
): boolean {
  if (selector === fullPath) return true;
  if (!relationPath) return false;

  // For nested fields, we allow matching the field name alone if we are in
  // the context of that relation (relative matching).
  const relationPrefix = `${relationPath}.`;
  if (!fullPath.startsWith(relationPrefix)) return false;
  const relativePath = fullPath.slice(relationPrefix.length);
  return selector === relativePath;
}

function matchFieldSelectors(
  selectors: string[] | undefined,
  fullPath: string,
  relationPath: string | null,
): boolean {
  if (!selectors || selectors.length === 0) return true;
  return selectors.some((selector) =>
    isFieldSelectorMatch(selector, fullPath, relationPath),
  );
}

function resolveFieldOverride(
  overrides: Record<string, ModelFormFieldOverrideValue> | undefined,
  fullPath: string,
  relationPath: string | null,
): ModelFormFieldOverrideValue | undefined {
  if (!overrides) return undefined;
  if (fullPath in overrides) return overrides[fullPath];
  if (!relationPath) return undefined;
  const relationPrefix = `${relationPath}.`;
  if (!fullPath.startsWith(relationPrefix)) return undefined;
  const relativePath = fullPath.slice(relationPrefix.length);
  return overrides[relativePath];
}

function resolveSectionOverride<TValues extends Record<string, unknown>>(
  overrides: Record<string, ModelFormSectionOverrideValue<TValues>> | undefined,
  sectionId: string | undefined,
): ModelFormSectionOverrideValue<TValues> | undefined {
  if (!sectionId || !overrides) return undefined;
  return overrides[sectionId];
}

function applyFieldOverride(
  field: FormFieldConfig,
  override: ModelFormFieldOverrideValue | undefined,
): FormFieldConfig | null {
  if (!override) return field;

  if (typeof override === "function") {
    const output = override(field);
    if (output == null) return null;
    if ("name" in output && "type" in output) {
      return output as FormFieldConfig;
    }
    return { ...field, ...output } as FormFieldConfig;
  }

  return { ...field, ...override } as FormFieldConfig;
}

function applySectionOverride<TValues extends Record<string, unknown>>(
  section: FormSectionConfig<TValues>,
  override: ModelFormSectionOverrideValue<TValues> | undefined,
): FormSectionConfig<TValues> | null {
  if (!override) return section;

  if (typeof override === "function") {
    const output = override(section);
    if (output == null) return null;
    if ("fields" in output) {
      return output as FormSectionConfig<TValues>;
    }
    return { ...section, ...output };
  }

  return { ...section, ...override };
}

function applySchemaControls<TValues extends Record<string, unknown>>(
  schema: FormSchema<TValues>,
  options: {
    onlyFields?: string[];
    excludeFields?: string[];
    onlyRelationships?: string[];
    excludeRelationships?: string[];
    fieldOverrides?: Record<string, ModelFormFieldOverrideValue>;
    sectionOverrides?: Record<string, ModelFormSectionOverrideValue<TValues>>;
    nestedControls: NestedControlMap<TValues> | null;
  },
): FormSchema<TValues> {
  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;
  const includedRelations = options.onlyRelationships?.length
    ? new Set(options.onlyRelationships)
    : null;
  const excludedRelations = options.excludeRelationships?.length
    ? new Set(options.excludeRelationships)
    : null;

  const nextSections = sections
    .map((section) => {
      const filteredFields = section.fields
        .map((field) => {
          const relationPath = inferRelationPath(field.name);

          if (
            options.onlyFields?.length &&
            !matchFieldSelectors(options.onlyFields, field.name, relationPath)
          ) {
            return null;
          }

          if (
            options.excludeFields?.length &&
            options.excludeFields.some((path) =>
              isFieldSelectorMatch(path, field.name, relationPath),
            )
          ) {
            return null;
          }

          if (
            relationPath &&
            includedRelations &&
            !includedRelations.has(relationPath)
          ) {
            return null;
          }

          if (relationPath && excludedRelations?.has(relationPath)) {
            return null;
          }

          let currentField = field;

          if (relationPath && options.nestedControls) {
            const nestedControl = options.nestedControls[relationPath];
            if (!nestedControl || nestedControl.enabled === false) {
              return null;
            }

            if (
              section.id &&
              nestedControl.includeSections?.length &&
              !nestedControl.includeSections.includes(section.id)
            ) {
              return null;
            }

            if (
              section.id &&
              nestedControl.excludeSections?.includes(section.id)
            ) {
              return null;
            }

            const includeNestedSelectors =
              nestedControl.onlyFields ?? nestedControl.fields;
            if (
              includeNestedSelectors?.length &&
              !matchFieldSelectors(
                includeNestedSelectors,
                field.name,
                relationPath,
              )
            ) {
              return null;
            }

            if (
              nestedControl.excludeFields?.length &&
              nestedControl.excludeFields.some((selector) =>
                isFieldSelectorMatch(selector, field.name, relationPath),
              )
            ) {
              return null;
            }

            currentField =
              applyFieldOverride(
                currentField,
                resolveFieldOverride(
                  nestedControl.fieldOverrides,
                  field.name,
                  relationPath,
                ),
              ) ?? currentField;
          }

          return applyFieldOverride(
            currentField,
            resolveFieldOverride(
              options.fieldOverrides,
              field.name,
              relationPath,
            ),
          );
        })
        .filter(Boolean) as FormFieldConfig[];

      if (filteredFields.length === 0) return null;

      let nextSection: FormSectionConfig<TValues> = {
        ...section,
        fields: filteredFields,
      };

      const relationPaths = new Set(
        filteredFields
          .map((item) => inferRelationPath(item.name))
          .filter(Boolean) as string[],
      );

      if (options.nestedControls && section.id) {
        for (const relationPath of relationPaths) {
          const nestedControl = options.nestedControls[relationPath];
          if (!nestedControl) continue;

          const nestedSectionOverride = resolveSectionOverride(
            nestedControl.sectionOverrides,
            section.id,
          );
          const overridden = applySectionOverride(
            nextSection,
            nestedSectionOverride,
          );
          if (!overridden) return null;
          nextSection = overridden;
        }
      }

      const globalSectionOverride = resolveSectionOverride(
        options.sectionOverrides,
        section.id,
      );
      const globallyOverridden = applySectionOverride(
        nextSection,
        globalSectionOverride,
      );
      if (!globallyOverridden) return null;

      return globallyOverridden.fields.length > 0 ? globallyOverridden : null;
    })
    .filter(Boolean) as FormSectionConfig<TValues>[];

  return {
    ...schema,
    sections: nextSections,
  };
}

function mergeValidationErrors(
  baseErrors: Record<string, string> | undefined,
  customErrors: Record<string, string> | undefined,
): Record<string, string> | undefined {
  const merged = {
    ...(baseErrors ?? {}),
    ...(customErrors ?? {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeRecords(
  ...sources: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined {
  let hasSource = false;
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;
    hasSource = true;

    for (const [key, sourceValue] of Object.entries(source)) {
      const existingValue = result[key];

      if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue];
        continue;
      }

      if (isRecord(sourceValue)) {
        if (isRecord(existingValue)) {
          result[key] =
            deepMergeRecords(existingValue, sourceValue) ?? sourceValue;
          continue;
        }
        result[key] = deepMergeRecords(sourceValue) ?? sourceValue;
        continue;
      }

      result[key] = sourceValue;
    }
  }

  return hasSource ? result : undefined;
}

function sortSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortSerializableValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortSerializableValue(value[key]);
  }
  return sorted;
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function stableHashOfValue(value: unknown): string {
  try {
    const serialized = JSON.stringify(sortSerializableValue(value));
    return hashString(serialized);
  } catch {
    return "0";
  }
}

function getMutationPayload(
  operationName: string,
  data: Record<string, unknown> | null | undefined,
): GeneratedMutationPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const response = data.response;
  if (response && typeof response === "object") {
    return response as GeneratedMutationPayload;
  }
  const byOperationName = data[operationName];
  if (byOperationName && typeof byOperationName === "object") {
    return byOperationName as GeneratedMutationPayload;
  }
  return {};
}

function toActionSubmitOutcome(outcome: ModelFormMutationOutcome | null) {
  if (!outcome) return null;
  return {
    ok: Boolean(outcome.ok),
    conflict: Boolean(outcome.conflict),
    errorCount: Array.isArray(outcome.errors) ? outcome.errors.length : 0,
  };
}

export function ModelForm<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(props: ModelFormProps<TFormValues>) {
  const apolloClient = useApolloClient();

  const {
    app,
    model,
    appName,
    modelName,
    mode,
    mutationMode,
    objectId,
    mutationId,
    includeNested,
    nested,
    nestedFields,
    generatedEnabled = true,
    runtimeOverrides,
    onlyFields,
    excludeFields,
    only,
    exclude,
    onlyRelationships,
    excludeRelationships,
    fieldOverrides,
    sectionOverrides,
    validatorExtensions,
    legacySchema,
    formProps,
    onSubmit,
    onChange,
    validate,
    defaultValues,
    readOnly,
    disabled,
    isLoading: externalLoading,
    onFormReady,
    showSectionHeaders,
    inPopup,
    state,
    behavior,
    layout,
    actions,
    devtools,
    title,
    description,
    showHeading = true,
    containerClassName,
    contentClassName,
    loadingFallback,
    emptySchemaFallback,
    errorFallback,
    requireObjectIdForUpdate = true,
    onContractLoaded,
    onInitialDataLoaded,
    onLoadError,
  } = props;

  const resolvedApp = app ?? appName ?? "";
  const resolvedModel = model ?? modelName ?? "";
  const resolvedMode = normalizeMode(mode ?? mutationMode ?? undefined);
  const resolvedObjectId = objectId ?? mutationId;
  const resolvedObjectIdValue = resolvedObjectId?.toString();
  const resolvedNested = nested ?? nestedFields;
  const resolvedRuntimeOverrides = runtimeOverrides ?? EMPTY_RUNTIME_OVERRIDES;
  const runtimeOverridesForQuery = React.useMemo(
    () => serializeRuntimeOverridesForQuery(resolvedRuntimeOverrides),
    [resolvedRuntimeOverrides],
  );
  const resolvedOnlyFieldsInput = onlyFields ?? EMPTY_PATHS;
  const resolvedExcludeFieldsInput = excludeFields ?? EMPTY_PATHS;
  const resolvedOnlyRelationshipsInput = onlyRelationships ?? EMPTY_PATHS;
  const resolvedExcludeRelationshipsInput = excludeRelationships ?? EMPTY_PATHS;
  const resolvedOnlyFields = React.useMemo(
    () => mergePathLists(resolvedOnlyFieldsInput, only),
    [resolvedOnlyFieldsInput, only],
  );
  const resolvedExcludeFields = React.useMemo(
    () => mergePathLists(resolvedExcludeFieldsInput, exclude),
    [resolvedExcludeFieldsInput, exclude],
  );
  const resolvedOnlyRelationships = React.useMemo(
    () => mergePathLists(resolvedOnlyRelationshipsInput),
    [resolvedOnlyRelationshipsInput],
  );
  const resolvedExcludeRelationships = React.useMemo(
    () => mergePathLists(resolvedExcludeRelationshipsInput),
    [resolvedExcludeRelationshipsInput],
  );

  const nestedControls = React.useMemo(
    () => normalizeNestedControls(resolvedNested),
    [resolvedNested],
  );

  const resolvedStateInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.state ?? {}),
      ...(state ?? {}),
      ...(defaultValues !== undefined ? { defaultValues } : {}),
      ...(readOnly !== undefined ? { readOnly } : {}),
      ...(disabled !== undefined ? { disabled } : {}),
      ...(externalLoading !== undefined ? { isLoading: externalLoading } : {}),
      ...(onFormReady ? { onReady: onFormReady } : {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [
    formProps?.state,
    state,
    defaultValues,
    readOnly,
    disabled,
    externalLoading,
    onFormReady,
  ]);
  const resolvedBehaviorInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.behavior ?? {}),
      ...(behavior ?? {}),
      ...(onSubmit ? { onSubmit } : {}),
      ...(onChange ? { onChange } : {}),
      ...(validate ? { validate } : {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.behavior, behavior, onSubmit, onChange, validate]);

  const resolvedLayoutInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.layout ?? {}),
      ...(layout ?? {}),
      ...(showSectionHeaders !== undefined ? { showSectionHeaders } : {}),
    };

    if (inPopup && (merged as { variant?: string }).variant === undefined) {
      (merged as { variant?: string }).variant = "popup";
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.layout, layout, showSectionHeaders, inPopup]);

  const resolvedActionsInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.actions ?? {}),
      ...(actions ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.actions, actions]);

  const resolvedDevtoolsInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.devtools ?? {}),
      ...(devtools ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.devtools, devtools]);

  const shouldIncludeNested =
    includeNested ??
    Boolean(
      nestedControls ||
      resolvedOnlyRelationships.length > 0 ||
      resolvedExcludeRelationships.length > 0,
    );
  const initialDataNestedFields = React.useMemo(() => {
    if (!nestedControls) return undefined;

    const includedRelations = resolvedOnlyRelationships.length
      ? new Set(resolvedOnlyRelationships)
      : null;
    const excludedRelations = resolvedExcludeRelationships.length
      ? new Set(resolvedExcludeRelationships)
      : null;

    const nestedPaths = Object.entries(nestedControls)
      .filter(([, definition]) => definition.enabled !== false)
      .map(([relationPath]) => String(relationPath).trim())
      .filter(Boolean)
      .filter((relationPath) =>
        includedRelations ? includedRelations.has(relationPath) : true,
      )
      .filter((relationPath) =>
        excludedRelations ? !excludedRelations.has(relationPath) : true,
      );

    return nestedPaths.length > 0 ? nestedPaths : undefined;
  }, [nestedControls, resolvedOnlyRelationships, resolvedExcludeRelationships]);
  const updateRequiresObjectId =
    resolvedMode === "UPDATE" &&
    requireObjectIdForUpdate &&
    !resolvedObjectIdValue;
  const shouldFetchInitialData =
    generatedEnabled &&
    isModelFormModeWithInitialData(resolvedMode) &&
    Boolean(resolvedObjectIdValue);

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      variables: {
        appLabel: resolvedApp,
        modelName: resolvedModel,
        mode: resolvedMode,
        includeNested: shouldIncludeNested,
      },
      skip: !generatedEnabled || !resolvedApp || !resolvedModel,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
      returnPartialData: false,
      notifyOnNetworkStatusChange: true,
    },
  );
  const initialDataQuery = useQuery<
    InitialDataQueryData,
    InitialDataQueryVariables
  >(MODEL_FORM_INITIAL_DATA_QUERY, {
    variables: {
      appLabel: resolvedApp,
      modelName: resolvedModel,
      objectId: resolvedObjectIdValue ?? "",
      includeNested: shouldIncludeNested,
      ...(initialDataNestedFields
        ? { nestedFields: initialDataNestedFields }
        : {}),
      runtimeOverrides: runtimeOverridesForQuery,
    },
    skip: !shouldFetchInitialData,
    fetchPolicy: "network-only",
  });

  const contract = contractQuery.data?.modelFormContract ?? null;
  const initialData = shouldFetchInitialData
    ? (initialDataQuery.data?.modelFormInitialData ?? null)
    : null;

  const nestedRelationModelRefs = React.useMemo(() => {
    if (!contract || !nestedControls) return [];

    const refs = new Map<
      string,
      {
        appLabel: string;
        modelName: string;
      }
    >();

    for (const relation of contract.relations ?? []) {
      const nestedControl = nestedControls[relation.path];
      if (!nestedControl || nestedControl.enabled === false) continue;
      if (!relation.relatedAppLabel || !relation.relatedModelName) continue;
      const key = buildRelationModelKey(
        relation.relatedAppLabel,
        relation.relatedModelName,
      );
      refs.set(key, {
        appLabel: relation.relatedAppLabel,
        modelName: relation.relatedModelName,
      });
    }

    return Array.from(refs.values());
  }, [contract, nestedControls]);

  const nestedRelationContractsQuery = useQuery<
    ContractPagesQueryData,
    ContractPagesQueryVariables
  >(MODEL_FORM_CONTRACT_PAGES_QUERY, {
    variables: {
      page: 1,
      perPage: Math.max(nestedRelationModelRefs.length, 1),
      models: nestedRelationModelRefs,
      mode: resolvedMode,
      includeNested: false,
    },
    skip: !generatedEnabled || nestedRelationModelRefs.length === 0,
    fetchPolicy: "cache-first",
  });

  const relatedContractsByModel = React.useMemo(() => {
    const map = new Map<string, ModelFormContract>();
    const page = nestedRelationContractsQuery.data?.modelFormContractPages;
    for (const relatedContract of page?.results ?? []) {
      map.set(
        buildRelationModelKey(
          relatedContract.appLabel,
          relatedContract.modelName,
        ),
        relatedContract,
      );
    }
    return map;
  }, [nestedRelationContractsQuery.data]);

  React.useEffect(() => {
    if (!contract || !onContractLoaded) return;
    onContractLoaded(contract);
  }, [contract, onContractLoaded]);

  React.useEffect(() => {
    if (!initialData || typeof onInitialDataLoaded !== "function") return;
    onInitialDataLoaded(initialData);
  }, [initialData, onInitialDataLoaded]);

  React.useEffect(() => {
    if (!contractQuery.error || !onLoadError) return;
    onLoadError(toError(contractQuery.error), "contract");
  }, [contractQuery.error, onLoadError]);

  React.useEffect(() => {
    if (!initialDataQuery.error || !onLoadError) return;
    onLoadError(toError(initialDataQuery.error), "initialData");
  }, [initialDataQuery.error, onLoadError]);

  React.useEffect(() => {
    if (!nestedRelationContractsQuery.error || !onLoadError) return;
    onLoadError(toError(nestedRelationContractsQuery.error), "contract");
  }, [nestedRelationContractsQuery.error, onLoadError]);

  const executeGeneratedMutation = React.useCallback(
    async (
      operationName: string,
      variables: Record<string, unknown>,
      envelope: { identifier?: { key: string; value: string | number } | null },
    ) => {
      const mutationMode = envelope.identifier ? "update" : "create";
      const rawIdentifierName = envelope.identifier?.key;
      const identifierName =
        rawIdentifierName === "objectId" ? "id" : rawIdentifierName;

      const graphqlVariables =
        rawIdentifierName &&
        identifierName &&
        rawIdentifierName !== identifierName &&
        Object.prototype.hasOwnProperty.call(variables, rawIdentifierName)
          ? {
              ...variables,
              [identifierName]: variables[rawIdentifierName],
            }
          : variables;

      if (
        rawIdentifierName &&
        identifierName &&
        rawIdentifierName !== identifierName
      ) {
        delete (graphqlVariables as Record<string, unknown>)[rawIdentifierName];
      }

      const mutation = gql(
        buildGeneratedMutationDocument(
          mutationMode,
          operationName,
          resolvedModel,
          "id",
          identifierName
            ? {
                identifierVariableName: identifierName,
                identifierArgumentName: identifierName,
              }
            : {},
        ),
      );

      const result = await apolloClient.mutate({
        mutation,
        variables: graphqlVariables,
      });

      return getMutationPayload(
        operationName,
        result.data as Record<string, unknown> | null | undefined,
      );
    },
    [apolloClient, resolvedModel],
  );

  const generated = useGeneratedModelForm({
    contract,
    initialData,
    runtimeOverrides: resolvedRuntimeOverrides,
    generatedEnabled,
    legacySchema: legacySchema as
      | FormSchema<Record<string, unknown>>
      | undefined,
    submitMode: resolvedMode,
    objectId: resolvedObjectIdValue,
    executeMutation: executeGeneratedMutation,
  });

  const { formValidator } = useGeneratedValidators(
    contract,
    validatorExtensions,
  );

  const schemaWithNestedRelations = React.useMemo(() => {
    return materializeNestedRelationFields(
      generated.schema as FormSchema<TFormValues>,
      {
        contract,
        nestedControls,
        relatedContractsByModel,
      },
    );
  }, [generated.schema, contract, nestedControls, relatedContractsByModel]);

  const controlledSchema = React.useMemo(() => {
    return applySchemaControls(schemaWithNestedRelations, {
      onlyFields: resolvedOnlyFields,
      excludeFields: resolvedExcludeFields,
      onlyRelationships: resolvedOnlyRelationships,
      excludeRelationships: resolvedExcludeRelationships,
      fieldOverrides,
      sectionOverrides,
      nestedControls,
    });
  }, [
    schemaWithNestedRelations,
    resolvedOnlyFields,
    resolvedExcludeFields,
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
    fieldOverrides,
    sectionOverrides,
    nestedControls,
  ]);
  const mergedBehavior = React.useMemo<
    FormBehaviorConfig<TFormValues> | undefined
  >(() => {
    const userValidate = resolvedBehaviorInput?.validate;
    const userSubmit = resolvedBehaviorInput?.onSubmit;
    const shouldUseGeneratedValidation = Boolean(generatedEnabled && contract);
    const generatedValidate = shouldUseGeneratedValidation
      ? formValidator
      : undefined;
    const shouldUseGeneratedSubmit = Boolean(
      generatedEnabled &&
      contract &&
      resolvedMode !== "VIEW" &&
      !userSubmit &&
      generated.canSubmit,
    );

    if (
      !resolvedBehaviorInput &&
      !generatedValidate &&
      !shouldUseGeneratedSubmit
    ) {
      return undefined;
    }

    const validate = (values: TFormValues) => {
      const generatedErrors = generatedValidate
        ? generatedValidate(values as Record<string, unknown>)
        : undefined;
      const customErrors = userValidate ? userValidate(values) : undefined;
      return mergeValidationErrors(generatedErrors, customErrors);
    };

    const onSubmit = shouldUseGeneratedSubmit
      ? async (
          values: TFormValues,
          ctx: Parameters<
            NonNullable<FormBehaviorConfig<TFormValues>["onSubmit"]>
          >[1],
        ) => {
          const outcome = await generated.submit(
            values as Record<string, unknown>,
          );
          if (outcome.errors.length) {
            applyErrorsToFormFields(
              normalizeGeneratedErrorsForForm(outcome.errors, {
                formErrorKey: outcome.formErrorKey,
              }),
              ctx.form as any,
            );
          }
        }
      : userSubmit;

    return {
      ...(resolvedBehaviorInput ?? {}),
      validate,
      ...(onSubmit ? { onSubmit } : {}),
    };
  }, [
    resolvedBehaviorInput,
    generatedEnabled,
    contract,
    formValidator,
    generated.canSubmit,
    generated.submit,
    resolvedMode,
  ]);

  const mergedState = React.useMemo(() => {
    const submitAwareState = {
      ...(resolvedStateInput ?? {}),
      isSubmitting: Boolean(
        resolvedStateInput?.isSubmitting || generated.submitState.isSubmitting,
      ),
    };
    if (resolvedMode !== "VIEW") return submitAwareState;
    return {
      ...submitAwareState,
      readOnly: submitAwareState.readOnly ?? true,
    };
  }, [resolvedMode, resolvedStateInput, generated.submitState.isSubmitting]);

  const mergedActions = React.useMemo(() => {
    const submitAwareActions = {
      ...(resolvedActionsInput ?? {}),
      isSubmitting: Boolean(
        resolvedActionsInput?.isSubmitting ||
        generated.submitState.isSubmitting,
      ),
      submitOutcome: toActionSubmitOutcome(generated.submitState.outcome),
    };
    if (resolvedMode !== "VIEW") return submitAwareActions;
    return {
      ...submitAwareActions,
      hidden: submitAwareActions.hidden ?? true,
    };
  }, [
    resolvedActionsInput,
    resolvedMode,
    generated.submitState.isSubmitting,
    generated.submitState.outcome,
  ]);

  const hydratedDefaultValues = React.useMemo<
    Partial<TFormValues> | undefined
  >(() => {
    if (!shouldFetchInitialData || initialDataQuery.loading) {
      return undefined;
    }
    if (!isRecord(generated.initialValues)) {
      return {} as Partial<TFormValues>;
    }
    return generated.initialValues as Partial<TFormValues>;
  }, [
    shouldFetchInitialData,
    initialDataQuery.loading,
    generated.initialValues,
  ]);

  const finalState = React.useMemo(() => {
    const baseState = { ...(mergedState ?? {}) };
    const stateDefaultValues = isRecord(baseState.defaultValues)
      ? (baseState.defaultValues as Record<string, unknown>)
      : undefined;
    const hydratedValues = isRecord(hydratedDefaultValues)
      ? (hydratedDefaultValues as Record<string, unknown>)
      : undefined;

    const mergedDefaultValues = deepMergeRecords(
      stateDefaultValues,
      hydratedValues,
    );

    if (mergedDefaultValues) {
      baseState.defaultValues = mergedDefaultValues as Partial<TFormValues>;
    }

    if (shouldFetchInitialData && hydratedDefaultValues !== undefined) {
      baseState.disableAutoReset = true;
    }

    return Object.keys(baseState).length > 0 ? baseState : undefined;
  }, [mergedState, hydratedDefaultValues, shouldFetchInitialData]);

  const dynamicFormKey = React.useMemo(() => {
    const baseKey = `${resolvedApp}:${resolvedModel}:${resolvedMode}:${
      resolvedObjectIdValue ?? "new"
    }`;
    const schemaHash = stableHashOfValue({
      sections: controlledSchema.sections ?? [],
      fields: controlledSchema.fields ?? [],
    });

    if (!shouldFetchInitialData) {
      return `${baseKey}:standard:${schemaHash}`;
    }

    if (initialDataQuery.loading) {
      return `${baseKey}:loading:${schemaHash}`;
    }

    return `${baseKey}:hydrated:${schemaHash}:${stableHashOfValue(
      hydratedDefaultValues ?? {},
    )}`;
  }, [
    resolvedApp,
    resolvedModel,
    resolvedMode,
    resolvedObjectIdValue,
    shouldFetchInitialData,
    initialDataQuery.loading,
    hydratedDefaultValues,
    controlledSchema.sections,
    controlledSchema.fields,
  ]);

  const contractError = contractQuery.error
    ? toError(contractQuery.error)
    : null;
  const initialDataError = initialDataQuery.error
    ? toError(initialDataQuery.error)
    : null;
  const shouldWaitForNestedRelationContracts =
    generatedEnabled && nestedRelationModelRefs.length > 0;

  const isLoading =
    (generatedEnabled && contractQuery.loading) ||
    (shouldFetchInitialData && initialDataQuery.loading) ||
    (shouldWaitForNestedRelationContracts &&
      nestedRelationContractsQuery.loading);

  const hasRenderableFields = Boolean(
    controlledSchema.sections?.some((section) => section.fields.length > 0) ||
    controlledSchema.fields?.length,
  );

  const renderError = (error: Error, stage: "contract" | "initialData") => {
    if (typeof errorFallback === "function") {
      return errorFallback({
        error,
        stage,
        app: resolvedApp,
        model: resolvedModel,
        mode: resolvedMode,
        objectId: resolvedObjectIdValue,
      });
    }
    return (
      errorFallback ?? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )
    );
  };

  if (!resolvedApp || !resolvedModel) {
    return renderError(
      new Error("ModelForm requires both `app` and `model` props."),
      "contract",
    );
  }

  if (updateRequiresObjectId) {
    return renderError(
      new Error("ModelForm requires `objectId` when mode is UPDATE."),
      "initialData",
    );
  }

  if (contractError) {
    return renderError(contractError, "contract");
  }

  if (initialDataError) {
    return renderError(initialDataError, "initialData");
  }

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Loading model form contract...
        </div>
      )
    );
  }

  if (!hasRenderableFields) {
    return (
      emptySchemaFallback ?? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          No fields are available for this model form.
        </div>
      )
    );
  }
  return (
    <div className={cn("space-y-4", containerClassName)}>
      {showHeading && (title || description) ? (
        <header className="space-y-1">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className={contentClassName}>
        <DynamicForm<TFormValues>
          key={dynamicFormKey}
          schema={controlledSchema}
          state={finalState}
          behavior={mergedBehavior}
          layout={resolvedLayoutInput}
          actions={mergedActions}
          devtools={resolvedDevtoolsInput}
        />
      </div>
    </div>
  );
}

export default ModelForm;
