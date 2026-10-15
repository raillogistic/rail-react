import type {
 ModelFormContractRelation,
 ModelFormNestedAction,
} from "../types/generatedContract";

import { toCamelCase } from "@/shared/api/graphql/graphql/queries/naming";
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

export type NestedRelationOperationOverride = {
 scalarListOperation?: "connect" | "set";
 removeOperation?: "disconnect" | "delete";
 deleteMutationEnabled?: boolean;
};

export type NestedMutationOperationOverrides = Record<
 string,
 NestedRelationOperationOverride
>;

export type BuildNestedMutationPayloadOptions = {
 mode?: NestedPayloadMode;
 operationOverrides?: NestedMutationOperationOverrides;
 baselineValues?: Record<string, unknown>;
};

type NestedRelationLookupContext = {
 mode: NestedPayloadMode;
 childRelationsByParentPath: Map<string, Map<string, ModelFormContractRelation>>;
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
	add(toCamelCase(relation.path ?? ""));
 add(relation.path);
 return Array.from(keys);
}

function extractLeafPathToken(value: string | null | undefined) {
 const normalized = String(value ?? "").trim();
 if (!normalized) return "";
 const segments = normalized.split(".").filter(Boolean);
 if (!segments.length) return "";
 return segments[segments.length - 1];
}

function resolveRelationPayloadFieldName(
 relation: ModelFormContractRelation | undefined,
 fallback: string,
) {
 const fromName = extractLeafPathToken(relation?.name);
 if (fromName) return fromName;
 const fromPath = extractLeafPathToken(relation?.path);
 if (fromPath) return fromPath;
 const fromFallback = extractLeafPathToken(fallback);
 return fromFallback || fallback;
}

function buildNestedChildRelationLookup(
 relations: ModelFormContractRelation[],
): Map<string, Map<string, ModelFormContractRelation>> {
 const lookup = new Map<string, Map<string, ModelFormContractRelation>>();
 const register = (
 parentPath: string,
 childKey: string,
 relation: ModelFormContractRelation,
 ) => {
 const normalizedParent = String(parentPath ?? "").trim();
 const normalizedChild = String(childKey ?? "").trim();
 if (!normalizedParent || !normalizedChild) return;
 const parentLookup = lookup.get(normalizedParent) ?? new Map<string, ModelFormContractRelation>();
 parentLookup.set(normalizedChild, relation);
 lookup.set(normalizedParent, parentLookup);
 };

 for (const relation of relations) {
 const relationLeafName = extractLeafPathToken(relation.name);
 const relationLeafPath = extractLeafPathToken(relation.path);
 for (const key of buildRelationLookupKeys(relation)) {
 const segments = key.split(".").filter(Boolean);
 if (segments.length < 2) continue;
 const parentPath = segments.slice(0, -1).join(".");
 const childToken = segments[segments.length - 1];
 register(parentPath, childToken, relation);
 if (relationLeafName) {
 register(parentPath, relationLeafName, relation);
 }
 if (relationLeafPath) {
 register(parentPath, relationLeafPath, relation);
 }
 }
 }

 return lookup;
}

function resolveNestedChildRelation(
 parentRelationPath: string,
 parentRelation: ModelFormContractRelation | undefined,
 key: string,
 context: NestedRelationLookupContext,
) {
 const parentCandidates = new Set<string>();
 const addParentCandidate = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 parentCandidates.add(normalized);
 }
 };

 addParentCandidate(parentRelationPath);
 addParentCandidate(parentRelation?.name);
 addParentCandidate(parentRelation?.path);

 const keyCandidates = new Set<string>();
 const addKeyCandidate = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 keyCandidates.add(normalized);
 }
 };

 addKeyCandidate(key);
 addKeyCandidate(extractLeafPathToken(key));

 for (const parentCandidate of parentCandidates) {
 const childLookup = context.childRelationsByParentPath.get(parentCandidate);
 if (!childLookup) continue;
 for (const keyCandidate of keyCandidates) {
 const relation = childLookup.get(keyCandidate);
 if (relation) {
 return relation;
 }
 }
 }

 return undefined;
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

