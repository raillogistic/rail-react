import * as React from "react";
import { gql, type ApolloClient } from "@apollo/client";
import {
  Layers,
  Box,
  ChevronRight,
  Pencil,
  Printer,
  Zap,
  CircleAlert,
} from "lucide-react";
import { toast } from "sonner";
import defaultApolloClient from "@/shared/api/apollo/client";
import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import { TABLE_MODEL_METADATA_QUERY } from "@/lib/graphql/metadata/queries";
import type {
  ModelMetadata,
  MutationInputField,
  MutationMetadata,
  TemplateInfo,
} from "@/lib/graphql/metadata/types";
import { buildResponsiveGridClass } from "@/lib/form/renderers/utils";
import { shouldEnforceOperationDeny } from "@/lib/form/utils/operationPermissions";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
  ModelFormOperationPermission,
} from "@/lib/form/types/generatedContract";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { Separator } from "@/lib/components/ui/separator";
import type { TemplateInfo as TableTemplateInfo } from "@/lib/table/types";
import { toGraphqlFieldName } from "@/lib/table/utils/caseConversion";
import { normalizeMutationType } from "@/lib/table/utils/schemaHelpers";
import {
  executeTemplateForRows,
  parseTemplateClientFields,
  type TemplateActionType,
} from "@/lib/table/utils/templateExecution";
import {
  hasRequiredPermissions,
  type SectionAction,
  type SectionActionCtx,
  type SectionDefinition,
  type SectionRuntimeCtx,
} from "../sectionTypes";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldDensity, UnitFieldMode } from "../units/unitFieldTypes";
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

type MetadataQueryData = {
  modelSchema: ModelMetadata | null;
};

type MetadataQueryVariables = {
  app: string;
  model: string;
  objectId?: string;
};

type MutationActionMode = "confirm" | "form";

type ModelSectionAccessState = {
  canView: boolean;
  canUpdate: boolean;
  viewReason?: string;
  updateReason?: string;
};

/** Auto-generated action settings for model details sections. */
export type ModelSectionAutoActionsConfig = {
  /** Include update action when object update is allowed. */
  includeUpdate?: boolean;
  /** Include custom mutation actions from model metadata. */
  includeCustomMutations?: boolean;
  /** Include template actions from model metadata. */
  includeTemplates?: boolean;
  /** Explicit generated action ids to remove. */
  excludeActionIds?: string[];
};

/** Update action callback payload for built-in model section edit action. */
export type ModelSectionUpdateActionContext = {
  runtime: SectionRuntimeCtx;
  objectId: string;
  appLabel: string;
  modelName: string;
};

export type ModelSectionData = ModelSectionEngineResult & {
  objectId: string;
  access: ModelSectionAccessState;
  customMutations: MutationMetadata[];
  templates: TemplateInfo[];
};

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
  /** Built-in generated action toggles and explicit generated action exclusions. */
  autoActions?: ModelSectionAutoActionsConfig;
  /** Callback executed by the built-in update action. */
  onUpdate?: (ctx: ModelSectionUpdateActionContext) => void | Promise<void>;
  /** Optional custom skeleton renderer for loading state. */
  skeleton?: SectionDefinition<ModelSectionData>["skeleton"];
  /** Optional custom empty-state renderer when computed data is empty. */
  empty?: SectionDefinition<ModelSectionData>["empty"];
  /** Optional custom error-state renderer for load failures. */
  error?: SectionDefinition<ModelSectionData>["error"];
  /** Optional deterministic test id for the section container/frame. */
  testId?: string;
};

type AutoActionSettings = {
  includeUpdate: boolean;
  includeCustomMutations: boolean;
  includeTemplates: boolean;
  excludeActionIds: Set<string>;
};

type PromptField = {
  name: string;
  label: string;
  required: boolean;
  rawType?: string;
  defaultValue?: unknown;
};

const UPDATE_ACTION_ID = "model-section:update";
const CUSTOM_MUTATION_ACTION_PREFIX = "model-section:mutation:";
const TEMPLATE_ACTION_PREFIX = "model-section:template:";

/** Build responsive grid classes for grouped model fields. */
function resolveGridClasses(columns: number): string {
  const normalized = Math.max(1, Math.min(columns, 6));
  return cn("grid gap-x-16 gap-y-12", buildResponsiveGridClass(normalized));
}

