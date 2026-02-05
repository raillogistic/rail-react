import type { UseFormReturn } from "@tanstack/react-form";
import type {
  FormMetadata,
  RelationshipSchema,
  ModelFormNestedFieldsControl,
  ModelFormNestedFieldConfig,
  NestedFieldMode,
  NestedRelationOperationMap,
} from "../types";

const RELATION_KEYS = new Set([
  "connect",
  "create",
  "update",
  "disconnect",
  "set",
  "delete",
]);
const DEFAULT_ID_KEYS = ["id", "pk", "uuid", "value"];

export function stripUntouchedFieldValues(
  input: Record<string, any>,
  form: UseFormReturn<any>
): Record<string, any> {
  const state =
    typeof form.store.getState === "function"
      ? form.store.getState()
      : (form.store as any).state;
  const fieldMeta: Record<
    string,
    { isDirty?: boolean; isTouched?: boolean } | undefined
  > = (state as any)?.fieldMeta ?? {};
  const clone: Record<string, any> = { ...input };
  const fieldMetaEntries = Object.entries(fieldMeta);
  Object.keys(clone).forEach((fieldName) => {
    const meta = fieldMeta[fieldName];
    const nestedTouched = fieldMetaEntries.some(([key, nestedMeta]) => {
      if (!key.startsWith(`${fieldName}.`)) return false;
      return (
        (nestedMeta as any)?.isDirty === true ||
        (nestedMeta as any)?.isTouched === true
      );
    });
    if (!meta || (meta.isDirty !== true && meta.isTouched !== true)) {
      if (nestedTouched) {
        return;
      }
      clone[fieldName] = undefined;
    }
  });
  return clone;
}

export function normalizeRelationshipInputValues(
  input: Record<string, any>,
  metadata: FormMetadata | null,
  mode: "create" | "update"
): Record<string, any> {
  if (!metadata) return input;
  const clone: Record<string, any> = { ...input };

  metadata.relationships.forEach((relationship) => {
    const fieldName = relationship.name;
    if (!(fieldName in clone)) return;
    clone[fieldName] = normalizeRelationValue(
      clone[fieldName],
      relationship,
      mode
    );
  });

  return clone;
}

export function normalizeNestedInputValues(
  input: Record<string, any>,
  metadata: FormMetadata | null,
  nestedMetadata: Record<string, FormMetadata>,
  mode: "create" | "update",
  nestedControl?: ModelFormNestedFieldsControl
): Record<string, any> {
  if (!metadata) return input;
  const nestedKeys = Object.keys(nestedMetadata ?? {});
  if (!nestedKeys.length) {
    return input;
  }
  const clone: Record<string, any> = { ...input };
  const controlFields = nestedControl?.fields ?? {};

  nestedKeys.forEach((fieldName) => {
    if (!(fieldName in clone)) {
      return;
    }
    const relation = metadata.relationships.find(
      (rel) => rel.name === fieldName || rel.fieldName === fieldName
    );
    if (!relation) {
      return;
    }
    const config =
      controlFields[fieldName] ??
      controlFields[relation.name] ??
      controlFields[relation.fieldName];
    const normalized = normalizeNestedValue(
      clone[fieldName],
      relation,
      nestedMetadata[fieldName],
      mode,
      nestedControl,
      config
    );
    const pruneEmpty =
      config?.pruneEmpty ??
      nestedControl?.defaultPruneEmpty ??
      mode === "create";
    if (normalized === undefined && pruneEmpty) {
      delete clone[fieldName];
      return;
    }
    clone[fieldName] = normalized;
  });

  return clone;
}

