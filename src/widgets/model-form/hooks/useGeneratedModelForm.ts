import React from "react";
import type { FormFieldConfig, FormSchema, FormSectionConfig } from "../types/schema";
import {
 createSubmitDispatchGuard,
 selectGeneratedSubmitOperation,
} from "../mutations";
import type {
 ModelFormContract,
 ModelFormInitialData,
 ModelFormMode,
 ModelFormMutationOutcome,
 ModelFormOperationPermission,
 ModelFormRuntimeOverride,
} from "../types/generatedContract";
import type { ModelFormSubmitState } from "../types.model";
import { asRecord, parseJsonValue } from "../utils/jsonCoercion";
import {
 getValueByPath,
 mergeValueByPath,
 setValueByPath,
 unsetValueByPath,
} from "../utils/objectPath";
import { normalizeGeneratedMutationErrors } from "../utils/normalizeMutationErrors";
import {
 CANONICAL_FORM_ERROR_KEY,
 resolveCanonicalFormErrorKey,
} from "../utils/errors";
import {
 ERROR_NORMALIZATION_BUDGET_MS,
 SUBMIT_ORCHESTRATION_BUDGET_MS,
 measureErrorNormalization,
 measureSubmitOrchestration,
} from "../utils/submitPerformance";
import { buildSubmitPayload, type SubmitPayloadEnvelope } from "../utils/buildSubmitPayload";
import type { NestedMutationOperationOverrides } from "../utils/nestedMutationPayload";
import { resolveSubmitIdentifier } from "../utils/resolveSubmitIdentifier";
import {
 buildSubmitErrorOutcome,
 unwrapMutationPayload,
 toExecutionErrorMessage,
} from "./generatedSubmit/submitExecution";
import { shouldEnforceOperationDeny } from "../utils/operationPermissions";

const INITIAL_SUBMIT_STATE: ModelFormSubmitState = {
 status: "IDLE",
 isSubmitting: false,
 lockActive: false,
 outcome: null,
};

const WRITE_RELATION_ACTIONS = new Set([
 "CONNECT",
 "CREATE",
 "UPDATE",
 "DISCONNECT",
 "DELETE",
 "SET",
 "CLEAR",
]);

export type GeneratedSubmitExecutionContext = {
 mode: "CREATE" | "UPDATE";
 values: Record<string, unknown>;
 resolvedValues: Record<string, unknown>;
 envelope: SubmitPayloadEnvelope;
};

export type UseGeneratedModelFormOptions = {
 contract?: ModelFormContract | null;
 initialData?: ModelFormInitialData | null;
 runtimeOverrides?: ModelFormRuntimeOverride[];
 generatedEnabled?: boolean;
 legacySchema?: FormSchema<Record<string, any>>;
 submitMode?: ModelFormMode;
 objectId?: string | number | null;
 identifierKeyOverride?: string | null;
 relationOperationOverrides?: NestedMutationOperationOverrides;
 submissionRelations?: ModelFormContract["relations"];
 executeMutation?: (
 operationName: string,
 variables: Record<string, unknown>,
 envelope: SubmitPayloadEnvelope,
 ) => Promise<unknown>;
 submitOverride?: (
 context: GeneratedSubmitExecutionContext,
 ) => Promise<unknown>;
};

type SubmitResult = {
 outcome: ModelFormMutationOutcome;
 orchestrationDurationMs: number;
 normalizationDurationMs: number;
};

function mapKindToInputType(kind: string): FormFieldConfig["type"] {
 switch (kind) {
 case "TEXTAREA":
 return "textarea";
 case "NUMBER":
 return "number";
 case "DECIMAL":
 return "decimal";
 case "BOOLEAN":
 return "switch";
 case "DATE":
 return "date";
 case "TIME":
 return "time";
 case "DATETIME":
 return "datetime-local";
 case "CHOICE":
 return "select";
 case "MULTI_CHOICE":
 return "select";
 case "JSON":
 return "json";
 case "FILE":
 return "file";
 case "RELATION":
 return "select-query";
 default:
 return "text";
 }
}