/** Resolve object id from config override or runtime entity id fallback. */
function resolveObjectId(
  config: ModelSectionConfig,
  runtime: SectionRuntimeCtx,
): string {
  const candidate =
    typeof config.objectId === "function"
      ? config.objectId(runtime)
      : config.objectId;
  if (
    candidate !== null &&
    candidate !== undefined &&
    String(candidate).trim()
  ) {
    return String(candidate);
  }
  return String(runtime.entityId);
}

/** Check whether a runtime adapter exposes an Apollo-compatible client. */
function isApolloClientLike(value: unknown): value is ApolloClient<unknown> {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as ApolloClient<unknown>).query === "function" &&
    typeof (value as ApolloClient<unknown>).mutate === "function",
  );
}

/** Resolve Apollo client from section config, runtime adapters, or default singleton. */
function resolveApolloClient(
  config: ModelSectionConfig,
  api: Record<string, unknown>,
): ApolloClient<unknown> {
  if (config.client) return config.client;

  const apiClientCandidates = [api.apolloClient, api.client, api.graphqlClient];

  for (const candidate of apiClientCandidates) {
    if (isApolloClientLike(candidate)) {
      return candidate;
    }
  }

  return defaultApolloClient as ApolloClient<unknown>;
}

/** Narrow unknown input to plain object records. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/** Parse JSON object-like values used in metadata action descriptors. */
function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (isRecord(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Normalize unknown permission arrays to trimmed string keys. */
function toPermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
}

/** Extract operation-level permission objects from model-form contract metadata. */
function resolveContractOperationPermission(
  contract: ModelFormContract,
  mode: "VIEW" | "UPDATE",
): ModelFormOperationPermission | null {
  const permissions = contract.permissions;
  if (!permissions) return null;
  const operation = mode === "VIEW" ? permissions.view : permissions.update;
  if (operation) return operation;
  const allowed = mode === "VIEW" ? permissions.canView : permissions.canUpdate;
  if (typeof allowed !== "boolean") return null;
  return {
    allowed,
    requiredPermissions: [],
    requiresAuthentication: false,
  };
}

/** Parse metadata denial-reasons payload into a stable key/value map. */
function parseMetadataPermissionReasons(
  denialReasons: unknown,
): Record<string, string> {
  if (typeof denialReasons !== "string") return {};
  const parsed = parseJsonObject(denialReasons);
  if (!parsed) return {};
  return Object.entries(parsed).reduce<Record<string, string>>((acc, entry) => {
    const [key, value] = entry;
    const normalized = String(value ?? "").trim();
    if (normalized) {
      acc[key] = normalized;
    }
    return acc;
  }, {});
}

/** Build fallback message for missing runtime permission keys. */
function buildMissingPermissionsReason(permissionKeys: string[]): string {
  return `Required permissions: ${permissionKeys.join(", ")}`;
}

/** Determine whether runtime context can evaluate permission keys locally. */
function hasRuntimePermissionSource(runtime: SectionRuntimeCtx): boolean {
  if (typeof runtime.can === "function") return true;
  return runtime.permissions !== undefined;
}

/** Evaluate required permission keys with runtime fallbacks only when available. */
function passesRuntimePermissionCheck(
  requiredPermissions: string[],
  runtime: SectionRuntimeCtx,
): boolean {
  if (requiredPermissions.length === 0) return true;
  if (!hasRuntimePermissionSource(runtime)) return true;
  return hasRequiredPermissions(requiredPermissions, runtime);
}

/** Return the first non-empty string candidate. */
function firstNonEmpty(
  candidates: Array<string | undefined>,
): string | undefined {
  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized) return normalized;
  }
  return undefined;
}

