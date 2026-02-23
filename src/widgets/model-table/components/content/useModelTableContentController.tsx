import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import { useMetadata } from "../../context/MetadataContext";
import { useTable } from "../../context/TableContext";
import type { TemplateInfo } from "../../types";
import type {
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
  /** Optional table configuration object. */
  tableConfig?: ModelTableV2TableConfig;
  /** Enables toolbar quick search behavior. */
  quickSearch?: boolean;
  /** Optional field configuration for toolbar selectors. */
  fields?: import("../../types").BaseModelTableFieldsInput;
  /** Optional custom top-actions input. */
  topActions?: ModelTableV2TopActionsInput;
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
 * Builds the full content view-model used by composed table content slots.
 */
export function useModelTableContentController({
  filterPanel,
  tableConfig,
  quickSearch,
  fields,
  topActions,
}: UseModelTableContentControllerInput): ModelTableContentControllerState {
  const { metadata, app, model } = useMetadata();
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

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading]);

  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model || model;
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
  const canCreate = Boolean(createMutation?.allowed);

  const addAction = useMemo<ModelTableV2TopAction | undefined>(() => {
    if (!canCreate) {
      return undefined;
    }
    return {
      key: "add",
      label: tableConfig?.addLabel ?? "Ajouter",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      variant: "default",
      size: "sm",
      order: -1,
      show_when: "always",
      on_click: () => {
        console.info("add item");
      },
    };
  }, [canCreate, tableConfig?.addLabel]);

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
      const result = await executeTemplateForRows(template, rowIds, clientData);
      toast.success(
        `${result.count} extractions terminees (${normalizeTemplateType(template).toUpperCase()}).`,
        {
          icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
        },
      );
    },
    [],
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

  const pdfTemplates = useMemo(
    () => templateEntries.filter((template) => normalizeTemplateType(template) === "pdf"),
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
        disabled: action.show_when === "has_selection" && !hasSelection,
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
    filterPanel,
    tableConfig,
    quickSearch,
    fields,
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
    handleTopActionClick,
    triggerRefresh: refresh,
    clearSelection,
    runTemplateForRows,
    closePrintDialog,
    submitPrintDialog,
    confirmBulkDelete,
  };
}
