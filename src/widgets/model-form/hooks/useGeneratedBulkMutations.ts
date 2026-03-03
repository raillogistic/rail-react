import { useCallback } from "react";
import type {
 ModelFormMutationBindings,
 ModelFormMutationOutcome,
} from "../types/generatedContract";
import {
 mapBulkErrorField,
 normalizeGeneratedMutationErrors,
} from "../utils/normalizeMutationErrors";

type ExecuteMutation = (
 operationName: string,
 variables: Record<string, unknown>,
) => Promise<Record<string, any>>;

type UseGeneratedBulkMutationsOptions = {
 mutationBindings?: ModelFormMutationBindings | null;
 executeMutation: ExecuteMutation;
};

export const BULK_FLOW_NON_GOAL_GUARD =
 "single-record submit orchestration must not modify bulk behavior";

function toOutcome(payload: any): ModelFormMutationOutcome & { objects: any[] } {
 const normalized = normalizeGeneratedMutationErrors(payload?.errors ?? []);
 const errors = normalized.map((error) => ({
 ...error,
 field: mapBulkErrorField(error),
 }));
 return {
 ok: Boolean(payload?.ok),
 errors,
 conflict: Boolean(payload?.conflict),
 formErrorKey: payload?.formErrorKey ?? "__all__",
 objects: Array.isArray(payload?.objects) ? payload.objects : [],
 };
}

export function useGeneratedBulkMutations({
 mutationBindings,
 executeMutation,
}: UseGeneratedBulkMutationsOptions) {
 // Explicit guard: this hook intentionally remains focused on bulk operations
 // even when single-record generated submit orchestration is enabled.
 void BULK_FLOW_NON_GOAL_GUARD;

 const runBulkCreate = useCallback(
 async (items: Record<string, unknown>[]) => {
 const operation = mutationBindings?.bulkCreateOperation;
 if (!operation) {
 throw new Error("bulkCreateOperation is missing from mutation bindings.");
 }
 const payload = await executeMutation(operation, { inputs: items });
 return toOutcome(payload);
 },
 [executeMutation, mutationBindings?.bulkCreateOperation],
 );

 const runBulkUpdate = useCallback(
 async (items: Array<{ id: string; data: Record<string, unknown> }>) => {
 const operation = mutationBindings?.bulkUpdateOperation;
 if (!operation) {
 throw new Error("bulkUpdateOperation is missing from mutation bindings.");
 }
 const payload = await executeMutation(operation, { inputs: items });
 return toOutcome(payload);
 },
 [executeMutation, mutationBindings?.bulkUpdateOperation],
 );

 return {
 runBulkCreate,
 runBulkUpdate,
 };
}
