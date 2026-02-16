import type { ModelFormContract } from "../../types/generatedContract";
import type { ModelFormNestedDefinition } from "../../types.model";

type NestedControlMap<TValues extends Record<string, unknown>> = Record<
  string,
  ModelFormNestedDefinition<TValues>
>;

function resolveRelationFieldName(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const name = String(relation.name ?? "").trim();
  if (name) return name;
  return String(relation.path ?? "").trim();
}

function relationLookupKeys(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const keys = new Set<string>();
  const add = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      keys.add(normalized);
    }
  };

  add(relation.name);
  add(relation.path);
  return Array.from(keys);
}

function extractLeafToken(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const segments = normalized.split(".").filter(Boolean);
  if (!segments.length) return "";
  return segments[segments.length - 1];
}

export function buildRelationModelKey(appLabel: string, modelName: string): string {
  return `${appLabel}::${modelName}`.toLowerCase();
}

export function collectInitialDataNestedFields<
  TValues extends Record<string, unknown>,
>(
  nestedControls: NestedControlMap<TValues> | undefined,
  onlyRelationships: string[],
  excludeRelationships: string[],
) {
  if (!nestedControls) return undefined;

  const includedRelations = onlyRelationships.length ? new Set(onlyRelationships) : null;
  const excludedRelations = excludeRelationships.length
    ? new Set(excludeRelationships)
    : null;

  const nestedPaths = Object.entries(nestedControls)
    .filter(([, definition]) => definition.enabled !== false)
    .map(([relationPath]) => String(relationPath).trim())
    .filter(Boolean)
    .filter((relationPath) =>
      includedRelations ? includedRelations.has(relationPath) : true,
    )
    .filter((relationPath) =>
      excludedRelations ? !excludedRelations.has(relationPath) : true,
    );

  return nestedPaths.length > 0 ? nestedPaths : undefined;
}

export function collectNestedRelationModelRefs<
  TValues extends Record<string, unknown>,
>(
  contract: ModelFormContract | null,
  nestedControls: NestedControlMap<TValues> | undefined,
) {
  if (!contract || !nestedControls) return [];

  const refs = new Map<
    string,
    {
      appLabel: string;
      modelName: string;
    }
  >();

  for (const relation of contract.relations ?? []) {
    const relationFieldName = resolveRelationFieldName(relation);
    const nestedControl =
      nestedControls[relationFieldName] ?? nestedControls[relation.path];
    if (!nestedControl || nestedControl.enabled === false) continue;
    if (!relation.relatedAppLabel || !relation.relatedModelName) continue;
    const key = buildRelationModelKey(
      relation.relatedAppLabel,
      relation.relatedModelName,
    );
    refs.set(key, {
      appLabel: relation.relatedAppLabel,
      modelName: relation.relatedModelName,
    });
  }

  return Array.from(refs.values()).sort((left, right) => {
    const leftKey = buildRelationModelKey(left.appLabel, left.modelName);
    const rightKey = buildRelationModelKey(right.appLabel, right.modelName);
    return leftKey.localeCompare(rightKey);
  });
}

export function expandInitialDataNestedFieldsWithRelatedContracts<
  TValues extends Record<string, unknown>,
>(
  initialNestedFields: string[] | undefined,
  contract: ModelFormContract | null,
  nestedControls: NestedControlMap<TValues> | undefined,
  relatedContractsByModel: Map<string, ModelFormContract>,
) {
  if (!initialNestedFields?.length || !contract || !nestedControls) {
    return initialNestedFields;
  }

  const selectedRelations = new Set(initialNestedFields);
  const expanded = new Set(initialNestedFields);
  const parentModelKey = buildRelationModelKey(
    contract.appLabel,
    contract.modelName,
  );

  for (const relation of contract.relations ?? []) {
    const relationFieldName = resolveRelationFieldName(relation);
    const nestedControl =
      nestedControls[relationFieldName] ?? nestedControls[relation.path];
    if (!nestedControl || nestedControl.enabled === false) {
      continue;
    }

    const activeParentPath = relationLookupKeys(relation).find((candidate) =>
      selectedRelations.has(candidate),
    );
    if (!activeParentPath) {
      continue;
    }

    const relationModelKey = buildRelationModelKey(
      relation.relatedAppLabel,
      relation.relatedModelName,
    );
    const relatedContract = relatedContractsByModel.get(relationModelKey);
    if (!relatedContract) {
      continue;
    }

    for (const childRelation of relatedContract.relations ?? []) {
      const childTargetModelKey = buildRelationModelKey(
        childRelation.relatedAppLabel,
        childRelation.relatedModelName,
      );
      if (childTargetModelKey === parentModelKey) {
        continue;
      }

      const childTokens = new Set<string>();
      const nameLeaf = extractLeafToken(childRelation.name);
      const pathLeaf = extractLeafToken(childRelation.path);
      if (nameLeaf) childTokens.add(nameLeaf);
      if (pathLeaf) childTokens.add(pathLeaf);

      for (const childToken of childTokens) {
        expanded.add(`${activeParentPath}.${childToken}`);
      }
    }
  }

  return expanded.size > 0 ? Array.from(expanded) : undefined;
}
