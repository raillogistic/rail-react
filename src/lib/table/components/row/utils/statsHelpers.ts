import { gql } from "@apollo/client";
import { buildModelQueryField } from "../../../utils";

const STAT_METRIC_META = [
  { suffix: "DistinctCount", label: "Distinct", order: 5 },
  { suffix: "Count", label: "Count", order: 4 },
  { suffix: "Sum", label: "Sum", order: 0 },
  { suffix: "Avg", label: "Avg", order: 1 },
  { suffix: "Min", label: "Min", order: 2 },
  { suffix: "Max", label: "Max", order: 3 },
] as const;

export type ParsedStatEntry = {
  key: string;
  value: unknown;
  fieldKey: string;
  fieldLabel: string;
  metricLabel: string;
  order: number;
  isSummary: boolean;
};

export function toLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export function normalizeRelationKey(value: string): string {
  return value
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/_/g, "");
}

export function parseStatEntry(
  key: string,
  value: unknown,
  labelLookup: Record<string, string>,
): ParsedStatEntry {
  if (key === "totalCount") {
    return {
      key,
      value,
      fieldKey: key,
      fieldLabel: "Total records",
      metricLabel: "Count",
      order: -1,
      isSummary: true,
    };
  }

  for (const metric of STAT_METRIC_META) {
    if (!key.endsWith(metric.suffix)) continue;
    const rawBase = key.slice(0, -metric.suffix.length);
    const fieldKey = rawBase || key;
    return {
      key,
      value,
      fieldKey,
      fieldLabel: labelLookup[fieldKey] || toLabel(fieldKey),
      metricLabel: metric.label,
      order: metric.order,
      isSummary: false,
    };
  }

  return {
    key,
    value,
    fieldKey: key,
    fieldLabel: toLabel(key),
    metricLabel: "Value",
    order: 99,
    isSummary: false,
  };
}

export function formatStatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && value.trim() !== "") {
      return Number.isInteger(parsed)
        ? parsed.toLocaleString()
        : parsed.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return value;
  }
  return String(value);
}

export function buildStatsQueryDocument(
  model: string,
  relationName: string,
  whereType: string,
  statFieldNames: string[],
  queryManager?: string,
) {
  const modelToken = buildModelQueryField(model, "single");
  const queryName = buildModelQueryField(model, "page", queryManager);
  const operationName = `${modelToken}${relationName.replace(/[^a-zA-Z0-9]/g, "")}StatsHover`;
  const statsFieldName = `${relationName}Stats`;

  return gql`
    query ${operationName}($where: ${whereType}, $skipCount: Boolean) {
      ${queryName}(page: 1, perPage: 1, where: $where, skipCount: $skipCount) {
        items {
          id
          ${statsFieldName} {
            ${statFieldNames.join("\n            ")}
          }
        }
      }
    }
  `;
}
