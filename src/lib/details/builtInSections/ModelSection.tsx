import * as React from "react";
import type { ApolloClient } from "@apollo/client";
import defaultApolloClient from "@/graphql/apollo-client";
import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
} from "@/lib/form/types/generatedContract";
import { cn } from "@/lib/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type {
  UnitFieldDensity,
  UnitFieldMode,
} from "../units/unitFieldTypes";
import {
  buildModelSectionData,
  isModelSectionResultEmpty,
  type ModelSectionEnginePlugin,
  type ModelSectionEngineResult,
  type ModelSectionManifest,
} from "../modelSection";

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

export type ModelSectionData = ModelSectionEngineResult;

export type ModelSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  order?: number;
  appLabel: string;
  modelName: string;
  objectId?:
    | string
    | number
    | ((ctx: SectionRuntimeCtx) => string | number | null | undefined);
  contractMode?: ModelFormMode;
  includeNested?: boolean;
  nestedFields?: string[];
  runtimeOverrides?: Array<Record<string, unknown>>;
  manifest?: ModelSectionManifest;
  plugins?: ModelSectionEnginePlugin[];
  client?: ApolloClient<unknown>;
  columns?: number;
  fieldMode?: UnitFieldMode;
  fieldDensity?: UnitFieldDensity;
  defaultLocale?: string;
  defaultTimezone?: string;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<ModelSectionData>["disabledIf"];
  actions?: SectionDefinition<ModelSectionData>["actions"];
  skeleton?: SectionDefinition<ModelSectionData>["skeleton"];
  empty?: SectionDefinition<ModelSectionData>["empty"];
  error?: SectionDefinition<ModelSectionData>["error"];
  testId?: string;
};

function resolveGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 4));
  const classes = ["grid grid-cols-1 gap-x-12 gap-y-8"];
  if (normalized >= 2) classes.push("md:grid-cols-2");
  if (normalized >= 3) classes.push("xl:grid-cols-3");
  if (normalized >= 4) classes.push("2xl:grid-cols-4");
  return classes.join(" ");
}

function resolveObjectId(
  config: ModelSectionConfig,
  runtime: SectionRuntimeCtx,
): string {
  const candidate =
    typeof config.objectId === "function"
      ? config.objectId(runtime)
      : config.objectId;
  if (candidate !== null && candidate !== undefined && String(candidate).trim()) {
    return String(candidate);
  }
  return String(runtime.entityId);
}

function isApolloClientLike(value: unknown): value is ApolloClient<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as ApolloClient<unknown>).query === "function",
  );
}

function resolveApolloClient(
  config: ModelSectionConfig,
  api: Record<string, unknown>,
): ApolloClient<unknown> {
  if (config.client) return config.client;

  const apiClientCandidates = [
    api.apolloClient,
    api.client,
    api.graphqlClient,
  ];

  for (const candidate of apiClientCandidates) {
    if (isApolloClientLike(candidate)) {
      return candidate;
    }
  }

  return defaultApolloClient as ApolloClient<unknown>;
}

export function createModelSection(
  config: ModelSectionConfig,
): SectionDefinition<ModelSectionData> {
  return {
    ...config,
    kind: "model",
    dataSource: "computed",
    loadingStrategy: config.loadingStrategy ?? "eager",
    load: async (loadCtx) => {
      const objectId = resolveObjectId(config, loadCtx.runtime);
      const client = resolveApolloClient(config, loadCtx.api);
      const contractMode = config.contractMode ?? "UPDATE";
      const includeNested = Boolean(config.includeNested);

      const contractResponse = await client.query<
        ContractQueryData,
        ContractQueryVariables
      >({
        query: MODEL_FORM_CONTRACT_QUERY,
        variables: {
          appLabel: config.appLabel,
          modelName: config.modelName,
          mode: contractMode,
          includeNested,
        },
        fetchPolicy: "network-only",
        context: {
          fetchOptions: {
            signal: loadCtx.abortSignal,
          },
        },
      });

      const contract = contractResponse.data?.modelFormContract ?? null;
      if (!contract) return undefined;

      const shouldLoadInitialData = contractMode !== "CREATE" && Boolean(objectId);
      let initialData: ModelFormInitialData | null = null;

      if (shouldLoadInitialData) {
        const initialDataResponse = await client.query<
          InitialDataQueryData,
          InitialDataQueryVariables
        >({
          query: MODEL_FORM_INITIAL_DATA_QUERY,
          variables: {
            appLabel: config.appLabel,
            modelName: config.modelName,
            objectId,
            includeNested,
            ...(config.nestedFields ? { nestedFields: config.nestedFields } : {}),
            ...(config.runtimeOverrides
              ? { runtimeOverrides: config.runtimeOverrides }
              : {}),
          },
          fetchPolicy: "network-only",
          context: {
            fetchOptions: {
              signal: loadCtx.abortSignal,
            },
          },
        });
        initialData = initialDataResponse.data?.modelFormInitialData ?? null;
      }

      const result = buildModelSectionData({
        contract,
        initialData,
        manifest: config.manifest,
        plugins: config.plugins,
        ctx: {
          appLabel: config.appLabel,
          modelName: config.modelName,
          objectId,
          runtime: loadCtx.runtime,
          manifest: config.manifest,
        },
      });

      if (isModelSectionResultEmpty(result)) {
        return undefined;
      }
      return result;
    },
    render: ({ data, runtime }) => {
      const groups = [...(data?.groups ?? [])].sort(
        (left, right) => (left.order ?? 0) - (right.order ?? 0),
      );

      return (
        <div className="space-y-8">
          {groups.map((group) => {
            const groupColumns = group.columns ?? config.columns ?? 2;
            return (
              <section key={group.id} className="space-y-3">
                {group.title || group.description ? (
                  <header className="space-y-1">
                    {group.title ? (
                      <h3 className="text-sm font-semibold tracking-tight">
                        {group.title}
                      </h3>
                    ) : null}
                    {group.description ? (
                      <p className="text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    ) : null}
                  </header>
                ) : null}
                <div className={cn(resolveGridClasses(groupColumns), "py-1")}>
                  {group.fields.map((field, index) => (
                    <div
                      key={field.id ?? `${group.id}-field-${index}`}
                      className="min-w-0"
                    >
                      <UnitFieldRenderer
                        field={field}
                        mode={config.fieldMode ?? "labelValue"}
                        density={config.fieldDensity ?? "normal"}
                        defaultLocale={config.defaultLocale ?? runtime.locale}
                        defaultTimezone={config.defaultTimezone ?? runtime.timezone}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      );
    },
  };
}

export default createModelSection;
