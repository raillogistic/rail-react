import { buildSchemaFromContract } from "../../hooks/useGeneratedModelForm";
import type {
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
} from "../../types";
import type { ModelFormContract } from "../../types/generatedContract";
import type {
  ModelFormFieldOverrideValue,
  ModelFormNestedDefinition,
  ModelFormNestedFieldsOrderMode,
  ModelFormSectionOverrideValue,
} from "../../types.model";
import { asRecord } from "../../utils/jsonCoercion";
import {
  mergeAddButtonConfig,
  mergeDeleteMutationConfig,
  mergePathLists,
  mergeSortableConfig,
  parseRelationNestedFormConfig,
  type RelationNestedFormConfig,
} from "./nestedSchema";
import { buildRelationModelKey } from "./queryLifecycle";

type NestedControlMap<TValues extends Record<string, unknown>> = Record<
  string,
  ModelFormNestedDefinition<TValues>
>;

function resolveRelationFieldName(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const name = String(relation.name ?? "").trim();
  if (name) return name;
  return String(relation.path ?? "").trim();
}

function resolveNestedControlForRelation<TValues extends Record<string, unknown>>(
  nestedControls: NestedControlMap<TValues>,
  relation: ModelFormContract["relations"][number],
) {
  const relationFieldName = resolveRelationFieldName(relation);
  return (
    nestedControls[relationFieldName] ??
    nestedControls[relation.path] ??
    undefined
  );
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

function collectNestedRelationFields<TValues extends Record<string, unknown>>(
  relatedSchema: FormSchema<Record<string, unknown>>,
  nestedControl: ModelFormNestedDefinition<TValues>,
): FormFieldConfig[] {
  const relatedSections = relatedSchema.sections ?? [];
  if (relatedSections.length === 0) {
    return collectUniqueTopLevelFields(relatedSchema);
  }

  const filteredSections = relatedSections
    .map((section) => {
      if (
        section.id &&
        nestedControl.includeSections?.length &&
        !nestedControl.includeSections.includes(section.id)
      ) {
        return null;
      }
      if (section.id && nestedControl.excludeSections?.includes(section.id)) {
        return null;
      }
      const sectionOverride = resolveSectionOverride(
        nestedControl.sectionOverrides,
        section.id,
      );
      const overridden = applySectionOverride(section, sectionOverride);
      if (!overridden) return null;
      if (typeof overridden.visible === "function") {
        try {
          if (overridden.visible({} as Record<string, unknown>) === false) {
            return null;
          }
        } catch {
          // Ignore visibility evaluation errors for nested extraction.
        }
      }
      return overridden;
    })
    .filter(Boolean)
    .filter((section): section is FormSectionConfig<Record<string, unknown>> =>
      Boolean(section && section.fields.length > 0),
    );

  if (filteredSections.length === 0) {
    return [];
  }

  return collectUniqueTopLevelFields({
    ...relatedSchema,
    sections: filteredSections,
  });
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
  const scalarListOperation =
    nestedControl.scalarListOperation ?? nestedFormConfig?.scalarListOperation;
  const removeOperation =
    nestedControl.removeOperation ?? nestedFormConfig?.removeOperation;
  const deleteMutation = mergeDeleteMutationConfig(
    nestedFormConfig?.deleteMutation,
    nestedControl.deleteMutation,
  );
  const deleteMutationWithDefaults = deleteMutation
    ? {
        ...deleteMutation,
        modelName: deleteMutation.modelName ?? relation.relatedModelName,
      }
    : undefined;

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
    meta: {
      ...(asRecord((relationField as { meta?: unknown }).meta) ?? {}),
      isRelationField: true,
      relationPath: relationField.name,
      relationContractPath: relation.path,
      relationType: relation.relationType,
      relatedAppLabel: relation.relatedAppLabel,
      relatedModelName: relation.relatedModelName,
      relationToMany: relation.toMany,
      relationPolicy: {
        allowedActions: relation.policy?.allowedActions ?? [],
        blockedActions: relation.policy?.blockedActions ?? [],
      },
      nestedOps: {
        ...(scalarListOperation ? { scalarListOperation } : {}),
        ...(removeOperation ? { removeOperation } : {}),
      },
      ...(deleteMutationWithDefaults
        ? { deleteMutation: deleteMutationWithDefaults }
        : {}),
    },
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
      addLabel: addButtonConfig?.label ?? "Ajouter",
      showAddButton: addButtonConfig?.enabled ?? true,
      ...(hasSortableConfig ? { sortable: sortableEnabled } : {}),
      ...(hasSortableConfig && sortableConfig?.mode
        ? { sortingMode: sortableConfig.mode }
        : {}),
      ...(sortableEnabled && sortableConfig?.orderField
        ? {
            ordering: {
              activate: true,
              toField: sortableConfig.orderField,
            },
          }
        : {}),
      relationOps: {
        ...(scalarListOperation ? { scalarListOperation } : {}),
        ...(removeOperation ? { removeOperation } : {}),
      },
      ...(deleteMutationWithDefaults
        ? { deleteMutation: deleteMutationWithDefaults }
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

export function materializeNestedRelationFields<
  TValues extends Record<string, unknown>,
>(
  schema: FormSchema<TValues>,
  options: {
    contract: ModelFormContract | null;
    nestedControls: NestedControlMap<TValues> | undefined;
    relatedContractsByModel: Map<string, ModelFormContract>;
  },
): FormSchema<TValues> {
  const { contract, nestedControls, relatedContractsByModel } = options;
  if (!contract || !nestedControls) return schema;

  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;

  const relationsByPath = new Map(
    (contract.relations ?? []).flatMap((relation) => {
      const relationFieldName = resolveRelationFieldName(relation);
      const entries: Array<[string, typeof relation]> = [];
      if (relationFieldName) {
        entries.push([relationFieldName, relation]);
      }
      if (relation.path && relation.path !== relationFieldName) {
        entries.push([relation.path, relation]);
      }
      return entries;
    }),
  );
  let schemaChanged = false;

  const nextSections = sections.map((section) => {
    let sectionChanged = false;

    const nextFields = section.fields.map((field) => {
      const relation = relationsByPath.get(field.name);
      if (!relation) return field;

      const relationFieldName = resolveRelationFieldName(relation) || field.name;
      const nestedControl = resolveNestedControlForRelation(nestedControls, relation);
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
      const relatedFields = collectNestedRelationFields(
        relatedSchema,
        nestedControl,
      );
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

          const fullPath = `${relationFieldName}.${relatedField.name}`;

          if (
            includeNestedSelectors.length > 0 &&
            !matchFieldSelectors(
              includeNestedSelectors,
              fullPath,
              relationFieldName,
            )
          ) {
            return null;
          }

          if (
            excludeNestedSelectors.some((selector) =>
              isFieldSelectorMatch(selector, fullPath, relationFieldName),
            )
          ) {
            return null;
          }

          return applyFieldOverride(
            relatedField,
            resolveFieldOverride(
              nestedControl.fieldOverrides,
              fullPath,
              relationFieldName,
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
              relationFieldName,
              includeNestedSelectors,
            )
          : fieldOrderMode === "custom"
            ? orderFieldsBySelectors(
                nestedFields,
                relationFieldName,
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

function hasExplicitFieldOrder(fields: FormFieldConfig[]): boolean {
  return fields.some((field) => typeof field.order === "number");
}

function isRelationBackedField(field: FormFieldConfig): boolean {
  const meta = asRecord((field as { meta?: unknown }).meta);
  if (!meta) return false;
  return Boolean(
    meta.isRelationField ||
    meta.relationPath ||
    meta.relationType ||
    meta.relatedAppLabel ||
    meta.relatedModelName,
  );
}

/**
 * Returns true when a field (or one of its nested children) is required.
 * Used to preserve relation-backed nested blocks in `onlyRequired` mode.
 */
function hasRequiredFieldInTree(field: FormFieldConfig): boolean {
  if (Boolean(field.required)) {
    return true;
  }
  const nestedFields = Array.isArray((field as { fields?: unknown }).fields)
    ? ((field as { fields?: FormFieldConfig[] }).fields ?? [])
    : [];
  if (nestedFields.length === 0) {
    return false;
  }
  return nestedFields.some((nestedField) => hasRequiredFieldInTree(nestedField));
}

/**
 * Determines whether a field should remain visible when `onlyRequired` is active.
 * Relation-backed fields are kept when they contain at least one required child.
 */
function shouldKeepFieldInOnlyRequiredMode(field: FormFieldConfig): boolean {
  if (field.required) {
    return true;
  }
  if (!isRelationBackedField(field)) {
    return false;
  }
  return hasRequiredFieldInTree(field);
}

function moveListFieldsToSectionEnd(
  fields: FormFieldConfig[],
): FormFieldConfig[] {
  if (fields.length < 2 || hasExplicitFieldOrder(fields)) {
    return fields;
  }

  const regularFields: FormFieldConfig[] = [];
  const trailingTextFields: FormFieldConfig[] = [];
  const listFields: FormFieldConfig[] = [];

  for (const field of fields) {
    if (field.type === "list" && !isRelationBackedField(field)) {
      listFields.push(field);
      continue;
    }
    if (field.type === "json" || field.type === "textarea") {
      trailingTextFields.push(field);
      continue;
    }
    regularFields.push(field);
  }

  if (trailingTextFields.length === 0 && listFields.length === 0) {
    return fields;
  }

  const ordered = [...regularFields, ...trailingTextFields, ...listFields];
  const unchanged = ordered.every((field, index) => field === fields[index]);
  return unchanged ? fields : ordered;
}

/**
 * Applies trailing-complex-field ordering at section level:
 * regular fields first, then textarea/json, then non-relation lists.
 */
export function enforceTrailingComplexFieldOrder<
  TValues extends Record<string, unknown>,
>(schema: FormSchema<TValues>): FormSchema<TValues> {
  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;

  let changed = false;
  const nextSections = sections.map((section) => {
    const orderedFields = moveListFieldsToSectionEnd(section.fields);
    if (orderedFields === section.fields) return section;
    changed = true;
    return {
      ...section,
      fields: orderedFields,
    };
  });

  if (!changed) return schema;
  return {
    ...schema,
    sections: nextSections,
  };
}

export function hasUserOrderOverrides(
  overrides?: Record<string, ModelFormFieldOverrideValue>,
): boolean {
  if (!overrides) return false;
  return Object.values(overrides).some((override) => {
    if (!override || typeof override === "function") return false;
    return typeof (override as { order?: unknown }).order === "number";
  });
}

function orderSectionFieldsByContractPaths(
  fields: FormFieldConfig[],
  fieldPaths: string[] | undefined,
): FormFieldConfig[] {
  if (!fieldPaths?.length || fields.length < 2) return fields;

  const ranking = new Map<string, number>();
  fieldPaths.forEach((path, index) => {
    const normalized = String(path ?? "").trim();
    if (!normalized || ranking.has(normalized)) return;
    ranking.set(normalized, index);
  });
  if (ranking.size === 0) return fields;

  const ranked = fields.map((field, index) => ({
    field,
    index,
    rank: ranking.get(field.name),
  }));
  const hasRankedField = ranked.some((entry) => entry.rank !== undefined);
  if (!hasRankedField) return fields;

  const ordered = ranked
    .sort((a, b) => {
      const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
      if (rankA === rankB) return a.index - b.index;
      return rankA - rankB;
    })
    .map((entry) => entry.field);
  const unchanged = ordered.every((field, index) => field === fields[index]);
  return unchanged ? fields : ordered;
}

export function enforceContractSectionFieldOrder<
  TValues extends Record<string, unknown>,
>(
  schema: FormSchema<TValues>,
  contract: ModelFormContract,
): FormSchema<TValues> {
  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;

  const sectionPaths = new Map<string, string[]>();
  for (const section of contract.sections ?? []) {
    if (!section.id) continue;
    sectionPaths.set(section.id, section.fieldPaths ?? []);
  }
  if (sectionPaths.size === 0) return schema;

  let changed = false;
  const nextSections = sections.map((section) => {
    const fieldPaths = sectionPaths.get(section.id);
    const orderedFields = orderSectionFieldsByContractPaths(
      section.fields,
      fieldPaths,
    );
    if (orderedFields === section.fields) return section;
    changed = true;
    return {
      ...section,
      fields: orderedFields,
    };
  });

  if (!changed) return schema;
  return {
    ...schema,
    sections: nextSections,
  };
}

export function applySchemaControls<TValues extends Record<string, unknown>>(
  schema: FormSchema<TValues>,
  options: {
    onlyFields?: string[];
    excludeFields?: string[];
    onlyRequired?: boolean;
    onlyRelationships?: string[];
    excludeRelationships?: string[];
    fieldOverrides?: Record<string, ModelFormFieldOverrideValue>;
    sectionOverrides?: Record<string, ModelFormSectionOverrideValue<TValues>>;
    nestedControls: NestedControlMap<TValues> | null;
    enforceListFieldsAtEnd?: boolean;
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

          const globallyOverridden = applyFieldOverride(
            currentField,
            resolveFieldOverride(
              options.fieldOverrides,
              field.name,
              relationPath,
            ),
          );
          if (!globallyOverridden) {
            return null;
          }

          if (
            options.onlyRequired &&
            !shouldKeepFieldInOnlyRequiredMode(globallyOverridden)
          ) {
            return null;
          }

          return globallyOverridden;
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

      const orderedFields =
        options.enforceListFieldsAtEnd === false
          ? globallyOverridden.fields
          : moveListFieldsToSectionEnd(globallyOverridden.fields);
      if (orderedFields.length === 0) {
        return null;
      }

      return orderedFields === globallyOverridden.fields
        ? globallyOverridden
        : {
            ...globallyOverridden,
            fields: orderedFields,
          };
    })
    .filter(Boolean) as FormSectionConfig<TValues>[];

  return {
    ...schema,
    sections: nextSections,
  };
}