function normalizeRelationValue(
  value: any,
  relationship: RelationshipSchema,
  mode: "create" | "update"
): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (isUnifiedRelationInput(value)) {
    return value;
  }

  const isToMany = relationship.isToMany;
  const idOperation = isToMany && mode === "update" ? "set" : "connect";

  if (Array.isArray(value)) {
    const connectIds: Array<string | number> = [];
    const createEntries: Record<string, any>[] = [];

    value.forEach((entry) => {
      if (entry === null || entry === undefined) return;
      if (isUnifiedRelationInput(entry)) {
        createEntries.push(entry);
        return;
      }
      if (typeof entry === "object") {
        const extracted = extractIdValue(entry);
        if (extracted !== null && extracted !== undefined) {
          connectIds.push(extracted);
          return;
        }
        createEntries.push(entry as Record<string, any>);
        return;
      }
      connectIds.push(entry as string | number);
    });

    if (!isToMany) {
      const preferred = connectIds[0] ?? null;
      if (preferred !== null && preferred !== undefined) {
        return { connect: preferred };
      }
      if (createEntries.length > 0) {
        return { create: createEntries[0] };
      }
      return null;
    }

    const payload: Record<string, any> = {};
    if (connectIds.length) {
      payload[idOperation] = connectIds;
    }
    if (createEntries.length) {
      payload.create = createEntries;
    }
    return payload;
  }

  if (typeof value === "object") {
    const extracted = extractIdValue(value);
    if (extracted !== null && extracted !== undefined) {
      return { connect: extracted };
    }
    return { create: value };
  }

  if (isToMany) {
    return { [idOperation]: [value] };
  }
  return { connect: value };
}

function normalizeNestedValue(
  value: any,
  relationship: RelationshipSchema,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  nestedControl: ModelFormNestedFieldsControl | undefined,
  fieldConfig: ModelFormNestedFieldConfig | undefined
) {
  if (value === null || value === undefined) {
    return value;
  }

  if (fieldConfig?.transform) {
    return fieldConfig.transform(value, {
      mode,
      metadata: nestedMeta,
      relation: relationship,
      nestedMetadata: nestedMeta,
    });
  }

  const allowedOps = resolveAllowedOperations(
    relationship,
    nestedControl,
    fieldConfig
  );

  if (isUnifiedRelationInput(value)) {
    return normalizeUnifiedRelationInput(
      value,
      relationship,
      nestedMeta,
      mode,
      allowedOps,
      fieldConfig,
      nestedControl
    );
  }

  if (relationship.isToMany) {
    return normalizeNestedList(
      value,
      relationship,
      nestedMeta,
      mode,
      allowedOps,
      fieldConfig,
      nestedControl
    );
  }
  return normalizeNestedObject(
    value,
    relationship,
    nestedMeta,
    mode,
    allowedOps,
    fieldConfig,
    nestedControl
  );
}

function normalizeNestedList(
  value: any,
  relationship: RelationshipSchema,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  allowedOps: Record<string, boolean>,
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  const entries = Array.isArray(value) ? value : [value];
  const idKeys = resolveIdKeys(fieldConfig, nestedControl);
  const idOperation = resolveIdOperation(mode, allowedOps, fieldConfig, nestedControl);
  const pruneEmpty = shouldPruneEmpty(mode, fieldConfig, nestedControl);
  const createEntries: Record<string, any>[] = [];
  const updateEntries: Record<string, any>[] = [];
  const idValues: Array<string | number> = [];

  entries.forEach((entry) => {
    if (entry === null || entry === undefined) return;
    if (isUnifiedRelationInput(entry)) {
      const normalized = normalizeUnifiedRelationInput(
        entry,
        relationship,
        nestedMeta,
        mode,
        allowedOps,
        fieldConfig,
        nestedControl
      );
      if (normalized) {
        // Merge any explicit operations into the payload later
        const payload = normalized as Record<string, any>;
        if (payload.connect) {
          idValues.push(...normalizeIdList(payload.connect, idKeys));
        }
        if (payload.set) {
          idValues.push(...normalizeIdList(payload.set, idKeys));
        }
        if (payload.create) {
          const list = Array.isArray(payload.create)
            ? payload.create
            : [payload.create];
          list.forEach((item) => {
            if (item) createEntries.push(item);
          });
        }
        if (payload.update) {
          const list = Array.isArray(payload.update)
            ? payload.update
            : [payload.update];
          list.forEach((item) => {
            if (item) updateEntries.push(item);
          });
        }
      }
      return;
    }

    if (typeof entry === "object") {
      const record = entry as Record<string, any>;
      const idValue = extractIdValue(record, idKeys);
      const hasOtherFields = hasMeaningfulOtherFields(record, idKeys);
      if (idValue !== null && idValue !== undefined) {
        if (idOperation) {
          idValues.push(idValue as any);
        }
        if (hasOtherFields && allowedOps.update) {
          updateEntries.push(
            normalizeNestedRecord(
              record,
              nestedMeta,
              mode,
              fieldConfig,
              nestedControl,
              false,
              "update"
            )
          );
        }
        return;
      }
      if (allowedOps.create) {
        if (pruneEmpty && isEmptyValue(record)) {
          return;
        }
        createEntries.push(
          normalizeNestedRecord(
            record,
            nestedMeta,
            mode,
            fieldConfig,
            nestedControl,
            true,
            "create"
          )
        );
      }
      return;
    }

    if (idOperation) {
      idValues.push(entry as any);
    }
  });

  const payload: Record<string, any> = {};
  if (idOperation && idValues.length) {
    payload[idOperation] = idValues;
  }
  if (allowedOps.create && createEntries.length) {
    payload.create = createEntries;
  }
  if (allowedOps.update && updateEntries.length) {
    payload.update = updateEntries;
  }

  return Object.keys(payload).length ? payload : undefined;
}