function normalizeChoicePrimitive(value: unknown): string | number | undefined {
 if (typeof value === "string" || typeof value === "number") {
 return value;
 }
 if (typeof value === "boolean") {
 return value ? "true" : "false";
 }
 return undefined;
}

function normalizeChoiceEntry(
 entry: unknown,
): { label: string; value: string | number; description?: string; disabled?: boolean } | null {
 if (Array.isArray(entry)) {
 const value = normalizeChoicePrimitive(entry[0]);
 if (value === undefined) return null;
 const label =
 entry.length > 1 && entry[1] !== undefined && entry[1] !== null
 ? String(entry[1])
 : String(value);
 const description =
 entry.length > 2 && entry[2] !== undefined && entry[2] !== null
 ? String(entry[2])
 : undefined;
 return {
 label,
 value,
 ...(description ? { description } : {}),
 };
 }

 if (entry && typeof entry === "object") {
 const record = entry as Record<string, unknown>;
 const value = normalizeChoicePrimitive(
 record.value ?? record.id ?? record.key,
 );
 if (value === undefined) return null;

 const label = String(
 record.label ?? record.name ?? record.title ?? value,
 );
 const description =
 record.description === undefined || record.description === null
 ? undefined
 : String(record.description);
 const disabled =
 typeof record.disabled === "boolean" ? record.disabled : undefined;

 return {
 label,
 value,
 ...(description ? { description } : {}),
 ...(disabled !== undefined ? { disabled } : {}),
 };
 }

 const primitive = normalizeChoicePrimitive(entry);
 if (primitive === undefined) return null;
 return {
 label: String(primitive),
 value: primitive,
 };
}

function normalizeChoiceCollection(
 source: unknown,
): Array<{ label: string; value: string | number; description?: string; disabled?: boolean }> {
 const parsed = parseJsonValue(source);
 if (Array.isArray(parsed)) {
 return parsed
 .map((entry) => normalizeChoiceEntry(entry))
 .filter(Boolean) as Array<{
 label: string;
 value: string | number;
 description?: string;
 disabled?: boolean;
 }>;
 }

 if (!parsed || typeof parsed !== "object") {
 return [];
 }

 const record = parsed as Record<string, unknown>;
 const directChoice = normalizeChoiceEntry(record);
 if (directChoice) {
 return [directChoice];
 }

 return Object.entries(record)
 .map(([value, labelOrConfig]) => {
 if (
 labelOrConfig &&
 typeof labelOrConfig === "object" &&
 !Array.isArray(labelOrConfig)
 ) {
 const config = labelOrConfig as Record<string, unknown>;
 const description =
 config.description === undefined || config.description === null
 ? undefined
 : String(config.description);
 const disabled =
 typeof config.disabled === "boolean" ? config.disabled : undefined;
 return {
 label: String(config.label ?? config.name ?? value),
 value,
 ...(description ? { description } : {}),
 ...(disabled !== undefined ? { disabled } : {}),
 };
 }
 return {
 label: String(labelOrConfig ?? value),
 value,
 };
 })
 .filter((option) => option.value !== "");
}

function resolveChoiceOptions(
 field: { kind?: string; constraints?: unknown; metadata?: unknown; ui?: unknown },
): Array<{ label: string; value: string | number; description?: string; disabled?: boolean }> {
 const metadata = asRecord(field.metadata) as Record<string, unknown> | undefined;
 const constraints = asRecord(field.constraints) as Record<string, unknown> | undefined;
 const ui = asRecord(field.ui) as Record<string, unknown> | undefined;

 const candidateSources = [
 metadata?.choices,
 constraints?.choices,
 ui?.choices,
 ui?.options,
 metadata?.enum,
 constraints?.enum,
 metadata?.allowed_values,
 constraints?.allowed_values,
 ];

 for (const candidate of candidateSources) {
 const normalized = normalizeChoiceCollection(candidate);
 if (normalized.length > 0) {
 return normalized;
 }
 }

 return [];
}

