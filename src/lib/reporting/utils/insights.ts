/**
 * Lightweight “insights” computations for reporting results.
 *
 * The goal is to provide dashboard-ready summaries (totals, min/max, anomalies)
 * without requiring extra backend endpoints.
 */

import type { ReportingColumn, ReportingQueryResult } from "@/lib/reporting/types";

/**
 * Summary statistics for a numeric metric column.
 * @property field - Metric field name.
 * @property label - Human-readable label.
 * @property count - Number of numeric samples.
 * @property sum - Sum of samples.
 * @property avg - Average of samples.
 * @property min - Minimum value.
 * @property max - Maximum value.
 */
export type ReportingMetricSummary = {
  field: string;
  label: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
};

/**
 * Outlier information computed using a simple z-score heuristic.
 * @property field - Metric field name.
 * @property rowIndex - Row index in the result set.
 * @property value - Outlier value.
 * @property zScore - Z-score used for ranking.
 */
export type ReportingOutlier = {
  field: string;
  rowIndex: number;
  value: number;
  zScore: number;
};

/**
 * Determine whether a value can be treated as a finite number.
 *
 * @param value - Unknown input value.
 * @returns True when numeric.
 */
export function isFiniteNumber(value: unknown): value is number {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed);
  }
  return false;
}

/**
 * Extract numeric samples from rows for a given field.
 *
 * @param rows - Result rows.
 * @param field - Target field name.
 * @returns Numeric samples.
 */
export function getNumericSamples(rows: Array<Record<string, unknown>>, field: string): number[] {
  const samples: number[] = [];
  for (const row of rows) {
    const value = row[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      samples.push(value);
      continue;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) samples.push(parsed);
    }
  }
  return samples;
}

/**
 * Compute summaries for metric-like columns in a query result.
 *
 * @param result - Query result payload.
 * @param columns - Optional column metadata list.
 * @returns List of numeric summaries.
 */
export function computeMetricSummaries(
  result: ReportingQueryResult,
  columns: ReportingColumn[] = result.columns ?? [],
): ReportingMetricSummary[] {
  const metricFields =
    columns.length > 0
      ? columns
          .filter((col) => col.kind === "metric" || col.kind === "computed")
          .map((col) => ({ field: col.name, label: col.label ?? col.name }))
      : Object.keys(result.rows?.[0] ?? {}).map((field) => ({ field, label: field }));

  const summaries: ReportingMetricSummary[] = [];
  for (const metric of metricFields) {
    const values = getNumericSamples(result.rows, metric.field);
    if (values.length === 0) continue;
    const sum = values.reduce((acc, value) => acc + value, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    summaries.push({
      field: metric.field,
      label: metric.label,
      count: values.length,
      sum,
      avg: sum / values.length,
      min,
      max,
    });
  }
  return summaries;
}

/**
 * Compute “outliers” for metric columns based on a z-score threshold.
 *
 * @param result - Query result payload.
 * @param threshold - Absolute z-score threshold.
 * @param maxOutliers - Max outlier entries returned.
 * @returns Outlier list sorted by decreasing absolute z-score.
 */
export function computeOutliers(
  result: ReportingQueryResult,
  threshold = 2.5,
  maxOutliers = 8,
): ReportingOutlier[] {
  const rows = result.rows ?? [];
  const columns = result.columns ?? [];
  const metricFields =
    columns.length > 0
      ? columns
          .filter((col) => col.kind === "metric" || col.kind === "computed")
          .map((col) => col.name)
      : Object.keys(rows?.[0] ?? {});

  const outliers: ReportingOutlier[] = [];

  for (const field of metricFields) {
    const samples = getNumericSamples(rows, field);
    if (samples.length < 3) continue;
    const mean = samples.reduce((acc, value) => acc + value, 0) / samples.length;
    const variance =
      samples.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (samples.length - 1);
    const std = Math.sqrt(variance);
    if (!Number.isFinite(std) || std === 0) continue;

    for (let index = 0; index < rows.length; index += 1) {
      const value = rows[index]?.[field];
      if (!isFiniteNumber(value)) continue;
      const numeric = typeof value === "number" ? value : Number(value);
      const zScore = (numeric - mean) / std;
      if (Math.abs(zScore) >= threshold) {
        outliers.push({ field, rowIndex: index, value: numeric, zScore });
      }
    }
  }

  outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  return outliers.slice(0, maxOutliers);
}