/** Combine contract and metadata permissions into view/update access state for the object. */
function resolveModelSectionAccess(
  contract: ModelFormContract,
  metadata: ModelMetadata | null,
  runtime: SectionRuntimeCtx,
): ModelSectionAccessState {
  const viewPermission = resolveContractOperationPermission(contract, "VIEW");
  const updatePermission = resolveContractOperationPermission(
    contract,
    "UPDATE",
  );
  const viewPermissionKeys = toPermissionList(
    viewPermission?.requiredPermissions,
  );
  const updatePermissionKeys = toPermissionList(
    updatePermission?.requiredPermissions,
  );
  const enforceViewPermissionKeys = viewPermission?.allowed !== true;
  const enforceUpdatePermissionKeys = updatePermission?.allowed !== true;
  const hasViewPermissionKeys =
    !enforceViewPermissionKeys ||
    passesRuntimePermissionCheck(viewPermissionKeys, runtime);
  const hasUpdatePermissionKeys =
    !enforceUpdatePermissionKeys ||
    passesRuntimePermissionCheck(updatePermissionKeys, runtime);

  const contractViewDenied =
    shouldEnforceOperationDeny(viewPermission, "VIEW") ||
    !hasViewPermissionKeys;
  const contractUpdateDenied =
    shouldEnforceOperationDeny(updatePermission, "UPDATE") ||
    !hasUpdatePermissionKeys;

  const modelPermissions = metadata?.permissions;
  const modelReasons = parseMetadataPermissionReasons(
    modelPermissions?.denialReasons,
  );
  const metadataCanView = modelPermissions
    ? Boolean(modelPermissions.canRetrieve ?? modelPermissions.canRead ?? true)
    : true;
  const metadataCanUpdate = modelPermissions
    ? Boolean(modelPermissions.canUpdate)
    : true;

  const canView = !contractViewDenied && metadataCanView;
  const canUpdate = canView && !contractUpdateDenied && metadataCanUpdate;

  const viewReason = !canView
    ? firstNonEmpty([
        enforceViewPermissionKeys && !hasViewPermissionKeys
          ? buildMissingPermissionsReason(viewPermissionKeys)
          : undefined,
        String(viewPermission?.reason ?? "").trim(),
        modelReasons.canRetrieve,
        modelReasons.canRead,
        "You do not have permission to view this object.",
      ])
    : undefined;

  const updateReason = !canUpdate
    ? firstNonEmpty([
        enforceUpdatePermissionKeys && !hasUpdatePermissionKeys
          ? buildMissingPermissionsReason(updatePermissionKeys)
          : undefined,
        String(updatePermission?.reason ?? "").trim(),
        modelReasons.canUpdate,
        canView
          ? "You do not have permission to update this object."
          : viewReason,
      ])
    : undefined;

  return {
    canView,
    canUpdate,
    ...(viewReason ? { viewReason } : {}),
    ...(updateReason ? { updateReason } : {}),
  };
}

/** Resolve normalized auto-action settings and generated-action exclusions. */
function resolveAutoActionSettings(
  config: ModelSectionConfig,
): AutoActionSettings {
  const autoActions = config.autoActions;
  const excludeActionIds = new Set(
    (autoActions?.excludeActionIds ?? [])
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry.length > 0),
  );
  return {
    includeUpdate: autoActions?.includeUpdate !== false,
    includeCustomMutations: autoActions?.includeCustomMutations !== false,
    includeTemplates: autoActions?.includeTemplates !== false,
    excludeActionIds,
  };
}

/** Read custom mutation actions from model metadata payload. */
function resolveCustomMutations(
  metadata: ModelMetadata | null,
): MutationMetadata[] {
  return (metadata?.mutations ?? []).filter(
    (mutation) => normalizeMutationType(mutation as any) === "custom",
  );
}

/** Read template actions from model metadata payload. */
function resolveTemplates(metadata: ModelMetadata | null): TemplateInfo[] {
  return Array.isArray(metadata?.templates) ? [...metadata.templates] : [];
}

/** Convert identifiers to human-readable action labels. */
function humanizeLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!withSpaces) return value;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/** Compute mutation action label from metadata UI hints and method names. */
function buildMutationLabel(mutation: MutationMetadata): string {
  const actionUi = parseJsonObject(mutation.action);
  const buttonTitle = actionUi?.button_title ?? actionUi?.buttonTitle;
  if (typeof buttonTitle === "string" && buttonTitle.trim()) {
    return buttonTitle.trim();
  }
  const title = actionUi?.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }
  return humanizeLabel(mutation.methodName || mutation.name || "Action");
}

