import type { UseFormReturn } from "@tanstack/react-form";
import type { FormMetadata, RelationshipSchema } from "../types";

const RELATION_KEYS = new Set([
  "connect",
  "create",
  "update",
  "disconnect",
  "set",
  "delete",
]);

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
  Object.keys(clone).forEach((fieldName) => {
    const meta = fieldMeta[fieldName];
    if (!meta || (meta.isDirty !== true && meta.isTouched !== true)) {
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

function isUnifiedRelationInput(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value).some((key) => RELATION_KEYS.has(key));
}

function extractIdValue(value: Record<string, any>) {
  return value.value ?? value.id ?? value.pk ?? value.uuid ?? null;
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
