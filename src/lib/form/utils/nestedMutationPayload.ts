import type {
  ModelFormContractRelation,
  ModelFormNestedAction,
} from "../types/generatedContract";

const ACTION_KEYS: Record<string, ModelFormNestedAction> = {
  connect: "CONNECT",
  create: "CREATE",
  update: "UPDATE",
  disconnect: "DISCONNECT",
  delete: "DELETE",
  set: "SET",
  clear: "CLEAR",
};

function isRelationInput(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value as Record<string, unknown>).some((key) => key in ACTION_KEYS);
}

function isActionAllowed(
  relation: ModelFormContractRelation | undefined,
  action: ModelFormNestedAction,
) {
  if (!relation) return true;
  if (relation.policy.blockedActions.includes(action)) {
    return false;
  }
  if (relation.policy.allowedActions.length > 0) {
    return relation.policy.allowedActions.includes(action);
  }
  return true;
}

export function buildNestedMutationPayload(
  values: Record<string, unknown>,
  relations: ModelFormContractRelation[] = [],
) {
  const relationByPath = new Map(relations.map((relation) => [relation.path, relation]));
  const payload: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(values ?? {})) {
    if (!isRelationInput(value)) {
      payload[path] = value;
      continue;
    }
    const relation = relationByPath.get(path);
    const relationInput = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(relationInput)) {
      const action = ACTION_KEYS[key];
      if (!action) continue;
      if (!isActionAllowed(relation, action)) {
        throw new Error(`Nested action '${action}' is blocked for relation '${path}'.`);
      }
      normalized[key] = nestedValue;
    }
    payload[path] = normalized;
  }

  return payload;
}
