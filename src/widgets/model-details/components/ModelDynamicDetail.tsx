/**
 * @module ModelDynamicDetail
 * @description Composant de détail dynamique pour les modèles.
 * Gère la récupération des métadonnées, la construction du schéma,
 * les actions CRUD, les mutations personnalisées et les templates.
 */
import * as React from "react";
import { gql, useApolloClient } from "@apollo/client";
import { AlertTriangle, Loader2, Pencil, Printer, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils";
import { toGraphqlFieldName } from "@/shared/api/graphql/graphql/naming";
import {
  fetchMetadataSnapshot,
} from "@/shared/api/graphql/graphql/metadata/gateway";
import { useModelSingleQuery } from "@/shared/api/graphql/graphql/queries/hooks/useModelSingleQuery";
import { useModelDeleteMutation } from "@/shared/api/graphql/graphql/mutations/hooks/useModelDeleteMutation";
import type {
  FieldMetadata,
  ModelMetadata,
  MutationInputField,
  MutationMetadata,
  RelationshipMetadata,
  TemplateInfo,
} from "@/shared/api/graphql/graphql/metadata/types";
import type { ModelQuerySelectionTree } from "@/shared/api/graphql/graphql/queries/types";
import { ModelForm } from "@/widgets/model-form";
import {
  getValueByPath,
  normalizeObjectPath,
} from "@/widgets/model-form/utils/objectPath";
import type {
  FormActionsConfig,
  FormFieldConfig,
  FormSchema,
} from "@/widgets/model-form/inputs/types";
import {
  ActionDialog,
  PrintDialog,
} from "@/widgets/model-table/components/ModelTableOverlays";
import {
  buildTemplateClientSchema,
  executeTemplateForRows,
  parseTemplateClientFields,
} from "@/widgets/model-table/utils/templateExecution";
import { normalizeMutationType } from "@/widgets/model-table/utils/schemaHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/kit/alert-dialog";
import { Button } from "@/shared/ui/kit/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  CustomMutationsDropdown,
} from "@/widgets/components/CustomMutationsDropdown";
import { ModelTemplatesDropdown } from "@/widgets/components/ModelTemplatesDropdown";
import DynamicDetail from "../DynamicDetail";
import { createCustomSection } from "../builtInSections";
import type {
  DetailsPageSchema,
  SectionDefinition,
  SectionRuntimeCtx,
} from "../sectionTypes";
import type { SectionAction } from "../sectionTypes";
import { hasRequiredPermissions } from "../sectionTypes";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import SectionEmptyState from "../states/SectionEmptyState";
import SectionErrorState from "../states/SectionErrorState";
import SectionSkeleton from "../states/SectionSkeleton";
import TableDetail from "./TableDetail";
import type {
  ModelDynamicDetailActionContext,
  ModelDynamicDetailActionsConfig,
  ModelDynamicDetailHeaderActionConfig,
  ModelDynamicDetailHeaderActionRenderProps,
  ModelDynamicDetailConfig,
  ModelDynamicDetailFieldConfig,
  ModelDynamicDetailFieldRenderContext,
  ModelDynamicDetailHandle,
  ModelDynamicDetailNestedConfig,
  ModelDynamicDetailProps,
  ModelDynamicDetailSectionContainerSpan,
  ModelDynamicDetailSnapshot,
  ModelDynamicDetailTabConfig,
} from "../config/types";
import { IconInfoCircle } from "@tabler/icons-react";
import { useDetailMetadata } from "@/widgets/model-details/hooks/useDetailMetadata";

interface SelectionTreeNode {
  [key: string]: true | SelectionTreeNode;
}

type RowPermissionSnapshot = {
  canUpdate?: boolean | null;
  canDelete?: boolean | null;
  updateReason?: string | null;
  deleteReason?: string | null;
};

type MutationActionMode = "confirm" | "form";

type MutationActionEntry = {
  mutation: MutationMetadata;
  mode: MutationActionMode;
  label: string;
  disabled: boolean;
  disabledReason?: string;
  schema?: FormSchema | null;
  defaults?: Record<string, unknown>;
};

type ResolvedFieldConfig<
  TRecord extends object = Record<string, unknown>,
> = ModelDynamicDetailFieldConfig<TRecord> & {
  path: string;
};

type ResolvedLayoutSection<
  TRecord extends object = Record<string, unknown>,
> = {
  id: string;
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  containerSpan?: ModelDynamicDetailSectionContainerSpan;
  rows: Array<{
    id: string;
    columns: number;
    fields: ResolvedFieldConfig<TRecord>[];
  }>;
};

type ResolvedNestedField = ResolvedFieldConfig & {
  absolutePath: string;
  sectionId: string;
};

type ResolvedNestedSection = {
  sectionId: string;
  tabId: string;
  path: string;
  relation: RelationshipMetadata;
  config: ModelDynamicDetailNestedConfig;
  mode: "table" | "object";
  sortOrder: number;
  fields: ResolvedNestedField[];
  relatedMetadata: ModelMetadata | null;
};

type MutationResponsePayload = {
  ok?: boolean;
  errors?: Array<{ message?: string }>;
};

type ResolvedLayoutTab = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  order: number;
  loadingStrategy?: ModelDynamicDetailTabConfig["loadingStrategy"];
  permissions?: string[];
};

type ResolvedHeaderActionEntry<
  TRecord extends object = Record<string, unknown>,
> = {
  position: number;
  render: ModelDynamicDetailHeaderActionConfig<TRecord>["render"];
};

type FormSubmitOutcome = NonNullable<
  FormActionsConfig<Record<string, unknown>>["submitOutcome"]
>;
type FormActionsExtraRenderer = Extract<
  NonNullable<FormActionsConfig<Record<string, unknown>>["extra"]>,
  (...args: any[]) => React.ReactNode
>;
type FormActionsExtraContext = Parameters<FormActionsExtraRenderer>[0];

type UpdateSubmitRefetchProbeProps = {
  enabled: boolean;
  isSubmitting: boolean;
  submitOutcome?: FormSubmitOutcome | null;
  onRefresh: () => Promise<unknown>;
};

/**
 * Triggers one detail refresh after each successful update submit cycle.
 */
function UpdateSubmitRefetchProbe({
  enabled,
  isSubmitting,
  submitOutcome,
  onRefresh,
}: UpdateSubmitRefetchProbeProps): null {
  const wasSubmittingRef = React.useRef(false);

  React.useEffect(() => {
    const didFinishSubmitting = wasSubmittingRef.current && !isSubmitting;
    if (enabled && didFinishSubmitting && submitOutcome?.ok) {
      void onRefresh();
    }
    wasSubmittingRef.current = isSubmitting;
  }, [enabled, isSubmitting, onRefresh, submitOutcome?.ok]);

  return null;
}

/**
 * Merges model-form layout sources while ignoring undefined override values.
 * This keeps `formProps.layout` values (for example `variant: "popup"`)
 * when top-level `layout` is present but only partially defined.
 */
function mergeModelFormLayoutConfig(
  formPropsLayout: unknown,
  directLayout: unknown,
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};

  if (isRecord(formPropsLayout)) {
    Object.entries(formPropsLayout).forEach(([key, value]) => {
      if (value !== undefined) {
        merged[key] = value;
      }
    });
  }

  if (isRecord(directLayout)) {
    Object.entries(directLayout).forEach(([key, value]) => {
      if (value !== undefined) {
        merged[key] = value;
      }
    });
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

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

function parseDefaultValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(?:\.\d+)?$/.test(trimmed) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizePath(path: string | null | undefined): string {
  return normalizeObjectPath(path ?? "");
}

function normalizeColumns(value: number | undefined, fallback: number): number {
  const candidate = Number.isFinite(value) ? Number(value) : fallback;
  return Math.max(1, Math.min(Math.floor(candidate), 6));
}

function normalizeOrder(value: number | undefined, fallback: number): number {
  if (Number.isFinite(value)) return Number(value);
  return fallback;
}

/**
 * Normalizes a tab identifier and returns an empty string when invalid.
 */
function normalizeTabId(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Emits development-only warnings for non-fatal configuration issues.
 */
function warnDev(message: string): void {
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn(message);
  }
}

/**
 * Resolves tab definitions from layout config and current render context.
 */
function resolveLayoutTabs<TRecord extends object>(options: {
  tabs: ModelDynamicDetailTabConfig<TRecord>[] | undefined;
  app: string;
  model: string;
  id: string;
  data: TRecord | null;
  metadata: ModelMetadata | null;
}): ResolvedLayoutTab[] {
  const { tabs, app, model, id, data, metadata } = options;
  if (!Array.isArray(tabs) || tabs.length === 0) return [];

  const renderCtx = { app, model, id, data, metadata };
  const seen = new Set<string>();

  return tabs
    .map((tab, index) => {
      const tabId = normalizeTabId(tab.id);
      if (!tabId) {
        warnDev("[ModelDynamicDetail] Ignoring tab with empty id.");
        return null;
      }
      if (seen.has(tabId)) {
        warnDev(`[ModelDynamicDetail] Duplicate tab id \"${tabId}\" ignored.`);
        return null;
      }
      if (tab.visible && !tab.visible(renderCtx)) {
        return null;
      }
      seen.add(tabId);
      return {
        id: tabId,
        title: tab.title,
        icon: tab.icon,
        order: normalizeOrder(tab.order, index),
        loadingStrategy: tab.loadingStrategy,
        permissions: tab.permissions,
      } satisfies ResolvedLayoutTab;
    })
    .filter(Boolean)
    .map((entry) => entry as ResolvedLayoutTab)
    .sort((left, right) => left.order - right.order);
}

function resolveNestedSectionId(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function resolveGridClasses(columns: number): string {
  const normalized = normalizeColumns(columns, 2);
  const classes = ["grid grid-cols-1 gap-x-8 gap-y-5"];
  if (normalized >= 2) classes.push("sm:grid-cols-2");
  if (normalized >= 3) classes.push("md:grid-cols-3");
  if (normalized >= 4) classes.push("lg:grid-cols-4");
  if (normalized >= 5) classes.push("xl:grid-cols-5");
  if (normalized >= 6) classes.push("2xl:grid-cols-6");
  return classes.join(" ");
}

const BASE_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
};

const SM_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
};

