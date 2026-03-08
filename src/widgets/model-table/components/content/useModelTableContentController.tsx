import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import type { ModelFormMutationOutcome } from "@/widgets/model-form/types/generatedContract";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import type { TemplateInfo } from "../../types";
import type {
  ModelTableCreateConfig,
  ModelTableCreateContext,
  ModelTableCreateFormOverrides,
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
  ModelTableV2TopAction,
  ModelTableV2TopActionsInput,
} from "../../config/types";
import { findMutation } from "../../utils";
import {
  buildTemplateClientSchema,
  executeTemplateForRows,
  normalizeTemplateType,
  parseTemplateClientFields,
  type TemplatePdfPreviewPayload,
} from "../../utils/templateExecution";
import type {
  ModelTableContentControllerState,
  ModelTableContentTopAction,
} from "./types";

/**
 * Input contract for the model-table content controller hook.
 */
export type UseModelTableContentControllerInput = {
  /** Optional filter-panel configuration. */
  filterPanel?: ModelTableFilterPanelProps;
  /** Optional create-action configuration. */
  create?: ModelTableCreateConfig;
  /** Optional table configuration object. */
  tableConfig?: ModelTableV2TableConfig;
  /** Enables toolbar quick search behavior. */
  quickSearch?: boolean;
  /** Optional field configuration for toolbar selectors. */
  fields?: import("../../types").BaseModelTableFieldsInput;
  /** Enables reverse relationship fields in default table surfaces. */
  showReversed?: boolean;
  /** Enables synthetic count fields in default table surfaces. */
  showCount?: boolean;
  /** Optional custom top-actions input. */
  topActions?: ModelTableV2TopActionsInput;
  /** Optional PDF preview hook for template-generated PDFs. */
  onTemplatePdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
};

type CreateFormValues = Record<string, unknown>;

/**
 * Normalized create-action configuration resolved for one table instance.
 */
type ResolvedCreateConfig = {
  type: "drawer" | "modal" | "link";
  title: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection: "left" | "right" | "top" | "bottom";
  hrefTemplate?: string;
  closeOnSuccess: boolean;
  refetchOnSuccess: boolean;
  formOverrides: ModelTableCreateFormOverrides;
};

/**
 * Returns a human-readable "time ago" label in minutes.
 */
function formatTimeAgo(lastUpdated: Date): string {
  const diffMinutes = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
  if (diffMinutes < 1) {
    return "a l'instant";
  }
  return `il y a ${diffMinutes} min`;
}

/**
 * Filters valid selected row IDs from arbitrary row payloads.
 */
function extractSelectedRowIds(rows: Record<string, unknown>[]): string[] {
  return rows
    .map((row) => String(row.id))
    .filter((id) => id !== "undefined" && id !== "null");
}

/**
 * Merges two optional ModelForm override records.
 */