function normalizeNestedObject(
  value: any,
  relationship: RelationshipSchema,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  allowedOps: Record<string, boolean>,
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  const idKeys = resolveIdKeys(fieldConfig, nestedControl);
  const pruneEmpty = shouldPruneEmpty(mode, fieldConfig, nestedControl);
  if (typeof value !== "object" || Array.isArray(value)) {
    if (allowedOps.connect) {
      return { connect: value };
    }
    return undefined;
  }

  const record = value as Record<string, any>;
  const idValue = extractIdValue(record, idKeys);
  const hasOtherFields = hasMeaningfulOtherFields(record, idKeys);
  const modeOverride = resolveNestedMode(mode, fieldConfig, nestedControl);

  if (modeOverride === "connect" || modeOverride === "set") {
    if (idValue !== null && idValue !== undefined && allowedOps.connect) {
      return { connect: idValue };
    }
    if (allowedOps.create) {
      if (pruneEmpty && isEmptyValue(record)) {
        return undefined;
      }
      return {
        create: normalizeNestedRecord(
          record,
          nestedMeta,
          mode,
          fieldConfig,
          nestedControl,
          true,
          "create"
        ),
      };
    }
    return undefined;
  }

  if (modeOverride === "create") {
    if (allowedOps.create) {
      if (pruneEmpty && isEmptyValue(record)) {
        return undefined;
      }
      return {
        create: normalizeNestedRecord(
          record,
          nestedMeta,
          mode,
          fieldConfig,
          nestedControl,
          true,
          "create"
        ),
      };
    }
    if (idValue !== null && idValue !== undefined && allowedOps.connect) {
      return { connect: idValue };
    }
    return undefined;
  }

  if (modeOverride === "update") {
    if (allowedOps.update) {
      return {
        update: normalizeNestedRecord(
          record,
          nestedMeta,
          mode,
          fieldConfig,
          nestedControl,
          false,
          "update"
        ),
      };
    }
    if (idValue !== null && idValue !== undefined && allowedOps.connect) {
      return { connect: idValue };
    }
    return undefined;
  }

  if (idValue !== null && idValue !== undefined) {
    if (hasOtherFields && allowedOps.update) {
      return {
        update: normalizeNestedRecord(
          record,
          nestedMeta,
          mode,
          fieldConfig,
          nestedControl,
          false,
          "update"
        ),
      };
    }
    if (allowedOps.connect) {
      return { connect: idValue };
    }
  }

  if (allowedOps.create) {
    if (pruneEmpty && isEmptyValue(record)) {
      return undefined;
    }
    return {
      create: normalizeNestedRecord(
        record,
        nestedMeta,
        mode,
        fieldConfig,
        nestedControl,
        true,
        "create"
      ),
    };
  }

  return undefined;
}