function applyOverrides(
 input: Record<string, any>,
 overrides: ModelFormRuntimeOverride[] = [],
): Record<string, any> {
 return (overrides ?? []).reduce((state, override) => {
 if (!override?.path) return state;
 const action = (override.action ?? "REPLACE").toUpperCase();
 if (action === "UNSET") {
 return unsetValueByPath(state, override.path);
 }
 if (action === "MERGE" && override.value && typeof override.value === "object") {
 return mergeValueByPath(
 state,
 override.path,
 override.value as Record<string, unknown>,
 );
 }
 return setValueByPath(state, override.path, override.value);
 }, { ...(input ?? {}) });
}

function resolveRelationFieldName(relation: {
 name?: string | null;
 path?: string | null;
}) {
 const declaredName = String(relation.name ?? "").trim();
 if (declaredName) return declaredName;
 return String(relation.path ?? "").trim();
}

function relationFieldCandidates(relation: {
 name?: string | null;
 path?: string | null;
}) {
 const candidates = new Set<string>();
 const add = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 candidates.add(normalized);
 }
 };

 add(relation.name);
 add(relation.path);
 return Array.from(candidates);
}

function normalizeVisibility(value: unknown): string {
 const normalized = String(value ?? "").trim().toUpperCase();
 if (["VISIBLE", "HIDDEN", "MASKED", "REDACTED"].includes(normalized)) {
 return normalized;
 }
 return "VISIBLE";
}

function isRelationReadable(relation: {
 readable?: boolean;
}): boolean {
 if (typeof relation.readable === "boolean") {
 return relation.readable;
 }
 return true;
}

function isRelationWritable(relation: {
 readOnly?: boolean;
 writable?: boolean;
 policy?: { allowedActions?: string[] | null } | null;
}): boolean {
 if (relation.readOnly === true) {
 return false;
 }
 if (typeof relation.writable === "boolean") {
 return relation.writable;
 }
 const allowedActions = relation.policy?.allowedActions;
 if (!Array.isArray(allowedActions) || allowedActions.length === 0) {
 return true;
 }
 return allowedActions.some((action) => WRITE_RELATION_ACTIONS.has(action));
}

function resolveSubmitPermission(
 contract: ModelFormContract | null | undefined,
 mode: "CREATE" | "UPDATE",
): ModelFormOperationPermission | null {
 const permissions = contract?.permissions;
 if (!permissions) return null;

 const operation =
 mode === "CREATE" ? permissions.create : permissions.update;
 if (operation) {
 return operation;
 }

 const allowed =
 mode === "CREATE"
 ? permissions.canCreate
 : permissions.canUpdate;
 if (typeof allowed === "boolean") {
 return {
 allowed,
 requiredPermissions: [],
 requiresAuthentication: false,
 };
 }

 return null;
}

function resolveContractFieldName(field: {
 name?: string | null;
 fieldName?: string | null;
 path?: string | null;
}) {
 const declaredName = String(field.name ?? "").trim();
 if (declaredName) return declaredName;
 return String(field.path ?? field.fieldName ?? "").trim();
}

function contractFieldCandidates(field: {
 name?: string | null;
 fieldName?: string | null;
 path?: string | null;
}) {
 const candidates = new Set<string>();
 const add = (value?: string | null) => {
 const normalized = String(value ?? "").trim();
 if (normalized) {
 candidates.add(normalized);
 }
 };

 add(field.name);
 add(field.path);

 return Array.from(candidates);
}

function resolveInitialPathValue(
 values: Record<string, any>,
 path: string,
): unknown {
 if (Object.prototype.hasOwnProperty.call(values, path)) {
 return values[path];
 }

 const nestedValue = getValueByPath(values, path);
 if (nestedValue !== undefined) {
 return nestedValue;
 }

 return undefined;
}

