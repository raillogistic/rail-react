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

const ACTION_KEY_SET = new Set(Object.keys(ACTION_KEYS));
const NESTED_IDENTITY_KEYS = ["id", "pk", "objectId", "object_id"] as const;
const EMPTY_ALLOWED_ACTIONS: ModelFormNestedAction[] = [];
const EMPTY_BLOCKED_ACTIONS: ModelFormNestedAction[] = [];

type NestedPayloadMode = "CREATE" | "UPDATE";
type RelationInputShape = "EXPLICIT_OPERATION" | "INFERRED_INPUT";
type NestedMutationPayloadErrorCode =
  | "NESTED_RELATION_POLICY_BLOCKED"
  | "NESTED_RELATION_INVALID_ACTION"
  | "NESTED_RELATION_INVALID_INPUT";

type IdentityKey = (typeof NESTED_IDENTITY_KEYS)[number];
type IdentityResolution = {
  key: IdentityKey;
  value: string | number;
};

function buildRelationLookupKeys(relation: ModelFormContractRelation): string[] {
  const keys = new Set<string>();
  const add = (value: string | undefined | null) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      keys.add(normalized);
    }
  };

  add(relation.name);
  add(relation.path);
  return Array.from(keys);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isScalarValue(value: unknown) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isPresentIdentityValue(value: unknown): value is string | number {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  return value.trim().length > 0;
}

export function resolveNestedIdentityKey(
  value: unknown,
): IdentityResolution | null {
  if (!isPlainRecord(value)) return null;
  for (const key of NESTED_IDENTITY_KEYS) {
    const candidate = value[key];
    if (isPresentIdentityValue(candidate)) {
      return { key, value: candidate };
    }
  }
  return null;
}

export function classifyRelationInputShape(value: unknown): RelationInputShape {
  if (!isPlainRecord(value)) {
    return "INFERRED_INPUT";
  }
  const keys = Object.keys(value);
  if (keys.some((key) => ACTION_KEY_SET.has(key))) {
    return "EXPLICIT_OPERATION";
  }
  return "INFERRED_INPUT";
}

export class NestedMutationPayloadError extends Error {
  readonly field: string;
  readonly code: NestedMutationPayloadErrorCode;
  readonly action: ModelFormNestedAction | null;
  readonly inferred: boolean;
  readonly source = "OPERATION";

  constructor(options: {
    field: string;
    code: NestedMutationPayloadErrorCode;
    message: string;
    action?: ModelFormNestedAction;
    inferred?: boolean;
  }) {
    super(options.message);
    this.name = "NestedMutationPayloadError";
    this.field = options.field;
    this.code = options.code;
    this.action = options.action ?? null;
    this.inferred = Boolean(options.inferred);
  }

  toNormalizedError() {
    return {
      field: this.field,
      message: this.message,
      code: this.code,
      source: this.source,
      meta: {
        relationPath: this.field,
        ...(this.action ? { action: this.action } : {}),
        inferred: this.inferred,
      },
    };
  }
}

function toNormalizedAction(actionKey: string): ModelFormNestedAction | null {
  return ACTION_KEYS[actionKey] ?? null;
}

function isActionAllowed(
  relation: ModelFormContractRelation | undefined,
  action: ModelFormNestedAction,
) {
  if (!relation) return true;
  const blockedActions =
    relation.policy?.blockedActions ?? EMPTY_BLOCKED_ACTIONS;
  if (blockedActions.includes(action)) {
    return false;
  }
  const allowedActions =
    relation.policy?.allowedActions ?? EMPTY_ALLOWED_ACTIONS;
  if (allowedActions.length > 0) {
    return allowedActions.includes(action);
  }
  return true;
}

function assertActionAllowed(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  action: ModelFormNestedAction,
  inferred: boolean,
) {
  if (isActionAllowed(relation, action)) return;
  const source = inferred ? "Inférée" : "Explicite";
  throw new NestedMutationPayloadError({
    field: relationPath,
    code: "NESTED_RELATION_POLICY_BLOCKED",
    action,
    inferred,
    message: `L'action imbriquée ${source} '${action}' est bloquée pour la relation '${relationPath}'.`,
  });
}

function normalizeExplicitOperationInput(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  value: Record<string, unknown>,
) {
  const normalized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const action = toNormalizedAction(key);
    if (!action) {
      throw new NestedMutationPayloadError({
        field: relationPath,
        code: "NESTED_RELATION_INVALID_ACTION",
        inferred: false,
        message: `Action imbriquée non supportée '${key}' pour la relation '${relationPath}'.`,
      });
    }
    assertActionAllowed(relation, relationPath, action, false);
    normalized[key] = nestedValue;
  }

  return normalized;
}