function isOmittedRelationValue(value: unknown) {
 if (value === undefined) return true;
 return typeof value === "string" && value.trim().length === 0;
}

function isPresentIdentityValue(value: unknown): value is string | number {
 if (typeof value === "number") return Number.isFinite(value);
 if (typeof value !== "string") return false;
 return value.trim().length > 0;
}

function isPersistableIdentityValue(value: unknown): value is string | number {
 return (
 (typeof value === "string" && value.trim().length > 0) ||
 (typeof value === "number" && Number.isFinite(value))
 );
}

function normalizeUpdateIdentityPayload(
 value: Record<string, unknown>,
): Record<string, unknown> {
 const identity = resolveNestedIdentityKey(value);
 const normalized: Record<string, unknown> = {
 ...value,
 };

 delete normalized.pk;
 delete normalized.objectId;
 delete normalized.object_id;

 if (identity && isPresentIdentityValue(identity.value)) {
 normalized.id = identity.value;
 }

 return normalized;
}

function normalizeNestedChildRecordValue(
 value: Record<string, unknown>,
 options: {
 parentRelation: ModelFormContractRelation | undefined;
 parentRelationPath: string;
 lookupContext: NestedRelationLookupContext | undefined;
 },
): Record<string, unknown> {
 const { parentRelation, parentRelationPath, lookupContext } = options;
 if (!lookupContext) {
 return value;
 }

 let normalized: Record<string, unknown> | null = null;

 for (const [key, childValue] of Object.entries(value)) {
 const childRelation = resolveNestedChildRelation(
 parentRelationPath,
 parentRelation,
 key,
 lookupContext,
 );
 if (!childRelation) {
 continue;
 }

 const childFieldName = resolveRelationPayloadFieldName(childRelation, key);
 if (
 childFieldName !== key &&
 Object.prototype.hasOwnProperty.call(value, childFieldName)
 ) {
 continue;
 }

 const childRelationPath =`${parentRelationPath}.${childFieldName}`;
 const normalizedChildValue = normalizeRelationInput(
 childRelation,
 childRelationPath,
 childValue,
 lookupContext.mode,
 {
 override: undefined,
 baselineValue: undefined,
 },
 lookupContext,
 );

 if (!normalized) {
 normalized = { ...value };
 }
 if (childFieldName !== key) {
 delete normalized[key];
 }
 normalized[childFieldName] = normalizedChildValue;
 }

 return normalized ?? value;
}

function normalizeExplicitUpdateValue(
 value: unknown,
 options: {
 relation: ModelFormContractRelation | undefined;
 relationPath: string;
 lookupContext: NestedRelationLookupContext | undefined;
 },
): unknown {
 if (Array.isArray(value)) {
 return value.map((item) =>
 isPlainRecord(item)
 ? normalizeUpdateIdentityPayload(
 normalizeNestedChildRecordValue(item, {
 parentRelation: options.relation,
 parentRelationPath: options.relationPath,
 lookupContext: options.lookupContext,
 }),
 )
 : item,
 );
 }
 if (isPlainRecord(value)) {
 return normalizeUpdateIdentityPayload(
 normalizeNestedChildRecordValue(value, {
 parentRelation: options.relation,
 parentRelationPath: options.relationPath,
 lookupContext: options.lookupContext,
 }),
 );
 }
 return value;
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
 message:`L'action imbriquée ${source} '${action}' est bloquée pour la relation '${relationPath}'.`,
 });
}