function normalizeInitialValuesByContract(
 values: Record<string, any>,
 contract?: ModelFormContract | null,
): Record<string, any> {
 if (!contract) {
 return { ...values };
 }

 let nextValues: Record<string, any> = {};
 let resolvedCount = 0;

 for (const field of contract.fields ?? []) {
 let resolved: unknown = undefined;
 
 // Inline candidates logic for performance
 const candidates = [field.name, field.path].filter(Boolean) as string[];
 
 for (const candidate of candidates) {
 resolved = resolveInitialPathValue(values, candidate);
 if (resolved !== undefined) break;
 }
 if (resolved === undefined) continue;

 const normalizedFieldName = resolveContractFieldName(field) || field.path;
 if (!normalizedFieldName) continue;
 
 nextValues = setValueByPath(nextValues, normalizedFieldName, resolved);
 resolvedCount += 1;
 }

 for (const relation of contract.relations ?? []) {
 let resolved: unknown = undefined;
 
 const candidates = [relation.name, relation.path].filter(Boolean) as string[];
 
 for (const candidate of candidates) {
 resolved = resolveInitialPathValue(values, candidate);
 if (resolved !== undefined) break;
 }
 if (resolved === undefined) continue;

 const relationFieldName = resolveRelationFieldName(relation) || relation.path;
 if (!relationFieldName) continue;
 
 nextValues = setValueByPath(nextValues, relationFieldName, resolved);
 resolvedCount += 1;
 }

 if (resolvedCount === 0) {
 return { ...values };
 }

 return nextValues;
}

function isGeneratedIdentifierField(field: {
 name?: string;
 path: string;
 fieldName?: string;
}): boolean {
 const contractName = resolveContractFieldName(field)
 .split(".")
 .filter(Boolean)
 .at(-1)
 ?.toLowerCase();
 const fieldName = String(field.fieldName ?? "").trim().toLowerCase();
 const leafToken = String(field.path ?? "")
 .split(".")
 .filter(Boolean)
 .at(-1)
 ?.toLowerCase();
 return contractName === "id" || fieldName === "id" || leafToken === "id";
}

