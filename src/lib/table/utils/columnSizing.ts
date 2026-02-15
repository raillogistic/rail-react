import type { CSSProperties } from "react";
import type { ColumnWidthState } from "../types";

export const MIN_COLUMN_WIDTH_PX = 120;
export const MAX_COLUMN_WIDTH_PX = 900;

export function clampColumnWidth(width: number): number {
  if (!Number.isFinite(width)) return MIN_COLUMN_WIDTH_PX;
  return Math.max(MIN_COLUMN_WIDTH_PX, Math.min(MAX_COLUMN_WIDTH_PX, width));
}

export function resolveColumnWidth(
  columnWidths: ColumnWidthState,
  columnId: string,
): number | null {
  const width = columnWidths[columnId];
  if (typeof width !== "number") return null;
  return clampColumnWidth(width);
}

export function getColumnWidthStyle(
  columnWidths: ColumnWidthState,
  columnId: string,
): CSSProperties | undefined {
  const width = resolveColumnWidth(columnWidths, columnId);
  if (width === null) return undefined;
  const value = `${width}px`;
  return {
    width: value,
    minWidth: value,
    maxWidth: value,
  };
}
