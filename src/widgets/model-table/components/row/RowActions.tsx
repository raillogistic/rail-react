import React, {
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useState,
} from "react";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Printer,
  Trash2,
  Zap,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { Badge } from "@/shared/ui/kit/badge";
import { cn } from "@/shared/utils";
import { ModelForm } from "@/widgets/model-form";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import type { ModelFormMutationOutcome } from "@/widgets/model-form/types/generatedContract";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import type {
  ModelTableUpdateConfig,
  ModelTableUpdateContext,
  ModelTableUpdateFormOverrides,
} from "../../config/types";
import {
  findMutation,
  normalizeMutationType,
  toGraphqlFieldName,
} from "../../utils";
import {
  buildTemplateClientSchema,
  executeTemplateForRows,
  normalizeTemplateType,
  parseTemplateClientFields,
} from "../../utils/templateExecution";
import type {
  BaseModelTableColumnActionContext,
  BaseModelTableColumnActionsInput,
  BaseModelTableRefetch,
  MutationInputFieldSchema,
  MutationSchema,
  RowMutationPermissions,
  TemplateInfo,
} from "../../types";
import { FormOverlay } from "../ModelTableOverlays";

type MutationActionMode = "confirm" | "form";

const ActionDialog = lazy(() =>
  import("../ModelTableOverlays").then((module) => ({
    default: module.ActionDialog,
  })),
);

const PrintDialog = lazy(() =>
  import("../ModelTableOverlays").then((module) => ({
    default: module.PrintDialog,
  })),
);

type MutationActionEntry = {
  mutation: MutationSchema;
  mode: MutationActionMode;
  ui: Record<string, unknown>;
  label: string;
  disabled: boolean;
  disabledReason: string | null;
  schema: FormSchema | null;
  defaults: Record<string, unknown>;
};

type UpdateFormValues = Record<string, unknown>;

/**
 * Normalized edit-action configuration resolved per row instance.
 */
type ResolvedUpdateConfig = {
  type: "drawer" | "modal" | "link";
  title: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection: "left" | "right" | "top" | "bottom";
  objectIdValue: string;
  hrefTemplate?: string;
  closeOnSuccess: boolean;
  refetchOnSuccess: boolean;
  formOverrides: ModelTableUpdateFormOverrides;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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

function humanizeLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();
  if (!withSpaces) return value;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function resolveFormFieldType(
  field: MutationInputFieldSchema,
): FormSchema["fields"][number]["type"] {
  const normalized = String(
    field.graphqlType || field.fieldType || "",
  ).toLowerCase();
  if (field.choices && field.choices.length > 0) {
    return "select";
  }
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
  mutation: MutationSchema,
): MutationInputFieldSchema[] {
  const source = Array.isArray(mutation.inputFields)
    ? mutation.inputFields
    : [];
  return source
    .filter((field): field is MutationInputFieldSchema => isRecord(field))
    .map((field, index) => {
      const fieldNameRaw =
        typeof field.name === "string"
          ? field.name
          : typeof field.fieldName === "string"
            ? field.fieldName
            : `field${index + 1}`;
      const fieldName = toGraphqlFieldName(fieldNameRaw) || fieldNameRaw;
      const rawChoices = Array.isArray(field.choices) ? field.choices : [];
      const choices = rawChoices
        .map((choice) => {
          if (!isRecord(choice)) return null;
          const value = choice.value;
          if (value === undefined || value === null) return null;
          const label = choice.label ?? value;
          return {
            value: String(value),
            label: String(label),
          };
        })
        .filter(
          (choice): choice is { value: string; label: string } => !!choice,
        );
      return {
        ...field,
        name: fieldName,
        fieldName,
        choices,
        required: Boolean(field.required),
      };
    });
}

function buildMutationSchema(
  fields: MutationInputFieldSchema[],
): FormSchema | null {
  if (!fields.length) return null;
  return {
    fields: fields.map((field) => ({
      name: field.name || "",
      label: humanizeLabel(field.name || field.fieldName || "Field"),
      type: resolveFormFieldType(field),
      required: Boolean(field.required),
      description: field.description || undefined,
      choices: (field.choices ?? []).map((choice) => ({
        value: String(choice.value),
        label: String(choice.label),
      })),
    })),
  };
}

function buildMutationDefaults(
  fields: MutationInputFieldSchema[],
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const name = field.name || field.fieldName;
    if (!name) return acc;
    if (field.defaultValue === undefined) return acc;
    acc[name] = parseDefaultValue(field.defaultValue);
    return acc;
  }, {});
}

