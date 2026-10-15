import type { ModelFormContract, ModelFormContractRelation } from "../../types/generatedContract";
import type { ModelFormNestedDefinition } from "../../types.model";
import { buildRelationModelKey } from "./queryLifecycle";

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

function relationIdentityKey(relation: ModelFormContractRelation) {
 return`${String(relation.name ?? "").trim()}|${String(relation.path ?? "").trim()}`;
}

function collectLeafCandidates(relation: ModelFormContractRelation) {
 const tokens = new Set<string>();
 const byName = extractLeafToken(relation.name);
 const byPath = extractLeafToken(relation.path);
 if (byName) tokens.add(byName);
 if (byPath) tokens.add(byPath);
 return Array.from(tokens);
}

export function buildSubmitRelationsFromContracts<
 TValues extends Record<string, unknown>,
>(options: {
 contract: ModelFormContract | null;
 nestedControls: NestedControlMap<TValues> | undefined;
 relatedContractsByModel: Map<string, ModelFormContract>;
}) {
 const { contract, nestedControls, relatedContractsByModel } = options;
 const baseRelations = contract?.relations ?? [];
 if (!contract || !nestedControls || baseRelations.length === 0) {
 return baseRelations;
 }

 const parentModelKey = buildRelationModelKey(
 contract.appLabel,
 contract.modelName,
 );
 const seen = new Set<string>();
 const output: ModelFormContractRelation[] = [];

 const pushRelation = (relation: ModelFormContractRelation) => {
 const key = relationIdentityKey(relation);
 if (seen.has(key)) return;
 seen.add(key);
 output.push(relation);
 };

 for (const relation of baseRelations) {
 pushRelation(relation);
 }

 for (const parentRelation of baseRelations) {
 const parentFieldName = resolveRelationFieldName(parentRelation);
 const nestedControl =
 nestedControls[parentFieldName] ?? nestedControls[parentRelation.path];
 if (!nestedControl || nestedControl.enabled === false) {
 continue;
 }

 const relationModelKey = buildRelationModelKey(
 parentRelation.relatedAppLabel,
 parentRelation.relatedModelName,
 );
 const relatedContract = relatedContractsByModel.get(relationModelKey);
 if (!relatedContract) {
 continue;
 }

 const parentPathCandidates = relationLookupKeys(parentRelation);
 for (const childRelation of relatedContract.relations ?? []) {
 const childTargetModelKey = buildRelationModelKey(
 childRelation.relatedAppLabel,
 childRelation.relatedModelName,
 );
 // Do not inline back-reference relations to the current root model.
 if (childTargetModelKey === parentModelKey) {
 continue;
 }

 const childLeafCandidates = collectLeafCandidates(childRelation);
 for (const parentPath of parentPathCandidates) {
 for (const childLeaf of childLeafCandidates) {
 pushRelation({
 ...childRelation,
 name: childLeaf,
 path:`${parentPath}.${childLeaf}`,
 });
 }
 }
 }
 }

 return output;
}
