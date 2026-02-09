import type { FieldSchema } from "../types";
import { toCamelCase, toSnakeCase } from "./caseConversion";

export function resolveGroupingValue(
  row: Record<string, unknown>,
  groupingField: string,
): unknown {
  if (!groupingField) return undefined;
  const path = groupingField.includes("__")
    ? groupingField.split("__")
    : groupingField.split(".");
  return path.reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, row);
}

export function resolveGroupingKey(
  row: Record<string, unknown>,
  groupingField: string,
): string {
  const value = resolveGroupingValue(row, groupingField);
  if (value === null || value === undefined || value === "") return "__EMPTY__";

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.id !== undefined && record.id !== null) return String(record.id);
    if (record.pk !== undefined && record.pk !== null) return String(record.pk);
    if (record.code !== undefined && record.code !== null) return String(record.code);
    if (record.name !== undefined && record.name !== null) return String(record.name);
    if (record.title !== undefined && record.title !== null) return String(record.title);
    if (record.desc !== undefined && record.desc !== null) return String(record.desc);
  }

  return String(value);
}

export function resolveFieldValue(
  row: Record<string, unknown>,
  field: Pick<FieldSchema, "name" | "fieldName">,
): unknown {
  const candidates = new Set<string>();
  const addCandidate = (candidate?: string) => {
    if (!candidate) return;
    candidates.add(candidate);
    candidates.add(toCamelCase(candidate));
    candidates.add(toSnakeCase(candidate));
  };

  addCandidate(field.name);
  addCandidate(field.fieldName);

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  return undefined;
}

export function resolveGroupingLabel(
  row: Record<string, unknown>,
  groupingField: string,
): string {
  const key = resolveGroupingKey(row, groupingField);
  if (key === "__EMPTY__") return "Non renseigne";

  const value = resolveGroupingValue(row, groupingField);
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (record.desc !== undefined && record.desc !== null) {
      return String(record.desc);
    }
    if (record.name !== undefined && record.name !== null) {
      return String(record.name);
    }
    if (record.title !== undefined && record.title !== null) {
      return String(record.title);
    }
  }

  return key;
}
