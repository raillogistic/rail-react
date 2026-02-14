import type {
  ModelFormContractRelation,
  ModelFormMode,
} from "../types/generatedContract";
import { buildNestedMutationPayload } from "./nestedMutationPayload";
import type { ResolvedSubmitIdentifier } from "./resolveSubmitIdentifier";

export type SubmitPayloadEnvelope = {
  operationName: string;
  variables: Record<string, unknown>;
  input: Record<string, unknown>;
  identifier?: ResolvedSubmitIdentifier | null;
};

export type BuildSubmitPayloadOptions = {
  mode: ModelFormMode;
  operationName: string;
  resolvedValues: Record<string, unknown>;
  relations?: ModelFormContractRelation[];
  identifier?: ResolvedSubmitIdentifier | null;
};

export function buildSubmitPayload(
  options: BuildSubmitPayloadOptions,
): SubmitPayloadEnvelope {
  const input = buildNestedMutationPayload(
    options.resolvedValues,
    options.relations ?? [],
    options.mode,
  );

  if (options.mode !== "UPDATE") {
    return {
      operationName: options.operationName,
      variables: { input },
      input,
      identifier: null,
    };
  }

  if (!options.identifier) {
    throw new Error("Les soumissions de mise à jour nécessitent un identifiant résolu.");
  }

  return {
    operationName: options.operationName,
    variables: {
      [options.identifier.key]: options.identifier.value,
      input,
    },
    input,
    identifier: options.identifier,
  };
}