export function buildSchemaFromContract(
 contract: ModelFormContract,
): FormSchema<Record<string, any>> {
 const orderRank = new Map<string, number>();
 (Array.isArray(contract.order) ? contract.order : []).forEach((path, index) => {
 const normalized = String(path ?? "").trim();
 if (!normalized || orderRank.has(normalized)) return;
 orderRank.set(normalized, index);
 });

 const resolveOrderRankFromCandidates = (candidates: Array<string | undefined>) => {
 for (const candidate of candidates) {
 const normalized = String(candidate ?? "").trim();
 if (!normalized) continue;
 const rank = orderRank.get(normalized);
 if (typeof rank === "number") {
 return rank;
 }
 }
 return undefined;
 };

 const orderFieldsByContractOrder = (fields: FormFieldConfig[]) => {
 if (orderRank.size === 0 || fields.length < 2) return fields;
 return fields
 .map((field, index) => ({
 field,
 index,
 rank:
 typeof field.order === "number" ? field.order : Number.MAX_SAFE_INTEGER,
 }))
 .sort((left, right) => {
 if (left.rank === right.rank) {
 return left.index - right.index;
 }
 return left.rank - right.rank;
 })
 .map((entry) => entry.field);
 };

 const fieldsByPath = new Map<string, FormFieldConfig>();
 const relationFieldInfoByPath = new Map<
 string,
 {
 required: boolean;
 defaultValue: unknown;
 }
 >();
 const resolveFieldByContractPath = (
 path: string,
 ): FormFieldConfig | undefined => fieldsByPath.get(path);

 /**
 * Returns relation field metadata captured from contract.fields so relation-only
 * fallback fields preserve required/default semantics.
 */
 const resolveRelationFieldInfo = (
 relation: ModelFormContract["relations"][number],
 ) => {
 for (const candidate of relationFieldCandidates(relation)) {
 const info = relationFieldInfoByPath.get(candidate);
 if (info) {
 return info;
 }
 }
 return undefined;
 };

 const buildGeneratedRelationField = (
 relation: ModelFormContract["relations"][number],
 ): FormFieldConfig => {
 const relationFieldName = resolveRelationFieldName(relation) || relation.path;
 const relationFieldInfo = resolveRelationFieldInfo(relation);
 const relationReadable = isRelationReadable(relation);
 const relationWritable = isRelationWritable(relation);
 const relatedModel = [relation.relatedAppLabel, relation.relatedModelName]
 .filter(Boolean)
 .join(".");
 const relationOrder = resolveOrderRankFromCandidates([
 relationFieldName,
 relation.path,
 ]);
 return {
 name: relationFieldName,
 type: "select-query",
 label: relation.label,
 required:
 relationFieldInfo?.required ??
 Boolean(
 relation.required ??
 (relation.nullable === undefined ? false : !relation.nullable),
 ),
 readOnly: !relationWritable,
 hidden: !relationReadable,
 defaultValue:
 relationFieldInfo?.defaultValue ?? (relation.toMany ? [] : null),
 multiple: relation.toMany,
 relatedModel: relatedModel || relation.relatedModelName,
 graphql: relatedModel
 ? {
 relatedModel,
 }
 : undefined,
 meta: {
 relationName: relationFieldName,
 relationPath: relation.path,
 relationType: relation.relationType,
 relatedAppLabel: relation.relatedAppLabel,
 relatedModelName: relation.relatedModelName,
 relationPolicy: {
 allowedActions: relation.policy?.allowedActions ?? [],
 blockedActions: relation.policy?.blockedActions ?? [],
 },
 },
 ...(typeof relationOrder === "number" ? { order: relationOrder } : {}),
 } as FormFieldConfig;
 };

 for (const field of contract.fields) {
 if (field.kind === "RELATION") {
 const relationRequired = Boolean(field.required || !field.nullable);
 const relationDefaultValue = parseJsonValue(field.defaultValue);
 const relationFieldAliases = contractFieldCandidates(field);
 const canonicalRelationFieldName = resolveContractFieldName(field);

 if (canonicalRelationFieldName) {
 relationFieldInfoByPath.set(canonicalRelationFieldName, {
 required: relationRequired,
 defaultValue: relationDefaultValue,
 });
 }

 for (const alias of relationFieldAliases) {
 relationFieldInfoByPath.set(alias, {
 required: relationRequired,
 defaultValue: relationDefaultValue,
 });
 }
 }

 const readable = field.readable ?? true;
 const writable = field.writable ?? !field.readOnly;
 const visibility = normalizeVisibility(field.visibility);
 const hidden = Boolean(
 field.hidden || !readable || visibility === "HIDDEN",
 );
 const readOnly = Boolean(field.readOnly || !writable);
 if (hidden || readOnly || isGeneratedIdentifierField(field)) continue;

 const contractFieldName = resolveContractFieldName(field) || field.path;
 if (!contractFieldName) continue;
 const type = mapKindToInputType(field.kind);
 const uiConfig = asRecord(field.ui);
 const fieldOrder = resolveOrderRankFromCandidates(
 contractFieldCandidates(field),
 );
 const baseConfig: FormFieldConfig = {
 name: contractFieldName,
 type,
 label: field.label,
 required: field.required,
 readOnly,
 defaultValue: parseJsonValue(field.defaultValue),
 inputProps: (uiConfig as Record<string, any>) ?? undefined,
 meta: {
 graphqlType: field.graphqlType,
 pythonType: field.pythonType,
 fieldPath: field.path,
 readable,
 writable,
 visibility,
 },
 ...(typeof fieldOrder === "number" ? { order: fieldOrder } : {}),
 } as FormFieldConfig;

 if (type === "select") {
 (baseConfig as any).options = resolveChoiceOptions(field);
 if (field.kind === "MULTI_CHOICE") {
 (baseConfig as any).multiple = true;
 }
 }

 const aliases = contractFieldCandidates(field);
 if (aliases.length === 0) {
 fieldsByPath.set(contractFieldName, baseConfig);
 } else {
 aliases.forEach((alias) => {
 fieldsByPath.set(alias, baseConfig);
 });
 }
 }

 for (const relation of contract.relations ?? []) {
 const relationFieldName = resolveRelationFieldName(relation) || relation.path;
 if (!relationFieldName) continue;
 if (!fieldsByPath.has(relationFieldName)) {
 fieldsByPath.set(relationFieldName, buildGeneratedRelationField(relation));
 }
 if (relation.path && !fieldsByPath.has(relation.path)) {
 const relationField = fieldsByPath.get(relationFieldName);
 if (relationField) {
 fieldsByPath.set(relation.path, relationField);
 }
 }
 }

 const assignedPaths = new Set<string>();
 const orderedVisibleSections = (contract.sections ?? [])
 .map((section, index) => ({ section, index }))
 .filter(({ section }) => section.visible)
 .sort((left, right) => {
 const leftOrder =
 typeof left.section.order === "number"
 ? left.section.order
 : Number.MAX_SAFE_INTEGER;
 const rightOrder =
 typeof right.section.order === "number"
 ? right.section.order
 : Number.MAX_SAFE_INTEGER;
 if (leftOrder === rightOrder) {
 return left.index - right.index;
 }
 return leftOrder - rightOrder;
 })
 .map(({ section }) => section);

 const sections: FormSectionConfig[] = orderedVisibleSections
 .map((section) => {
 const sectionFields = section.fieldPaths
 .map((path) => {
 const field = resolveFieldByContractPath(path);
 if (field) {
 assignedPaths.add(field.name);
 }
 return field;
 })
 .filter(Boolean) as FormFieldConfig[];
 const orderedSectionFields = orderFieldsByContractOrder(sectionFields);
 return {
 id: section.id,
 title: section.title ?? undefined,
 description: section.description ?? undefined,
 fields: orderedSectionFields,
 };
 })
 .filter((section) => section.fields.length > 0);

 const danglingFields = Array.from(fieldsByPath.values()).filter(
 (field) => !assignedPaths.has(field.name),
 );

 if (danglingFields.length > 0) {
 const seen = new Set<string>();
 const deduped = danglingFields.filter((field) => {
 if (seen.has(field.name)) return false;
 seen.add(field.name);
 return true;
 });
 const orderedDeduped = orderFieldsByContractOrder(deduped);
 if (sections.length > 0) {
 sections[0] = {
 ...sections[0],
 fields: [...sections[0].fields, ...orderedDeduped],
 };
 } else {
 sections.push({
 id: "default",
 fields: orderedDeduped,
 });
 }
 }

 return {
 id: contract.id,
 sections,
 };
}