const MD_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
};

const LG_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
};

const XL_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
};

const XXL_COL_SPAN_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "2xl:col-span-1",
  2: "2xl:col-span-2",
  3: "2xl:col-span-3",
  4: "2xl:col-span-4",
  5: "2xl:col-span-5",
  6: "2xl:col-span-6",
};

/**
 * Builds Tailwind `col-span` classes from responsive container span settings.
 */
function resolveSectionContainerSpanClassName(
  span: ModelDynamicDetailSectionContainerSpan | undefined,
): string | undefined {
  if (!span) return undefined;

  const classes = [
    span.base ? BASE_COL_SPAN_CLASS[span.base] : undefined,
    span.sm ? SM_COL_SPAN_CLASS[span.sm] : undefined,
    span.md ? MD_COL_SPAN_CLASS[span.md] : undefined,
    span.lg ? LG_COL_SPAN_CLASS[span.lg] : undefined,
    span.xl ? XL_COL_SPAN_CLASS[span.xl] : undefined,
    span.xxl ? XXL_COL_SPAN_CLASS[span.xxl] : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  if (classes.length === 0) return undefined;
  return classes.join(" ");
}

function toGraphqlPath(path: string): string {
  return normalizePath(path)
    .split(".")
    .map((segment) => toGraphqlFieldName(segment))
    .filter(Boolean)
    .join(".");
}

function ensureSelectionNode(
  tree: SelectionTreeNode,
  key: string,
): SelectionTreeNode {
  if (!tree[key] || tree[key] === true) {
    tree[key] = {};
  }
  return tree[key] as SelectionTreeNode;
}

function addSelectionPath(tree: SelectionTreeNode, path: string): void {
  const parts = normalizePath(path).split(".").filter(Boolean);
  if (!parts.length) return;

  let cursor = tree;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = true;
      return;
    }
    cursor = ensureSelectionNode(cursor, part);
  });
}

function mergeSelectionTree(
  target: SelectionTreeNode,
  source: ModelQuerySelectionTree,
  prefix?: string,
): void {
  Object.entries(source ?? {}).forEach(([key, value]) => {
    const token = toGraphqlFieldName(String(key));
    if (!token) return;
    const nextPrefix = prefix ? `${prefix}.${token}` : token;

    if (value === true) {
      addSelectionPath(target, nextPrefix);
      return;
    }

    addSelectionPath(target, nextPrefix);
    mergeSelectionTree(target, value, nextPrefix);
  });
}

function serializeSelectionTree(tree: SelectionTreeNode, indent = 0): string {
  const prefix = " ".repeat(indent);
  return Object.keys(tree)
    .sort()
    .map((key) => {
      const child = tree[key];
      if (child === true) {
        return `${prefix}${key}`;
      }
      const nested = serializeSelectionTree(
        child as SelectionTreeNode,
        indent + 2,
      );
      return `${prefix}${key} {\n${nested}\n${prefix}}`;
    })
    .join("\n");
}

function humanizeLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();

  if (!withSpaces) return value;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function resolveFormFieldType(
  field: MutationInputField,
): FormSchema["fields"][number]["type"] {
  const normalized = String(
    field.graphqlType || field.fieldType || "",
  ).toLowerCase();
  if (field.choices && field.choices.length > 0) return "select";
  if (normalized.includes("bool")) return "checkbox";
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("number")
  ) {
    return "number";
  }
  if (normalized.includes("datetime")) return "datetime-local";
  if (normalized.includes("date")) return "date";
  if (normalized.includes("time")) return "time";
  if (normalized.includes("json")) return "json";
  return "text";
}

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
      const name = toGraphqlFieldName(rawName) || rawName;

      const rawChoices = Array.isArray(field.choices) ? field.choices : [];
      const choices = rawChoices
        .map((choice) => {
          if (!isRecord(choice)) return null;
          if (choice.value === undefined || choice.value === null) return null;
          return {
            value: String(choice.value),
            label: String(choice.label ?? choice.value),
          };
        })
        .filter((choice): choice is { value: string; label: string } =>
          Boolean(choice),
        );

      return {
        ...field,
        name,
        fieldName: name,
        choices,
        required: Boolean(field.required),
      };
    });
}

function buildMutationSchema(fields: MutationInputField[]): FormSchema | null {
  if (!fields.length) return null;

  return {
    fields: fields.map(
      (field) =>
        ({
          name: field.name || "",
          label: humanizeLabel(field.name || field.fieldName || "Field"),
          type: resolveFormFieldType(field),
          required: Boolean(field.required),
          description: field.description || undefined,
          choices: (field.choices ?? []).map((choice) => ({
            value: String(choice.value),
            label: String(choice.label),
          })),
        }) as unknown as FormFieldConfig,
    ),
  };
}

function buildMutationDefaults(
  fields: MutationInputField[],
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const key = field.name || field.fieldName;
    if (!key) return acc;
    if (field.defaultValue === undefined) return acc;
    acc[key] = parseDefaultValue(field.defaultValue);
    return acc;
  }, {});
}

function resolveMutationActionMode(
  mutation: MutationMetadata,
  inputFields: MutationInputField[],
): MutationActionMode {
  const actionPayload = parseJsonObject(mutation.action);
  const declared = String(actionPayload?.mode ?? "").toLowerCase();

  if (declared === "confirm") return "confirm";
  if (declared === "form") return inputFields.length > 0 ? "form" : "confirm";
  return inputFields.length > 0 ? "form" : "confirm";
}

function buildMutationOperationNames(
  mutation: MutationMetadata,
  modelName: string,
): string[] {
  const candidates = new Set<string>();

  if (mutation.name) {
    candidates.add(String(mutation.name));
  }

  const methodToken = mutation.methodName
    ? toGraphqlFieldName(mutation.methodName)
    : "";
  if (methodToken) {
    candidates.add(`${methodToken}${mutation.modelName || modelName}`);
  }

  return [...candidates].filter(Boolean);
}

function buildMutationLabel(mutation: MutationMetadata): string {
  const actionPayload = parseJsonObject(mutation.action);

  const buttonTitle = actionPayload?.button_title ?? actionPayload?.buttonTitle;
  if (typeof buttonTitle === "string" && buttonTitle.trim()) {
    return buttonTitle.trim();
  }

  const title = actionPayload?.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return humanizeLabel(mutation.methodName || mutation.name || "Action");
}