function normalizeMutationActionMode(
  mutation: MutationSchema,
  inputFields: MutationInputFieldSchema[],
): MutationActionMode {
  const actionPayload = parseJsonObject(mutation.action);
  const declaredMode = String(actionPayload?.mode ?? "").toLowerCase();
  if (declaredMode === "confirm") {
    return "confirm";
  }
  if (declaredMode === "form") {
    return inputFields.length > 0 ? "form" : "confirm";
  }
  return inputFields.length > 0 ? "form" : "confirm";
}

function buildMutationOperationNames(
  mutation: MutationSchema,
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

function buildMutationLabel(
  mutation: MutationSchema,
  actionUi: Record<string, unknown>,
): string {
  const uiButtonTitle = actionUi.button_title ?? actionUi.buttonTitle;
  if (typeof uiButtonTitle === "string" && uiButtonTitle.trim()) {
    return uiButtonTitle.trim();
  }
  const uiTitle = actionUi.title;
  if (typeof uiTitle === "string" && uiTitle.trim()) return uiTitle.trim();
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
  inputFields: MutationInputFieldSchema[];
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

/**
 * Merges two optional ModelForm override records.
 */
function mergeModelFormOverrides(
  base: ModelTableUpdateFormOverrides | undefined,
  extra: ModelTableUpdateFormOverrides | undefined,
): ModelTableUpdateFormOverrides {
  const left = base ?? {};
  const right = extra ?? {};
  const leftFormProps = left.formProps ?? {};
  const rightFormProps = right.formProps ?? {};

  return {
    ...left,
    ...right,
    state: { ...(left.state ?? {}), ...(right.state ?? {}) },
    behavior: { ...(left.behavior ?? {}), ...(right.behavior ?? {}) },
    layout: { ...(left.layout ?? {}), ...(right.layout ?? {}) },
    actions: { ...(left.actions ?? {}), ...(right.actions ?? {}) },
    devtools: { ...(left.devtools ?? {}), ...(right.devtools ?? {}) },
    formProps: {
      ...leftFormProps,
      ...rightFormProps,
      state: { ...(leftFormProps.state ?? {}), ...(rightFormProps.state ?? {}) },
      behavior: {
        ...(leftFormProps.behavior ?? {}),
        ...(rightFormProps.behavior ?? {}),
      },
      layout: {
        ...(leftFormProps.layout ?? {}),
        ...(rightFormProps.layout ?? {}),
      },
      actions: {
        ...(leftFormProps.actions ?? {}),
        ...(rightFormProps.actions ?? {}),
      },
      devtools: {
        ...(leftFormProps.devtools ?? {}),
        ...(rightFormProps.devtools ?? {}),
      },
    },
  };
}

/**
 * Resolves update overlay title from static text/callback with a safe fallback.
 */
function resolveUpdateTitle(
  title: ModelTableUpdateConfig["title"],
  context: ModelTableUpdateContext,
): React.ReactNode {
  if (typeof title === "function") {
    return title(context);
  }
  if (title !== undefined && title !== null) {
    return title;
  }
  return `Modifier ${context.metadata?.verboseName ?? context.model}`;
}

/**
 * Replaces `:id` placeholders in link templates with encoded row identifiers.
 */
function buildUpdateHrefFromTemplate(
  template: string,
  rowId: string,
): string {
  return template.replace(/:id\b/g, encodeURIComponent(rowId));
}

type RowActionsProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown>[];
  refetch?: BaseModelTableRefetch;
  permissions?: RowMutationPermissions | null;
  columnActions?: BaseModelTableColumnActionsInput;
  update?: ModelTableUpdateConfig;
};

export function RowActions({
  row,
  data,
  refetch,
  permissions,
  columnActions,
  update,
}: RowActionsProps) {
  const { app, model, metadata } = useMetadata();
  const { refresh } = useTable();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<TemplateInfo | null>(null);
  const [printTemplateSchema, setPrintTemplateSchema] =
    useState<FormSchema | null>(null);
  const [activeMutationAction, setActiveMutationAction] =
    useState<MutationActionEntry | null>(null);
  const [mutationDialogOpen, setMutationDialogOpen] = useState(false);
  const [executingMutationAction, setExecutingMutationAction] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const rowIdValue = row.id;
  const rowId =
    rowIdValue === undefined || rowIdValue === null ? "" : String(rowIdValue);

  const templateEntries = useMemo(
    () =>
      (metadata?.templates ?? []).filter(
        (entry): entry is TemplateInfo => !!entry && typeof entry === "object",
      ),
    [metadata?.templates],
  );

  const pdfTemplates = useMemo(
    () =>
      templateEntries.filter(
        (template) => normalizeTemplateType(template) === "pdf",
      ),
    [templateEntries],
  );

  const excelTemplates = useMemo(
    () =>
      templateEntries.filter(
        (template) => normalizeTemplateType(template) === "excel",
      ),
    [templateEntries],
  );

  const baseMutations = metadata?.mutations ?? [];
  const baseDeleteMutation = findMutation(baseMutations, "delete");
  const baseUpdateMutation = findMutation(baseMutations, "update");
  const canDelete =
    !!rowId &&
    !!baseDeleteMutation?.allowed &&
    (permissions?.canDelete ?? true);
  const canEdit =
    !!baseUpdateMutation?.allowed && (permissions?.canUpdate ?? true);

  const updateContext = useMemo<ModelTableUpdateContext>(
    () => ({
      app,
      model,
      row,
      rowId,
      metadata: metadata ?? undefined,
    }),
    [app, metadata, model, row, rowId],
  );

  const resolvedUpdateConfig = useMemo<ResolvedUpdateConfig>(() => {
    const resolvedObjectId =
      update?.resolveObjectId?.(updateContext) ?? update?.objectId ?? rowId;
    const objectIdValue =
      resolvedObjectId === undefined || resolvedObjectId === null
        ? ""
        : String(resolvedObjectId);
    const globalOverrides = update?.form;
    const perRowOverrides = update?.resolveFormProps?.(updateContext);
    const mergedOverrides = mergeModelFormOverrides(globalOverrides, perRowOverrides);
    return {
      type: update?.type ?? "drawer",
      title: resolveUpdateTitle(update?.title, updateContext),
      width: update?.width,
      height: update?.height,
      drawerDirection: update?.drawerDirection ?? "right",
      objectIdValue,
      hrefTemplate: update?.hrefTemplate,
      closeOnSuccess: update?.closeOnSuccess ?? true,
      refetchOnSuccess: update?.refetchOnSuccess ?? true,
      formOverrides: mergedOverrides,
    };
  }, [update, updateContext]);

  const editDisabledReason = useMemo(() => {
    if (!canEdit) {
      return "Permission de mise a jour indisponible.";
    }
    if (!resolvedUpdateConfig.objectIdValue) {
      return "Cette ligne ne possede pas d'identifiant valide.";
    }
    if (
      resolvedUpdateConfig.type === "link" &&
      !resolvedUpdateConfig.hrefTemplate
    ) {
      return "Configuration update.link manquante (hrefTemplate).";
    }
    return null;
  }, [
    canEdit,
    resolvedUpdateConfig.hrefTemplate,
    resolvedUpdateConfig.objectIdValue,
    resolvedUpdateConfig.type,
  ]);

  const actionContext = useMemo<BaseModelTableColumnActionContext>(
    () => ({
      row,
      data,
      refetch,
    }),
    [data, refetch, row],
  );

  const customActions = useMemo(() => {
    const source =
      typeof columnActions === "function"
        ? columnActions(actionContext)
        : columnActions;
    return source ?? [];
  }, [actionContext, columnActions]);

  const metadataMutationActions = useMemo<MutationActionEntry[]>(() => {
    const customMutations = (metadata?.mutations ?? []).filter(
      (mutation): mutation is MutationSchema =>
        !!mutation &&
        typeof mutation === "object" &&
        normalizeMutationType(mutation) === "custom",
    );

    return customMutations.map((mutation) => {
      const inputFields = normalizeMutationInputFields(mutation);
      const mode = normalizeMutationActionMode(mutation, inputFields);
      const ui = parseJsonObject(mutation.action) ?? {};
      const schema = mode === "form" ? buildMutationSchema(inputFields) : null;
      const defaults = buildMutationDefaults(inputFields);
      const requiredPermissions = mutation.requiredPermissions ?? [];
      const permissionReason =
        mutation.reason ||
        (requiredPermissions.length > 0
          ? `Permission required: ${requiredPermissions.join(", ")}`
          : null);
      const disabledReason =
        mutation.allowed === false
          ? permissionReason ||
            "Vous n'avez pas la permission d'exécuter cette action."
          : !rowId
            ? "Cette ligne ne possède pas d'identifiant valide."
            : null;

      return {
        mutation,
        mode,
        ui,
        label: buildMutationLabel(mutation, ui),
        disabled: Boolean(disabledReason),
        disabledReason,
        schema,
        defaults,
      };
    });
  }, [metadata?.mutations, rowId]);

  const hasTemplateActions = templateEntries.length > 0;
  const hasBuiltinActions = canEdit || canDelete;
  const hasMetadataMutationActions = metadataMutationActions.length > 0;
  const hasCustomActions = customActions.length > 0;
  const hasAnyActions =
    hasBuiltinActions ||
    hasTemplateActions ||
    hasCustomActions ||
    hasMetadataMutationActions;

  const deleteMutationName = baseDeleteMutation?.name || `delete${model}`;
  const deleteDocument = useMemo(
    () => gql`
        mutation ${deleteMutationName}($id: ID!) {
          response: ${deleteMutationName}(id: $id) {
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
      `,
    [deleteMutationName],
  );

  const [executeDelete, { loading: deleting }] = useMutation(deleteDocument, {
    errorPolicy: "all",
  });

  const handleDelete = async () => {
    try {
      const result = await executeDelete({ variables: { id: rowId } });
      const ok = !!result.data?.response?.ok;
      if (ok) {
        toast.success(
          `${metadata?.verboseName ?? "Record"} supprimé avec succès.`,
          {
            icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
          },
        );
        refresh();
      } else {
        const message =
          result.data?.response?.errors
            ?.map((error: { message?: string }) => error?.message)
            .filter(Boolean)
            .join(", ") || "Échec de la suppression.";
        toast.error(message);
      }
    } catch (error) {
      console.error("Failed to delete record", error);
      const message =
        error instanceof Error ? error.message : "Échec de la suppression.";
      toast.error(message);
    } finally {
      setConfirmOpen(false);
    }
  };

  /**
   * Executes update action according to configured presentation mode.
   */
  const handleEdit = useCallback(() => {
    if (editDisabledReason) {
      toast.error(editDisabledReason);
      return;
    }

    if (resolvedUpdateConfig.type === "link") {
      const template = resolvedUpdateConfig.hrefTemplate ?? "";
      const href = buildUpdateHrefFromTemplate(
        template,
        resolvedUpdateConfig.objectIdValue,
      );
      navigate(href);
      return;
    }

    setUpdateDialogOpen(true);
  }, [
    editDisabledReason,
    navigate,
    resolvedUpdateConfig.hrefTemplate,
    resolvedUpdateConfig.type,
    resolvedUpdateConfig.objectIdValue,
    ]);

  /**
   * Handles post-submit update outcome to close popup and refresh table data.
   */
  const handleUpdateSubmitResult = useCallback(
    async (outcome: ModelFormMutationOutcome) => {
      if (!outcome.ok) {
        return;
      }

      if (resolvedUpdateConfig.closeOnSuccess) {
        setUpdateDialogOpen(false);
      }

      if (!resolvedUpdateConfig.refetchOnSuccess) {
        return;
      }

      try {
        if (refetch) {
          await refetch();
        } else {
          refresh();
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de recharger la table apres mise a jour.";
        toast.error(message);
      }
    },
    [
      refetch,
      refresh,
      resolvedUpdateConfig.closeOnSuccess,
      resolvedUpdateConfig.refetchOnSuccess,
    ],
  );

  const closePrintDialog = () => {
    setPrintTemplate(null);
    setPrintTemplateSchema(null);
  };

  const runTemplate = async (
    template: TemplateInfo,
    clientData: Record<string, unknown> = {},
  ) => {
    if (!rowId) {
      toast.error("Cette ligne ne possède pas d'identifiant valide.");
      return;
    }

    const result = await executeTemplateForRows(template, [rowId], clientData);
    if (result.templateType === "pdf") {
      toast.success(`Template "${template.title}" généré.`);
    } else {
      toast.success(`Template "${template.title}" téléchargé.`);
    }
  };

  const handleTemplateAction = (template: TemplateInfo) => {
    if (template.allowed === false) {
      toast.error(
        template.denialReason ||
          "Vous n'avez pas la permission d'utiliser ce template.",
      );
      return;
    }

    if (!rowId) {
      toast.error("Cette ligne ne possède pas d'identifiant valide.");
      return;
    }

    const clientFields = parseTemplateClientFields(template);
    if (clientFields.length > 0) {
      setPrintTemplate(template);
      setPrintTemplateSchema(buildTemplateClientSchema(clientFields));
      return;
    }

    void runTemplate(template).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Échec de la génération du template.";
      toast.error(message);
    });
  };

  const runCustomAction = (
    onClick: (
      context: BaseModelTableColumnActionContext,
    ) => void | Promise<void>,
  ) => {
    void Promise.resolve(onClick(actionContext)).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Échec de l'action personnalisée.";
      toast.error(message);
    });
  };

  const closeMutationDialog = () => {
    if (executingMutationAction) return;
    setMutationDialogOpen(false);
    setActiveMutationAction(null);
  };

  const executeMetadataMutation = async (
    actionEntry: MutationActionEntry,
    payload: Record<string, unknown>,
  ) => {
    const mutation = actionEntry.mutation;
    const operationNames = buildMutationOperationNames(mutation, model);
    if (operationNames.length === 0) {
      throw new Error("Nom de mutation introuvable.");
    }

    const inputFields = normalizeMutationInputFields(mutation);
    const hasInputPayload = inputFields.length > 0;
    const inputPayload = hasInputPayload ? payload : {};
    const graphqlErrors: string[] = [];

    for (const operationName of operationNames) {
      const plans =
        hasInputPayload && mutation.inputType ? [true, false] : [false];

      for (const useInputObject of plans) {
        const mutationDocument = buildMutationDocument({
          operationName,
          inputType: mutation.inputType,
          inputFields,
          useInputObject,
        });
        const variables =
          hasInputPayload && useInputObject
            ? { id: rowId, input: inputPayload }
            : hasInputPayload
              ? { id: rowId, ...inputPayload }
              : { id: rowId };

        try {
          const result = await apolloClient.mutate({
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

          const responseErrors = response?.errors ?? [];
          const firstResponseError = responseErrors.find(
            (entry) => typeof entry?.message === "string" && entry.message,
          );
          if (firstResponseError?.message) {
            throw new Error(firstResponseError.message);
          }

          const requestErrors = extractGraphqlErrors(result.errors);
          if (requestErrors.length > 0) {
            graphqlErrors.push(
              ...requestErrors
                .map((entry) => entry.message)
                .filter((entry): entry is string => Boolean(entry)),
            );
            continue;
          }

          throw new Error("Échec de l'exécution de la mutation.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message) {
            graphqlErrors.push(message);
          }
          continue;
        }
      }
    }

    if (graphqlErrors.length > 0) {
      throw new Error(graphqlErrors[graphqlErrors.length - 1]);
    }
    throw new Error("Échec de l'exécution de la mutation.");
  };

  const runMutationAction = (payload: Record<string, unknown> = {}) => {
    if (!activeMutationAction) return;
    setExecutingMutationAction(true);
    void executeMetadataMutation(activeMutationAction, payload)
      .then(() => {
        const successMessage =
          activeMutationAction.mutation.successMessage ||
          "Action exécutée avec succès.";
        toast.success(successMessage);
        refresh();
        setMutationDialogOpen(false);
        setActiveMutationAction(null);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Échec de l'exécution de l'action.";
        toast.error(message);
      })
      .finally(() => {
        setExecutingMutationAction(false);
      });
  };

  const openMutationAction = (actionEntry: MutationActionEntry) => {
    if (actionEntry.disabled) return;
    setActiveMutationAction(actionEntry);
    setMutationDialogOpen(true);
  };

  const updateFormProps = useMemo<ModelFormProps<UpdateFormValues>>(() => {
    const overrides = resolvedUpdateConfig.formOverrides;
    const formPropsLayout =
      (overrides.formProps?.layout as
        | Record<string, unknown>
        | undefined) ?? {};

    return {
      app,
      model,
      mode: "update",
      objectId: resolvedUpdateConfig.objectIdValue,
      showHeading: false,
      ...overrides,
      layout: {
        variant: "popup",
        ...(overrides.layout as Record<string, unknown> | undefined),
      },
      formProps: {
        ...(overrides.formProps ?? {}),
        layout: {
          variant: "popup",
          ...formPropsLayout,
        },
      },
      onSubmitResult: handleUpdateSubmitResult,
    };
  }, [
    app,
    handleUpdateSubmitResult,
    model,
    resolvedUpdateConfig.formOverrides,
    resolvedUpdateConfig.objectIdValue,
  ]);

  if (!hasAnyActions) {
    return null;
  }

  const renderTemplateItem = (template: TemplateInfo) => {
    const templateType = normalizeTemplateType(template);
    const disabledReason =
      template.allowed === false
        ? template.denialReason || "Accès refusé"
        : !rowId
          ? "ID manquant"
          : null;
    const disabled = Boolean(disabledReason);

    return (
      <DropdownMenuItem
        key={`row-template:${rowId}:${template.key}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          handleTemplateAction(template);
        }}
        className="group/item flex items-center gap-3 rounded-lg py-2.5 text-xs font-medium transition-all"
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            templateType === "excel"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-500/20"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover/item:bg-blue-500/20",
          )}
        >
          {templateType === "excel" ? (
            <FileSpreadsheet className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-bold tracking-tight">
            {template.title || template.key}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
            {templateType}
          </span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-primary" />
      </DropdownMenuItem>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="group/actions flex items-center justify-end gap-1 opacity-50 transition-opacity duration-200 group-hover/row:opacity-100">
        {canEdit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Modifier"
                className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-500 hover:text-white active:scale-95"
                onClick={handleEdit}
                disabled={Boolean(editDisabledReason)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-blue-600 text-white font-bold uppercase text-[9px] tracking-widest">
              {editDisabledReason ?? "Modifier"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-95 disabled:grayscale"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-rose-600 text-white font-bold uppercase text-[9px] tracking-widest">
              Supprimer
            </TooltipContent>
          </Tooltip>
        ) : null}

        {hasTemplateActions ? (
          <DropdownMenu modal={false}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white active:scale-95"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg bg-emerald-600 text-white font-bold uppercase text-[9px] tracking-widest">
                Templates
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl border-border/30 p-1.5 shadow-xl backdrop-blur-xl bg-background/95"
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Extractions
              </DropdownMenuLabel>

              <div className="flex flex-col gap-1 p-1">
                {pdfTemplates.length > 0 &&
                  pdfTemplates.map((template) => renderTemplateItem(template))}

                {pdfTemplates.length > 0 && excelTemplates.length > 0 && (
                  <DropdownMenuSeparator className="my-1 bg-border/40" />
                )}

                {excelTemplates.length > 0 &&
                  excelTemplates.map((template) =>
                    renderTemplateItem(template),
                  )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {hasCustomActions || hasMetadataMutationActions ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-lg bg-muted/30 text-muted-foreground transition-all hover:bg-primary hover:text-white active:scale-95"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-border/30 p-1.5 shadow-xl backdrop-blur-xl bg-background/95"
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                <Zap className="h-3.5 w-3.5" />
                Actions
              </DropdownMenuLabel>
              <div className="flex flex-col gap-1 p-1">
                {metadataMutationActions.map((entry) => {
                  const modeBadgeLabel =
                    entry.mode === "form" ? "FORM" : "CONFIRM";
                  const severity = String(entry.ui.severity ?? "default");
                  const description =
                    typeof entry.mutation.description === "string" &&
                    entry.mutation.description.trim()
                      ? entry.mutation.description.trim()
                      : null;
                  const tooltipText =
                    entry.disabledReason && description
                      ? `${entry.disabledReason}\n${description}`
                      : entry.disabledReason || description || undefined;
                  const iconClassName =
                    severity === "destructive"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover/custom:bg-rose-500 group-hover/custom:text-white"
                      : "bg-muted/40 group-hover/custom:bg-primary group-hover/custom:text-white";
                  return (
                    <DropdownMenuItem
                      key={`metadata-row-action:${rowId}:${entry.mutation.name}`}
                      disabled={entry.disabled}
                      title={tooltipText}
                      onClick={() => openMutationAction(entry)}
                      className="group/custom flex items-center gap-3 rounded-lg py-2.5 text-xs font-medium transition-all"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          iconClassName,
                        )}
                      >
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-bold tracking-tight">
                          {entry.label}
                        </span>
                        {entry.disabledReason ? (
                          <span className="truncate text-[9px] uppercase tracking-widest text-muted-foreground/70">
                            {entry.disabledReason}
                          </span>
                        ) : null}
                      </div>
                      <Badge variant="secondary" className="text-[9px]">
                        {modeBadgeLabel}
                      </Badge>
                    </DropdownMenuItem>
                  );
                })}

                {metadataMutationActions.length > 0 &&
                customActions.length > 0 ? (
                  <DropdownMenuSeparator className="my-1 bg-border/40" />
                ) : null}

                {customActions.map((action, index) => {
                  const key = action.key ?? `custom-row-action-${index}`;
                  if (
                    typeof (action as { render?: unknown }).render ===
                    "function"
                  ) {
                    const renderAction = (
                      action as {
                        render: (
                          context: BaseModelTableColumnActionContext,
                        ) => React.ReactNode;
                      }
                    ).render;
                    return (
                      <div key={key} className="px-1">
                        {renderAction(actionContext)}
                      </div>
                    );
                  }

                  const clickAction = action as {
                    onClick: (
                      context: BaseModelTableColumnActionContext,
                    ) => void | Promise<void>;
                    label?: string;
                  };

                  return (
                    <DropdownMenuItem
                      key={key}
                      variant={action.variant}
                      disabled={action.disabled}
                      onClick={() => runCustomAction(clickAction.onClick)}
                      className={cn(
                        "group/custom flex items-center gap-3 rounded-lg py-2.5 text-xs font-medium transition-all",
                        action.className,
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 group-hover/custom:bg-primary group-hover/custom:text-white transition-colors">
                        {action.icon ?? <ExternalLink className="h-4 w-4" />}
                      </div>
                      <span className="font-bold tracking-tight">
                        {clickAction.label ?? "Action"}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl border-border/30 shadow-2xl overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
          {/* Accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10">
              <Trash2 className="size-7 text-rose-500" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-bold">
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                Êtes-vous sûr de vouloir supprimer cet enregistrement{" "}
                <span className="font-bold text-foreground">
                  "{metadata?.verboseName}"
                </span>{" "}
                ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex-col sm:flex-row gap-3 justify-center w-full">
              <AlertDialogCancel className="h-10 flex-1 rounded-xl border-border/30 bg-muted/30 font-bold text-xs uppercase tracking-wider transition-all hover:bg-muted/50 active:scale-95">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 flex-1 rounded-xl bg-rose-500 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95 disabled:grayscale"
              >
                {deleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {resolvedUpdateConfig.type !== "link" ? (
        <FormOverlay
          mode={resolvedUpdateConfig.type === "modal" ? "modal" : "drawer"}
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          title={resolvedUpdateConfig.title}
          width={resolvedUpdateConfig.width}
          height={resolvedUpdateConfig.height}
          drawerDirection={resolvedUpdateConfig.drawerDirection}
        >
          <ModelForm<UpdateFormValues> {...updateFormProps} />
        </FormOverlay>
      ) : null}
      <Suspense fallback={null}>
        <ActionDialog
          open={mutationDialogOpen && Boolean(activeMutationAction)}
          mode={activeMutationAction?.mode ?? null}
          actionMeta={
            activeMutationAction
              ? {
                  name: activeMutationAction.mutation.name,
                  description:
                    activeMutationAction.mutation.description ?? null,
                  action: activeMutationAction.ui,
                }
              : null
          }
          schema={activeMutationAction?.schema}
          defaults={activeMutationAction?.defaults}
          submitting={executingMutationAction}
          onCancel={closeMutationDialog}
          onExecute={(values) => runMutationAction(values ?? {})}
        />

        <PrintDialog
          open={Boolean(printTemplate && printTemplateSchema)}
          title={printTemplate?.title ?? "Paramètres d'extraction"}
          schema={printTemplateSchema ?? { fields: [] }}
          submitLabel={
            printTemplate && normalizeTemplateType(printTemplate) === "excel"
              ? "Télécharger"
              : "Générer"
          }
          cancelLabel="Annuler"
          onCancel={closePrintDialog}
          onSubmit={(values) => {
            if (!printTemplate) return;
            const template = printTemplate;
            closePrintDialog();
            void runTemplate(template, values).catch((error: unknown) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Échec de la génération du template.";
              toast.error(message);
            });
          }}
        />
      </Suspense>
    </TooltipProvider>
  );
}
