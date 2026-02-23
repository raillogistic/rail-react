import { getValueByPath, normalizeObjectPath } from "@/widgets/model-form/utils/objectPath";
import type {
  ModelFormContract,
  ModelFormContractField,
  ModelFormContractRelation,
} from "@/widgets/model-form/types/generatedContract";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import { createDescRelationPlugin } from "./plugins";
import type {
  ModelSectionEngineContext,
  ModelSectionEngineInput,
  ModelSectionEnginePlugin,
  ModelSectionEngineResult,
  ModelSectionFieldCandidate,
  ModelSectionManifest,
  ModelSectionManifestField,
  ModelSectionResolvedGroup,
} from "./types";

type FieldPatch = Omit<ModelSectionManifestField, "path">;

type GroupBlueprint = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  columns?: number;
  fieldRefs: Array<string | ModelSectionManifestField>;
};

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function normalizePath(path: string | null | undefined): string {
  return normalizeObjectPath(path ?? "");
}

function normalizeColumns(value: unknown): number | undefined {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(raw)) return undefined;
  const normalized = Math.floor(raw);
  if (normalized < 1) return 1;
  if (normalized > 6) return 6;
  return normalized;
}

function toUnitFieldId(path: string): string {
  return normalizePath(path).replace(/[^\w]+/g, "_") || "model_field";
}