function normalizeUnifiedRelationInput(
  value: any,
  relationship: RelationshipSchema,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  allowedOps: Record<string, boolean>,
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  if (!value || typeof value !== "object") return value;
  const clone: Record<string, any> = { ...value };
  const idKeys = resolveIdKeys(fieldConfig, nestedControl);

  (Object.keys(clone) as Array<keyof typeof clone>).forEach((key) => {
    const op = String(key);
    if (!allowedOps[op]) {
      delete clone[key];
      return;
    }
    if (op === "create" || op === "update") {
      const recordMode: "create" | "update" =
        op === "create" ? "create" : "update";
      clone[key] = normalizeNestedPayload(
        clone[key],
        nestedMeta,
        mode,
        fieldConfig,
        nestedControl,
        op === "create",
        recordMode
      );
    } else if (op === "connect" || op === "disconnect" || op === "set") {
      clone[key] = normalizeIdOperationPayload(clone[key], idKeys);
    }
  });

  if (!Object.keys(clone).length) {
    return undefined;
  }
  if (!relationship.isToMany && clone.disconnect) {
    // To-one disconnects are represented as null in input types
    return { disconnect: true };
  }
  return clone;
}

function normalizeNestedPayload(
  payload: any,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined,
  stripIds: boolean,
  recordMode?: "create" | "update"
) {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) {
    return payload
      .map((entry) =>
        normalizeNestedRecord(
          entry,
          nestedMeta,
          mode,
          fieldConfig,
          nestedControl,
          stripIds,
          recordMode
        )
      )
      .filter((entry) => entry !== undefined);
  }
  if (typeof payload === "object") {
    return normalizeNestedRecord(
      payload,
      nestedMeta,
      mode,
      fieldConfig,
      nestedControl,
      stripIds,
      recordMode
    );
  }
  return payload;
}

function normalizeNestedRecord(
  record: Record<string, any>,
  nestedMeta: FormMetadata | null,
  mode: "create" | "update",
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined,
  stripIds: boolean = false,
  recordMode?: "create" | "update"
) {
  if (!record || typeof record !== "object") return record;
  let next = { ...record };
  const idKeys = resolveIdKeys(fieldConfig, nestedControl);
  const effectiveMode = recordMode ?? (stripIds ? "create" : mode);
  if (stripIds) {
    next = stripIdFields(next, idKeys);
  }
  if (nestedMeta) {
    next = normalizeRelationshipInputValues(next, nestedMeta, effectiveMode);
    next = sanitizeEmptyScalarValues(next, nestedMeta);
    next = coerceNumericFieldValues(next, nestedMeta);
  }
  return next;
}

function resolveNestedMode(
  mode: "create" | "update",
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
): NestedFieldMode {
  return (
    fieldConfig?.mode ??
    nestedControl?.defaultMode ??
    (mode === "update" ? "auto" : "create")
  );
}

function resolveIdOperation(
  mode: "create" | "update",
  allowedOps: Record<string, boolean>,
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  const explicitMode = resolveNestedMode(mode, fieldConfig, nestedControl);
  const preferred =
    explicitMode === "set" || explicitMode === "connect"
      ? explicitMode
      : mode === "update"
      ? "set"
      : "connect";

  if (allowedOps[preferred]) return preferred;
  if (allowedOps.connect) return "connect";
  if (allowedOps.set) return "set";
  return null;
}

function resolveIdKeys(
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  return (
    fieldConfig?.idKeys ??
    nestedControl?.defaultIdKeys ??
    DEFAULT_ID_KEYS
  );
}

function shouldPruneEmpty(
  mode: "create" | "update",
  fieldConfig: ModelFormNestedFieldConfig | undefined,
  nestedControl: ModelFormNestedFieldsControl | undefined
) {
  return (
    fieldConfig?.pruneEmpty ??
    nestedControl?.defaultPruneEmpty ??
    mode === "create"
  );
}

function resolveAllowedOperations(
  relationship: RelationshipSchema,
  nestedControl: ModelFormNestedFieldsControl | undefined,
  fieldConfig: ModelFormNestedFieldConfig | undefined
) {
  const defaults: Record<string, boolean> = {
    connect: true,
    create: true,
    update: true,
    disconnect: true,
    set: true,
  };

  const relationOps = parseRelationOperations(relationship);
  const hasRelationOps = Boolean(relationOps);
  if (relationOps?.style?.toLowerCase() === "id_only") {
    defaults.create = false;
    defaults.update = false;
  }
  if (relationOps) {
    ["connect", "create", "update", "disconnect", "set"].forEach((op) => {
      const value = relationOps[op];
      if (value && typeof value.enabled === "boolean") {
        defaults[op] = value.enabled;
      }
    });
  }

  const overrideOps: NestedRelationOperationMap | undefined =
    fieldConfig?.operations ?? nestedControl?.defaultOperations;
  if (overrideOps) {
    Object.entries(overrideOps).forEach(([op, enabled]) => {
      if (typeof enabled === "boolean") {
        if (enabled === false) {
          defaults[op] = false;
        } else if (!hasRelationOps) {
          defaults[op] = true;
        }
      }
    });
  }

  if (!relationship.isToMany) {
    defaults.set = false;
    defaults.disconnect = false;
  }

  return defaults;
}