function normalizeSubmitMode(mode: ModelFormMode | undefined): "CREATE" | "UPDATE" {
 return mode === "UPDATE" ? "UPDATE" : "CREATE";
}

export function useGeneratedModelForm(options: UseGeneratedModelFormOptions) {
 const {
 contract,
 initialData,
 runtimeOverrides = [],
 generatedEnabled = true,
 legacySchema,
 submitMode,
 objectId,
 identifierKeyOverride,
 relationOperationOverrides,
 submissionRelations,
 executeMutation,
 submitOverride,
 } = options;

 const usingGenerated = Boolean(generatedEnabled && contract);
 const effectiveSubmissionRelations = React.useMemo(
 () =>
 (submissionRelations?.length
 ? submissionRelations
 : contract?.relations ?? []),
 [submissionRelations, contract?.relations],
 );
 const rawSubmitMode = submitMode ?? contract?.mode ?? "CREATE";
 const activeSubmitMode = normalizeSubmitMode(rawSubmitMode);
 const submitPermission = React.useMemo(
 () => resolveSubmitPermission(contract, activeSubmitMode),
 [contract, activeSubmitMode],
 );
 const submitPermissionDenied = React.useMemo(
 () => shouldEnforceOperationDeny(submitPermission, activeSubmitMode),
 [submitPermission, activeSubmitMode],
 );
 const submitPermissionAllowed = !submitPermissionDenied;
 const formErrorKey = resolveCanonicalFormErrorKey(
 contract?.errorPolicy?.canonicalFormErrorKey ?? CANONICAL_FORM_ERROR_KEY,
 );
 const submitGuardRef = React.useRef(createSubmitDispatchGuard());
 const [submitState, setSubmitState] = React.useState<ModelFormSubmitState>(
 INITIAL_SUBMIT_STATE,
 );

 const visibleFieldPaths = React.useMemo(
 () =>
 new Set(
 [
 ...(contract?.fields ?? [])
 .filter(
 (field) =>
 !field.hidden &&
 (field.readable ?? true) &&
 normalizeVisibility(field.visibility) !== "HIDDEN",
 )
 .flatMap((field) => {
 const canonicalName = resolveContractFieldName(field);
 return [
 canonicalName,
 ...contractFieldCandidates(field),
 ].filter(Boolean) as string[];
 }),
 ...((contract?.relations ?? [])
 .filter((relation) => isRelationReadable(relation))
 .flatMap((relation) => {
 const fieldName = resolveRelationFieldName(relation);
 return [fieldName, relation.path].filter(Boolean) as string[];
 }) ?? []),
 ...((effectiveSubmissionRelations ?? [])
 .filter((relation) => isRelationReadable(relation))
 .flatMap((relation) => {
 const fieldName = resolveRelationFieldName(relation);
 return [fieldName, relation.path].filter(Boolean) as string[];
 }) ?? []),
 ],
 ),
 [contract, effectiveSubmissionRelations],
 );

 const baseValues = React.useMemo(() => {
 const parsedValues = parseJsonValue(initialData?.values);
 if (!parsedValues || typeof parsedValues !== "object" || Array.isArray(parsedValues)) {
 return {};
 }

 return normalizeInitialValuesByContract(
 parsedValues as Record<string, any>,
 contract,
 );
 }, [initialData, contract]);

 const runtimeValues = React.useMemo(
 () => applyOverrides(baseValues, runtimeOverrides),
 [baseValues, runtimeOverrides],
 );

 const baseSchema = React.useMemo(() => {
 if (!usingGenerated || !contract) return null;
 return buildSchemaFromContract(contract);
 }, [usingGenerated, contract]);

 const schema = React.useMemo<FormSchema<Record<string, any>>>(() => {
 if (!baseSchema) {
 return legacySchema ?? { sections: [], fields: [] };
 }
 return {
 ...baseSchema,
 initialValues: runtimeValues,
 };
 }, [baseSchema, legacySchema, runtimeValues]);

 const buildSubmissionValues = React.useCallback(
 (values: Record<string, any>) => {
 return applyOverrides(values, runtimeOverrides);
 },
 [runtimeOverrides],
 );

 const canSubmit = Boolean(
 usingGenerated &&
 contract &&
 rawSubmitMode !== "VIEW" &&
 submitPermissionAllowed &&
 (executeMutation || submitOverride),
 );

 const submit = React.useCallback(
 async (
 values: Record<string, any>,
 ): Promise<ModelFormMutationOutcome> => {
 if (!canSubmit || !contract) {
 const permissionMessage =
 submitPermissionAllowed
 ? null
 : submitPermission?.reason ??
 "Permission denied for this form operation.";
 return buildSubmitErrorOutcome(
 new Error(permissionMessage ?? "Generated submit executor is not configured."),
 {
 formErrorKey,
 visibleFieldPaths,
 },
 );
 }

 try {
 const result = await submitGuardRef.current.run<SubmitResult>(async () => {
 setSubmitState((prev) => ({
 ...prev,
 status: "SUBMITTING",
 isSubmitting: true,
 lockActive: true,
 }));

 const {
 result: orchestration,
 measurement: orchestrationMeasurement,
 } = measureSubmitOrchestration(() => {
 const mode = activeSubmitMode;
 const operationName = selectGeneratedSubmitOperation(
 contract.mutationBindings,
 mode,
 contract.modelName,
 );
 const resolvedValues = buildSubmissionValues(values);
 const identifier = resolveSubmitIdentifier({
 mode,
 values: resolvedValues,
 objectId,
 mutationBindings: contract.mutationBindings,
 identifierKeyOverride,
 });
 const envelope = buildSubmitPayload({
 mode,
 operationName,
 resolvedValues,
 relations: effectiveSubmissionRelations,
 relationOperationOverrides,
 baselineValues: runtimeValues,
 identifier,
 });
 return { mode, resolvedValues, envelope };
 });

 const executionPayload = submitOverride
 ? await submitOverride({
 mode: orchestration.mode,
 values,
 resolvedValues: orchestration.resolvedValues,
 envelope: orchestration.envelope,
 })
 : await executeMutation?.(
 orchestration.envelope.operationName,
 orchestration.envelope.variables,
 orchestration.envelope,
 );

 const payload = unwrapMutationPayload(
 executionPayload,
 orchestration.envelope.operationName,
 );

 const {
 result: normalizedErrors,
 measurement: normalizationMeasurement,
 } = measureErrorNormalization(() =>
 normalizeGeneratedMutationErrors(payload.errors ?? [], {
 formErrorKey,
 visibleFieldPaths,
 }),
 );

 const conflict =
 Boolean(payload.conflict) ||
 normalizedErrors.some((error) => Boolean(error.conflict));
 const ok = Boolean(payload.ok) && normalizedErrors.length === 0 && !conflict;

 const outcome: ModelFormMutationOutcome = {
 ok,
 object: asRecord(payload.object) ?? null,
 errors: normalizedErrors,
 conflict,
 formErrorKey: resolveCanonicalFormErrorKey(
 String(payload.formErrorKey ?? formErrorKey),
 ),
 };

 const status: ModelFormSubmitState["status"] = ok
 ? "SUCCEEDED"
 : conflict
 ? "FAILED_CONFLICT"
 : normalizedErrors.length > 0
 ? "FAILED_VALIDATION"
 : "FAILED_EXECUTION";

 setSubmitState({
 status,
 isSubmitting: false,
 lockActive: false,
 outcome,
 });

 return {
 outcome,
 orchestrationDurationMs: orchestrationMeasurement.durationMs,
 normalizationDurationMs: normalizationMeasurement.durationMs,
 };
 });

 if (result.orchestrationDurationMs > SUBMIT_ORCHESTRATION_BUDGET_MS) {
 console.warn(
`Generated submit orchestration exceeded budget: ${result.orchestrationDurationMs.toFixed(2)}ms.`,
 );
 }
 if (result.normalizationDurationMs > ERROR_NORMALIZATION_BUDGET_MS) {
 console.warn(
`Generated submit normalization exceeded budget: ${result.normalizationDurationMs.toFixed(2)}ms.`,
 );
 }

 return result.outcome;
 } catch (error) {
 const outcome = buildSubmitErrorOutcome(error, {
 formErrorKey,
 visibleFieldPaths,
 });
 const primaryMessage =
 outcome.errors[0]?.message ?? toExecutionErrorMessage(error);
 const isReentrantError =
 /already in progress/i.test(primaryMessage) ||
 /envoi\s+d[eé]j[àa]\s+en\s+cours/i.test(primaryMessage);
 const hasValidationErrors = outcome.errors.some(
 (entry) => entry.source === "OPERATION",
 );

 if (!isReentrantError) {
 setSubmitState({
 status: hasValidationErrors ? "FAILED_VALIDATION" : "FAILED_EXECUTION",
 isSubmitting: false,
 lockActive: false,
 outcome,
 });
 }

 return outcome;
 }
 },
 [
 canSubmit,
 contract,
 activeSubmitMode,
 buildSubmissionValues,
 executeMutation,
 formErrorKey,
 identifierKeyOverride,
 objectId,
 effectiveSubmissionRelations,
 relationOperationOverrides,
 rawSubmitMode,
 runtimeValues,
 submitOverride,
 submitPermission,
 submitPermissionAllowed,
 visibleFieldPaths,
 ],
 );

 return {
 usingGenerated,
 schema,
 mutationBindings: contract?.mutationBindings,
 errorPolicy: contract?.errorPolicy,
 initialValues: runtimeValues,
 buildSubmissionValues,
 submit,
 submitState,
 canSubmit,
 permissions: contract?.permissions,
 };
}
