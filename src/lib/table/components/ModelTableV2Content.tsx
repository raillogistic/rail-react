import React from "react";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import type { FormSchema } from "@/lib/form/inputs/types";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import type { TemplateInfo } from "../types";
import { findMutation } from "../utils";
import {
  buildTemplateClientSchema,
  executeTemplateForRows,
  normalizeTemplateType,
  parseTemplateClientFields,
} from "../utils/templateExecution";
import { TableToolbar } from "./TableToolbar";
import { PrintDialog } from "./ModelTableOverlays";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
  ModelTableV2TopAction,
  ModelTableV2TopActionsInput,
} from "../config/types";

type ModelTableV2ContentProps = {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
};

function getTemplateDisabledReason(
  template: TemplateInfo,
  hasSelection: boolean,
): string | null {
  if (template.allowed === false) {
    return (
      template.denialReason ||
      "You do not have permission to use this template."
    );
  }
  if (!hasSelection) {
    return "Select at least one row.";
  }
  return null;
}

export function ModelTableV2Content({
  filterPanel,
  tableConfig,
  quickSearch,
  topActions,
}: ModelTableV2ContentProps) {
  const { metadata, app, model } = useMetadata();
  const { data, rowSelection } = useTable();
  const navigate = useNavigate();
  const [printTemplate, setPrintTemplate] = React.useState<TemplateInfo | null>(
    null,
  );
  const [printTemplateRowIds, setPrintTemplateRowIds] = React.useState<string[]>(
    [],
  );
  const [printTemplateSchema, setPrintTemplateSchema] =
    React.useState<FormSchema | null>(null);
  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;

  const selectedRows = React.useMemo(
    () =>
      data.filter((row) => {
        const rowId = String(row.id);
        return !!rowSelection[rowId];
      }),
    [data, rowSelection],
  );

  const selectedRowIds = React.useMemo(
    () =>
      selectedRows
        .map((row) => row.id)
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map((value) => String(value)),
    [selectedRows],
  );

  const createMutation = findMutation(metadata?.mutations, "create");
  const canCreate = !!createMutation?.allowed;

  const addAction = React.useMemo<ModelTableV2TopAction | undefined>(() => {
    if (!canCreate) return undefined;

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

  const importAction = React.useMemo<ModelTableV2TopAction>(() => {
    return {
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
    };
  }, [app, model, navigate]);

  const closePrintDialog = React.useCallback(() => {
    setPrintTemplate(null);
    setPrintTemplateRowIds([]);
    setPrintTemplateSchema(null);
  }, []);

  const runTemplate = React.useCallback(
    async (
      template: TemplateInfo,
      rowIds: string[],
      clientData: Record<string, unknown> = {},
    ) => {
      const result = await executeTemplateForRows(template, rowIds, clientData);
      if (result.count > 1) {
        if (result.templateType === "pdf") {
          toast.success(`Merged PDF downloaded for ${result.count} rows.`);
        } else {
          toast.success(`Combined workbook downloaded for ${result.count} rows.`);
        }
        return;
      }
      if (result.templateType === "pdf") {
        toast.success(`Template "${template.title}" generated.`);
      } else {
        toast.success(`Template "${template.title}" downloaded.`);
      }
    },
    [],
  );

  const openTemplateAction = React.useCallback(
    (template: TemplateInfo, rows: Record<string, unknown>[]) => {
      if (!rows.length) {
        toast.error("Select at least one row.");
        return;
      }

      const rowIds = rows
        .map((row) => row.id)
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map((value) => String(value));

      if (!rowIds.length) {
        toast.error("The selected rows do not contain valid identifiers.");
        return;
      }

      if (template.allowed === false) {
        toast.error(
          template.denialReason ||
            "You do not have permission to use this template.",
        );
        return;
      }

      const clientFields = parseTemplateClientFields(template);
      if (clientFields.length > 0) {
        setPrintTemplate(template);
        setPrintTemplateRowIds(rowIds);
        setPrintTemplateSchema(buildTemplateClientSchema(clientFields));
        return;
      }

      void runTemplate(template, rowIds).catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Failed to generate template.";
        toast.error(message);
      });
    },
    [runTemplate],
  );

  const templateEntries = React.useMemo(
    () =>
      (metadata?.templates ?? []).filter(
        (entry): entry is TemplateInfo => !!entry && typeof entry === "object",
      ),
    [metadata?.templates],
  );

  const hasSelection = selectedRowIds.length > 0;

  const resolvedTopActions = React.useMemo(() => {
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
      .map((action) => {
        const requiresSelection = action.show_when === "has_selection";
        const disabledBySelection = requiresSelection && !hasSelection;
        const disabled = Boolean(action.disabled) || disabledBySelection;
        const disabledReason =
          action.disabledReason ??
          (disabledBySelection ? "Select at least one row." : undefined);
        const dataAttributes = disabledReason
          ? { ...(action.dataAttributes ?? {}), title: disabledReason }
          : action.dataAttributes;
        return {
          ...action,
          disabled,
          disabledReason,
          dataAttributes,
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          {showTitle && resolvedTitle && (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {resolvedTitle}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {resolvedTopActions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant ?? "outline"}
                size={action.size === "icon" ? "icon" : "sm"}
                className={action.size === "icon" ? "h-8 w-8" : "h-8"}
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) return;
                  action.on_click({
                    selected_rows: selectedRows,
                    selection_state: rowSelection,
                  });
                }}
                {...(action.dataAttributes ?? {})}
              >
                {action.icon}
                {action.size === "icon" ? null : <span>{action.label}</span>}
              </Button>
            ))}

            {templateEntries.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    data-testid="templates-dropdown-trigger"
                  >
                    Templates
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Template Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {templateEntries.map((template) => {
                    const templateType = normalizeTemplateType(template);
                    const disabledReason = getTemplateDisabledReason(
                      template,
                      hasSelection,
                    );
                    const disabled = Boolean(disabledReason);
                    return (
                      <DropdownMenuItem
                        key={`template-dropdown:${template.key}`}
                        disabled={disabled}
                        title={disabledReason ?? undefined}
                        onClick={() => {
                          if (disabled) return;
                          openTemplateAction(template, selectedRows);
                        }}
                      >
                        {templateType === "excel" ? (
                          <FileSpreadsheet className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span>{template.title || template.key}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <TableToolbar
          filterPanel={filterPanel}
          tableConfig={tableConfig}
          quickSearch={quickSearch}
        />
      </div>
      <PrintDialog
        open={Boolean(printTemplate && printTemplateSchema)}
        title={printTemplate?.title ?? "Template Parameters"}
        schema={printTemplateSchema ?? { fields: [] }}
        submitLabel={
          printTemplate && normalizeTemplateType(printTemplate) === "excel"
            ? "Download"
            : "Generate"
        }
        cancelLabel="Cancel"
        onCancel={closePrintDialog}
        onSubmit={(values) => {
          if (!printTemplate || !printTemplateRowIds.length) return;
          const template = printTemplate;
          const rowIds = printTemplateRowIds;
          closePrintDialog();
          void runTemplate(template, rowIds, values).catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to generate template.";
            toast.error(message);
          });
        }}
      />
    </>
  );
}
