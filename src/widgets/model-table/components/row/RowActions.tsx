import React, { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap,
  Sparkles,
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  CustomMutationsDropdown,
  type CustomMutationsDropdownExtraAction,
} from "@/widgets/components/CustomMutationsDropdown";
import { ModelTemplateAction } from "@/widgets/components/ModelTemplateAction";
import { ModelTemplatesDropdown } from "@/widgets/components/ModelTemplatesDropdown";
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
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import type {
  ModelDynamicDetailConfig,
  ModelDynamicDetailProps,
} from "@/widgets/model-details/config/types";
import type {
  ModelFormProps,
  ModelFormValueShape,
} from "@/widgets/model-form/types.model";
import type { ModelFormMutationOutcome } from "@/widgets/model-form/types/generatedContract";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import type {
  ModelTableDetailConfig,
  ModelTableDetailContext,
  ModelTableDetailFormOverrides,
  ModelTableUpdateConfig,
  ModelTableUpdateContext,
  ModelTableUpdateFormOverrides,
} from "../../config/types";
import { findMutation, normalizeMutationType } from "../../utils";
import { type TemplatePdfPreviewPayload } from "../../utils/templateExecution";
import type {
  BaseModelTableColumnActionContext,
  BaseModelTableColumnActionsInput,
  BaseModelTableRefetch,
  DynamicModelTableRow,
  RowMutationPermissions,
  TemplateInfo,
} from "../../types";
import { FormOverlay } from "../ModelTableOverlays";

const LazyModelForm = lazy(() =>
  import("@/widgets/model-form").then((module) => ({
    default: module.ModelForm as React.ComponentType<
      ModelFormProps<UpdateFormValues<any>, any>
    >,
  })),
);

const LazyModelDynamicDetail = lazy(() =>
  import("@/widgets/model-details").then((module) => ({
    default:
      module.ModelDynamicDetail as React.ComponentType<ModelDynamicDetailProps<any>>,
  })),
);

type UpdateFormValues<TSource extends object> = ModelFormValueShape<TSource>;
type ResolvedUpdateFormValues<TSource extends object> =
  UpdateFormValues<TSource> extends Record<string, unknown>
    ? UpdateFormValues<TSource>
    : Record<string, unknown>;

/**
 * Normalized edit-action configuration resolved per row instance.
 */
type ResolvedUpdateConfig<TSource extends object = Record<string, unknown>> = {
  type: "drawer" | "modal" | "link";
  title: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection: "left" | "right" | "top" | "bottom";
  objectIdValue: string;
  hrefTemplate?: string;
  closeOnSuccess: boolean;
  refetchOnSuccess: boolean;
  formOverrides: ModelTableUpdateFormOverrides<TSource>;
};

/**
 * Normalized detail-action configuration resolved per row instance.
 */
type ResolvedDetailConfig<TSource extends object = Record<string, unknown>> = {
  type: "drawer" | "modal" | "link";
  title: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection: "left" | "right" | "top" | "bottom";
  objectIdValue: string;
  hrefTemplate?: string;
  baseDetail: ModelDynamicDetailConfig<TSource>;
  formOverrides: ModelTableDetailFormOverrides<TSource>;
};

/**
 * Merges two optional ModelForm override records.
 */
type RowActionFormOverrides =
  | ModelTableUpdateFormOverrides<any>
  | ModelTableDetailFormOverrides<any>;