function normalizeExplicitOperationInput(
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
 value: Record<string, unknown>,
 lookupContext: NestedRelationLookupContext | undefined,
) {
 const isToManyRelation = Boolean(relation?.toMany);
 const normalized: Record<string, unknown> = {};
 let shouldDisconnectSingular = false;

 for (const [key, nestedValue] of Object.entries(value)) {
 if (key === "connect") {
 assertActionAllowed(relation, relationPath, "CONNECT", false);
 normalized.connect = nestedValue;
 continue;
 }

 if (key === "create") {
 assertActionAllowed(relation, relationPath, "CREATE", false);
 normalized.create = nestedValue;
 continue;
 }

 if (key === "update") {
 assertActionAllowed(relation, relationPath, "UPDATE", false);
 normalized.update = normalizeExplicitUpdateValue(nestedValue, {
 relation,
 relationPath,
 lookupContext,
 });
 continue;
 }

 if (key === "disconnect") {
 assertActionAllowed(relation, relationPath, "DISCONNECT", false);
 if (isToManyRelation) {
 normalized.disconnect = nestedValue;
 } else {
 shouldDisconnectSingular = true;
 }
 continue;
 }

 if (key === "set") {
 if (isToManyRelation) {
 assertActionAllowed(relation, relationPath, "SET", false);
 normalized.set = nestedValue;
 } else if (nestedValue === null) {
 assertActionAllowed(relation, relationPath, "DISCONNECT", false);
 shouldDisconnectSingular = true;
 } else {
 assertActionAllowed(relation, relationPath, "CONNECT", false);
 normalized.connect = nestedValue;
 }
 continue;
 }

 if (key === "clear") {
 if (isToManyRelation) {
 assertActionAllowed(relation, relationPath, "SET", false);
 normalized.set = [];
 } else {
 assertActionAllowed(relation, relationPath, "DISCONNECT", false);
 shouldDisconnectSingular = true;
 }
 continue;
 }

 const action = toNormalizedAction(key);
 if (action === "DELETE") {
 assertActionAllowed(relation, relationPath, "DELETE", false);
 throw new NestedMutationPayloadError({
 field: relationPath,
 code: "NESTED_RELATION_INVALID_ACTION",
 inferred: false,
 message:`Nested action 'delete' is not supported by Rail Django generated mutation inputs for relation '${relationPath}'. Use 'disconnect' or direct deleteMutation handling.`,
 });
 }

 throw new NestedMutationPayloadError({
 field: relationPath,
 code: "NESTED_RELATION_INVALID_ACTION",
 inferred: false,
 message:`Unsupported nested action '${key}' for relation '${relationPath}'.`,
 });
 }

 if (!isToManyRelation && shouldDisconnectSingular) {
 if (Object.keys(normalized).length > 0) {
 throw new NestedMutationPayloadError({
 field: relationPath,
 code: "NESTED_RELATION_INVALID_INPUT",
 inferred: false,
 message:`Relation '${relationPath}' cannot combine disconnect/clear with other explicit operations.`,
 });
 }
 return { disconnect: true };
 }

 return normalized;
}
function normalizeToOneRelationInput(
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
 value: unknown,
 mode: NestedPayloadMode,
 lookupContext: NestedRelationLookupContext | undefined,
) {
	// Unwrap arrays (select-query may store to-one value as array or empty array when cleared)
	if (Array.isArray(value)) {
		value = value.length > 0 ? value[0] : null;
	}
 if (value === null) {
 if (mode === "UPDATE") {
 assertActionAllowed(relation, relationPath, "DISCONNECT", true);
 return { disconnect: true };
 }
 return null;
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
 message:`Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
 });
 }

 const normalizedRecord = normalizeNestedChildRecordValue(value, {
 parentRelation: relation,
 parentRelationPath: relationPath,
 lookupContext,
 });

 const identity = resolveNestedIdentityKey(normalizedRecord);
 if (identity) {
 assertActionAllowed(relation, relationPath, "UPDATE", true);
 return { update: normalizeUpdateIdentityPayload(normalizedRecord) };
 }

 assertActionAllowed(relation, relationPath, "CREATE", true);
 return { create: normalizedRecord };
}

function normalizeToManyRelationArrayInput(
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
 values: unknown[],
 mode: NestedPayloadMode,
 options: {
 override?: NestedRelationOperationOverride;
 baselineValue?: unknown;
 },
 lookupContext: NestedRelationLookupContext | undefined,
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
 message:`Impossible d'inférer l'action imbriquée pour la relation '${relationPath}' à partir d'un élément de liste nul.`,
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
 message:`Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
 });
 }
 if (classifyRelationInputShape(item) === "EXPLICIT_OPERATION") {
 throw new NestedMutationPayloadError({
 field: relationPath,
 code: "NESTED_RELATION_INVALID_INPUT",
 inferred: true,
 message:`La relation de liste '${relationPath}' n'accepte pas d'objets d'opération explicites comme éléments de liste.`,
 });
 }

 const normalizedItem = normalizeNestedChildRecordValue(item, {
 parentRelation: relation,
 parentRelationPath: relationPath,
 lookupContext,
 });

 if (resolveNestedIdentityKey(normalizedItem)) {
 updateValues.push(normalizeUpdateIdentityPayload(normalizedItem));
 } else {
 createValues.push(normalizedItem);
 }
 }

 const normalized: Record<string, unknown> = {};
 const hasObjectValues = createValues.length > 0 || updateValues.length > 0;
 const scalarModeOverride = options.override?.scalarListOperation;
 const removeModeOverride = options.override?.removeOperation;

 if (scalarValues.length > 0) {
 const scalarAction =
 mode === "UPDATE" && !hasObjectValues
 ? scalarModeOverride === "connect"
 ? "CONNECT"
 : "SET"
 : "CONNECT";
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

 if (mode === "UPDATE" && removeModeOverride) {
 const baselinePersistedIds = extractPersistedRelationIdsFromArray(
 Array.isArray(options.baselineValue) ? options.baselineValue : [],
 );
 if (baselinePersistedIds.length > 0) {
 const currentPersistedIds = extractPersistedRelationIdsFromArray(values);
 const currentIdKeys = new Set(currentPersistedIds.map((item) => String(item)));
 const removedIds = baselinePersistedIds.filter(
 (item) => !currentIdKeys.has(String(item)),
 );
 const usesSetReplacement = typeof normalized.set !== "undefined";

 const deleteHandledExternally =
 Boolean(options.override?.deleteMutationEnabled) &&
 removeModeOverride === "delete";

 if (removedIds.length > 0 && !usesSetReplacement && !deleteHandledExternally) {
 if (removeModeOverride === "delete") {
 throw new NestedMutationPayloadError({
 field: relationPath,
 code: "NESTED_RELATION_INVALID_ACTION",
 inferred: true,
 message:`removeOperation='delete' requires deleteMutation.enabled for relation '${relationPath}' because generated Rail Django relation inputs do not support nested delete operation.`,
 });
 }
 const removedAction = "DISCONNECT";
 assertActionAllowed(relation, relationPath, removedAction, true);
 normalized.disconnect = removedIds;
 }
 }
 }

 return normalized;
}

