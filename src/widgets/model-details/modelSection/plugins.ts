import type { UnitFieldInput } from "../units/unitFieldTypes";
import type {
  ModelSectionEnginePlugin,
  ModelSectionFieldCandidate,
} from "./types";

const DEFAULT_RELATION_LABEL_PRIORITY = [
  "desc",
  "label",
  "name",
  "title",
  "code",
  "reference",
] as const;

function normalizePriority(
  priority?: string[],
): string[] {
  if (!Array.isArray(priority) || priority.length === 0) {
    return [...DEFAULT_RELATION_LABEL_PRIORITY];
  }
  const seen = new Set<string>();
  const output: string[] = [];
  for (const entry of priority) {
    const normalized = String(entry ?? "").trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output.length > 0 ? output : [...DEFAULT_RELATION_LABEL_PRIORITY];
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function resolveRecordId(record: Record<string, unknown>): string | number | undefined {
  const value = record.id ?? record.pk ?? record.uuid ?? record.value;
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return undefined;
}

function resolveRecordLabel(
  record: Record<string, unknown>,
  priority: string[],
): string | null {
  for (const key of priority) {
    const value = toStringValue(record[key]);
    if (value) return value;
  }
  const fallbackKeys = ["id", "pk", "uuid", "value"];
  for (const key of fallbackKeys) {
    const value = toStringValue(record[key]);
    if (value) return value;
  }
  return null;
}

function resolveRelationLabel(value: unknown, priority: string[]): string | null {
  const record = toRecord(value);
  if (record) {
    return resolveRecordLabel(record, priority);
  }
  return toStringValue(value);
}

function resolveBaseField(candidate: ModelSectionFieldCandidate): UnitFieldInput {
  const resolvedLabel = candidate.manifest?.label ?? candidate.label ?? candidate.path;
  return {
    id: candidate.path.replace(/[.[\]]+/g, "_"),
    label: resolvedLabel,
    kind: candidate.manifest?.kind ?? candidate.kindHint,
    value: candidate.value,
    ...(candidate.manifest?.hint !== undefined
      ? { hint: candidate.manifest.hint }
      : {}),
    ...(candidate.manifest?.emptyText !== undefined
      ? { emptyText: candidate.manifest.emptyText }
      : {}),
    ...(candidate.manifest?.format !== undefined
      ? { format: candidate.manifest.format }
      : {}),
    ...(candidate.manifest?.copyable !== undefined
      ? { copyable: candidate.manifest.copyable }
      : {}),
    ...(candidate.manifest?.copyValue !== undefined
      ? { copyValue: candidate.manifest.copyValue }
      : {}),
  };
}

function mapToOneRelation(
  candidate: ModelSectionFieldCandidate,
  priority: string[],
): UnitFieldInput {
  const base = resolveBaseField(candidate);
  const raw = Array.isArray(candidate.value)
    ? candidate.value[0]
    : candidate.value;
  const record = toRecord(raw);

  if (!record) {
    const label = resolveRelationLabel(raw, priority);
    return {
      ...base,
      kind: candidate.manifest?.kind ?? "entityRef",
      value:
        label === null
          ? null
          : {
              id: toStringValue(raw) ?? undefined,
              label,
            },
    };
  }

  const id = resolveRecordId(record);
  const label = resolveRecordLabel(record, priority) ?? (id ? String(id) : null);
  return {
    ...base,
    kind: candidate.manifest?.kind ?? "entityRef",
    value:
      label === null
        ? null
        : {
            id: id ?? undefined,
            label,
            href: toStringValue(record.href) ?? undefined,
          },
  };
}

function mapToManyRelation(
  candidate: ModelSectionFieldCandidate,
  priority: string[],
): UnitFieldInput {
  const base = resolveBaseField(candidate);
  const rawValues = Array.isArray(candidate.value)
    ? candidate.value
    : candidate.value === null || candidate.value === undefined
      ? []
      : [candidate.value];
  const labels = rawValues
    .map((entry) => resolveRelationLabel(entry, priority))
    .filter((entry): entry is string => Boolean(entry));

  return {
    ...base,
    kind: candidate.manifest?.kind ?? "tags",
    value: labels,
  };
}

export function createDescRelationPlugin(
  options: { labelPriority?: string[] } = {},
): ModelSectionEnginePlugin {
  return {
    name: "desc-relation-display",
    mapCandidate(candidate, ctx) {
      if (candidate.source !== "relation") return undefined;
      const priority = normalizePriority(
        ctx.manifest?.relationLabelPriority ?? options.labelPriority,
      );
      if (candidate.relation?.toMany) {
        return mapToManyRelation(candidate, priority);
      }
      return mapToOneRelation(candidate, priority);
    },
  };
}
