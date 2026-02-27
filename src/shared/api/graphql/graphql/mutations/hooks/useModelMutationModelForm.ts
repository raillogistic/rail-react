import { useCallback } from "react";
import { useQuery, type OperationVariables } from "@apollo/client";
import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "../modelFormQueries";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
} from "@/shared/api/graphql/graphql/model-form/generatedContract";
import type {
  ModelMutationMode,
  UseModelMutationModelFormResult,
} from "../types";

type ContractQueryData = {
  modelFormContract: ModelFormContract | null;
};

type ContractQueryVariables = {
  appLabel: string;
  modelName: string;
  mode: ModelFormMode;
  includeNested: boolean;
};

type InitialDataQueryData = {
  modelFormInitialData: ModelFormInitialData | null;
};

type InitialDataQueryVariables = {
  appLabel: string;
  modelName: string;
  objectId: string;
  includeNested: boolean;
  nestedFields?: string[];
  runtimeOverrides?: Array<Record<string, unknown>>;
};

/**
 * Input options for model-form contract and initial-data resolution.
 */
interface UseModelMutationModelFormOptions {
  /**
   * Mutation mode used to derive default contract mode behavior.
   */
  mode: ModelMutationMode;
  /**
   * Django app label.
   */
  app?: string;
  /**
   * Django model name.
   */
  model: string;
  /**
   * Preloaded model-form contract used to bypass contract query.
   */
  contract?: ModelFormContract | null;
  /**
   * Preloaded model-form initial data used to bypass initial-data query.
   */
  initialData?: ModelFormInitialData | null;
  /**
   * Contract mode override for `modelFormContract`.
   */
  contractMode?: ModelFormMode;
  /**
   * Includes nested relations in contract/initial-data queries.
   */
  includeNested?: boolean;
  /**
   * Object identifier used for `modelFormInitialData`.
   */
  objectId?: string | number | null;
  /**
   * Optional nested field filter for `modelFormInitialData`.
   */
  initialDataNestedFields?: string[];
  /**
   * Runtime overrides forwarded to `modelFormInitialData`.
   */
  runtimeOverrides?: Array<Record<string, unknown>>;
  /**
   * Skips both model-form contract and initial-data queries.
   */
  skipModelForm?: boolean;
  /**
   * Skips only model-form initial-data query.
   */
  skipInitialData?: boolean;
  /**
   * Query options forwarded to `modelFormContract`.
   */
  contractQueryOptions?: Record<string, unknown>;
  /**
   * Query options forwarded to `modelFormInitialData`.
   */
  initialDataQueryOptions?: Record<string, unknown>;
}

/**
 * Returns true when mutation mode defaults to create contract mode.
 */
function isCreateLikeMode(mode: ModelMutationMode): boolean {
  return mode === "create" || mode === "bulkCreate";
}

/**
 * Returns default model-form contract mode based on mutation mode.
 */
function resolveDefaultContractMode(mode: ModelMutationMode): ModelFormMode {
  return isCreateLikeMode(mode) ? "CREATE" : "UPDATE";
}

/**
 * Returns true when mode requires object identifier for initial-data lookups.
 */
function requiresObjectIdForInitialData(mode: ModelMutationMode): boolean {
  return mode === "update";
}

/**
 * Normalizes object identifier to GraphQL-ready string.
 */