function mergeModelFormOverrides(
  base: ModelTableCreateFormOverrides | undefined,
  extra: ModelTableCreateFormOverrides | undefined,
): ModelTableCreateFormOverrides {
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
 * Resolves create overlay title from static text/callback with safe fallback.
 */
function resolveCreateTitle(
  title: ModelTableCreateConfig["title"],
  context: ModelTableCreateContext,
): React.ReactNode {
  if (typeof title === "function") {
    return title(context);
  }
  if (title !== undefined && title !== null) {
    return title;
  }
  return `Ajouter ${context.metadata?.verboseName ?? context.model}`;
}

/**
 * Replaces create link placeholders with encoded app/model values.
 */
function buildCreateHrefFromTemplate(
  template: string,
  context: Pick<ModelTableCreateContext, "app" | "model">,
): string {
  return template
    .replace(/:app\b/g, encodeURIComponent(context.app))
    .replace(/:model\b/g, encodeURIComponent(context.model));
}

/**
 * Builds the full content view-model used by composed table content slots.
 */
export function useModelTableContentController({
  filterPanel,
  create,
  tableConfig,
  quickSearch,
  fields,
  showReversed,
  showCount,
  topActions,
  onTemplatePdfPreview,
}: UseModelTableContentControllerInput): ModelTableContentControllerState {
  const {
    metadata,
    app,
    model,
    actionBootstrapLoading,
    actionDetailsLoading,
    actionDetailsLoaded,
    ensureActionDetailsLoaded,
  } = useMetadata();
  const tableState = useTable();
  const data = tableState.data ?? [];
  const queryPage = tableState.queryPage;
  const rowSelection = tableState.rowSelection ?? {};
  const pagination = tableState.pagination ?? {
    total: 0,
    page: 1,
    perPage: 25,
    numPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalKnown: false,
  };
  const setRowSelection =
    tableState.setRowSelection ??
    ((_selection: Record<string, boolean>) => undefined);
  const refresh = tableState.refresh ?? (() => undefined);
  const loading = tableState.loading ?? false;
  const navigate = useNavigate();

  const [printTemplate, setPrintTemplate] = useState<TemplateInfo | null>(null);
  const [printTemplateRowIds, setPrintTemplateRowIds] = useState<string[]>([]);
  const [printTemplateSchema, setPrintTemplateSchema] =
    useState<FormSchema | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading]);

  const resolvedTitle =
    tableConfig?.title ||
    metadata?.verboseNamePlural ||
    metadata?.model ||
    model;
  const totalCount = queryPage?.pageInfo?.totalCount ?? pagination.total;

  const selectedRows = useMemo(
    () => data.filter((row) => !!rowSelection[String(row.id)]),
    [data, rowSelection],
  );

  const selectedRowIds = useMemo(
    () => extractSelectedRowIds(selectedRows),
    [selectedRows],
  );

  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const createMutation = findMutation(metadata?.mutations, "create");
  const canCreate =
    createMutation?.allowed ?? metadata?.permissions?.canCreate ?? false;
  const createCapabilitiesPending =
    actionBootstrapLoading &&
    createMutation?.allowed === undefined &&
    metadata?.permissions?.canCreate === undefined;

  const createContext = useMemo<ModelTableCreateContext>(
    () => ({
      app,
      model,
      metadata: metadata ?? undefined,
      selectedRows,
      selectionState: rowSelection,
    }),
    [app, metadata, model, rowSelection, selectedRows],
  );

  const resolvedCreateConfig = useMemo<ResolvedCreateConfig>(() => {
    const globalOverrides = create?.form;
    const runtimeOverrides = create?.resolveFormProps?.(createContext);
    const mergedOverrides = mergeModelFormOverrides(
      globalOverrides,
      runtimeOverrides,
    );
    return {
      type: create?.type ?? "drawer",
      title: resolveCreateTitle(create?.title, createContext),
      width: create?.width,
      height: create?.height,
      drawerDirection: create?.drawerDirection ?? "right",
      hrefTemplate: create?.hrefTemplate,
      closeOnSuccess: create?.closeOnSuccess ?? true,
      refetchOnSuccess: create?.refetchOnSuccess ?? true,
      formOverrides: mergedOverrides,
    };
  }, [create, createContext]);

  /**
   * Handles successful create submissions by closing the popup and refreshing rows.
   */
  const handleCreateSubmitResult = useCallback(
    (outcome: ModelFormMutationOutcome) => {
      if (!outcome.ok) {
        return;
      }

      if (resolvedCreateConfig.closeOnSuccess) {
        setCreateDialogOpen(false);
      }

      if (!resolvedCreateConfig.refetchOnSuccess) {
        return;
      }

      try {
        refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de recharger la table apres creation.";
        toast.error(message);
      }
    },
    [
      refresh,
      resolvedCreateConfig.closeOnSuccess,
      resolvedCreateConfig.refetchOnSuccess,
    ],
  );

  const createFormProps =
    useMemo<ModelFormProps<CreateFormValues> | null>(() => {
      if (resolvedCreateConfig.type === "link") {
        return null;
      }

      const overrides = resolvedCreateConfig.formOverrides;
      const formPropsLayout =
        (overrides.formProps?.layout as Record<string, unknown> | undefined) ??
        {};

      return {
        app,
        model,
        mode: "create",
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
        onSubmitResult: handleCreateSubmitResult,
      };
    }, [app, handleCreateSubmitResult, model, resolvedCreateConfig]);

  const addAction = useMemo<ModelTableV2TopAction>(() => {
    return {
      key: "add",
      label: tableConfig?.addLabel ?? "Ajouter",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      loading: createCapabilitiesPending,
      variant: "default",
      size: "sm",
      order: -1,
      show_when: "always",
      disabled: !canCreate,
      disabledReason: canCreate
        ? undefined
        : createCapabilitiesPending
          ? "Chargement des capacites de creation..."
          : "Creation non autorisee.",
      on_click: () => {
        if (!canCreate) {
          return;
        }
        if (resolvedCreateConfig.type === "link") {
          if (!resolvedCreateConfig.hrefTemplate) {
            toast.error("Configuration create.link manquante (hrefTemplate).");
            return;
          }
          navigate(
            buildCreateHrefFromTemplate(
              resolvedCreateConfig.hrefTemplate,
              createContext,
            ),
          );
          return;
        }
        setCreateDialogOpen(true);
      },
    };
  }, [
    canCreate,
    createCapabilitiesPending,
    createContext,
    navigate,
    resolvedCreateConfig.hrefTemplate,
    resolvedCreateConfig.type,
    tableConfig?.addLabel,
  ]);

  const importAction = useMemo<ModelTableV2TopAction>(
    () => ({
      key: "import",
      label: "Importer",
      icon: <Upload className="mr-2 h-4 w-4" />,
      variant: "outline",
      size: "sm",
      order: 0,
      show_when: "always",
      on_click: () => {
        const params = new URLSearchParams({ app, model });
        navigate(`/model-import?${params.toString()}`);
      },
    }),
    [app, model, navigate],
  );

  /**
   * Resets print-dialog state after submit or cancel.
   */
  const closePrintDialog = useCallback(() => {
    setPrintTemplate(null);
    setPrintTemplateRowIds([]);
    setPrintTemplateSchema(null);
  }, []);

  /**
   * Runs one template extraction operation and surfaces toast feedback.
   */
  const runTemplate = useCallback(
    async (
      template: TemplateInfo,
      rowIds: string[],
      clientData: Record<string, unknown> = {},
    ) => {
      const result = await executeTemplateForRows(
        template,
        rowIds,
        clientData,
        {
          onPdfPreview: onTemplatePdfPreview
            ? (payload) =>
                onTemplatePdfPreview({
                  ...payload,
                  onRefresh: () => runTemplate(template, rowIds, clientData),
                })
            : undefined,
        },
      );
      toast.success(
        `${result.count} extractions terminees (${normalizeTemplateType(template).toUpperCase()}).`,
        {
          icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
        },
      );
    },
    [onTemplatePdfPreview],
  );

  /**
   * Opens client-input dialog when required, otherwise runs extraction directly.
   */
  const runTemplateForRows = useCallback(
    (template: TemplateInfo, rows: Record<string, unknown>[]) => {
      if (template.allowed === false) {
        toast.error(template.denialReason ?? "Template non autorise.");
        return;
      }
      const rowIds = extractSelectedRowIds(rows);
      if (!rowIds.length) {
        toast.error("Selectionnez au moins une ligne.");
        return;
      }

      const clientFields = parseTemplateClientFields(template);
      if (clientFields.length > 0) {
        setPrintTemplate(template);
        setPrintTemplateRowIds(rowIds);
        setPrintTemplateSchema(buildTemplateClientSchema(clientFields));
        return;
      }

      void runTemplate(template, rowIds).catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Erreur d'extraction.",
        );
      });
    },
    [runTemplate],
  );

  const templateEntries = useMemo(
    () =>
      (metadata?.templates ?? []).filter(
        (entry): entry is TemplateInfo => !!entry && typeof entry === "object",
      ),
    [metadata?.templates],
  );

  useEffect(() => {
    if (!hasSelection) return;
    if (templateEntries.length > 0) return;
    if (actionDetailsLoaded || actionDetailsLoading) return;
    void ensureActionDetailsLoaded();
  }, [
    actionDetailsLoaded,
    actionDetailsLoading,
    ensureActionDetailsLoaded,
    hasSelection,
    templateEntries.length,
  ]);

  const templateCapabilitiesPending =
    actionDetailsLoading && templateEntries.length === 0;

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

  const resolvedTopActions = useMemo<ModelTableContentTopAction[]>(() => {
    const userActions =
      typeof topActions === "function"
        ? topActions({
            app,
            model,
            metadata,
            items: data,
            selected_rows: selectedRows,
            selection_state: rowSelection,
          })
        : topActions;

    const combined = [...(userActions ?? [])];
    combined.unshift(importAction);
    if (addAction) {
      combined.unshift(addAction);
    }

    return combined
      .map((action) => ({
        ...action,
        disabled:
          Boolean(action.disabled) ||
          Boolean(action.loading) ||
          (action.show_when === "has_selection" && !hasSelection),
      }))
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  }, [
    addAction,
    app,
    data,
    hasSelection,
    importAction,
    metadata,
    model,
    rowSelection,
    selectedRows,
    topActions,
  ]);

  /**
   * Executes one resolved top action with current selection context.
   */
  const handleTopActionClick = useCallback(
    (action: ModelTableContentTopAction) => {
      if (action.disabled) {
        return;
      }
      action.on_click({
        selected_rows: selectedRows,
        selection_state: rowSelection,
      });
    },
    [rowSelection, selectedRows],
  );

  /**
   * Clears all row selections.
   */
  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, [setRowSelection]);

  /**
   * Handles current bulk-delete UX flow.
   */
  const confirmBulkDelete = useCallback(() => {
    console.info("Bulk delete confirmed", selectedRowIds);
    setBulkDeleteDialogOpen(false);
    clearSelection();
    toast.success(`${selectedCount} elements supprimes.`);
  }, [clearSelection, selectedCount, selectedRowIds]);

  /**
   * Submits print dialog payload and dispatches extraction.
   */
  const submitPrintDialog = useCallback(
    (values: Record<string, unknown>) => {
      if (!printTemplate || !printTemplateRowIds.length) {
        return;
      }
      const currentTemplate = printTemplate;
      const rowIds = printTemplateRowIds;
      closePrintDialog();
      void runTemplate(currentTemplate, rowIds, values).catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Erreur d'extraction.",
        );
      });
    },
    [closePrintDialog, printTemplate, printTemplateRowIds, runTemplate],
  );

  return {
    app,
    model,
    metadata,
    capabilitiesLoaded: actionDetailsLoaded,
    templateCapabilitiesPending,
    filterPanel,
    tableConfig,
    quickSearch,
    fields,
    showReversed,
    showCount,
    loading,
    resolvedTitle,
    totalCount,
    timeAgo: formatTimeAgo(lastUpdated),
    rowSelection,
    selectedRows,
    selectedRowIds,
    selectedCount,
    hasSelection,
    resolvedTopActions,
    pdfTemplates,
    excelTemplates,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    printDialogOpen: Boolean(printTemplate && printTemplateSchema),
    printDialogTitle: printTemplate?.title ?? "Parametres d'extraction",
    printDialogSchema: printTemplateSchema ?? { fields: [] },
    printDialogSubmitLabel:
      printTemplate && normalizeTemplateType(printTemplate) === "excel"
        ? "Telecharger"
        : "Generer",
    createDialogOpen:
      resolvedCreateConfig.type === "link" ? false : createDialogOpen,
    setCreateDialogOpen,
    createOverlayMode:
      resolvedCreateConfig.type === "modal" ? "modal" : "drawer",
    createOverlayTitle: resolvedCreateConfig.title,
    createOverlayWidth: resolvedCreateConfig.width,
    createOverlayHeight: resolvedCreateConfig.height,
    createOverlayDrawerDirection: resolvedCreateConfig.drawerDirection,
    createFormProps,
    handleTopActionClick,
    triggerRefresh: refresh,
    clearSelection,
    runTemplateForRows,
    closePrintDialog,
    submitPrintDialog,
    confirmBulkDelete,
  };
}