function normalizeToManyRelationInput(
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
 value: unknown,
 mode: NestedPayloadMode,
 options: {
 override?: NestedRelationOperationOverride;
 baselineValue?: unknown;
 },
 lookupContext: NestedRelationLookupContext | undefined,
) {
 if (value === null) {
 const action = mode === "UPDATE" ? "SET" : "CONNECT";
 assertActionAllowed(relation, relationPath, action, true);
 return mode === "UPDATE" ? { set: [] } : { connect: [] };
 }

 if (Array.isArray(value)) {
 return normalizeToManyRelationArrayInput(
 relation,
 relationPath,
 value,
 mode,
 options,
 lookupContext,
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
 message:`Impossible d'inférer l'action imbriquée pour la relation '${relationPath}'.`,
 });
 }

 const normalizedRecord = normalizeNestedChildRecordValue(value, {
 parentRelation: relation,
 parentRelationPath: relationPath,
 lookupContext,
 });

 if (resolveNestedIdentityKey(normalizedRecord)) {
 assertActionAllowed(relation, relationPath, "UPDATE", true);
 return { update: [normalizeUpdateIdentityPayload(normalizedRecord)] };
 }

 assertActionAllowed(relation, relationPath, "CREATE", true);
 return { create: [normalizedRecord] };
}