/** Normalize metadata mutation input fields to GraphQL-safe variable names. */
function normalizeMutationInputFields(
  mutation: MutationMetadata,
): MutationInputField[] {
  const source = Array.isArray(mutation.inputFields)
    ? mutation.inputFields
    : [];
  return source
    .filter((field): field is MutationInputField => isRecord(field))
    .map((field, index) => {
      const rawName =
        typeof field.name === "string"
          ? field.name
          : typeof field.fieldName === "string"
            ? field.fieldName
            : `field${index + 1}`;
      const normalizedName = toGraphqlFieldName(rawName) || rawName;
      return {
        ...field,
        name: normalizedName,
        fieldName: normalizedName,
      };
    });
}

/** Resolve mutation action mode from metadata, defaulting to form when input exists. */
function resolveMutationActionMode(
  mutation: MutationMetadata,
  inputFields: MutationInputField[],
): MutationActionMode {
  const actionUi = parseJsonObject(mutation.action);
  const declaredMode = String(actionUi?.mode ?? "").toLowerCase();
  if (declaredMode === "confirm") return "confirm";
  if (declaredMode === "form")
    return inputFields.length > 0 ? "form" : "confirm";
  return inputFields.length > 0 ? "form" : "confirm";
}

/** Coerce prompt text values to typed GraphQL-friendly scalar values. */
function coercePromptValue(raw: string, rawType?: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const normalizedType = String(rawType ?? "").toLowerCase();

  if (normalizedType.includes("bool")) {
    const lowered = trimmed.toLowerCase();
    if (lowered === "true" || lowered === "1" || lowered === "yes") return true;
    if (lowered === "false" || lowered === "0" || lowered === "no")
      return false;
    return Boolean(trimmed);
  }

  if (
    normalizedType.includes("int") ||
    normalizedType.includes("float") ||
    normalizedType.includes("decimal") ||
    normalizedType.includes("number")
  ) {
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? trimmed : parsed;
  }

  if (
    normalizedType.includes("json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/** Collect mutation/template input values via simple prompt-based fallback UI. */
function collectPromptValues(
  title: string,
  fields: PromptField[],
): Record<string, unknown> | null {
  if (!fields.length) return {};
  if (typeof window === "undefined" || typeof window.prompt !== "function") {
    return {};
  }

  const values: Record<string, unknown> = {};

  for (const field of fields) {
    const promptLabel = `${title}: ${field.label}${field.required ? " *" : ""}`;
    const defaultText =
      field.defaultValue === undefined || field.defaultValue === null
        ? ""
        : String(field.defaultValue);
    const rawInput = window.prompt(promptLabel, defaultText);
    if (rawInput === null) return null;

    const trimmed = rawInput.trim();
    if (!trimmed) {
      if (field.required) {
        toast.error(`Field '${field.label}' is required.`);
        return null;
      }
      continue;
    }

    values[field.name] = coercePromptValue(trimmed, field.rawType);
  }

  return values;
}

/** Build operation-name candidates for custom model-method mutation execution. */
function buildMutationOperationNames(
  mutation: MutationMetadata,
  fallbackModelName: string,
): string[] {
  const names = new Set<string>();
  const directName = String(mutation.name ?? "").trim();
  if (directName) names.add(directName);

  const methodToken = mutation.methodName
    ? toGraphqlFieldName(mutation.methodName)
    : "";
  const modelToken = String(
    mutation.modelName ?? fallbackModelName ?? "",
  ).trim();
  if (methodToken && modelToken) {
    names.add(`${methodToken}${modelToken}`);
  }

  return [...names].filter((entry) => entry.length > 0);
}

/** Normalize GraphQL variable types and preserve required markers. */
function normalizeGraphqlType(
  rawType: string | undefined,
  required: boolean,
): string {
  const base = String(rawType ?? "String")
    .replace(/\s+/g, "")
    .replace(/!$/, "");
  if (!base) return required ? "String!" : "String";
  return required ? `${base}!` : base;
}

/** Build ad-hoc GraphQL mutation documents for metadata-defined custom actions. */
function buildMutationDocument(options: {
  operationName: string;
  inputType?: string | null;
  inputFields: MutationInputField[];
  useInputObject: boolean;
}): ReturnType<typeof gql> {
  const variableDefinitions: string[] = ["$id: ID!"];
  const argumentMappings: string[] = ["id: $id"];

  if (
    options.inputFields.length > 0 &&
    options.useInputObject &&
    options.inputType
  ) {
    const inputTypeName = normalizeGraphqlType(options.inputType, true);
    variableDefinitions.push(`$input: ${inputTypeName}`);
    argumentMappings.push("input: $input");
  } else if (options.inputFields.length > 0) {
    options.inputFields.forEach((field) => {
      const variableName = String(field.name ?? field.fieldName ?? "").trim();
      if (!variableName) return;
      const variableType = normalizeGraphqlType(
        String(field.graphqlType ?? field.fieldType ?? "String"),
        Boolean(field.required),
      );
      variableDefinitions.push(`$${variableName}: ${variableType}`);
      argumentMappings.push(`${variableName}: $${variableName}`);
    });
  }

  const variableBlock = variableDefinitions.join(", ");
  const argumentBlock = argumentMappings.join(", ");
  return gql`
    mutation ${options.operationName}(${variableBlock}) {
      response: ${options.operationName}(${argumentBlock}) {
        ok
        errors {
          field
          message
          code
          severity
          details
        }
      }
    }
  `;
}

/** Extract GraphQL error message strings from Apollo error arrays. */
function extractGraphqlErrors(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((entry): entry is { message?: string } => isRecord(entry))
    .map((entry) => String(entry.message ?? "").trim())
    .filter((entry) => entry.length > 0);
}

/** Execute metadata custom mutation against Apollo with fallback argument plans. */
async function executeMetadataMutation(options: {
  client: ApolloClient<unknown>;
  mutation: MutationMetadata;
  modelName: string;
  objectId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const operationNames = buildMutationOperationNames(
    options.mutation,
    options.modelName,
  );
  if (operationNames.length === 0) {
    throw new Error("Unable to resolve mutation operation name.");
  }

  const inputFields = normalizeMutationInputFields(options.mutation);
  const hasInputPayload = inputFields.length > 0;
  const inputPayload = hasInputPayload ? options.payload : {};
  const graphqlErrors: string[] = [];

  for (const operationName of operationNames) {
    const plans =
      hasInputPayload && options.mutation.inputType ? [true, false] : [false];

    for (const useInputObject of plans) {
      const mutationDocument = buildMutationDocument({
        operationName,
        inputType: options.mutation.inputType,
        inputFields,
        useInputObject,
      });
      const variables =
        hasInputPayload && useInputObject
          ? { id: options.objectId, input: inputPayload }
          : hasInputPayload
            ? { id: options.objectId, ...inputPayload }
            : { id: options.objectId };

      try {
        const result = await options.client.mutate({
          mutation: mutationDocument,
          variables,
          errorPolicy: "all",
        });
        const response = (
          result.data as {
            response?: { ok?: boolean; errors?: Array<{ message?: string }> };
          } | null
        )?.response;

        if (response?.ok) {
          return;
        }

        const responseError = (response?.errors ?? []).find(
          (entry) => typeof entry?.message === "string" && entry.message,
        );
        if (responseError?.message) {
          throw new Error(responseError.message);
        }

        const requestErrors = extractGraphqlErrors(result.errors);
        if (requestErrors.length > 0) {
          graphqlErrors.push(...requestErrors);
          continue;
        }

        throw new Error("Mutation execution failed.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message) {
          graphqlErrors.push(message);
        }
      }
    }
  }

  if (graphqlErrors.length > 0) {
    throw new Error(graphqlErrors[graphqlErrors.length - 1]);
  }

  throw new Error("Mutation execution failed.");
}

/** Execute one custom mutation action and reload section data on success. */
async function runCustomMutationAction(
  ctx: SectionActionCtx<ModelSectionData>,
  config: ModelSectionConfig,
  mutation: MutationMetadata,
): Promise<void> {
  const data = ctx.state.data;
  if (!data?.objectId) {
    toast.error("Missing object identifier for mutation action.");
    return;
  }

  const inputFields = normalizeMutationInputFields(mutation);
  const actionMode = resolveMutationActionMode(mutation, inputFields);
  const actionUi = parseJsonObject(mutation.action);

  if (
    actionMode === "confirm" &&
    typeof window !== "undefined" &&
    typeof window.confirm === "function"
  ) {
    const confirmMessage =
      String(actionUi?.confirmMessage ?? actionUi?.confirmation ?? "").trim() ||
      `Run '${buildMutationLabel(mutation)}'?`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
  }

  const promptFields: PromptField[] =
    actionMode === "form"
      ? inputFields.map((field) => ({
          name: String(field.name ?? field.fieldName ?? "").trim(),
          label: humanizeLabel(
            String(field.name ?? field.fieldName ?? "Field"),
          ),
          required: Boolean(field.required),
          rawType: String(field.graphqlType ?? field.fieldType ?? ""),
          defaultValue: field.defaultValue,
        }))
      : [];

  const payload = collectPromptValues(
    buildMutationLabel(mutation),
    promptFields,
  );
  if (payload === null) return;

  const client = resolveApolloClient(config, ctx.runtime.api ?? {});
  await executeMetadataMutation({
    client,
    mutation,
    modelName: config.modelName,
    objectId: data.objectId,
    payload,
  });

  toast.success(
    String(mutation.successMessage ?? "Action executed successfully.").trim() ||
      "Action executed successfully.",
  );
  await ctx.reload();
}

/** Execute one template action for the current object and show user feedback. */
async function runTemplateAction(
  ctx: SectionActionCtx<ModelSectionData>,
  template: TemplateInfo,
): Promise<void> {
  const objectId = ctx.state.data?.objectId;
  if (!objectId) {
    toast.error("Missing object identifier for template action.");
    return;
  }

  const promptFields: PromptField[] = parseTemplateClientFields(
    template as unknown as TableTemplateInfo,
  ).map((field) => ({
    name: String(field.name ?? "").trim(),
    label: humanizeLabel(String(field.name ?? "Field")),
    required: false,
    rawType: String(field.type ?? ""),
  }));

  const payload = collectPromptValues(
    String(template.title ?? template.key ?? "Template").trim() || "Template",
    promptFields,
  );
  if (payload === null) return;

  const result = await executeTemplateForRows(
    template as unknown as TableTemplateInfo,
    [objectId],
    payload,
  );
  const templateType = String(
    result.templateType ?? "",
  ).toLowerCase() as TemplateActionType;
  if (templateType === "excel") {
    toast.success(`Template '${template.title || template.key}' downloaded.`);
    return;
  }
  toast.success(`Template '${template.title || template.key}' generated.`);
}

/** Build generated section actions from resolved permissions and metadata payloads. */
function buildAutoActions(
  config: ModelSectionConfig,
  runtime: SectionRuntimeCtx,
  state: { data?: ModelSectionData },
): SectionAction<ModelSectionData>[] {
  const settings = resolveAutoActionSettings(config);
  const data = state.data;
  if (!data || !data.access.canView) {
    return [];
  }

  const actions: SectionAction<ModelSectionData>[] = [];

  if (
    settings.includeUpdate &&
    !settings.excludeActionIds.has(UPDATE_ACTION_ID) &&
    data.access.canUpdate
  ) {
    actions.push({
      id: UPDATE_ACTION_ID,
      label: "Update",
      icon: <Pencil className="size-3.5" />,
      tone: "primary",
      disabled: !config.onUpdate,
      disabledReason: !config.onUpdate
        ? "Provide onUpdate to enable the edit action."
        : undefined,
      onClick: async () => {
        if (!config.onUpdate) return;
        await config.onUpdate({
          runtime,
          objectId: data.objectId,
          appLabel: config.appLabel,
          modelName: config.modelName,
        });
      },
    });
  }

  if (settings.includeCustomMutations) {
    for (const mutation of data.customMutations) {
      const actionId = `${CUSTOM_MUTATION_ACTION_PREFIX}${mutation.name}`;
      if (settings.excludeActionIds.has(actionId)) continue;
      if (mutation.allowed === false) continue;

      const requiredPermissions = toPermissionList(
        mutation.requiredPermissions,
      );
      if (
        mutation.allowed !== true &&
        !passesRuntimePermissionCheck(requiredPermissions, runtime)
      ) {
        continue;
      }

      actions.push({
        id: actionId,
        label: buildMutationLabel(mutation),
        icon: <Zap className="size-3.5" />,
        tone: "secondary",
        permissions: requiredPermissions,
        onClick: async (ctx) => {
          await runCustomMutationAction(ctx, config, mutation);
        },
      });
    }
  }

  if (settings.includeTemplates) {
    for (const template of data.templates) {
      const actionId = `${TEMPLATE_ACTION_PREFIX}${template.key}`;
      if (settings.excludeActionIds.has(actionId)) continue;
      if (template.allowed === false) continue;

      const requiredPermissions = toPermissionList(template.permissions);
      if (
        template.allowed !== true &&
        !passesRuntimePermissionCheck(requiredPermissions, runtime)
      ) {
        continue;
      }

      actions.push({
        id: actionId,
        label:
          String(template.title ?? template.key ?? "Template").trim() ||
          "Template",
        icon: <Printer className="size-3.5" />,
        tone: "secondary",
        permissions: requiredPermissions,
        onClick: async (ctx) => {
          await runTemplateAction(ctx, template);
        },
      });
    }
  }

  return actions;
}

/** Merge generated and configured actions, preferring configured action ids. */
function mergeActions(
  generated: SectionAction<ModelSectionData>[],
  configured: SectionAction<ModelSectionData>[],
): SectionAction<ModelSectionData>[] {
  const merged = new Map<string, SectionAction<ModelSectionData>>();
  for (const action of generated) {
    merged.set(action.id, action);
  }
  for (const action of configured) {
    merged.set(action.id, action);
  }
  return [...merged.values()];
}

/** Build explicit no-access payload to render access alert instead of details fields. */
function buildNoAccessData(
  objectId: string,
  access: ModelSectionAccessState,
  metadata: ModelMetadata | null,
): ModelSectionData {
  return {
    groups: [],
    allFields: [],
    objectId,
    access,
    customMutations: resolveCustomMutations(metadata),
    templates: resolveTemplates(metadata),
  };
}

/** Create a metadata-driven model details section with auto actions and permission gating. */
export function createModelSection(
  config: ModelSectionConfig,
): SectionDefinition<ModelSectionData> {
  return {
    ...config,
    kind: "model",
    dataSource: "computed",
    loadingStrategy: config.loadingStrategy ?? "eager",
    actions: (runtime, state) => {
      const generated = buildAutoActions(config, runtime, state);
      const configured = config.actions?.(runtime, state) ?? [];
      return mergeActions(generated, configured);
    },
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

      const metadataResponse = await client.query<
        MetadataQueryData,
        MetadataQueryVariables
      >({
        query: TABLE_MODEL_METADATA_QUERY,
        variables: {
          app: config.appLabel,
          model: config.modelName,
          objectId,
        },
        fetchPolicy: "network-only",
        context: {
          fetchOptions: {
            signal: loadCtx.abortSignal,
          },
        },
      });
      const metadata = metadataResponse.data?.modelSchema ?? null;
      const access = resolveModelSectionAccess(
        contract,
        metadata,
        loadCtx.runtime,
      );

      if (!access.canView) {
        return buildNoAccessData(objectId, access, metadata);
      }

      const shouldLoadInitialData =
        contractMode !== "CREATE" && Boolean(objectId);
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
            ...(config.nestedFields
              ? { nestedFields: config.nestedFields }
              : {}),
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
      return {
        ...result,
        objectId,
        access,
        customMutations: resolveCustomMutations(metadata),
        templates: resolveTemplates(metadata),
      };
    },
    render: ({ data, runtime }) => {
      if (data?.access && !data.access.canView) {
        return (
          <Alert
            variant="destructive"
            className="rounded-2xl border-destructive/30 bg-destructive/5"
          >
            <CircleAlert className="size-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription>
              {data.access.viewReason ||
                "You do not have permission to view this object."}
            </AlertDescription>
          </Alert>
        );
      }

      const groups = [...(data?.groups ?? [])].sort(
        (left, right) => (left.order ?? 0) - (right.order ?? 0),
      );

      return (
        <div className="space-y-20">
          {groups.map((group, index) => {
            const groupColumns = group.columns ?? config.columns ?? 2;
            const hasHeader = Boolean(group.title || group.description);

            return (
              <section
                key={group.id}
                className="space-y-10 group/section transition-all duration-500"
              >
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

                <div
                  className={cn(resolveGridClasses(groupColumns), "px-2 py-2")}
                >
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
                        defaultTimezone={
                          config.defaultTimezone ?? runtime.timezone
                        }
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