function normalizeToOneRelationInput(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  value: unknown,
) {
  if (value === null) {
    assertActionAllowed(relation, relationPath, "CLEAR", true);
    return { clear: true };
  }

  if (isScalarValue(value)) {
    assertActionAllowed(relation, relationPath, "CONNECT", true);
    return { connect: value };
  }

  if (!isPlainRecord(value)) {
    throw new NestedMutationPayloadError({
      field: relationPath,
      code: "NESTED_RELATION_INVALID_INPUT",
      inferred: true,
      message: `Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
    });
  }

  const identity = resolveNestedIdentityKey(value);
  if (identity) {
    assertActionAllowed(relation, relationPath, "UPDATE", true);
    return { update: value };
  }

  assertActionAllowed(relation, relationPath, "CREATE", true);
  return { create: value };
}

function normalizeToManyRelationArrayInput(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  values: unknown[],
  mode: NestedPayloadMode,
) {
  if (values.length === 0) {
    if (mode === "UPDATE") {
      assertActionAllowed(relation, relationPath, "SET", true);
      return { set: [] };
    }
    assertActionAllowed(relation, relationPath, "CONNECT", true);
    return { connect: [] };
  }

  const scalarValues: Array<string | number | boolean> = [];
  const createValues: Record<string, unknown>[] = [];
  const updateValues: Record<string, unknown>[] = [];

  for (const item of values) {
    if (item === null || item === undefined) {
      throw new NestedMutationPayloadError({
        field: relationPath,
        code: "NESTED_RELATION_INVALID_INPUT",
        inferred: true,
        message: `Impossible d'inférer l'action imbriquée pour la relation '${relationPath}' à partir d'un élément de liste nul.`,
      });
    }
    if (isScalarValue(item)) {
      scalarValues.push(item);
      continue;
    }
    if (!isPlainRecord(item)) {
      throw new NestedMutationPayloadError({
        field: relationPath,
        code: "NESTED_RELATION_INVALID_INPUT",
        inferred: true,
        message: `Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
      });
    }
    if (classifyRelationInputShape(item) === "EXPLICIT_OPERATION") {
      throw new NestedMutationPayloadError({
        field: relationPath,
        code: "NESTED_RELATION_INVALID_INPUT",
        inferred: true,
        message: `La relation de liste '${relationPath}' n'accepte pas d'objets d'opération explicites comme éléments de liste.`,
      });
    }

    if (resolveNestedIdentityKey(item)) {
      updateValues.push(item);
    } else {
      createValues.push(item);
    }
  }

  const normalized: Record<string, unknown> = {};
  const hasObjectValues = createValues.length > 0 || updateValues.length > 0;

  if (scalarValues.length > 0) {
    const scalarAction =
      mode === "UPDATE" && !hasObjectValues ? "SET" : "CONNECT";
    assertActionAllowed(relation, relationPath, scalarAction, true);
    normalized[scalarAction === "SET" ? "set" : "connect"] =
      mode === "UPDATE" && !hasObjectValues ? scalarValues : [...scalarValues];
  }
  if (updateValues.length > 0) {
    assertActionAllowed(relation, relationPath, "UPDATE", true);
    normalized.update = updateValues;
  }
  if (createValues.length > 0) {
    assertActionAllowed(relation, relationPath, "CREATE", true);
    normalized.create = createValues;
  }

  return normalized;
}

function normalizeToManyRelationInput(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  value: unknown,
  mode: NestedPayloadMode,
) {
  if (value === null) {
    assertActionAllowed(relation, relationPath, "CLEAR", true);
    return { clear: true };
  }

  if (Array.isArray(value)) {
    return normalizeToManyRelationArrayInput(
      relation,
      relationPath,
      value,
      mode,
    );
  }

  if (isScalarValue(value)) {
    assertActionAllowed(relation, relationPath, "CONNECT", true);
    return { connect: [value] };
  }

  if (!isPlainRecord(value)) {
    throw new NestedMutationPayloadError({
      field: relationPath,
      code: "NESTED_RELATION_INVALID_INPUT",
      inferred: true,
      message: `Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
    });
  }

  if (resolveNestedIdentityKey(value)) {
    assertActionAllowed(relation, relationPath, "UPDATE", true);
    return { update: [value] };
  }

  assertActionAllowed(relation, relationPath, "CREATE", true);
  return { create: [value] };
}

function normalizeRelationInput(
  relation: ModelFormContractRelation | undefined,
  relationPath: string,
  value: unknown,
  mode: NestedPayloadMode,
) {
  if (classifyRelationInputShape(value) === "EXPLICIT_OPERATION") {
    return normalizeExplicitOperationInput(
      relation,
      relationPath,
      value as Record<string, unknown>,
    );
  }

  if (relation?.toMany) {
    return normalizeToManyRelationInput(relation, relationPath, value, mode);
  }
  return normalizeToOneRelationInput(relation, relationPath, value);
}

export function buildNestedMutationPayload(
  values: Record<string, unknown>,
  relations: ModelFormContractRelation[] = [],
  mode: NestedPayloadMode = "CREATE",
) {
  const relationByPath = new Map<string, ModelFormContractRelation>();
  for (const relation of relations) {
    for (const key of buildRelationLookupKeys(relation)) {
      relationByPath.set(key, relation);
    }
  }

  const payload: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(values ?? {})) {
    const relation = relationByPath.get(path);

    if (!relation) {
      payload[path] = value;
      continue;
    }

    const canonicalRelationName = String(relation.name ?? "").trim() || path;
    if (
      canonicalRelationName !== path &&
      Object.prototype.hasOwnProperty.call(values, canonicalRelationName)
    ) {
      continue;
    }

    payload[canonicalRelationName] = normalizeRelationInput(
      relation,
      canonicalRelationName,
      value,
      mode,
    );
  }

  return payload;
}