function normalizeRelationInput(
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
 value: unknown,
 mode: NestedPayloadMode,
 options: {
 override?: NestedRelationOperationOverride;
 baselineValue?: unknown;
 },
 lookupContext: NestedRelationLookupContext | undefined,
) {
 if (classifyRelationInputShape(value) === "EXPLICIT_OPERATION") {
 return normalizeExplicitOperationInput(
 relation,
 relationPath,
 value as Record<string, unknown>,
 lookupContext,
 );
 }

 if (relation?.toMany) {
 return normalizeToManyRelationInput(
 relation,
 relationPath,
 value,
 mode,
 options,
 lookupContext,
 );
 }
 return normalizeToOneRelationInput(
 relation,
 relationPath,
 value,
 mode,
 lookupContext,
 );
}

function resolveRelationOverride(
 overrides: NestedMutationOperationOverrides | undefined,
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
): NestedRelationOperationOverride | undefined {
 if (!overrides) return undefined;
 const lookupKeys = new Set<string>();
 const add = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 lookupKeys.add(normalized);
 }
 };

 add(relationPath);
 add(relation?.name);
 add(relation?.path);

 for (const key of lookupKeys) {
 const override = overrides[key];
 if (override) return override;
 }

 return undefined;
}

function resolveBaselineRelationValue(
 baselineValues: Record<string, unknown> | undefined,
 relation: ModelFormContractRelation | undefined,
 relationPath: string,
): unknown {
 if (!baselineValues) return undefined;

 const lookupKeys = new Set<string>();
 const add = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 lookupKeys.add(normalized);
 }
 };

 add(relationPath);
 add(relation?.name);
 add(relation?.path);

 for (const key of lookupKeys) {
 if (Object.prototype.hasOwnProperty.call(baselineValues, key)) {
 return baselineValues[key];
 }
 }

 return undefined;
}

function extractPersistedRelationIdsFromArray(values: unknown[]) {
 const ids: Array<string | number> = [];
 for (const item of values) {
 if (isPersistableIdentityValue(item)) {
 ids.push(item);
 continue;
 }
 const identity = resolveNestedIdentityKey(item);
 if (identity && isPersistableIdentityValue(identity.value)) {
 ids.push(identity.value);
 }
 }
 return ids;
}

export function buildNestedMutationPayload(
 values: Record<string, unknown>,
 relations: ModelFormContractRelation[] = [],
 modeOrOptions: NestedPayloadMode | BuildNestedMutationPayloadOptions = "CREATE",
) {
 const options: BuildNestedMutationPayloadOptions =
 typeof modeOrOptions === "string"
 ? { mode: modeOrOptions }
 : modeOrOptions ?? {};
 const mode = options.mode ?? "CREATE";
 const operationOverrides = options.operationOverrides;
 const baselineValues = options.baselineValues;

 const relationByPath = new Map<string, ModelFormContractRelation>();
 for (const relation of relations) {
 for (const key of buildRelationLookupKeys(relation)) {
 relationByPath.set(key, relation);
 }
 }
 const lookupContext: NestedRelationLookupContext = {
 mode,
 childRelationsByParentPath: buildNestedChildRelationLookup(relations),
 };

 const payload: Record<string, unknown> = {};

 for (const [path, value] of Object.entries(values ?? {})) {
 const relation = relationByPath.get(path);

 if (!relation) {
 payload[path] = value;
 continue;
 }

 if (isOmittedRelationValue(value)) {
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
 {
 override: resolveRelationOverride(
 operationOverrides,
 relation,
 canonicalRelationName,
 ),
 baselineValue: resolveBaselineRelationValue(
 baselineValues,
 relation,
 canonicalRelationName,
 ),
 },
 lookupContext,
 );
 }

 return payload;
}