function normalizeGraphqlType(
  rawType: string | undefined,
  required: boolean,
): string {
  const base = String(rawType || "String")
    .replace(/\s+/g, "")
    .replace(/!$/, "");
  if (!base) {
    return required ? "String!" : "String";
  }
  return required ? `${base}!` : base;
}

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
      const variableName = field.name || field.fieldName;
      if (!variableName) return;
      const variableType = normalizeGraphqlType(
        String(field.graphqlType || field.fieldType || "String"),
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

function extractGraphqlErrors(payload: unknown): Array<{ message?: string }> {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((entry): entry is { message?: string } => isRecord(entry))
    .map((entry) => ({
      message: typeof entry.message === "string" ? entry.message : undefined,
    }));
}

function pickResponsePayload(rawData: unknown): MutationResponsePayload | null {
  if (!isRecord(rawData)) return null;

  const direct = rawData.response;
  if (isRecord(direct)) {
    return direct as MutationResponsePayload;
  }

  for (const value of Object.values(rawData)) {
    if (!isRecord(value)) continue;
    if (Object.prototype.hasOwnProperty.call(value, "ok")) {
      return value as MutationResponsePayload;
    }
  }

  return null;
}
function resolveFieldLookup(
  metadata: ModelMetadata | null | undefined,
): Map<string, FieldMetadata> {
  const lookup = new Map<string, FieldMetadata>();
  if (!metadata?.fields) return lookup;

  metadata.fields.forEach((field) => {
    const baseName = toGraphqlFieldName(field.name || field.fieldName || "");
    const fieldName = field.fieldName
      ? toGraphqlFieldName(field.fieldName)
      : "";

    [field.name, field.fieldName, baseName, fieldName]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .forEach((entry) => {
        lookup.set(entry, field);
      });
  });

  return lookup;
}

function resolveRelationshipLookup(
  metadata: ModelMetadata | null | undefined,
): Map<string, RelationshipMetadata> {
  const lookup = new Map<string, RelationshipMetadata>();
  if (!metadata?.relationships) return lookup;

  metadata.relationships.forEach((relation) => {
    const baseName = toGraphqlFieldName(
      relation.name || relation.fieldName || "",
    );
    const fieldName = relation.fieldName
      ? toGraphqlFieldName(relation.fieldName)
      : "";

    [relation.name, relation.fieldName, baseName, fieldName]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .forEach((entry) => {
        lookup.set(entry, relation);
      });
  });

  return lookup;
}

function resolveDefaultRelationSelection(
  relation: RelationshipMetadata,
): string[] {
  const defaults = new Set<string>(["id", "desc"]);
  const rawLookup = String(relation.lookupField || "").trim();
  const loweredLookup = rawLookup.toLowerCase();
  const shouldIgnoreLookup =
    !rawLookup ||
    rawLookup.startsWith("__") ||
    loweredLookup === "__str__" ||
    loweredLookup === "__unicode__" ||
    loweredLookup === "id" ||
    loweredLookup === "desc" ||
    loweredLookup === "str";

  if (!shouldIgnoreLookup) {
    const lookup = toGraphqlFieldName(rawLookup);
    const isSafeToken = Boolean(lookup) && !lookup.startsWith("_");
    if (
      isSafeToken &&
      lookup !== "id" &&
      lookup !== "desc" &&
      lookup !== "str"
    ) {
      defaults.add(lookup);
    }
  }
  return [...defaults];
}

function toPermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Returns true when runtime exposes a local permission source.
 */
function hasRuntimePermissionSource(runtime: SectionRuntimeCtx): boolean {
  if (typeof runtime.can === "function") return true;
  return runtime.permissions !== undefined;
}

function resolveRuntimeCan(
  permissionKeys: string[],
  runtime: SectionRuntimeCtx,
): boolean {
  if (!permissionKeys.length) return true;
  if (!hasRuntimePermissionSource(runtime)) return true;
  return hasRequiredPermissions(permissionKeys, runtime);
}
function inferFieldKind(
  fieldMeta: FieldMetadata | undefined,
  value: unknown,
): UnitFieldInput["kind"] {
  if (fieldMeta?.isBoolean) return "boolean";
  if (fieldMeta?.isDatetime) return "datetime";
  if (fieldMeta?.isDate) return "date";
  if (fieldMeta?.isJson) return "json";
  if (fieldMeta?.isNumeric) return "number";
  if (fieldMeta?.isPrimaryKey) return "id";

  if (isRecord(value)) {
    if (Object.prototype.hasOwnProperty.call(value, "name")) return "entityRef";
    if (Object.prototype.hasOwnProperty.call(value, "desc")) return "entityRef";
    if (Object.prototype.hasOwnProperty.call(value, "id")) return "entityRef";
    return "json";
  }

  if (Array.isArray(value)) {
    return "json";
  }

  return "text";
}

function normalizeFieldConfig<TRecord extends object>(
  entry: string | ModelDynamicDetailFieldConfig<TRecord>,
  options?: {
    pathPrefix?: string;
    fieldOverrides?: Record<
      string,
      Omit<ModelDynamicDetailFieldConfig<TRecord>, "path">
    >;
    keepRelative?: boolean;
  },
): ResolvedFieldConfig<TRecord> {
  const rawPath = typeof entry === "string" ? entry : entry.path;
  const normalized = normalizePath(rawPath);
  const normalizedGraphql =
    options?.keepRelative === true ? normalized : toGraphqlPath(normalized);
  const pathPrefix = options?.pathPrefix
    ? normalizePath(options.pathPrefix)
    : "";

  const path =
    pathPrefix && !normalizedGraphql.startsWith(`${pathPrefix}.`)
      ? `${pathPrefix}.${normalizedGraphql}`
      : normalizedGraphql;
  const typedPath = path as ModelDynamicDetailFieldConfig<TRecord>["path"];

  const payload: ModelDynamicDetailFieldConfig<TRecord> =
    typeof entry === "string" ? { path: typedPath } : { ...entry, path: typedPath };

  const override = options?.fieldOverrides?.[path];
  if (!override) {
    return payload as ResolvedFieldConfig<TRecord>;
  }

  return {
    ...payload,
    ...override,
    path: typedPath,
  } as ResolvedFieldConfig<TRecord>;
}

function resolveBaseFieldPaths<TRecord extends object>(
  metadata: ModelMetadata | null,
  layout: ModelDynamicDetailConfig<TRecord>["layout"],
  nestedFields: Record<string, ModelDynamicDetailNestedConfig>,
  bootstrapDefaultIncludeFields?: string[],
): string[] {
  const excluded = new Set(
    (layout?.excludeFields ?? []).map((entry) => toGraphqlPath(entry)),
  );

  const relationLookup = resolveRelationshipLookup(metadata);
  const nestedRoots = new Set(
    Object.keys(nestedFields).map(
      (entry) => toGraphqlPath(entry).split(".")[0],
    ),
  );

  const requested = (layout?.includeFields ?? []).map((entry) =>
    toGraphqlPath(entry),
  );
  if (requested.length > 0) {
    return requested.filter((entry) => Boolean(entry) && !excluded.has(entry));
  }

  const bootstrapDefaults = (bootstrapDefaultIncludeFields ?? [])
    .map((entry) => toGraphqlPath(entry))
    .filter(Boolean);
  if (bootstrapDefaults.length > 0) {
    return bootstrapDefaults.filter((entry) => !excluded.has(entry));
  }

  const defaults: string[] = [];
  (metadata?.fields ?? []).forEach((field) => {
    if (field.readable === false || field.visibility === "hidden") return;
    const token = toGraphqlPath(field.name || field.fieldName || "");
    if (!token) return;

    const relation = relationLookup.get(token);
    if (relation?.isToMany && nestedRoots.has(token)) {
      return;
    }

    defaults.push(token);
  });

  return defaults.filter((entry) => !excluded.has(entry));
}

function resolveRelativePathFromAbsolute(path: string, root: string): string {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root);
  if (normalizedPath === normalizedRoot) return "";
  if (!normalizedPath.startsWith(`${normalizedRoot}.`)) return normalizedPath;
  return normalizedPath.slice(normalizedRoot.length + 1);
}

function resolveNestedFieldConfigs(options: {
  sectionId: string;
  relationPath: string;
  config: ModelDynamicDetailNestedConfig;
  relatedMetadata: ModelMetadata | null;
  data: Record<string, unknown> | null;
}): ResolvedNestedField[] {
  const { sectionId, relationPath, config, relatedMetadata, data } = options;
  const relationValue = getValueByPath<unknown>(data ?? {}, relationPath);

  const fromConfig = config.fields ?? [];
  if (fromConfig.length > 0) {
    return fromConfig
      .map((entry, index) => {
        const normalized = normalizeFieldConfig(entry, { keepRelative: true });
        const relative = resolveRelativePathFromAbsolute(
          normalized.path,
          relationPath,
        );
        const absolutePath = relative
          ? `${relationPath}.${relative}`
          : relationPath;
        return {
          ...normalized,
          sectionId: resolveNestedSectionId(normalized.sectionId, sectionId),
          path: relative || "id",
          absolutePath,
          order: normalizeOrder(normalized.order, index),
        };
      })
      .sort(
        (left, right) =>
          normalizeOrder(left.order, Number.MAX_SAFE_INTEGER) -
          normalizeOrder(right.order, Number.MAX_SAFE_INTEGER),
      );
  }

  const defaultFieldsFromMetadata = (relatedMetadata?.fields ?? [])
    .filter(
      (field) => field.readable !== false && field.visibility !== "hidden",
    )
    .map((field) => toGraphqlPath(field.name || field.fieldName || ""))
    .filter(Boolean);

  if (defaultFieldsFromMetadata.length > 0) {
    return defaultFieldsFromMetadata.map((path) => ({
      path,
      absolutePath: `${relationPath}.${path}`,
      sectionId,
    }));
  }

  const sampleRow = Array.isArray(relationValue)
    ? relationValue.find((entry) => isRecord(entry))
    : isRecord(relationValue)
      ? relationValue
      : null;

  if (sampleRow && isRecord(sampleRow)) {
    return Object.keys(sampleRow)
      .map((key) => toGraphqlPath(key))
      .filter(Boolean)
      .map((path) => ({
        path,
        absolutePath: `${relationPath}.${path}`,
        sectionId,
      }));
  }

  return [
    { path: "id", absolutePath: `${relationPath}.id`, sectionId },
    { path: "desc", absolutePath: `${relationPath}.desc`, sectionId },
  ];
}

function resolveRowPermissions<TRecord extends object>(
  data: TRecord | null,
): RowPermissionSnapshot {
  const value = (data as Record<string, unknown> | null)?.rowPermissions;
  if (!isRecord(value)) {
    return {};
  }

  return {
    canUpdate:
      typeof value.canUpdate === "boolean"
        ? value.canUpdate
        : (value.canUpdate as boolean | null | undefined),
    canDelete:
      typeof value.canDelete === "boolean"
        ? value.canDelete
        : (value.canDelete as boolean | null | undefined),
    updateReason:
      typeof value.updateReason === "string" ? value.updateReason : null,
    deleteReason:
      typeof value.deleteReason === "string" ? value.deleteReason : null,
  };
}

