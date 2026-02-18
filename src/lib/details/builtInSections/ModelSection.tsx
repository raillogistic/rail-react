import * as React from "react";
import type { ApolloClient } from "@apollo/client";
import { LayoutGrid, Layers, Info, Box, ChevronRight, Fingerprint } from "lucide-react";
import defaultApolloClient from "@/graphql/apollo-client";
import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import { buildResponsiveGridClass } from "@/lib/form/renderers/utils";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
} from "@/lib/form/types/generatedContract";
import { cn } from "@/lib/utils";
import { Separator } from "@/lib/components/ui/separator";
import { Badge } from "@/lib/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
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
  /** Unique section identifier within the details schema. */
  id: string;
  /** Optional section title rendered in the section frame header. */
  title?: string;
  /** Optional section description rendered below the title. */
  description?: string;
  /** Optional header icon displayed by the section frame. */
  icon?: React.ReactNode;
  /** Sort order among sibling sections; lower values render first. */
  order?: number;
  /** Django app label used to fetch the model contract and data. */
  appLabel: string;
  /** Django model name used to fetch the model contract and data. */
  modelName: string;
  /** Target record id, or resolver function, for initial value loading. */
  objectId?:
    | string
    | number
    | ((ctx: SectionRuntimeCtx) => string | number | null | undefined);
  /** Contract mode used for metadata generation (defaults to "UPDATE"). */
  contractMode?: ModelFormMode;
  /** Enables nested relation metadata and initial data retrieval. */
  includeNested?: boolean;
  /** Limits nested initial data loading to specific nested field paths. */
  nestedFields?: string[];
  /** Runtime overrides forwarded to `modelFormInitialData` query. */
  runtimeOverrides?: Array<Record<string, unknown>>;
  /** Declarative low-code manifest for field/section composition. */
  manifest?: ModelSectionManifest;
  /** Engine plugins for custom candidate/field/result transformations. */
  plugins?: ModelSectionEnginePlugin[];
  /** Optional Apollo client override used for contract/data queries. */
  client?: ApolloClient<unknown>;
  /** Default column count for rendered groups when group columns are missing. */
  columns?: number;
  /** Unit field rendering mode. */
  fieldMode?: UnitFieldMode;
  /** Unit field density preset. */
  fieldDensity?: UnitFieldDensity;
  /** Locale fallback used by `UnitFieldRenderer`. */
  defaultLocale?: string;
  /** Timezone fallback used by `UnitFieldRenderer`. */
  defaultTimezone?: string;
  /** Section loading strategy (defaults to eager for model sections). */
  loadingStrategy?: "eager" | "lazy";
  /** Required permissions to render this section. */
  permissions?: string[];
  /** Visibility predicate evaluated against current section runtime context. */
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  /** Disabled-state resolver for read-only/no-action presentation. */
  disabledIf?: SectionDefinition<ModelSectionData>["disabledIf"];
  /** Section action factory rendered in the section frame header. */
  actions?: SectionDefinition<ModelSectionData>["actions"];
  /** Optional custom skeleton renderer for loading state. */
  skeleton?: SectionDefinition<ModelSectionData>["skeleton"];
  /** Optional custom empty-state renderer when computed data is empty. */
  empty?: SectionDefinition<ModelSectionData>["empty"];
  /** Optional custom error-state renderer for load failures. */
  error?: SectionDefinition<ModelSectionData>["error"];
  /** Optional deterministic test id for the section container/frame. */
  testId?: string;
};

function resolveGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 6));
  return cn("grid gap-x-16 gap-y-12", buildResponsiveGridClass(normalized));
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
        <div className="space-y-20">
          {groups.map((group, index) => {
            const groupColumns = group.columns ?? config.columns ?? 2;
            const hasHeader = Boolean(group.title || group.description);

            return (
              <section key={group.id} className="space-y-10 group/section transition-all duration-500">
                {hasHeader ? (
                  <div className="space-y-6">
                    <header className="flex items-center justify-between gap-6">
                      <div className="space-y-2 min-w-0">
                        {group.title ? (
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-2xl bg-primary shadow-lg shadow-primary/10 text-primary-foreground shrink-0 transition-transform duration-500 group-hover/section:scale-110 group-hover/section:-rotate-2">
                              <Box className="size-4" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-[0.15em] text-foreground/90">
                              {group.title}
                            </h3>
                          </div>
                        ) : null}
                        {group.description ? (
                          <div className="flex items-start gap-2.5 pl-[3.25rem]">
                             <ChevronRight className="size-3.5 text-primary/40 mt-0.5 shrink-0" />
                             <p className="text-xs font-bold text-muted-foreground/50 leading-relaxed max-w-4xl tracking-tight">
                              {group.description}
                            </p>
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                         <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-muted/30 border border-border/10 backdrop-blur-sm transition-all hover:bg-muted/50 cursor-default">
                           <Layers className="size-3.5 text-muted-foreground/40" />
                           <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                             {group.fields.length} Entries
                           </span>
                         </div>
                      </div>
                    </header>
                    <Separator className="bg-gradient-to-r from-border/60 via-border/20 to-transparent h-[1px]" />
                  </div>
                ) : index > 0 ? (
                   <div className="py-4">
                      <Separator className="bg-border/10 border-dashed" />
                   </div>
                ) : null}

                <div className={cn(resolveGridClasses(groupColumns), "px-2 py-2")}>
                  {group.fields.map((field, fIndex) => (
                    <div
                      key={field.id ?? `${group.id}-field-${fIndex}`}
                      className="min-w-0"
                    >
                      <UnitFieldRenderer
                        field={field}
                        mode={config.fieldMode ?? "labelValue"}
                        density={config.fieldDensity ?? "normal"}
                        defaultLocale={config.defaultLocale ?? runtime.locale}
                        defaultTimezone={config.defaultTimezone ?? runtime.timezone}
                        className="transition-all duration-150 ease-out hover:bg-primary/[0.1] rounded-2xl p-4 -m-4 border border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.15] hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-default"
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
