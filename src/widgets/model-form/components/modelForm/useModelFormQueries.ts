import React from "react";
import { useQuery } from "@apollo/client";

import {
  MODEL_FORM_CONTRACT_PAGES_QUERY,
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/shared/api/graphql/legacy/modelFormContract";

import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
} from "../../types/generatedContract";
import type { ModelFormNestedDefinition } from "../../types.model";
import { toError } from "./modelFormUtils";
import {
  buildRelationModelKey,
  collectNestedRelationModelRefs,
  expandInitialDataNestedFieldsWithRelatedContracts,
} from "./queryLifecycle";

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

type ContractPagesQueryData = {
  modelFormContractPages: {
    page: number;
    perPage: number;
    total: number;
    results: ModelFormContract[];
  } | null;
};

type ContractPagesQueryVariables = {
  page: number;
  perPage: number;
  models: Array<{
    appLabel: string;
    modelName: string;
  }>;
  mode: ModelFormMode;
  includeNested: boolean;
};

type NestedControlMap<TValues extends Record<string, unknown>> = Record<
  string,
  ModelFormNestedDefinition<TValues>
>;

type UseModelFormQueriesOptions<TValues extends Record<string, unknown>> = {
  generatedEnabled: boolean;
  resolvedApp: string;
  resolvedModel: string;
  resolvedMode: ModelFormMode;
  shouldIncludeNested: boolean;
  shouldFetchInitialData: boolean;
  resolvedObjectIdValue?: string;
  initialDataNestedFields?: string[];
  runtimeOverridesForQuery?: Array<Record<string, unknown>>;
  nestedControls: NestedControlMap<TValues> | undefined;
  onContractLoaded?: (contract: ModelFormContract) => void;
  onInitialDataLoaded?: (initialData: ModelFormInitialData) => void;
  onLoadError?: (error: Error, stage: "contract" | "initialData") => void;
};

export function useModelFormQueries<TValues extends Record<string, unknown>>(
  options: UseModelFormQueriesOptions<TValues>,
) {
  const {
    generatedEnabled,
    resolvedApp,
    resolvedModel,
    resolvedMode,
    shouldIncludeNested,
    shouldFetchInitialData,
    resolvedObjectIdValue,
    initialDataNestedFields,
    runtimeOverridesForQuery,
    nestedControls,
    onContractLoaded,
    onInitialDataLoaded,
    onLoadError,
  } = options;

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      variables: {
        appLabel: resolvedApp,
        modelName: resolvedModel,
        mode: resolvedMode,
        includeNested: shouldIncludeNested,
      },
      skip: !generatedEnabled || !resolvedApp || !resolvedModel,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
      returnPartialData: false,
      notifyOnNetworkStatusChange: true,
    },
  );

  const contract = contractQuery.data?.modelFormContract ?? null;

  const nestedRelationModelRefs = React.useMemo(() => {
    return collectNestedRelationModelRefs(contract, nestedControls);
  }, [contract, nestedControls]);

  const nestedRelationContractsQuery = useQuery<
    ContractPagesQueryData,
    ContractPagesQueryVariables
  >(MODEL_FORM_CONTRACT_PAGES_QUERY, {
    variables: {
      page: 1,
      perPage: Math.max(nestedRelationModelRefs.length, 1),
      models: nestedRelationModelRefs,
      mode: resolvedMode,
      includeNested: false,
    },
    skip: !generatedEnabled || nestedRelationModelRefs.length === 0,
    fetchPolicy: "cache-first",
    returnPartialData: false,
  });

  const relatedContractsByModel = React.useMemo(() => {
    const map = new Map<string, ModelFormContract>();
    const results =
      nestedRelationContractsQuery.data?.modelFormContractPages?.results ?? [];

    for (const relatedContract of results) {
      map.set(
        buildRelationModelKey(
          relatedContract.appLabel,
          relatedContract.modelName,
        ),
        relatedContract,
      );
    }

    return map;
  }, [nestedRelationContractsQuery.data?.modelFormContractPages?.results]);

  const resolvedInitialDataNestedFields = React.useMemo(() => {
    return expandInitialDataNestedFieldsWithRelatedContracts(
      initialDataNestedFields,
      contract,
      nestedControls,
      relatedContractsByModel,
    );
  }, [initialDataNestedFields, contract, nestedControls, relatedContractsByModel]);

  const shouldDelayInitialDataQuery = Boolean(
    shouldFetchInitialData &&
      generatedEnabled &&
      shouldIncludeNested &&
      nestedControls &&
      (contract === null || nestedRelationContractsQuery.loading),
  );

  const initialDataQuery = useQuery<
    InitialDataQueryData,
    InitialDataQueryVariables
  >(MODEL_FORM_INITIAL_DATA_QUERY, {
    variables: {
      appLabel: resolvedApp,
      modelName: resolvedModel,
      objectId: resolvedObjectIdValue ?? "",
      includeNested: shouldIncludeNested,
      ...(resolvedInitialDataNestedFields
        ? { nestedFields: resolvedInitialDataNestedFields }
        : {}),
      runtimeOverrides: runtimeOverridesForQuery,
    },
    skip: !shouldFetchInitialData || shouldDelayInitialDataQuery,
    fetchPolicy: "network-only",
  });

  const initialData = shouldFetchInitialData
    ? (initialDataQuery.data?.modelFormInitialData ?? null)
    : null;

  React.useEffect(() => {
    if (!contract || !onContractLoaded) return;
    onContractLoaded(contract);
  }, [contract, onContractLoaded]);

  React.useEffect(() => {
    if (!initialData || typeof onInitialDataLoaded !== "function") return;
    onInitialDataLoaded(initialData);
  }, [initialData, onInitialDataLoaded]);

  React.useEffect(() => {
    if (!contractQuery.error || !onLoadError) return;
    onLoadError(toError(contractQuery.error), "contract");
  }, [contractQuery.error, onLoadError]);

  React.useEffect(() => {
    if (!initialDataQuery.error || !onLoadError) return;
    onLoadError(toError(initialDataQuery.error), "initialData");
  }, [initialDataQuery.error, onLoadError]);

  React.useEffect(() => {
    if (!nestedRelationContractsQuery.error || !onLoadError) return;
    onLoadError(toError(nestedRelationContractsQuery.error), "contract");
  }, [nestedRelationContractsQuery.error, onLoadError]);

  return {
    contractQuery,
    initialDataQuery,
    nestedRelationContractsQuery,
    contract,
    initialData,
    nestedRelationModelRefs,
    relatedContractsByModel,
  };
}