function parseRelationOperations(relationship: RelationshipSchema) {
  const raw = (relationship as any).relationOperations;
  if (!raw) {
    return null;
  }
  if (typeof raw === "object") {
    return raw as Record<string, any>;
  }
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeIdOperationPayload(value: any, idKeys: string[]) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return normalizeIdList(value, idKeys);
  }
  if (typeof value === "object") {
    const extracted = extractIdValue(value, idKeys);
    return extracted ?? value;
  }
  return value;
}

function normalizeIdList(value: any[], idKeys: string[]) {
  return value
    .map((entry) =>
      typeof entry === "object" && entry !== null
        ? extractIdValue(entry as Record<string, any>, idKeys)
        : entry
    )
    .filter((entry) => entry !== null && entry !== undefined);
}

function hasMeaningfulOtherFields(record: Record<string, any>, idKeys: string[]) {
  const idKeySet = new Set(idKeys);
  return Object.entries(record).some(([key, value]) => {
    if (idKeySet.has(key)) return false;
    return !isEmptyValue(value);
  });
}

function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((entry) => isEmptyValue(entry));
  }
  if (typeof value === "object") {
    const entries = Object.values(value);
    if (!entries.length) return true;
    return entries.every((entry) => isEmptyValue(entry));
  }
  return false;
}

function stripIdFields(record: Record<string, any>, idKeys: string[]) {
  const idKeySet = new Set(idKeys);
  return Object.entries(record).reduce<Record<string, any>>((acc, [key, value]) => {
    if (!idKeySet.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function isUnifiedRelationInput(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value).some((key) => RELATION_KEYS.has(key));
}

function extractIdValue(value: Record<string, any>, idKeys: string[] = DEFAULT_ID_KEYS) {
  for (const key of idKeys) {
    const candidate = (value as any)?.[key];
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }
  return null;
}

export function sanitizeEmptyScalarValues(
  input: Record<string, any>,
  metadata: FormMetadata | null
): Record<string, any> {
  if (!metadata) {
    return input;
  }
  const dateLikeFields = new Set(
    metadata.fields
      .filter((field) =>
        ["DateField", "DateTimeField", "TimeField"].includes(
          field.fieldType ?? ""
        )
      )
      .map((field) => field.name)
  );
  if (!dateLikeFields.size) {
    return input;
  }
  const clone: Record<string, any> = { ...input };
  dateLikeFields.forEach((fieldName) => {
    if (clone[fieldName] === "") {
      clone[fieldName] = undefined;
    }
  });
  return clone;
}

export function coerceNumericFieldValues(
  input: Record<string, any>,
  metadata: FormMetadata | null
): Record<string, any> {
  if (!metadata) return input;

  const numericFieldNames = metadata.fields
    .filter((field) =>
      [
        "IntegerField",
        "SmallIntegerField",
        "PositiveSmallIntegerField",
        "PositiveIntegerField",
        "BigIntegerField",
        "AutoField",
        "BigAutoField",
      ].includes(field.fieldType ?? "")
    )
    .map((field) => field.name);

  const decimalFieldNames = metadata.fields
    .filter((field) =>
      ["DecimalField", "FloatField"].includes(field.fieldType ?? "")
    )
    .map((field) => field.name);

  if (!numericFieldNames.length && !decimalFieldNames.length) {
    return input;
  }

  const clone: Record<string, any> = { ...input };

  numericFieldNames.forEach((fieldName) => {
    const value = clone[fieldName];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        clone[fieldName] = parsed;
      }
    }
  });

  decimalFieldNames.forEach((fieldName) => {
    const value = clone[fieldName];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        clone[fieldName] = parsed;
      }
    }
  });

  return clone;
}