function mergeModelFormOverrides(
  base: RowActionFormOverrides | undefined,
  extra: RowActionFormOverrides | undefined,
): RowActionFormOverrides {
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
      state: {
        ...(leftFormProps.state ?? {}),
        ...(rightFormProps.state ?? {}),
      },
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
 * Merges two optional ModelDynamicDetail config records.
 */
function mergeModelDynamicDetailConfig(
  base: ModelDynamicDetailConfig<any> | undefined,
  extra: ModelDynamicDetailConfig<any> | undefined,
): ModelDynamicDetailConfig<any> {
  const left = base ?? {};
  const right = extra ?? {};

  return {
    ...left,
    ...right,
    header: {
      ...(left.header ?? {}),
      ...(right.header ?? {}),
      frame: {
        ...(left.header?.frame ?? {}),
        ...(right.header?.frame ?? {}),
      },
    },
    runtime: { ...(left.runtime ?? {}), ...(right.runtime ?? {}) },
    view: { ...(left.view ?? {}), ...(right.view ?? {}) },
    layout: {
      ...(left.layout ?? {}),
      ...(right.layout ?? {}),
      fieldOverrides: {
        ...(left.layout?.fieldOverrides ?? {}),
        ...(right.layout?.fieldOverrides ?? {}),
      },
    },
    nestedFields: {
      ...(left.nestedFields ?? {}),
      ...(right.nestedFields ?? {}),
    },
    actions: {
      ...(left.actions ?? {}),
      ...(right.actions ?? {}),
      permissions: {
        ...(left.actions?.permissions ?? {}),
        ...(right.actions?.permissions ?? {}),
      },
      updateForm: {
        ...(left.actions?.updateForm ?? {}),
        ...(right.actions?.updateForm ?? {}),
      },
    },
    queryOptions: {
      ...(left.queryOptions ?? {}),
      ...(right.queryOptions ?? {}),
    },
  };
}

/**
 * Applies row-detail ModelForm overrides to ModelDynamicDetail update-form config.
 */
function applyDetailFormOverridesToBaseDetail(
  baseDetail: ModelDynamicDetailConfig<any>,
  formOverrides: ModelTableDetailFormOverrides<any>,
): ModelDynamicDetailConfig<any> {
  const existingModelFormProps = (baseDetail.actions?.updateForm
    ?.modelFormProps ?? {}) as ModelTableDetailFormOverrides<any>;
  const mergedModelFormProps = mergeModelFormOverrides(
    existingModelFormProps,
    formOverrides,
  ) as ModelTableDetailFormOverrides<any>;

  return {
    ...baseDetail,
    actions: {
      ...(baseDetail.actions ?? {}),
      updateForm: {
        ...(baseDetail.actions?.updateForm ?? {}),
        modelFormProps: mergedModelFormProps,
      },
    },
  };
}

/**
 * Resolves update overlay title from static text/callback with a safe fallback.
 */
function resolveUpdateTitle(
  title: ModelTableUpdateConfig<any>["title"],
  context: ModelTableUpdateContext<any>,
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
 * Resolves detail overlay title from static text/callback with a safe fallback.
 */
function resolveDetailTitle(
  title: ModelTableDetailConfig<any>["title"],
  context: ModelTableDetailContext<any>,
): React.ReactNode {
  if (typeof title === "function") {
    return title(context);
  }
  if (title !== undefined && title !== null) {
    return title;
  }
  return `Details ${context.metadata?.verboseName ?? context.model}`;
}

/**
 * Replaces`:id` placeholders in link templates with encoded row identifiers.
 */
function buildHrefFromTemplate(template: string, rowId: string): string {
  return template.replace(/:id\b/g, encodeURIComponent(rowId));
}

type RowActionsProps<TSource extends object = Record<string, unknown>> = {
  row: DynamicModelTableRow<TSource>;
  data: DynamicModelTableRow<TSource>[];
  refetch?: BaseModelTableRefetch;
  permissions?: RowMutationPermissions | null;
  columnActions?: BaseModelTableColumnActionsInput<DynamicModelTableRow<TSource>>;
  update?: ModelTableUpdateConfig<TSource>;
  detail?: ModelTableDetailConfig<TSource>;
  onTemplatePdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
};

export function RowActions<TSource extends object = Record<string, unknown>>({
  row,
  data,
  refetch,
  permissions,
  columnActions,
  update,
  detail,
  onTemplatePdfPreview,
}: RowActionsProps<TSource>) {
  const { app, model, metadata } = useMetadata();
  const { refresh } = useTable();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  const baseMutations = metadata?.mutations ?? [];
  const baseDeleteMutation = findMutation(baseMutations, "delete");
  const baseUpdateMutation = findMutation(baseMutations, "update");
  const modelPermissions = metadata?.permissions;
  const canDeleteByMutation = baseDeleteMutation?.allowed;
  const canUpdateByMutation = baseUpdateMutation?.allowed;
  const detailUsesUpdateLink = (update?.type ?? "drawer") === "link";
  const canDelete =
    !!rowId &&
    (permissions?.canDelete ??
      canDeleteByMutation ??
      modelPermissions?.canDelete ??
      true);
  const canEdit =
    permissions?.canUpdate ??
    canUpdateByMutation ??
    modelPermissions?.canUpdate ??
    true;
  const canDetail =
    !!rowId &&
    (detailUsesUpdateLink ? canEdit : (modelPermissions?.canRetrieve ?? true));

  const updateContext = useMemo<ModelTableUpdateContext<TSource>>(
    () => ({
      app,
      model,
      row,
      rowId,
      metadata: metadata ?? undefined,
    }),
    [app, metadata, model, row, rowId],
  );

  const detailContext = useMemo<ModelTableDetailContext<TSource>>(
    () => ({
      app,
      model,
      row,
      rowId,
      metadata: metadata ?? undefined,
    }),
    [app, metadata, model, row, rowId],
  );

  const resolvedUpdateConfig = useMemo<ResolvedUpdateConfig<TSource>>(() => {
    const resolvedObjectId =
      update?.resolveObjectId?.(updateContext) ?? update?.objectId ?? rowId;
    const objectIdValue =
      resolvedObjectId === undefined || resolvedObjectId === null
        ? ""
        : String(resolvedObjectId);
    const globalOverrides = update?.form;
    const perRowOverrides = update?.resolveFormProps?.(updateContext);
    const mergedOverrides = mergeModelFormOverrides(
      globalOverrides,
      perRowOverrides,
    ) as ModelTableUpdateFormOverrides<TSource>;
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

  const resolvedDetailConfig = useMemo<ResolvedDetailConfig<TSource>>(() => {
    const resolvedObjectId =
      detail?.resolveObjectId?.(detailContext) ?? detail?.objectId ?? rowId;
    const objectIdValue =
      resolvedObjectId === undefined || resolvedObjectId === null
        ? ""
        : String(resolvedObjectId);
    const globalOverrides = detail?.form;
    const perRowOverrides = detail?.resolveFormProps?.(detailContext);
    const mergedOverrides = mergeModelFormOverrides(
      globalOverrides,
      perRowOverrides,
    ) as ModelTableDetailFormOverrides<TSource>;
    const globalBaseDetail = detail?.baseDetail;
    const perRowBaseDetail = detail?.resolveBaseDetail?.(detailContext);
    const mergedBaseDetail = mergeModelDynamicDetailConfig(
      globalBaseDetail,
      perRowBaseDetail,
    );
    const mergedBaseDetailWithFormOverrides =
      applyDetailFormOverridesToBaseDetail(mergedBaseDetail, mergedOverrides);

    return {
      type: detail?.type ?? "drawer",
      title: resolveDetailTitle(detail?.title, detailContext),
      width: detail?.width,
      height: detail?.height,
      drawerDirection: detail?.drawerDirection ?? "right",
      objectIdValue,
      hrefTemplate: detail?.hrefTemplate,
      baseDetail: mergedBaseDetailWithFormOverrides,
      formOverrides: mergedOverrides,
    };
  }, [detail, detailContext]);

  const detailLinkTemplate = resolvedDetailConfig.hrefTemplate;

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

  const detailDisabledReason = useMemo(() => {
    if (!canDetail) {
      return "Permission de consultation indisponible.";
    }
    if (!resolvedDetailConfig.objectIdValue) {
      return "Cette ligne ne possede pas d'identifiant valide.";
    }
    if (detailUsesUpdateLink && !detailLinkTemplate) {
      return "Configuration detail.link manquante (hrefTemplate).";
    }
    return null;
  }, [
    canDetail,
    detailLinkTemplate,
    detailUsesUpdateLink,
    resolvedDetailConfig.objectIdValue,
  ]);

  const actionContext = useMemo<BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>>(
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
  const destructiveCustomActions = useMemo(
    () => customActions.filter((action) => action.variant === "destructive"),
    [customActions],
  );
  const menuCustomActions = useMemo(
    () => customActions.filter((action) => action.variant !== "destructive"),
    [customActions],
  );
  const customMutationMenuActions = useMemo<CustomMutationsDropdownExtraAction[]>(
    () =>
      menuCustomActions.map((action, index) => {
        const key = action.key ?? `custom-row-action-${index}`;

        if (typeof (action as { render?: unknown }).render === "function") {
          const renderAction = (
            action as {
              render: (
                context: BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>,
              ) => React.ReactNode;
            }
          ).render;

          return {
            key,
            content: renderAction(actionContext),
          };
        }

        const clickAction = action as {
          onClick: (
            context: BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>,
          ) => void | Promise<void>;
          label?: string;
        };

        return {
          key,
          label: clickAction.label ?? "Action",
          icon: action.icon ?? <ExternalLink className="h-4 w-4" />,
          variant: action.variant,
          disabled: action.disabled,
          className: cn(action.className),
          onClick: () => {
            void Promise.resolve(clickAction.onClick(actionContext)).catch(
              (error: unknown) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Échec de l'action personnalisée.";
                toast.error(message);
              },
            );
          },
        };
      }),
    [actionContext, menuCustomActions],
  );

  const hasTemplateActions = templateEntries.length > 0;
  const singleTemplate =
    templateEntries.length === 1 ? templateEntries[0] : null;
  const singleTemplateDisabledReason = singleTemplate
    ? singleTemplate.allowed === false
      ? singleTemplate.denialReason || "Accès refusé"
      : !rowId
        ? "ID manquant"
        : null
    : null;
  const singleTemplateLabel = singleTemplate
    ? singleTemplate.title || singleTemplate.key || "Template"
    : "Template";
  const hasBuiltinActions = canDetail || canEdit || canDelete;
  const hasMetadataMutationActions = useMemo(
    () =>
      (metadata?.mutations ?? []).some(
        (mutation) =>
          !!mutation &&
          typeof mutation === "object" &&
          normalizeMutationType(mutation) === "custom",
      ),
    [metadata?.mutations],
  );
  const hasCustomActions =
    destructiveCustomActions.length > 0 || customMutationMenuActions.length > 0;
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
      const href = buildHrefFromTemplate(
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
   * Executes detail action according to configured presentation mode.
   */
  const handleDetail = useCallback(() => {
    if (detailDisabledReason) {
      toast.error(detailDisabledReason);
      return;
    }

    if (detailUsesUpdateLink) {
      const template = detailLinkTemplate ?? "";
      const href = buildHrefFromTemplate(
        template,
        resolvedDetailConfig.objectIdValue,
      );
      navigate(href);
      return;
    }

    setDetailDialogOpen(true);
  }, [
    detailDisabledReason,
    detailLinkTemplate,
    detailUsesUpdateLink,
    navigate,
    resolvedDetailConfig.objectIdValue,
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

  const runCustomAction = (
    onClick: (
      context: BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>,
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

  const updateFormProps = useMemo<
    ModelFormProps<ResolvedUpdateFormValues<TSource>, TSource>
  >(() => {
    const overrides = resolvedUpdateConfig.formOverrides;
    const formPropsLayout =
      (overrides.formProps?.layout as Record<string, unknown> | undefined) ??
      {};

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

  const detailViewProps = useMemo<ModelDynamicDetailProps<TSource>>(
    () => ({
      app,
      model,
      id: resolvedDetailConfig.objectIdValue,
      baseDetail: resolvedDetailConfig.baseDetail,
    }),
    [
      app,
      model,
      resolvedDetailConfig.baseDetail,
      resolvedDetailConfig.objectIdValue,
    ],
  );

  if (!hasAnyActions) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="group/actions flex items-center justify-end gap-1 opacity-50 transition-opacity duration-200 group-hover/row:opacity-100">
        {destructiveCustomActions.length > 0 ? (
          <div className="flex items-center gap-1">
            {destructiveCustomActions.map((action, index) => {
              const key = action.key ?? `custom-row-destructive-action-${index}`;
              if (typeof (action as { render?: unknown }).render === "function") {
                const renderAction = (
                  action as {
                    render: (
                      context: BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>,
                    ) => React.ReactNode;
                  }
                ).render;

                return (
                  <DropdownMenu key={key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={String(action.label ?? action.key ?? "Action")}
                            className={cn(
                              "size-6 bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-95",
                              action.className,
                            )}
                            disabled={action.disabled}
                          >
                            {action.icon ?? <MoreHorizontal className="h-3.5 w-3.5" />}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="bg-rose-600 text-white font-bold uppercase text-[8px] tracking-widest">
                        {String(action.label ?? action.key ?? "Action")}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 border-border/30 p-1 shadow-xl backdrop-blur-xl bg-background/95"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        <MoreHorizontal className="h-3 w-3" />
                        {String(action.label ?? action.key ?? "Action")}
                      </DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5 p-0.5">
                        {renderAction(actionContext)}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              const clickAction = action as {
                onClick: (
                  context: BaseModelTableColumnActionContext<DynamicModelTableRow<TSource>>,
                ) => void | Promise<void>;
                label?: string;
              };

              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={clickAction.label ?? "Action"}
                      className={cn(
                        "size-6 bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-95 disabled:grayscale",
                        action.className,
                      )}
                      onClick={() => runCustomAction(clickAction.onClick)}
                      disabled={action.disabled}
                    >
                      {action.icon ?? <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-rose-600 text-white font-bold uppercase text-[8px] tracking-widest">
                    {clickAction.label ?? "Action"}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ) : null}

        {canDetail ? (
          <Tooltip>
            <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Details"
                  className="size-6 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 transition-all hover:bg-cyan-500 hover:text-white active:scale-95"
                  onClick={handleDetail}
                  disabled={Boolean(detailDisabledReason)}
                >
                <Info className="h-3.5 w-3.5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-cyan-600 text-white font-bold uppercase text-[8px] tracking-widest">
              {detailDisabledReason ?? "Details"}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {canEdit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Modifier"
                className="size-6 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-500 hover:text-white active:scale-95"
                onClick={handleEdit}
                disabled={Boolean(editDisabledReason)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-blue-600 text-white font-bold uppercase text-[8px] tracking-widest">
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
                className="size-6 bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-95 disabled:grayscale"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-rose-600 text-white font-bold uppercase text-[8px] tracking-widest">
              Supprimer
            </TooltipContent>
          </Tooltip>
        ) : null}

        {hasTemplateActions ? (
          singleTemplate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <ModelTemplateAction
                  data={{
                    app,
                    model,
                    funcName: singleTemplate.key,
                    objectId: rowId,
                  }}
                  onPdfPreview={onTemplatePdfPreview}
                  renderTrigger={({ run, disabled }) => (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Template: ${singleTemplateLabel}`}
                      className="size-6 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white active:scale-95"
                      disabled={
                        Boolean(singleTemplateDisabledReason) || disabled
                      }
                      onClick={run}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-emerald-600 text-white font-bold uppercase text-[8px] tracking-widest">
                {singleTemplateDisabledReason ?? singleTemplateLabel}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <ModelTemplatesDropdown
                  data={{
                    app,
                    model,
                    objectId: rowId,
                  }}
                  onPdfPreview={onTemplatePdfPreview}
                  renderTrigger={({ disabled }) => (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Templates"
                      disabled={disabled}
                      className="size-6 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white active:scale-95"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-emerald-600 text-white font-bold uppercase text-[8px] tracking-widest">
                Templates
              </TooltipContent>
            </Tooltip>
          )
        ) : null}

        {hasMetadataMutationActions || customMutationMenuActions.length > 0 ? (
          <CustomMutationsDropdown
            data={{
              app,
              model,
              objectId: rowId,
            }}
            button={{
              label: "Actions",
            }}
            extraActions={customMutationMenuActions}
            renderTrigger={() => (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Actions"
                className="size-6 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500 hover:text-white active:scale-95"
              >
                <Zap className="h-3.5 w-3.5" />
              </Button>
            )}
          />
        ) : null}
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[400px] border-border/30 shadow-2xl overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
          {/* Accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center bg-rose-500/10">
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
              <AlertDialogCancel className="h-10 flex-1 border-border/30 bg-muted/30 font-bold text-xs uppercase tracking-wider transition-all hover:bg-muted/50 active:scale-95">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 flex-1 bg-rose-500 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95 disabled:grayscale"
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
          <Suspense
            fallback={
              <div className="flex min-h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            }
          >
            <LazyModelForm {...updateFormProps} />
          </Suspense>
        </FormOverlay>
      ) : null}
      {resolvedDetailConfig.type !== "link" ? (
        <FormOverlay
          mode={resolvedDetailConfig.type === "modal" ? "modal" : "drawer"}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          title={resolvedDetailConfig.title}
          width={resolvedDetailConfig.width}
          height={resolvedDetailConfig.height}
          drawerDirection={resolvedDetailConfig.drawerDirection}
        >
          <Suspense
            fallback={
              <div className="flex min-h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            }
          >
            <LazyModelDynamicDetail {...detailViewProps} />
          </Suspense>
        </FormOverlay>
      ) : null}
    </TooltipProvider>
  );
}