function toUpperValue(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function mapContractKindToUnitKind(
  kind: string | null | undefined,
): UnitFieldInput["kind"] {
  switch (toUpperValue(kind)) {
    case "TEXT":
      return "text";
    case "TEXTAREA":
      return "multiline";
    case "NUMBER":
      return "integer";
    case "DECIMAL":
      return "number";
    case "BOOLEAN":
      return "boolean";
    case "DATE":
      return "date";
    case "TIME":
      return "time";
    case "DATETIME":
      return "datetime";
    case "CHOICE":
      return "enum";
    case "MULTI_CHOICE":
      return "multiEnum";
    case "JSON":
      return "json";
    case "RELATION":
      return "entityRef";
    default:
      return "text";
  }
}

function resolveContractFieldPath(field: ModelFormContractField): string {
  return normalizePath(field.name ?? field.path ?? field.fieldName);
}

function resolveRelationPath(relation: ModelFormContractRelation): string {
  return normalizePath(relation.name ?? relation.path);
}

function isFieldHidden(field: ModelFormContractField): boolean {
  if (field.hidden) return true;
  if (field.readable === false) return true;
  return toUpperValue(field.visibility) === "HIDDEN";
}

function resolveCandidateValue(
  values: Record<string, unknown>,
  aliases: Array<string | null | undefined>,
): unknown {
  const normalizedAliases = Array.from(
    new Set(
      aliases
        .map((alias) => normalizePath(alias))
        .filter((alias) => alias.length > 0),
    ),
  );

  for (const alias of normalizedAliases) {
    if (Object.prototype.hasOwnProperty.call(values, alias)) {
      return values[alias];
    }
    const nested = getValueByPath(values, alias);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

function toFieldPatch(value: unknown): FieldPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const patch = { ...(value as Record<string, unknown>) };
  delete patch.path;
  return patch as FieldPatch;
}

function buildFieldOverrideLookup(manifest?: ModelSectionManifest): Map<string, FieldPatch> {
  const lookup = new Map<string, FieldPatch>();
  if (!manifest?.fields) return lookup;
  for (const [path, override] of Object.entries(manifest.fields)) {
    const normalized = normalizePath(path);
    if (!normalized) continue;
    lookup.set(normalized, toFieldPatch(override));
  }
  return lookup;
}

function mergeFieldPatch(
  base: FieldPatch | undefined,
  patch: FieldPatch | undefined,
): FieldPatch | undefined {
  if (!base && !patch) return undefined;
  return {
    ...(base ?? {}),
    ...(patch ?? {}),
  };
}

function mergeCandidatePatch(
  candidate: ModelSectionFieldCandidate,
  patch?: FieldPatch,
): ModelSectionFieldCandidate {
  if (!patch) return candidate;
  const mergedManifest = mergeFieldPatch(candidate.manifest, patch);
  return {
    ...candidate,
    label: patch.label ?? candidate.label,
    kindHint: patch.kind ?? candidate.kindHint,
    manifest: mergedManifest,
  };
}

function applyManifestFilters(
  candidates: ModelSectionFieldCandidate[],
  manifest?: ModelSectionManifest,
): ModelSectionFieldCandidate[] {
  const include = new Set(
    (manifest?.include ?? [])
      .map((entry) => normalizePath(entry))
      .filter(Boolean),
  );
  const exclude = new Set(
    (manifest?.exclude ?? [])
      .map((entry) => normalizePath(entry))
      .filter(Boolean),
  );
  const enforceInclude = include.size > 0;

  return candidates.filter((candidate) => {
    const key = normalizePath(candidate.path);
    if (!key) return false;
    if (enforceInclude && !include.has(key)) return false;
    if (exclude.has(key)) return false;
    if (candidate.hidden) return false;
    if (candidate.manifest?.hidden) return false;
    return true;
  });
}

function createBaseFieldFromCandidate(
  candidate: ModelSectionFieldCandidate,
): UnitFieldInput {
  const resolvedLabel = candidate.manifest?.label ?? candidate.label ?? candidate.path;
  return {
    id: toUnitFieldId(candidate.path),
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

function runPreMapPlugins(
  candidate: ModelSectionFieldCandidate,
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): ModelSectionFieldCandidate | null {
  let current = candidate;
  for (const plugin of plugins) {
    const next = plugin.preMapCandidate?.(current, ctx);
    if (next === null) return null;
    if (next !== undefined) current = next;
  }
  return current;
}

function runMapPlugins(
  candidate: ModelSectionFieldCandidate,
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): UnitFieldInput | null {
  for (const plugin of plugins) {
    const mapped = plugin.mapCandidate?.(candidate, ctx);
    if (mapped === null) return null;
    if (mapped !== undefined) return mapped;
  }
  return createBaseFieldFromCandidate(candidate);
}

function runPostMapPlugins(
  field: UnitFieldInput,
  candidate: ModelSectionFieldCandidate,
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): UnitFieldInput | null {
  let current = field;
  for (const plugin of plugins) {
    const next = plugin.postMapField?.(current, candidate, ctx);
    if (next === null) return null;
    if (next !== undefined) current = next;
  }
  return current;
}

function mapCandidateToField(
  candidate: ModelSectionFieldCandidate,
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): UnitFieldInput | null {
  const preMapped = runPreMapPlugins(candidate, plugins, ctx);
  if (!preMapped) return null;
  const mapped = runMapPlugins(preMapped, plugins, ctx);
  if (!mapped) return null;
  return runPostMapPlugins(mapped, preMapped, plugins, ctx);
}

function collectFieldCandidates(
  contract: ModelFormContract,
  values: Record<string, unknown>,
  manifest?: ModelSectionManifest,
): ModelSectionFieldCandidate[] {
  const candidates: ModelSectionFieldCandidate[] = [];
  const seen = new Set<string>();
  const overrides = buildFieldOverrideLookup(manifest);

  for (const field of contract.fields ?? []) {
    const path = resolveContractFieldPath(field);
    if (!path) continue;
    const key = normalizePath(path);
    if (seen.has(key)) continue;
    seen.add(key);

    const value = resolveCandidateValue(values, [
      field.path,
      field.name,
      field.fieldName,
      path,
    ]);

    candidates.push({
      source: "contractField",
      path,
      label: String(field.label ?? path),
      value,
      hidden: isFieldHidden(field),
      kindHint: mapContractKindToUnitKind(field.kind),
      field,
      manifest: overrides.get(key),
    });
  }

  for (const relation of contract.relations ?? []) {
    const path = resolveRelationPath(relation);
    if (!path) continue;
    const key = normalizePath(path);
    if (seen.has(key)) continue;
    seen.add(key);

    const value = resolveCandidateValue(values, [
      relation.path,
      relation.name,
      path,
    ]);

    candidates.push({
      source: "relation",
      path,
      label: String(relation.label ?? path),
      value,
      hidden: relation.readable === false,
      kindHint: relation.toMany ? "tags" : "entityRef",
      relation,
      manifest: overrides.get(key),
    });
  }

  return candidates;
}

function buildManifestGroups(manifest?: ModelSectionManifest): GroupBlueprint[] {
  if (!manifest?.sections?.length) return [];
  return [...manifest.sections]
    .filter((section) => section.visible !== false)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      columns: normalizeColumns(section.columns),
      fieldRefs: [...section.fields],
    }));
}

function buildContractGroups(contract: ModelFormContract): GroupBlueprint[] {
  return [...(contract.sections ?? [])]
    .filter((section) => section.visible !== false)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((section) => ({
      id: section.id,
      title: section.title ?? undefined,
      description: section.description ?? undefined,
      order: section.order ?? undefined,
      columns: normalizeColumns(toRecord(section.layout).columns),
      fieldRefs: [...(section.fieldPaths ?? [])],
    }));
}

function resolveBlueprints(
  contract: ModelFormContract,
  manifest?: ModelSectionManifest,
): GroupBlueprint[] {
  const manifestGroups = buildManifestGroups(manifest);
  if (manifestGroups.length > 0) return manifestGroups;
  if (manifest?.useContractSections === false) return [];
  return buildContractGroups(contract);
}

function asFieldPatch(
  fieldRef: string | ModelSectionManifestField,
): FieldPatch | undefined {
  if (typeof fieldRef === "string") return undefined;
  return toFieldPatch(fieldRef);
}

function asFieldPath(fieldRef: string | ModelSectionManifestField): string {
  if (typeof fieldRef === "string") return normalizePath(fieldRef);
  return normalizePath(fieldRef.path);
}

function buildFieldLookup(
  candidates: ModelSectionFieldCandidate[],
): Map<string, ModelSectionFieldCandidate> {
  const lookup = new Map<string, ModelSectionFieldCandidate>();
  for (const candidate of candidates) {
    lookup.set(normalizePath(candidate.path), candidate);
  }
  return lookup;
}

function mapUnassignedCandidates(
  candidates: ModelSectionFieldCandidate[],
  assigned: Set<string>,
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): UnitFieldInput[] {
  const mapped: UnitFieldInput[] = [];
  for (const candidate of candidates) {
    const key = normalizePath(candidate.path);
    if (assigned.has(key)) continue;
    const field = mapCandidateToField(candidate, plugins, ctx);
    if (!field) continue;
    mapped.push(field);
    assigned.add(key);
  }
  return mapped;
}

function buildGroups(
  contract: ModelFormContract,
  candidates: ModelSectionFieldCandidate[],
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): ModelSectionResolvedGroup[] {
  const groups: ModelSectionResolvedGroup[] = [];
  const assigned = new Set<string>();
  const lookup = buildFieldLookup(candidates);
  const blueprints = resolveBlueprints(contract, ctx.manifest);

  for (const blueprint of blueprints) {
    const fields: UnitFieldInput[] = [];
    for (const fieldRef of blueprint.fieldRefs) {
      const path = asFieldPath(fieldRef);
      if (!path) continue;
      const key = normalizePath(path);
      const candidate = lookup.get(key);
      if (!candidate) continue;
      const patched = mergeCandidatePatch(candidate, asFieldPatch(fieldRef));
      const field = mapCandidateToField(patched, plugins, ctx);
      if (!field) continue;
      fields.push(field);
      assigned.add(key);
    }

    if (fields.length === 0) continue;
    groups.push({
      id: blueprint.id,
      title: blueprint.title,
      description: blueprint.description,
      order: blueprint.order,
      columns: blueprint.columns,
      fields,
    });
  }

  const includeUnassigned = ctx.manifest?.includeUnassignedFields !== false;
  if (includeUnassigned) {
    const unassigned = mapUnassignedCandidates(candidates, assigned, plugins, ctx);
    if (unassigned.length > 0) {
      groups.push({
        id: "unassigned",
        title: groups.length > 0 ? "Other" : undefined,
        fields: unassigned,
      });
    }
  }

  if (groups.length === 0) {
    const fields = mapUnassignedCandidates(candidates, assigned, plugins, ctx);
    if (fields.length > 0) {
      groups.push({
        id: "default",
        fields,
      });
    }
  }

  return groups;
}

function finalizeResult(
  groups: ModelSectionResolvedGroup[],
  plugins: ModelSectionEnginePlugin[],
  ctx: ModelSectionEngineContext,
): ModelSectionEngineResult {
  let result: ModelSectionEngineResult = {
    groups,
    allFields: groups.flatMap((group) => group.fields),
  };

  for (const plugin of plugins) {
    const next = plugin.transformResult?.(result, ctx);
    if (next !== undefined) {
      result = next;
    }
  }

  return {
    ...result,
    allFields: result.groups.flatMap((group) => group.fields),
  };
}

export function buildModelSectionData(
  input: ModelSectionEngineInput,
): ModelSectionEngineResult {
  const values = toRecord(input.initialData?.values);
  const manifest = input.manifest ?? input.ctx.manifest;
  const runtimeCtx: ModelSectionEngineContext = {
    ...input.ctx,
    manifest,
  };
  const plugins: ModelSectionEnginePlugin[] = [
    ...(input.plugins ?? []),
    createDescRelationPlugin({
      labelPriority: manifest?.relationLabelPriority,
    }),
  ];

  const candidates = applyManifestFilters(
    collectFieldCandidates(input.contract, values, manifest),
    manifest,
  );
  const groups = buildGroups(input.contract, candidates, plugins, runtimeCtx);
  return finalizeResult(groups, plugins, runtimeCtx);
}

export function isModelSectionResultEmpty(result: ModelSectionEngineResult): boolean {
  return result.allFields.length === 0;
}