function evaluateOverrideBoolean<TRecord extends object>(
  source:
    | boolean
    | ((ctx: ModelDynamicDetailActionContext<TRecord>) => boolean)
    | undefined,
  fallback: boolean,
  ctx: ModelDynamicDetailActionContext<TRecord>,
): boolean {
  if (typeof source === "boolean") return source;
  if (typeof source === "function") {
    return Boolean(source(ctx));
  }
  return fallback;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function buildSelectionInput(options: {
  basePaths: string[];
  relationLookup: Map<string, RelationshipMetadata>;
  nestedSections: ResolvedNestedSection[];
}): string | ModelQuerySelectionTree {
  const { basePaths, relationLookup, nestedSections } = options;
  const tree: SelectionTreeNode = {};
  const manualBlocks: string[] = [];

  const ensureRelationDefaults = (root: string) => {
    const relation = relationLookup.get(root);
    if (!relation) return;
    resolveDefaultRelationSelection(relation).forEach((nested) => {
      addSelectionPath(tree, `${root}.${nested}`);
    });
  };

  basePaths.forEach((entry) => {
    const path = toGraphqlPath(entry);
    if (!path) return;
    const [root] = path.split(".");
    if (relationLookup.has(root) && !path.includes(".")) {
      ensureRelationDefaults(root);
      return;
    }
    if (path.includes(".")) {
      ensureRelationDefaults(root);
    }
    addSelectionPath(tree, path);
  });

  nestedSections.forEach((section) => {
    const relationRoot = section.path.split(".")[0];
    ensureRelationDefaults(relationRoot);

    if (
      section.config.selection &&
      typeof section.config.selection === "string"
    ) {
      const blockBody = section.config.selection.trim();
      if (blockBody) {
        manualBlocks.push(`${section.path} {\n${blockBody}\n}`);
      }
      return;
    }

    if (section.config.selection && isRecord(section.config.selection)) {
      const localTree = section.config.selection as ModelQuerySelectionTree;
      mergeSelectionTree(tree, localTree, section.path);
      return;
    }

    section.fields.forEach((field) => {
      addSelectionPath(tree, field.absolutePath);
    });
  });

  if (!Object.keys(tree).length) {
    addSelectionPath(tree, "id");
  }

  if (manualBlocks.length === 0) {
    return tree as ModelQuerySelectionTree;
  }

  const serialized = serializeSelectionTree(tree);
  return [
    serialized,
    ...manualBlocks,
    "rowPermissions { canUpdate canDelete updateReason deleteReason }",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLayoutSections<TRecord extends object>(options: {
  metadata: ModelMetadata | null;
  config: ModelDynamicDetailConfig<TRecord>;
  data: TRecord | null;
  app: string;
  model: string;
  id: string;
  bootstrapDefaultIncludeFields?: string[];
}): ResolvedLayoutSection<TRecord>[] {
  const layout = options.config.layout;
  const fieldOverrides = layout?.fieldOverrides ?? {};
  const defaultColumns = normalizeColumns(layout?.defaultColumns, 2);

  const basePaths = resolveBaseFieldPaths(
    options.metadata,
    layout,
    (options.config.nestedFields ?? {}) as Record<
      string,
      ModelDynamicDetailNestedConfig
    >,
    options.bootstrapDefaultIncludeFields,
  );
  const baseFields = basePaths.map((path) =>
    normalizeFieldConfig<TRecord>(path, { fieldOverrides }),
  );

  const renderCtx = {
    app: options.app,
    model: options.model,
    id: options.id,
    data: options.data,
    metadata: options.metadata,
  };

  const assigned = new Set<string>();

  const normalizedSections = (layout?.sections ?? [])
    .filter((section) => (section.visible ? section.visible(renderCtx) : true))
    .map<ResolvedLayoutSection<TRecord>>((section, sectionIndex) => {
      const rows = (section.rows ?? []).map((row, rowIndex) => ({
        id: row.id ?? `${section.id}:row:${rowIndex}`,
        columns: normalizeColumns(
          row.columns ?? section.columns,
          defaultColumns,
        ),
        fields: row.fields
          .map((entry) => normalizeFieldConfig<TRecord>(entry, { fieldOverrides }))
          .filter((entry) => !entry.hidden),
      }));

      if (!rows.length && section.fields?.length) {
        rows.push({
          id: `${section.id}:row:0`,
          columns: normalizeColumns(section.columns, defaultColumns),
          fields: section.fields
            .map((entry) => normalizeFieldConfig<TRecord>(entry, { fieldOverrides }))
            .filter((entry) => !entry.hidden),
        });
      }

      rows.forEach((row) => {
        row.fields.forEach((field) => assigned.add(field.path));
      });

      return {
        id: section.id || `section:${sectionIndex}`,
        tabId: normalizeTabId(section.tabId),
        title: section.title,
        description: section.description,
        order: section.order,
        containerSpan: section.containerSpan,
        rows,
      };
    })
    .filter((section) => section.rows.length > 0);

  if (layout?.includeUnassignedFields !== false) {
    const leftovers = baseFields.filter((field) => !assigned.has(field.path));
    if (leftovers.length > 0) {
      const rows: ResolvedLayoutSection<TRecord>["rows"] = [];
      for (let index = 0; index < leftovers.length; index += defaultColumns) {
        rows.push({
          id: `section:auto:${index}`,
          columns: defaultColumns,
          fields: leftovers.slice(index, index + defaultColumns),
        });
      }

      normalizedSections.push({
        id: "base-detail:auto",
        title: "Details",
        order: 999,
        rows,
      });
    }
  }

  return normalizedSections.sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0),
  );
}
function renderFieldValue<TRecord extends object>(options: {
  field: ResolvedFieldConfig<TRecord>;
  record: TRecord;
  sectionId: string;
  metadata: ModelMetadata | null;
  nestedMetadataByRelation: Record<string, ModelMetadata | null>;
}): React.ReactNode {
  const { field, record, sectionId, metadata, nestedMetadataByRelation } =
    options;
  const path = normalizePath(field.path);
  const value = getValueByPath(record as Record<string, unknown>, path);

  if (typeof field.render === "function") {
    const ctx: ModelDynamicDetailFieldRenderContext<TRecord> = {
      value,
      record,
      path: path as ModelDynamicDetailFieldRenderContext<TRecord>["path"],
      field,
      sectionId,
    };
    return field.render(ctx);
  }

  const [root, child] = path.split(".");
  const rootFieldLookup = resolveFieldLookup(metadata);
  const rootFieldMeta = rootFieldLookup.get(root);
  const nestedFieldMeta = child
    ? resolveFieldLookup(nestedMetadataByRelation[root] ?? null).get(child)
    : undefined;
  const fieldMeta = nestedFieldMeta ?? rootFieldMeta;

  const label =
    field.label ??
    fieldMeta?.verboseName ??
    humanizeLabel(path.split(".").slice(-1)[0] ?? path);

  const unitField: UnitFieldInput = {
    id: path,
    label,
    value,
    kind: field.kind ?? inferFieldKind(fieldMeta, value),
    hint: field.description ?? fieldMeta?.helpText,
    emptyText: field.emptyText ?? "-",
    format: field.format,
    copyable: field.copyable,
    copyValue: field.copyValue,
    hidden: field.hidden,
  };

  return <UnitFieldRenderer field={unitField} />;
}

type ModelDynamicDetailComponent = <
  TRecord extends object = Record<string, unknown>,
>(
  props: ModelDynamicDetailProps<TRecord> &
    React.RefAttributes<ModelDynamicDetailHandle<TRecord>>,
) => React.ReactElement | null;

const ModelDynamicDetailInner = <
  TRecord extends object = Record<string, unknown>,
>(
  props: ModelDynamicDetailProps<TRecord>,
  ref: React.ForwardedRef<ModelDynamicDetailHandle<TRecord>>,
) => {
  const { app, model, id, baseDetail } = props;
  const config: ModelDynamicDetailConfig<TRecord> = baseDetail ?? {};
  const nestedConfig = config.nestedFields ?? {};
  const looseNestedConfig = nestedConfig as Record<
    string,
    ModelDynamicDetailNestedConfig
  >;
  const actionsConfig: ModelDynamicDetailActionsConfig<TRecord> =
    config.actions ?? {};
  const idAsString = String(id);
  const apolloClient = useApolloClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const [printTemplate, setPrintTemplate] = React.useState<TemplateInfo | null>(
    null,
  );
  const [printTemplateSchema, setPrintTemplateSchema] =
    React.useState<FormSchema | null>(null);
  const [activeMutationAction, setActiveMutationAction] =
    React.useState<MutationActionEntry | null>(null);
  const [mutationDialogOpen, setMutationDialogOpen] = React.useState(false);
  const [executingMutationAction, setExecutingMutationAction] =
    React.useState(false);

  const [nestedMetadataByRelation, setNestedMetadataByRelation] =
    React.useState<Record<string, ModelMetadata | null>>({});
  const supportsSharedActionQueries =
    typeof (apolloClient as { watchQuery?: unknown } | null)?.watchQuery ===
    "function";

  const metadataState = useDetailMetadata(app, model, idAsString, {
    fetchPolicy: config.queryOptions?.fetchPolicy,
    errorPolicy: config.queryOptions?.errorPolicy,
  });

  const relationLookup = React.useMemo(
    () => resolveRelationshipLookup(metadataState.metadata),
    [metadataState.metadata],
  );

  const resolvedNestedSections = React.useMemo<ResolvedNestedSection[]>(() => {
    return Object.entries(looseNestedConfig)
      .map(([rawPath, nested], index) => {
        const path = toGraphqlPath(rawPath);
        const relation = relationLookup.get(path);
        if (!relation) return null;
        const sectionId = resolveNestedSectionId(
          nested.sectionId,
          `nested:${path}`,
        );

        const mode =
          nested.mode && nested.mode !== "auto"
            ? nested.mode
            : relation.isToMany
              ? "table"
              : "object";

        const fields = resolveNestedFieldConfigs({
          sectionId,
          relationPath: path,
          config: nested,
          relatedMetadata: nestedMetadataByRelation[path] ?? null,
          data: null,
        });

        return {
          sectionId,
          tabId: normalizeTabId(nested.tabId),
          path,
          relation,
          config: nested,
          mode,
          sortOrder: normalizeOrder(nested.order, index),
          fields,
          relatedMetadata: nestedMetadataByRelation[path] ?? null,
        } satisfies ResolvedNestedSection;
      })
      .filter((entry): entry is ResolvedNestedSection => Boolean(entry))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }, [looseNestedConfig, relationLookup, nestedMetadataByRelation]);

  React.useEffect(() => {
    if (!metadataState.metadata) return;
    if (Object.keys(looseNestedConfig).length === 0) {
      setNestedMetadataByRelation((previous) =>
        Object.keys(previous).length === 0 ? previous : {},
      );
      return;
    }

    let active = true;

    void Promise.all(
      Object.entries(looseNestedConfig).map(async ([rawPath]) => {
        const relationPath = toGraphqlPath(rawPath);
        const relation = relationLookup.get(relationPath);
        if (!relation) {
          return [relationPath, null] as const;
        }

        const snapshot = await fetchMetadataSnapshot(
          apolloClient,
          {
            app: relation.relatedApp,
            model: relation.relatedModel,
            profile: "table",
          },
          { forceNetwork: false },
        ).catch(() => null);

        return [relationPath, snapshot] as const;
      }),
    ).then((entries) => {
      if (!active) return;
      setNestedMetadataByRelation((previous) => {
        if (entries.length === 0) return previous;

        let changed = false;
        const next = { ...previous };
        entries.forEach(([path, value]) => {
          if (next[path] !== value) {
            next[path] = value;
            changed = true;
          }
        });
        return changed ? next : previous;
      });
    });

    return () => {
      active = false;
    };
  }, [apolloClient, metadataState.metadata, looseNestedConfig, relationLookup]);

  const layoutSections = React.useMemo<ResolvedLayoutSection<TRecord>[]>(
    () =>
      buildLayoutSections({
        metadata: metadataState.metadata,
        config,
        data: null,
        app,
        model,
        id: idAsString,
        bootstrapDefaultIncludeFields: metadataState.defaultIncludeFields,
      }),
    [app, config, idAsString, metadataState.defaultIncludeFields, metadataState.metadata, model],
  );

  const baseSelectionPaths = React.useMemo(() => {
    const paths = new Set<string>();

    layoutSections.forEach((section) => {
      section.rows.forEach((row) => {
        row.fields.forEach((field) => {
          paths.add(toGraphqlPath(field.path));
        });
      });
    });

    resolveBaseFieldPaths(
      metadataState.metadata,
      config.layout,
      looseNestedConfig,
      metadataState.defaultIncludeFields,
    ).forEach((path) => {
      paths.add(toGraphqlPath(path));
    });

    return [...paths].filter(Boolean);
  }, [
    config.layout,
    layoutSections,
    metadataState.defaultIncludeFields,
    metadataState.metadata,
    looseNestedConfig,
  ]);

  const selection = React.useMemo(
    () =>
      buildSelectionInput({
        basePaths: baseSelectionPaths,
        relationLookup,
        nestedSections: resolvedNestedSections,
      }),
    [baseSelectionPaths, relationLookup, resolvedNestedSections],
  );

  const queryState = useModelSingleQuery({
    app,
    model,
    id: idAsString,
    metadataOptions: {
      metadata: metadataState.metadata,
      skipMetadata: true,
    },
    selectionOptions: {
      selection,
      includeRowPermissions: true,
    },
    apollo: {
      fetchPolicy: config.queryOptions?.fetchPolicy,
      errorPolicy: config.queryOptions?.errorPolicy,
    },
  });

  const record = React.useMemo(
    () =>
      isRecord(queryState.data)
        ? (queryState.data as TRecord)
        : null,
    [queryState.data],
  );

  const rowPermissions = React.useMemo(
    () => resolveRowPermissions(record),
    [record],
  );
  const hasResolvedRowPermissions = React.useMemo(
    () =>
      typeof rowPermissions.canUpdate === "boolean" ||
      typeof rowPermissions.canDelete === "boolean",
    [rowPermissions.canDelete, rowPermissions.canUpdate],
  );

  const actionContext = React.useMemo<ModelDynamicDetailActionContext<TRecord>>(
    () => ({
      app,
      model,
      id: idAsString,
      data: record,
      metadata: metadataState.metadata,
    }),
    [app, idAsString, metadataState.metadata, model, record],
  );

  const { execute: executeDelete, loading: deleting } = useModelDeleteMutation({
    app,
    model,
    skipModelForm: true,
    apollo: {
      errorPolicy: "all",
    },
  });

  const refetch = React.useCallback(async () => {
    await Promise.all([
      metadataState.refetch().catch(() => null),
      queryState.refetch().catch(() => null),
    ]);
  }, [metadataState, queryState]);

  const snapshot = React.useMemo<ModelDynamicDetailSnapshot<TRecord>>(
    () => ({
      data: record,
      metadata: metadataState.metadata,
      loading: metadataState.loading || queryState.loading,
      error: (queryState.error ?? metadataState.error ?? null) as Error | null,
      deleted,
    }),
    [
      deleted,
      metadataState.error,
      metadataState.loading,
      metadataState.metadata,
      queryState.error,
      queryState.loading,
      record,
    ],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      refetch,
      getSnapshot: () => snapshot,
    }),
    [refetch, snapshot],
  );

  React.useEffect(() => {
    if (metadataState.loading) return;
    metadataState.scheduleActionDetailsPrefetch();
  }, [
    metadataState.loading,
    metadataState.scheduleActionDetailsPrefetch,
  ]);

  const canUpdate = React.useMemo(() => {
    const backendAllowed =
      actionsConfig.showUpdate !== false &&
      Boolean(metadataState.metadata?.permissions?.canUpdate) &&
      hasResolvedRowPermissions &&
      rowPermissions.canUpdate === true;

    return evaluateOverrideBoolean(
      actionsConfig.permissions?.canUpdate,
      backendAllowed,
      actionContext,
    );
  }, [
    actionContext,
    actionsConfig.permissions,
    actionsConfig.showUpdate,
    hasResolvedRowPermissions,
    metadataState.metadata?.permissions?.canUpdate,
    rowPermissions.canUpdate,
  ]);

  const canDelete = React.useMemo(() => {
    const backendAllowed =
      actionsConfig.showDelete !== false &&
      Boolean(metadataState.metadata?.permissions?.canDelete) &&
      hasResolvedRowPermissions &&
      rowPermissions.canDelete === true;

    return evaluateOverrideBoolean(
      actionsConfig.permissions?.canDelete,
      backendAllowed,
      actionContext,
    );
  }, [
    actionContext,
    actionsConfig.permissions,
    actionsConfig.showDelete,
    hasResolvedRowPermissions,
    metadataState.metadata?.permissions?.canDelete,
    rowPermissions.canDelete,
  ]);

  const templateEntries = React.useMemo(
    () =>
      (metadataState.metadata?.templates ?? []).filter((entry) =>
        isRecord(entry),
      ),
    [metadataState.metadata?.templates],
  ) as TemplateInfo[];

  const templateItemOverrides = React.useMemo(() => {
    const entries = templateEntries.flatMap((template) => {
      const overrideAllowed = actionsConfig.permissions?.canRunTemplate
        ? actionsConfig.permissions.canRunTemplate(template, actionContext)
        : true;
      const disabled = template.allowed === false || !overrideAllowed;
      const override = { disabled };
      const keys = [
        template.key,
        template.urlPath,
        String(template.urlPath ?? "")
          .split("/")
          .filter(Boolean)
          .at(-1),
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);

      return keys.map((key) => [key, override] as const);
    });

    return Object.fromEntries(entries);
  }, [actionContext, actionsConfig.permissions, templateEntries]);

  const customMutationEntries = React.useMemo(() => {
    if (actionsConfig.showCustomMutations === false) return [];

    return (metadataState.metadata?.mutations ?? [])
      .filter((mutation) => normalizeMutationType(mutation as any) === "custom")
      .map((mutation) => {
        const fields = normalizeMutationInputFields(mutation);
        const mode = resolveMutationActionMode(mutation, fields);
        const schema = mode === "form" ? buildMutationSchema(fields) : null;
        const defaults = buildMutationDefaults(fields);
        const permissionAllowed =
          mutation.allowed !== false &&
          resolveRuntimeCan(toPermissionList(mutation.requiredPermissions), {
            entityId: idAsString,
            entity: record ?? undefined,
            locale: config.runtime?.locale,
            timezone: config.runtime?.timezone,
            user: config.runtime?.user,
            permissions: config.runtime?.permissions,
            can: config.runtime?.can,
          });

        const overrideAllowed = actionsConfig.permissions?.canRunMutation
          ? actionsConfig.permissions.canRunMutation(mutation, actionContext)
          : true;

        const disabledReason =
          permissionAllowed && overrideAllowed
            ? undefined
            : mutation.reason ||
              "You do not have permission to execute this action.";

        return {
          mutation,
          mode,
          label: buildMutationLabel(mutation),
          disabled: Boolean(disabledReason),
          disabledReason,
          schema,
          defaults,
        };
      });
  }, [
    actionContext,
    actionsConfig.permissions,
    actionsConfig.showCustomMutations,
    config.runtime?.can,
    config.runtime?.locale,
    config.runtime?.permissions,
    config.runtime?.timezone,
    config.runtime?.user,
    idAsString,
    metadataState.metadata?.mutations,
    record,
  ]);

  const customMutationItemOverrides = React.useMemo(() => {
    const entries = customMutationEntries.flatMap((entry) => {
      const override = {
        disabled: entry.disabled,
      };
      const keys = [entry.mutation.methodName, entry.mutation.name]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);

      return keys.map((key) => [key, override] as const);
    });

    return Object.fromEntries(entries);
  }, [customMutationEntries]);

  const updateFormProps = React.useMemo(
    () => actionsConfig.updateForm?.modelFormProps ?? {},
    [actionsConfig.updateForm?.modelFormProps],
  );
  const resolvedUpdateFormActions = React.useMemo(() => {
    const sourceActions = updateFormProps.actions;
    const refetchOnSubmitSuccess =
      actionsConfig.updateForm?.refetchOnSubmitSuccess !== false;

    if (!refetchOnSubmitSuccess) {
      return sourceActions;
    }

    const sourceExtra = sourceActions?.extra;
    return {
      ...(sourceActions ?? {}),
      extra: (ctx: FormActionsExtraContext) => (
        <>
          {typeof sourceExtra === "function" ? sourceExtra(ctx) : sourceExtra}
          <UpdateSubmitRefetchProbe
            enabled
            isSubmitting={ctx.isSubmitting}
            submitOutcome={ctx.submitOutcome}
            onRefresh={refetch}
          />
        </>
      ),
    } as typeof updateFormProps.actions;
  }, [
    actionsConfig.updateForm?.refetchOnSubmitSuccess,
    refetch,
    updateFormProps.actions,
  ]);
  const resolvedUpdateFormLayout = React.useMemo(() => {
    const merged = mergeModelFormLayoutConfig(
      updateFormProps.formProps?.layout,
      updateFormProps.layout,
    );
    const variant = String(merged?.variant ?? "")
      .trim()
      .toLowerCase();
    if (variant) return merged;
    return { ...(merged ?? {}), variant: "popup" };
  }, [updateFormProps.formProps?.layout, updateFormProps.layout]);

  const runTemplate = React.useCallback(
    async (
      template: TemplateInfo,
      clientData: Record<string, unknown> = {},
    ) => {
      await executeTemplateForRows(template as any, [idAsString], clientData);
      toast.success(
        `Template "${template.title || template.key}" generated.`,
      );
    },
    [idAsString],
  );

  const handleTemplateClick = React.useCallback(
    (template: TemplateInfo) => {
      const overrideAllowed = actionsConfig.permissions?.canRunTemplate
        ? actionsConfig.permissions.canRunTemplate(template, actionContext)
        : true;
      const allowed = template.allowed !== false && overrideAllowed;

      if (!allowed) {
        toast.error(
          template.denialReason || "Access denied for this template.",
        );
        return;
      }

      const clientFields = parseTemplateClientFields(template as any);
      if (clientFields.length > 0) {
        setPrintTemplate(template);
        setPrintTemplateSchema(buildTemplateClientSchema(clientFields));
        return;
      }

      void runTemplate(template).catch((error: unknown) => {
        toast.error(getErrorMessage(error, "Template execution failed."));
      });
    },
    [actionContext, actionsConfig.permissions, runTemplate],
  );

  const executeMetadataMutation = React.useCallback(
    async (entry: MutationActionEntry, payload: Record<string, unknown>) => {
      const operationNames = buildMutationOperationNames(entry.mutation, model);
      if (!operationNames.length) {
        throw new Error("Mutation operation could not be resolved.");
      }

      const inputFields = normalizeMutationInputFields(entry.mutation);
      const hasInputPayload = inputFields.length > 0;
      const inputPayload = hasInputPayload ? payload : {};

      const errors: string[] = [];

      for (const operationName of operationNames) {
        const plans =
          hasInputPayload && entry.mutation.inputType ? [true, false] : [false];

        for (const useInputObject of plans) {
          const document = buildMutationDocument({
            operationName,
            inputType: entry.mutation.inputType,
            inputFields,
            useInputObject,
          });

          const variables =
            hasInputPayload && useInputObject
              ? { id: idAsString, input: inputPayload }
              : hasInputPayload
                ? { id: idAsString, ...inputPayload }
                : { id: idAsString };

          try {
            const result = await apolloClient.mutate({
              mutation: document,
              variables,
              errorPolicy: "all",
            });

            const response = pickResponsePayload(result.data);
            if (response?.ok) {
              return;
            }

            const responseError = (response?.errors ?? []).find(
              (item) =>
                typeof item?.message === "string" && Boolean(item.message),
            );
            if (responseError?.message) {
              throw new Error(responseError.message);
            }

            const requestErrors = extractGraphqlErrors(result.errors);
            if (requestErrors.length > 0) {
              errors.push(
                ...requestErrors
                  .map((item) => item.message)
                  .filter((item): item is string => Boolean(item)),
              );
            }
          } catch (error) {
            errors.push(getErrorMessage(error, "Mutation execution failed."));
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(errors[errors.length - 1]);
      }

      throw new Error("Mutation execution failed.");
    },
    [apolloClient, idAsString, model],
  );

  const handleDelete = React.useCallback(async () => {
    try {
      const result = await executeDelete({ id: idAsString });
      const payload = pickResponsePayload(result.data);
      if (!payload?.ok) {
        const message =
          payload?.errors
            ?.map((error) => error?.message)
            .filter((message): message is string => Boolean(message))
            .join(", ") || "Delete action failed.";
        toast.error(message);
        return;
      }

      setDeleteDialogOpen(false);
      setDeleted(true);
      toast.success(
        `${metadataState.metadata?.verboseName ?? "Record"} deleted.`,
      );

      const callbackResult = await actionsConfig.onDeleted?.(actionContext);
      if (callbackResult === false) return;

      if (actionsConfig.navigateBack) {
        actionsConfig.navigateBack();
        return;
      }

      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete action failed."));
    }
  }, [
    actionContext,
    actionsConfig,
    executeDelete,
    idAsString,
    metadataState.metadata?.verboseName,
  ]);

  const handleUpdate = React.useCallback(async () => {
    if (actionsConfig.onUpdate) {
      await Promise.resolve(actionsConfig.onUpdate(actionContext));
      return;
    }

    if (actionsConfig.updateForm?.enabled !== false) {
      setUpdateDialogOpen(true);
    }
  }, [actionContext, actionsConfig]);

  const customHeaderActionProps =
    React.useMemo<ModelDynamicDetailHeaderActionRenderProps<TRecord>>(
      () => ({
        app,
        model,
        id: idAsString,
        data: record,
        metadata: metadataState.metadata,
        refetch,
      }),
      [app, idAsString, metadataState.metadata, model, record, refetch],
    );

  const customHeaderActions = React.useMemo<
    ResolvedHeaderActionEntry<TRecord>[]
  >(() => {
    const resolveActions = config.header?.actions;
    if (!resolveActions) return [];

    const actionList = resolveActions(customHeaderActionProps);
    if (!Array.isArray(actionList) || actionList.length === 0) return [];

    return actionList
      .filter((action): action is ModelDynamicDetailHeaderActionConfig<TRecord> =>
        Boolean(action?.render),
      )
      .map((action, index) => ({
        position: Number.isFinite(action.position)
          ? Number(action.position)
          : index,
        render: action.render,
      }))
      .sort((left, right) => left.position - right.position);
  }, [config.header?.actions, customHeaderActionProps]);

  const resolvedHeaderTitle = React.useMemo<
    React.ReactElement | string | null
  >(() => {
    const recordValue = record as Record<string, unknown> | null;
    if (config.header?.title) {
      const title = config.header.title(record);
      if (typeof title === "string") {
        const trimmed = title.trim();
        return trimmed || null;
      }
      return title ?? null;
    }

    const fallbackName = recordValue?.["name"];
    if (typeof fallbackName === "string") {
      const trimmed = fallbackName.trim();
      return trimmed || null;
    }

    const fallbackTitle = recordValue?.["title"];
    if (typeof fallbackTitle === "string") {
      const trimmed = fallbackTitle.trim();
      return trimmed || null;
    }
    return null;
  }, [config.header?.title, record]);

  const layoutSectionsWithData = React.useMemo<
    ResolvedLayoutSection<TRecord>[]
  >(
    () =>
      buildLayoutSections({
        metadata: metadataState.metadata,
        config,
        data: record,
        app,
        model,
        id: idAsString,
        bootstrapDefaultIncludeFields: metadataState.defaultIncludeFields,
      }),
    [
      app,
      config,
      idAsString,
      metadataState.defaultIncludeFields,
      metadataState.metadata,
      model,
      record,
    ],
  );

  const layoutSectionSpanClassById = React.useMemo(() => {
    const entries: Array<readonly [string, string]> = [];
    layoutSectionsWithData.forEach((section) => {
      const className = resolveSectionContainerSpanClassName(
        section.containerSpan,
      );
      if (!className) return;
      entries.push([`layout:${section.id}`, className]);
    });

    return new Map<string, string>(entries);
  }, [layoutSectionsWithData]);

  const resolvedView = React.useMemo(() => {
    if (!config.view) return undefined;

    const baseResolveSectionContainer = config.view.resolveSectionContainer;
    if (!baseResolveSectionContainer && layoutSectionSpanClassById.size === 0) {
      return config.view;
    }

    return {
      ...config.view,
      resolveSectionContainer: (section: SectionDefinition, tabId?: string) => {
        const baseContainer = baseResolveSectionContainer?.(section, tabId);
        const spanClassName = layoutSectionSpanClassById.get(section.id);
        if (!spanClassName) {
          return baseContainer;
        }

        return {
          className: cn(baseContainer?.className, spanClassName),
          style: baseContainer?.style,
        };
      },
    };
  }, [config.view, layoutSectionSpanClassById]);

  const resolvedNestedWithData = React.useMemo<ResolvedNestedSection[]>(() => {
    return Object.entries(looseNestedConfig)
      .map(([rawPath, nested], index) => {
        const path = toGraphqlPath(rawPath);
        const relation = relationLookup.get(path);
        if (!relation) return null;
        const sectionId = resolveNestedSectionId(
          nested.sectionId,
          `nested:${path}`,
        );

        const mode =
          nested.mode && nested.mode !== "auto"
            ? nested.mode
            : relation.isToMany
              ? "table"
              : "object";

        const fields = resolveNestedFieldConfigs({
          sectionId,
          relationPath: path,
          config: nested,
          relatedMetadata: nestedMetadataByRelation[path] ?? null,
          data: record as Record<string, unknown> | null,
        });

        return {
          sectionId,
          tabId: normalizeTabId(nested.tabId),
          path,
          relation,
          config: nested,
          mode,
          sortOrder: normalizeOrder(nested.order, index),
          fields,
          relatedMetadata: nestedMetadataByRelation[path] ?? null,
        } satisfies ResolvedNestedSection;
      })
      .filter((entry): entry is ResolvedNestedSection => Boolean(entry))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }, [looseNestedConfig, nestedMetadataByRelation, record, relationLookup]);

  const detailsSchema = React.useMemo<DetailsPageSchema>(() => {
    const recordValue = record as Record<string, unknown> | null;
    const headerFrame = config.header?.frame;
    const resolvedHeaderDescription = (() => {
      const source = headerFrame?.description;
      if (typeof source === "function") {
        const value = source(record);
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed || undefined;
        }
        return value ?? undefined;
      }
      if (typeof source === "string") {
        const trimmed = source.trim();
        return trimmed || undefined;
      }

      const fallbackDesc = recordValue?.["desc"];
      if (typeof fallbackDesc === "string") {
        const trimmed = fallbackDesc.trim();
        if (trimmed) return trimmed;
      }

      const fallbackDescription = recordValue?.["description"];
      if (typeof fallbackDescription === "string") {
        const trimmed = fallbackDescription.trim();
        if (trimmed) return trimmed;
      }

      return undefined;
    })();
    const hasEnabledCustomMutationEntries = customMutationEntries.some(
      (entry) => !entry.disabled,
    );
    const hasHeaderActions =
      canUpdate ||
      canDelete ||
      (actionsConfig.showTemplates !== false && templateEntries.length > 0) ||
      hasEnabledCustomMutationEntries ||
      customHeaderActions.length > 0 ||
      Boolean(headerFrame?.actions);
    const frameTitle =
      headerFrame?.title ??
      (typeof resolvedHeaderTitle === "string"
        ? resolvedHeaderTitle
        : undefined);
    const headerSectionActions: SectionAction<{ ready: true }>[] = [
      ...customHeaderActions.map((entry, index) => ({
        id: `header-custom:${entry.position}:${index}`,
        label: `header-custom:${index}`,
        render: () => entry.render(customHeaderActionProps),
        onClick: () => undefined,
      })),
      ...(canUpdate
        ? [
            {
              id: "header-update",
              label: "Update",
              ariaLabel: "Update",
              icon: <Pencil className="size-4" />,
              onClick: () => {
                void handleUpdate();
              },
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              id: "header-delete",
              label: "Delete",
              ariaLabel: "Delete",
              tone: "danger" as const,
              icon: deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              ),
              disabled: deleting,
              onClick: () => {
                setDeleteDialogOpen(true);
              },
            },
          ]
        : []),
      ...(actionsConfig.showTemplates !== false && templateEntries.length > 0
        ? [
            {
              id: "header-templates",
              label: "Templates",
              render: () => (
                supportsSharedActionQueries ? (
                  <ModelTemplatesDropdown
                    data={{
                      app,
                      model,
                      objectId: idAsString,
                    }}
                    menu={{
                      align: "end",
                      contentClassName:
                        "w-52 p-1.5 rounded-xl shadow-xl border-border/50",
                    }}
                    actions={{
                      overrides: templateItemOverrides,
                    }}
                    renderTrigger={({ disabled, loading }) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs font-medium gap-1.5"
                        disabled={disabled}
                      >
                        {loading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Printer className="size-3.5" />
                        )}
                      </Button>
                    )}
                  />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs font-medium gap-1.5"
                      >
                        <Printer className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 p-1.5 rounded-xl shadow-xl border-border/50"
                    >
                      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60 px-2" />
                      <DropdownMenuSeparator />
                      {templateEntries.map((template) => (
                        <DropdownMenuItem
                          key={template.key}
                          onClick={() => handleTemplateClick(template)}
                          className="rounded-md text-[13px] font-medium px-2.5 py-2 focus:bg-accent"
                        >
                          {template.title || template.key}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ),
              onClick: () => undefined,
            },
          ]
        : []),
      ...(hasEnabledCustomMutationEntries
        ? [
            {
              id: "header-custom-mutations",
              label: "Actions",
              render: () => (
                supportsSharedActionQueries ? (
                  <CustomMutationsDropdown
                    data={{
                      app,
                      model,
                      objectId: idAsString,
                    }}
                    menu={{
                      align: "end",
                      contentClassName:
                        "w-56 p-1.5 rounded-xl shadow-xl border-border/50",
                    }}
                    actions={{
                      overrides: customMutationItemOverrides,
                    }}
                    renderTrigger={({ disabled, loading }) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs font-medium gap-1.5"
                        disabled={disabled}
                      >
                        {loading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Zap className="size-3.5" />
                        )}
                      </Button>
                    )}
                  />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs font-medium gap-1.5"
                      >
                        <Zap className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 p-1.5 rounded-xl shadow-xl border-border/50"
                    >
                      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60 px-2">
                        Custom Mutations
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {customMutationEntries.map((entry) => (
                        <DropdownMenuItem
                          key={entry.mutation.name}
                          disabled={entry.disabled}
                          title={entry.disabledReason}
                          onClick={() => {
                            setActiveMutationAction(entry);
                            setMutationDialogOpen(true);
                          }}
                          className="rounded-md text-[13px] font-medium px-2.5 py-2 focus:bg-accent"
                        >
                          {entry.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ),
              onClick: () => undefined,
            },
          ]
        : []),
    ];

    const headerSections =
      frameTitle || hasHeaderActions
        ? [
            createCustomSection<{ ready: boolean }>({
              id: "header:main",
              title: frameTitle,
              description: resolvedHeaderDescription,
              icon: headerFrame?.icon || <IconInfoCircle />,
              order: headerFrame?.order ?? -200,
              dataSource: headerFrame?.dataSource,
              loadingStrategy: headerFrame?.loadingStrategy,
              cacheKey: headerFrame?.cacheKey,
              permissions: headerFrame?.permissions,
              visibleIf: headerFrame?.visibleIf,
              disabledIf: headerFrame?.disabledIf,
              noAccessBehavior: headerFrame?.noAccessBehavior,
              load: headerFrame?.load,
              select:
                (headerFrame?.select as
                  | ((ctx: SectionRuntimeCtx) => { ready: boolean } | undefined)
                  | undefined) ?? (() => ({ ready: true })),
              skeleton: headerFrame?.skeleton,
              empty: headerFrame?.empty,
              error: headerFrame?.error,
              actions: (runtime, state) => [
                ...(headerFrame?.actions?.(runtime, state as any) ?? []),
                ...headerSectionActions,
              ],
              testId: headerFrame?.testId,
              render: () => null,
            }),
          ]
        : [];

    const layoutSectionEntries = layoutSectionsWithData.map((section) => ({
      tabId: section.tabId,
      section: createCustomSection<{ ready: boolean }>({
        id: `layout:${section.id}`,
        order: section.order,
        select: () => ({ ready: true }),
        title: typeof section.title === "string" ? section.title : undefined,
        description:
          typeof section.description === "string"
            ? section.description
            : undefined,
        render: () => (
          <div className="space-y-5">
            {section.rows.map((row) => (
              <div
                key={row.id}
                className={cn(resolveGridClasses(row.columns), "py-1")}
              >
                {row.fields.map((field) => (
                  <div
                    key={`${section.id}:${row.id}:${field.path}`}
                    className="min-w-0"
                    style={{
                      gridColumn: field.colSpan
                        ? `span ${field.colSpan} / span ${field.colSpan}`
                        : undefined,
                      gridRow: field.rowSpan
                        ? `span ${field.rowSpan} / span ${field.rowSpan}`
                        : undefined,
                    }}
                  >
                    {record
                      ? renderFieldValue({
                          field,
                          record,
                          sectionId: section.id,
                          metadata: metadataState.metadata,
                          nestedMetadataByRelation,
                        })
                      : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ),
      }),
    }));

    const nestedSectionEntries = resolvedNestedWithData.map((nested) => ({
      tabId: nested.tabId,
      section: createCustomSection<{ ready: boolean }>({
        id: nested.sectionId,
        order: undefined,
        select: () => ({ ready: true }),
        title:
          typeof nested.config.title === "string"
            ? nested.config.title
            : nested.relation.verboseName,
        description:
          typeof nested.config.description === "string"
            ? nested.config.description
            : nested.relation.helpText,
        visibleIf:
          nested.mode === "table"
            ? () => {
                const nestedValue = getValueByPath(record ?? {}, nested.path);
                return (
                  Array.isArray(nestedValue) && nestedValue.length > 0
                );
              }
            : undefined,
        render: () => {
          const nestedValue = getValueByPath(record ?? {}, nested.path);

          if (nested.mode === "table") {
            const rows = Array.isArray(nestedValue)
              ? nestedValue.filter((entry): entry is Record<string, unknown> =>
                  isRecord(entry),
                )
              : [];

            const tableRows = rows.map((row) => {
              const output: Record<string, unknown> = {};
              nested.fields.forEach((field) => {
                output[field.path] = getValueByPath(row, field.path);
              });
              return output;
            });

            return (
              <TableDetail
                columns={nested.fields.map((field) => ({
                  id: field.path,
                  header: String(
                    field.label ??
                      humanizeLabel(
                        field.path.split(".").slice(-1)[0] ?? field.path,
                      ),
                  ),
                }))}
                rows={tableRows}
                enable_quick_search={
                  nested.config.table?.enableQuickSearch ?? true
                }
                enable_sorting={nested.config.table?.enableSorting ?? true}
                initial_page_size={nested.config.table?.initialPageSize ?? 10}
              />
            );
          }

          if (!isRecord(nestedValue)) {
            return <SectionEmptyState title="No nested object" />;
          }

          const columns = normalizeColumns(nested.config.columns, 2);
          return (
            <div className={cn(resolveGridClasses(columns), "py-1")}>
              {nested.fields.map((field) => (
                <div
                  key={`${nested.path}:${field.path}`}
                  className="min-w-0"
                  style={{
                    gridColumn: field.colSpan
                      ? `span ${field.colSpan} / span ${field.colSpan}`
                      : undefined,
                    gridRow: field.rowSpan
                      ? `span ${field.rowSpan} / span ${field.rowSpan}`
                      : undefined,
                  }}
                >
                  {renderFieldValue({
                    field,
                    record: nestedValue,
                    sectionId: field.sectionId,
                    metadata: nested.relatedMetadata,
                    nestedMetadataByRelation: {},
                  })}
                </div>
              ))}
            </div>
          );
        },
      }),
    }));

    const customSectionEntries = (config.layout?.customSections ?? []).map(
      (section) => ({
        tabId: normalizeTabId(section.tabId),
        section: createCustomSection<{ ready: boolean }>({
          id: `custom:${section.id}`,
          order: section.order,
          select: () => ({ ready: true }),
          title: typeof section.title === "string" ? section.title : undefined,
          description:
            typeof section.description === "string"
              ? section.description
              : undefined,
          visibleIf: section.visible
            ? () =>
                section.visible({
                  app,
                  model,
                  id: idAsString,
                  data: record,
                  metadata: metadataState.metadata,
                })
            : undefined,
          render: () =>
            section.render({
              app,
              model,
              id: idAsString,
              data: record,
              metadata: metadataState.metadata,
            }),
        }),
      }),
    );

    const layoutTabs = resolveLayoutTabs({
      tabs: config.layout?.tabs,
      app,
      model,
      id: idAsString,
      data: record,
      metadata: metadataState.metadata,
    });
    const tabLookup = new Set(layoutTabs.map((tab) => tab.id));
    const sectionsByTab = new Map<string, SectionDefinition[]>();
    layoutTabs.forEach((tab) => {
      sectionsByTab.set(tab.id, []);
    });
    const bodySections: SectionDefinition[] = [];

    const routeSection = (
      section: SectionDefinition,
      targetTabId: string | undefined,
    ) => {
      const tabId = normalizeTabId(targetTabId);
      if (tabId && tabLookup.has(tabId)) {
        const sections = sectionsByTab.get(tabId);
        if (sections) {
          sections.push(section);
          return;
        }
      }
      if (tabId && !tabLookup.has(tabId)) {
        warnDev(
          `[ModelDynamicDetail] Unknown tabId \"${tabId}\". Section \"${section.id}\" was routed to body.`,
        );
      }
      bodySections.push(section);
    };

    [
      ...layoutSectionEntries,
      ...nestedSectionEntries,
      ...customSectionEntries,
    ].forEach((entry) => {
      routeSection(entry.section, entry.tabId);
    });

    const tabs = layoutTabs
      .map((tab) => ({
        id: tab.id,
        title: tab.title,
        icon: tab.icon,
        order: tab.order,
        loadingStrategy: tab.loadingStrategy,
        permissions: tab.permissions,
        sections: sectionsByTab.get(tab.id) ?? [],
      }))
      .filter((tab) => tab.sections.length > 0);

    return {
      header: headerSections,
      body: bodySections,
      ...(tabs.length > 0 ? { tabs } : {}),
    };
  }, [
    actionsConfig.showTemplates,
    app,
    canDelete,
    canUpdate,
    config.header?.frame,
    config.layout?.customSections,
    config.layout?.tabs,
    customHeaderActionProps,
    customHeaderActions,
    customMutationEntries,
    customMutationItemOverrides,
    deleting,
    handleUpdate,
    idAsString,
    layoutSectionsWithData,
    metadataState.metadata,
    model,
    nestedMetadataByRelation,
    record,
    resolvedHeaderTitle,
    resolvedNestedWithData,
    templateItemOverrides,
    templateEntries,
  ]);

  if (deleted) {
    return (
      <div
        className={cn(
          "min-h-[200px] flex items-center justify-center",
          config.className,
        )}
      >
        <SectionEmptyState
          title="Record deleted"
          description="The detail view is no longer available for this record."
        />
      </div>
    );
  }

  if (metadataState.loading || queryState.loading) {
    return (
      <div className={cn("space-y-6", config.className)}>
        <SectionSkeleton lines={8} />
      </div>
    );
  }

  if (metadataState.error || queryState.error) {
    return (
      <div
        className={cn(
          "min-h-[200px] flex items-center justify-center",
          config.className,
        )}
      >
        <SectionErrorState
          title="Detail loading failed"
          description={getErrorMessage(
            metadataState.error ?? queryState.error,
            "Unable to load detail.",
          )}
          onRetry={refetch}
        />
      </div>
    );
  }
  if (!record) {
    return (
      <div
        className={cn(
          "min-h-[200px] flex items-center justify-center",
          config.className,
        )}
      >
        <SectionEmptyState
          title="Record not found"
          description="The requested record does not exist or is not accessible."
        />
      </div>
    );
  }

  const runtime: SectionRuntimeCtx = {
    entityId: idAsString,
    entity: record,
    locale: config.runtime?.locale,
    timezone: config.runtime?.timezone,
    user: config.runtime?.user,
    permissions: config.runtime?.permissions,
    can: config.runtime?.can,
  };

  return (
    <div data-slot="model-detail" className={cn("space-y-6", config.className)}>
      <DynamicDetail
        schema={detailsSchema}
        runtime={runtime}
        className="space-y-6"
        view={resolvedView}
      />

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent
          className={cn(
            "max-w-5xl",
            actionsConfig.updateForm?.width ? "max-w-none" : undefined,
          )}
          style={{
            width: actionsConfig.updateForm?.width,
            maxWidth: actionsConfig.updateForm?.width,
            height: actionsConfig.updateForm?.height,
          }}
        >
          <DialogHeader className="pb-4 border-b border-border/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/8 text-primary">
                <Pencil className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {actionsConfig.updateForm?.modalTitle ??
                  `Update ${metadataState.metadata?.verboseName ?? model}`}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Update form for the selected{" "}
              {metadataState.metadata?.verboseName ?? model} record.
            </DialogDescription>
          </DialogHeader>
          <ModelForm
            app={app}
            model={model}
            mode={updateFormProps.mode ?? "UPDATE"}
            objectId={updateFormProps.objectId ?? idAsString}
            includeNested={updateFormProps.includeNested}
            nested={updateFormProps.nested}
            generatedEnabled={updateFormProps.generatedEnabled}
            runtimeOverrides={updateFormProps.runtimeOverrides}
            onlyFields={updateFormProps.onlyFields}
            excludeFields={updateFormProps.excludeFields}
            onlyRequired={updateFormProps.onlyRequired}
            onlyRelationships={updateFormProps.onlyRelationships}
            excludeRelationships={updateFormProps.excludeRelationships}
            fieldOverrides={updateFormProps.fieldOverrides}
            sectionOverrides={updateFormProps.sectionOverrides}
            validatorExtensions={updateFormProps.validatorExtensions}
            legacySchema={updateFormProps.legacySchema}
            formProps={updateFormProps.formProps}
            state={updateFormProps.state}
            behavior={updateFormProps.behavior}
            layout={resolvedUpdateFormLayout as typeof updateFormProps.layout}
            actions={resolvedUpdateFormActions}
            devtools={updateFormProps.devtools}
            title={updateFormProps.title}
            description={updateFormProps.description}
            showHeading={updateFormProps.showHeading}
            containerClassName={updateFormProps.containerClassName}
            contentClassName={updateFormProps.contentClassName}
            loadingFallback={updateFormProps.loadingFallback}
            emptySchemaFallback={updateFormProps.emptySchemaFallback}
            errorFallback={updateFormProps.errorFallback}
            requireObjectIdForUpdate={updateFormProps.requireObjectIdForUpdate}
            onContractLoaded={updateFormProps.onContractLoaded}
            onInitialDataLoaded={updateFormProps.onInitialDataLoaded}
            onLoadError={updateFormProps.onLoadError}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl border-border/30 shadow-xl">
          <AlertDialogHeader>
            <div className="mx-auto size-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="size-5 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-base font-semibold text-center">
              Delete record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground/70">
              {rowPermissions.deleteReason ||
                `This action will permanently delete this ${metadataState.metadata?.verboseName ?? model}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-3">
            <AlertDialogCancel className="rounded-lg font-medium text-xs h-9 px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-lg bg-rose-500 hover:bg-rose-600 font-medium text-xs h-9 px-5 shadow-md shadow-rose-500/15"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActionDialog
        open={
          !supportsSharedActionQueries &&
          mutationDialogOpen &&
          Boolean(activeMutationAction)
        }
        mode={activeMutationAction?.mode ?? null}
        actionMeta={
          activeMutationAction
            ? {
                name: activeMutationAction.mutation.name,
                description: activeMutationAction.mutation.description ?? null,
                action: activeMutationAction.mutation.action,
              }
            : null
        }
        schema={activeMutationAction?.schema}
        defaults={activeMutationAction?.defaults}
        submitting={executingMutationAction}
        onCancel={() => {
          if (executingMutationAction) return;
          setMutationDialogOpen(false);
          setActiveMutationAction(null);
        }}
        onExecute={(payload) => {
          if (!activeMutationAction) return;
          setExecutingMutationAction(true);
          void executeMetadataMutation(activeMutationAction, payload ?? {})
            .then(() => {
              toast.success(
                activeMutationAction.mutation.successMessage ||
                  "Action executed successfully.",
              );
              setMutationDialogOpen(false);
              setActiveMutationAction(null);
            })
            .catch((error: unknown) => {
              toast.error(getErrorMessage(error, "Action execution failed."));
            })
            .finally(() => {
              setExecutingMutationAction(false);
            });
        }}
      />

      <PrintDialog
        open={
          !supportsSharedActionQueries &&
          Boolean(printTemplate && printTemplateSchema)
        }
        title={printTemplate?.title ?? "Template parameters"}
        schema={printTemplateSchema ?? { fields: [] }}
        submitLabel="Generate"
        cancelLabel="Cancel"
        onCancel={() => {
          setPrintTemplate(null);
          setPrintTemplateSchema(null);
        }}
        onSubmit={(values) => {
          if (!printTemplate) return;
          const current = printTemplate;
          setPrintTemplate(null);
          setPrintTemplateSchema(null);
          void runTemplate(current, values).catch((error: unknown) => {
            toast.error(getErrorMessage(error, "Template execution failed."));
          });
        }}
      />
    </div>
  );
};

const ForwardedModelDynamicDetail = React.forwardRef(ModelDynamicDetailInner);
ForwardedModelDynamicDetail.displayName = "ModelDynamicDetail";

export const ModelDynamicDetail =
  ForwardedModelDynamicDetail as ModelDynamicDetailComponent;

export default ModelDynamicDetail;
