/**
 * Formatting helpers used by reporting widgets and exporters.
 */

import type { ReportingColumn } from "@/widgets/reporting/types";

/**
 * Resolve a column label from a columns list.
 *
 * @param columns - Column definitions.
 * @param field - Field name used in rows.
 * @returns Best-effort human label.
 */
export function resolveColumnLabel(columns: ReportingColumn[], field: string): string {
  return columns.find((col) => col.name === field)?.label ?? field;
}

/**
 * Convert an unknown cell value to a display-friendly string.
 *
 * @param value - Raw cell value.
 * @returns Display string.
 */
export function stringifyCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

