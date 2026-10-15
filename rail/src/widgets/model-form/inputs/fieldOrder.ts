/**
 * Field ordering helpers extracted from the old DynamicForm monolith.
 */
import type {
  FormFieldConfig,
  ObjectFieldConfig,
  ListFieldConfig,
} from "../types/schema";
import type {
  FormFieldOrderingConfig,
  FormFieldOrderingRule,
} from "../types/layout";

export type NormalizeFieldOrderOptions = {
  ordering?: FormFieldOrderingConfig<any>;
  sectionId?: string;
};

/**
 * Normalizes field order recursively using:
 * 1) intrinsic`order` hints
 * 2) optional layout ordering rules
 */
export function normalizeFieldOrder(
  fields: FormFieldConfig[],
  options?: NormalizeFieldOrderOptions,
): FormFieldConfig[] {
  if (!fields.length) return fields;

  let childMutated = false;
  const withChildren = fields.map((field) => {
    let nextField = field;
    if (fieldHasChildFields(field) && field.fields?.length) {
      const nestedFields = normalizeFieldOrder(field.fields, {
        ordering: options?.ordering,
      });
      if (nestedFields !== field.fields) {
        childMutated = true;
        nextField = {
          ...nextField,
          fields: nestedFields,
        } as FormFieldConfig;
      }
    }
    return nextField;
  });

  const orderedByHint = sortFieldsByOrderHint(withChildren);
  const orderedByList = applyExplicitFieldListOrder(
    orderedByHint,
    options?.ordering?.order,
    false,
  );
  const orderedByTail = applyExplicitFieldListOrder(
    orderedByList,
    options?.ordering?.tailing,
    true,
  );
  const orderedByRules = applyOrderingRules(
    orderedByTail,
    resolveSectionOrderingRules(options?.ordering, options?.sectionId),
  );
  const orderChanged = !arraysShallowEqual(orderedByRules, withChildren);

  if (
    !childMutated &&
    !orderChanged &&
    arraysShallowEqual(fields, withChildren)
  ) {
    return fields;
  }
  return orderChanged ? orderedByRules : withChildren;
}

/**
 * Reorders fields according to an explicit field-name list.
 * The list can be partial; unmatched fields keep relative order.
 */
function applyExplicitFieldListOrder(
  fields: FormFieldConfig[],
  orderedNames: string[] | undefined,
  placeAtEnd: boolean,
): FormFieldConfig[] {
  if (!orderedNames?.length || fields.length < 2) return fields;

  const normalizedNames = Array.from(
    new Set(
      orderedNames
        .map((name) => String(name ?? "").trim())
        .filter((name) => name.length > 0),
    ),
  );
  if (normalizedNames.length === 0) return fields;

  const selected = new Map<string, FormFieldConfig>();
  for (const field of fields) {
    if (!selected.has(field.name) && normalizedNames.includes(field.name)) {
      selected.set(field.name, field);
    }
  }

  if (selected.size === 0) return fields;

  const orderedSubset: FormFieldConfig[] = [];
  for (const name of normalizedNames) {
    const field = selected.get(name);
    if (field) orderedSubset.push(field);
  }

  const selectedNames = new Set(orderedSubset.map((field) => field.name));
  const remaining = fields.filter((field) => !selectedNames.has(field.name));
  const next = placeAtEnd
    ? [...remaining, ...orderedSubset]
    : [...orderedSubset, ...remaining];

  return arraysShallowEqual(next, fields) ? fields : next;
}

/**
 * Resolves ordering rules for a given section by merging global and section rules.
 */
function resolveSectionOrderingRules(
  ordering: FormFieldOrderingConfig<any> | undefined,
  sectionId: string | undefined,
): FormFieldOrderingRule<any>[] {
  if (!ordering || ordering.enabled === false) return [];

  const globalRules = Array.isArray(ordering.rules) ? ordering.rules : [];
  const sectionRules = sectionId
    ? (ordering.sectionRules?.[sectionId] ?? [])
    : [];

  return [...globalRules, ...sectionRules];
}

/**
 * Applies explicit placement rules after order-hint sorting.
 */
function applyOrderingRules(
  fields: FormFieldConfig[],
  rules: FormFieldOrderingRule<any>[],
): FormFieldConfig[] {
  if (fields.length < 2 || rules.length === 0) return fields;

  const next = [...fields];

  for (const rule of rules) {
    const targetName = String(rule.field ?? "").trim();
    if (!targetName) continue;

    const sourceIndex = next.findIndex((field) => field.name === targetName);
    if (sourceIndex < 0) continue;

    const [targetField] = next.splice(sourceIndex, 1);
    const targetIndex = resolveTargetIndex(next, rule);
    next.splice(targetIndex, 0, targetField);
  }

  return arraysShallowEqual(next, fields) ? fields : next;
}

/**
 * Resolves insertion index for a field based on placement rule.
 */
function resolveTargetIndex(
  fields: FormFieldConfig[],
  rule: FormFieldOrderingRule<any>,
): number {
  const place = rule.place;

  if (place === "start") {
    return 0;
  }

  if (place === "end") {
    return fields.length;
  }

  if (place === "index") {
    return clampIndex(rule.index, fields.length);
  }

  const anchorName = String(rule.anchor ?? "").trim();
  if (!anchorName) return fields.length;
  const anchorIndex = fields.findIndex((field) => field.name === anchorName);
  if (anchorIndex < 0) return fields.length;

  if (place === "before") {
    return anchorIndex;
  }

  if (place === "after") {
    return anchorIndex + 1;
  }

  return fields.length;
}

/**
 * Clamps numeric indices into a valid insertion range.
 */
function clampIndex(value: number | undefined, length: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return length;
  }
  const a = Math.trunc(value);
  if (a < 0) return 0;
  if (a > length) return length;
  return a;
}

/**
 * Sorts fields using explicit`order`, then keeps stable relative fallback.
 */
function sortFieldsByOrderHint(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (fields.length < 2) return fields;
  return fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => compareFieldOrder(a.field, b.field, a.index, b.index))
    .map((entry) => entry.field);
}

/**
 * Compares two fields by`order` hint then by name for deterministic ties.
 */
function compareFieldOrder(
  a: FormFieldConfig,
  b: FormFieldConfig,
  indexA: number,
  indexB: number,
) {
  const orderA = typeof a.order === "number" ? a.order : indexA;
  const orderB = typeof b.order === "number" ? b.order : indexB;
  if (orderA === orderB) return a.name.localeCompare(b.name);
  return orderA - orderB;
}

/**
 * Compares field arrays by reference equality of each element.
 */
function arraysShallowEqual(a: FormFieldConfig[], b: FormFieldConfig[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Narrowing helper for nested field containers.
 */
function fieldHasChildFields(
  field: FormFieldConfig,
): field is ObjectFieldConfig | ListFieldConfig {
  return field.type === "object" || field.type === "list";
}
