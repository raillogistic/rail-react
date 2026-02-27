import type { UseModelMutationBaseOptions } from "../types";
import type { ModelMutationMode } from "../types";
import type { ModelFormMutationBindings } from "@/shared/api/graphql/graphql/model-form/generatedContract";

/**
 * Normalized mutation options consumed by generated mutation hooks.
 */
export interface ResolvedModelMutationOptions {
  app: string;
  model: string;
  selection?: string;
  resultSelection?: string;
  operationName?: string;
  mutationName?: string;
  responseAlias?: string;
  identifierVariableName?: string;
  identifierArgumentName?: string;
  identifierType?: string;
  inputTypeName?: string;
  bulkInputTypeName?: string;
  methodName?: string;
  methodFieldName?: string;
  includeInput?: boolean;
  customArgumentDefinitions?: string[];
  customArgumentAssignments?: string[];
  preferContractBindings?: boolean;
  contract?: UseModelMutationBaseOptions["contract"];
  initialData?: UseModelMutationBaseOptions["initialData"];
  contractMode?: UseModelMutationBaseOptions["contractMode"];
  includeNested?: UseModelMutationBaseOptions["includeNested"];
  objectId?: UseModelMutationBaseOptions["objectId"];
  initialDataNestedFields?: UseModelMutationBaseOptions["initialDataNestedFields"];
  runtimeOverrides?: UseModelMutationBaseOptions["runtimeOverrides"];
  skipModelForm?: UseModelMutationBaseOptions["skipModelForm"];
  skipInitialData?: UseModelMutationBaseOptions["skipInitialData"];
  contractQueryOptions?: UseModelMutationBaseOptions["contractQueryOptions"];
  initialDataQueryOptions?: UseModelMutationBaseOptions["initialDataQueryOptions"];
}

/**
 * Resolves grouped mutation options with backward-compatible flat fallback.
 */
export function resolveModelMutationOptions(
  options: UseModelMutationBaseOptions,
): ResolvedModelMutationOptions {
  const identity = options.identity || {};
  const selectionOptions = options.selectionOptions || {};
  const executionOptions = options.executionOptions || {};
  const modelFormOptions = options.modelFormOptions || {};

  return {
    app: identity.app ?? options.app ?? "",
    model: identity.model ?? options.model ?? "",
    selection: selectionOptions.selection ?? options.selection,
    resultSelection: selectionOptions.resultSelection ?? options.resultSelection,
    operationName: executionOptions.operationName ?? options.operationName,
    mutationName: executionOptions.mutationName ?? options.mutationName,
    responseAlias: executionOptions.responseAlias ?? options.responseAlias,
    identifierVariableName:
      executionOptions.identifierVariableName ?? options.identifierVariableName,
    identifierArgumentName:
      executionOptions.identifierArgumentName ?? options.identifierArgumentName,
    identifierType: executionOptions.identifierType ?? options.identifierType,
    inputTypeName: executionOptions.inputTypeName ?? options.inputTypeName,
    bulkInputTypeName:
      executionOptions.bulkInputTypeName ?? options.bulkInputTypeName,
    methodName: executionOptions.methodName ?? options.methodName,
    methodFieldName:
      executionOptions.methodFieldName ?? options.methodFieldName,
    includeInput: executionOptions.includeInput ?? options.includeInput,
    customArgumentDefinitions:
      executionOptions.customArgumentDefinitions ??
      options.customArgumentDefinitions,
    customArgumentAssignments:
      executionOptions.customArgumentAssignments ??
      options.customArgumentAssignments,
    preferContractBindings:
      executionOptions.preferContractBindings ?? options.preferContractBindings,
    contract: modelFormOptions.contract ?? options.contract,
    initialData: modelFormOptions.initialData ?? options.initialData,
    contractMode: modelFormOptions.contractMode ?? options.contractMode,
    includeNested: modelFormOptions.includeNested ?? options.includeNested,
    objectId: modelFormOptions.objectId ?? options.objectId,
    initialDataNestedFields:
      modelFormOptions.initialDataNestedFields ?? options.initialDataNestedFields,
    runtimeOverrides: modelFormOptions.runtimeOverrides ?? options.runtimeOverrides,
    skipModelForm: modelFormOptions.skipModelForm ?? options.skipModelForm,
    skipInitialData: modelFormOptions.skipInitialData ?? options.skipInitialData,
    contractQueryOptions:
      modelFormOptions.contractQueryOptions ?? options.contractQueryOptions,
    initialDataQueryOptions:
      modelFormOptions.initialDataQueryOptions ?? options.initialDataQueryOptions,
  };
}

/**
 * Resolves mutation field name from model-form mutation bindings when available.
 */
export function resolveContractBoundMutationName(
  mode: ModelMutationMode,
  bindings: ModelFormMutationBindings | null | undefined,
): string | undefined {
  if (!bindings) return undefined;

  if (mode === "create") {
    return String(bindings.createOperation || "").trim() || undefined;
  }
  if (mode === "update") {
    return String(bindings.updateOperation || "").trim() || undefined;
  }
  if (mode === "bulkCreate") {
    return String(bindings.bulkCreateOperation || "").trim() || undefined;
  }
  if (mode === "bulkUpdate") {
    return String(bindings.bulkUpdateOperation || "").trim() || undefined;
  }
  return undefined;
}