function normalizeObjectId(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Narrows unknown payload to object record.
 * Supports both object payloads and JSON-encoded object strings.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;
    try {
      const parsed = JSON.parse(normalized);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Resolves model-form contract and initial-data state for mutation hooks.
 */
export function useModelMutationModelForm(
  options: UseModelMutationModelFormOptions,
): UseModelMutationModelFormResult {
  const appLabel = String(options.app ?? "").trim();
  const modelName = String(options.model ?? "").trim();
  const contractMode = options.contractMode ?? resolveDefaultContractMode(options.mode);
  const includeNested = options.includeNested === true;
  const normalizedObjectId = normalizeObjectId(options.objectId);
  const explicitContract = options.contract ?? null;
  const explicitInitialData = options.initialData ?? null;
  const skipModelForm = options.skipModelForm === true;
  const skipInitialData = options.skipInitialData === true;

  const contractQueryOptions = options.contractQueryOptions as {
    skip?: boolean;
  };
  const initialDataQueryOptions = options.initialDataQueryOptions as {
    skip?: boolean;
  };

  const shouldSkipContract =
    skipModelForm ||
    Boolean(contractQueryOptions?.skip) ||
    Boolean(explicitContract) ||
    !appLabel ||
    !modelName;

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      ...(options.contractQueryOptions as Record<string, unknown>),
      variables: {
        appLabel,
        modelName,
        mode: contractMode,
        includeNested,
      } as ContractQueryVariables,
      skip: shouldSkipContract,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
    },
  );

  const contract = explicitContract ?? contractQuery.data?.modelFormContract ?? null;

  const supportsInitialData = !isCreateLikeMode(options.mode);
  const missingObjectIdError =
    supportsInitialData &&
    requiresObjectIdForInitialData(options.mode) &&
    !skipModelForm &&
    !skipInitialData &&
    !explicitInitialData &&
    !normalizedObjectId
      ? new Error(
          "Model mutation initial-data resolution requires `objectId` for update mode.",
        )
      : undefined;
  const shouldSkipInitialDataQuery =
    skipModelForm ||
    skipInitialData ||
    Boolean(initialDataQueryOptions?.skip) ||
    Boolean(explicitInitialData) ||
    !supportsInitialData ||
    !appLabel ||
    !modelName ||
    !normalizedObjectId;

  const initialDataQuery = useQuery<InitialDataQueryData, InitialDataQueryVariables>(
    MODEL_FORM_INITIAL_DATA_QUERY,
    {
      ...(options.initialDataQueryOptions as Record<string, unknown>),
      variables: {
        appLabel,
        modelName,
        objectId: normalizedObjectId,
        includeNested,
        ...(Array.isArray(options.initialDataNestedFields)
          ? { nestedFields: options.initialDataNestedFields }
          : {}),
        ...(Array.isArray(options.runtimeOverrides)
          ? { runtimeOverrides: options.runtimeOverrides }
          : {}),
      } as InitialDataQueryVariables,
      skip: shouldSkipInitialDataQuery,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
    },
  );

  const initialData =
    explicitInitialData ?? initialDataQuery.data?.modelFormInitialData ?? null;
  const initialValues = toRecord(initialData?.values) ?? null;
  const readonlyValues = toRecord(initialData?.readonlyValues) ?? null;

  const contractLoading = explicitContract ? false : contractQuery.loading;
  const initialDataLoading =
    explicitInitialData || shouldSkipInitialDataQuery
      ? false
      : initialDataQuery.loading;
  const contractError = explicitContract
    ? undefined
    : (contractQuery.error as Error | undefined);
  const initialDataError =
    explicitInitialData || shouldSkipInitialDataQuery
      ? undefined
      : (initialDataQuery.error as Error | undefined);
  const formError =
    (missingObjectIdError || contractError || initialDataError) as
      | Error
      | undefined;

  const refetchContract = useCallback(async (): Promise<ModelFormContract | null> => {
    if (explicitContract) return explicitContract;
    if (shouldSkipContract) return null;
    const result = await contractQuery.refetch(
      contractQuery.variables as OperationVariables,
    );
    return result.data?.modelFormContract ?? null;
  }, [contractQuery, explicitContract, shouldSkipContract]);

  const refetchInitialData = useCallback(
    async (): Promise<ModelFormInitialData | null> => {
      if (explicitInitialData) return explicitInitialData;
      if (shouldSkipInitialDataQuery) return null;
      const result = await initialDataQuery.refetch(
        initialDataQuery.variables as OperationVariables,
      );
      return result.data?.modelFormInitialData ?? null;
    },
    [explicitInitialData, initialDataQuery, shouldSkipInitialDataQuery],
  );

  return {
    fields: contract?.fields ?? [],
    permissions: contract?.permissions ?? null,
    mutationBindings: contract?.mutationBindings ?? null,
    errorPolicy: contract?.errorPolicy ?? null,
    initialValues,
    readonlyValues,
    formLoading: contractLoading || initialDataLoading,
    contractLoading,
    initialDataLoading,
    formError,
    contractError,
    initialDataError: (missingObjectIdError || initialDataError) as
      | Error
      | undefined,
    refetchContract,
    refetchInitialData,
  };
}
