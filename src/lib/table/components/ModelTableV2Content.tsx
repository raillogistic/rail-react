import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Upload,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Trash2,
  X,
  CheckCircle2,
  Archive,
  MoreHorizontal,
  Info,
  RefreshCw,
  Box,
  ClipboardList,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import { Separator } from "@/lib/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
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

/**
 * ModelTableV2Content manages the top header, top actions, and global toolbar.
 * It also handles the floating selection bar for bulk operations.
 */
export function ModelTableV2Content({
  filterPanel,
  tableConfig,
  quickSearch,
  topActions,
}: ModelTableV2ContentProps) {
  const { metadata, app, model } = useMetadata();
  const { data, rowSelection, pagination, setRowSelection, refresh, loading } =
    useTable();
  const navigate = useNavigate();

  const [printTemplate, setPrintTemplate] = useState<TemplateInfo | null>(null);
  const [printTemplateRowIds, setPrintTemplateRowIds] = useState<string[]>([]);
  const [printTemplateSchema, setPrintTemplateSchema] =
    useState<FormSchema | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;
  const totalCount = pagination.total;

  useEffect(() => {
    if (!loading) setLastUpdated(new Date());
  }, [loading]);

  const timeAgo = useMemo(() => {
    const diff = Math.floor(
      (new Date().getTime() - lastUpdated.getTime()) / 60000,
    );
    if (diff < 1) return "à l'instant";
    return `il y a ${diff} min`;
  }, [lastUpdated, loading]);

  const selectedRows = useMemo(
    () => data.filter((row) => !!rowSelection[String(row.id)]),
    [data, rowSelection],
  );

  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const selectedRowIds = useMemo(
    () =>
      selectedRows
        .map((row) => String(row.id))
        .filter((id) => id !== "undefined" && id !== "null"),
    [selectedRows],
  );

  const createMutation = findMutation(metadata?.mutations, "create");
  const canCreate = !!createMutation?.allowed;

  const addAction = useMemo<ModelTableV2TopAction | undefined>(() => {
    if (!canCreate) return undefined;
    return {
      key: "add",
      label: tableConfig?.addLabel ?? "Ajouter",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      variant: "default",
      size: "sm",
      order: -1,
      show_when: "always",
      on_click: () => console.info("add item"),
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

  const closePrintDialog = useCallback(() => {
    setPrintTemplate(null);
    setPrintTemplateRowIds([]);
    setPrintTemplateSchema(null);
  }, []);

  const runTemplate = useCallback(
    async (
      template: TemplateInfo,
      rowIds: string[],
      clientData: Record<string, unknown> = {},
    ) => {
      const result = await executeTemplateForRows(template, rowIds, clientData);
      toast.success(
        `${result.count} extractions terminées (${normalizeTemplateType(template).toUpperCase()}).`,
        {
          icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
        },
      );
    },
    [],
  );

  const handleRunTemplate = useCallback(
    (template: TemplateInfo, rows: Record<string, unknown>[]) => {
      const ids = rows
        .map((r) => String(r.id))
        .filter((id) => id !== "undefined" && id !== "null");
      if (!ids.length) return toast.error("Sélectionnez au moins une ligne.");

      const clientFields = parseTemplateClientFields(template);
      if (clientFields.length > 0) {
        setPrintTemplate(template);
        setPrintTemplateRowIds(ids);
        setPrintTemplateSchema(buildTemplateClientSchema(clientFields));
        return;
      }

      void runTemplate(template, ids).catch((e) =>
        toast.error(e instanceof Error ? e.message : "Erreur d'extraction."),
      );
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

  const pdfTemplates = templateEntries.filter(
    (t) => normalizeTemplateType(t) === "pdf",
  );
  const excelTemplates = templateEntries.filter(
    (t) => normalizeTemplateType(t) === "excel",
  );

  const resolvedTopActions = useMemo(() => {
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
    if (addAction) combined.unshift(addAction);

    return combined
      .map((action) => ({
        ...action,
        disabled: action.show_when === "has_selection" && !hasSelection,
      }))
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

  if (!metadata) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
        {/* Modern Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 py-4">
          <div className="flex items-start gap-4">
            {/* Entity Identity Avatar */}
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner">
              <Box className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Breadcrumbs / Context */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
                <Database className="h-3.5 w-3.5" />
                <span>{app}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary/70">{model}</span>
              </div>

              {/* Title & Stats */}
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black tracking-tighter text-foreground/90 uppercase">
                  {resolvedTitle}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="h-8 rounded-full px-4 bg-primary text-primary-foreground border-none font-black text-sm shadow-lg shadow-primary/20"
                  >
                    {totalCount}
                  </Badge>
                  {hasSelection && (
                    <Badge className="h-8 rounded-full px-4 bg-emerald-500 text-white border-none font-black text-sm shadow-lg shadow-emerald-200 animate-in zoom-in">
                      {selectedCount} SÉLECTIONNÉS
                    </Badge>
                  )}
                </div>
              </div>

              {/* Data Status Indicator */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60">
                <div className="flex items-center gap-1.5">
                  <RefreshCw
                    className={cn(
                      "h-3 w-3",
                      loading && "animate-spin text-primary",
                    )}
                  />
                  <span>Mis à jour {timeAgo}</span>
                </div>
                <Separator orientation="vertical" className="h-3" />
                <button
                  onClick={() => refresh()}
                  className="hover:text-primary transition-colors uppercase tracking-widest"
                >
                  Rafraîchir maintenant
                </button>
              </div>
            </div>
          </div>

          {/* Top Actions Cluster */}
          <div className="flex items-center justify-end gap-2.5">
            {resolvedTopActions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant ?? "outline"}
                size={action.size === "icon" ? "icon" : "sm"}
                className={cn(
                  "h-11 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px]",
                  action.key === "add" &&
                    "bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 border-none",
                  action.key === "import" &&
                    "hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 border-indigo-200/50 text-indigo-600 dark:text-indigo-400",
                  action.size === "icon" ? "w-11" : "px-6",
                )}
                disabled={action.disabled || loading}
                onClick={() => {
                  if (action.disabled) return;
                  action.on_click({
                    selected_rows: selectedRows,
                    selection_state: rowSelection,
                  });
                }}
              >
                {action.icon}
                {action.size !== "icon" && <span>{action.label}</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Global Table Toolbar - Integrated seamlessly */}
        <TableToolbar
          filterPanel={filterPanel}
          tableConfig={tableConfig}
          quickSearch={quickSearch}
        />

        {/* Floating Bulk Selection Bar - Practical & Beautiful */}
        <div
          className={cn(
            "fixed bottom-10 left-1/2 z-[60] -translate-x-1/2 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)",
            hasSelection
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-32 opacity-0 scale-90 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-4 rounded-[2.5rem] border border-primary/30 bg-background/90 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-3xl ring-8 ring-primary/5">
            {/* Selection Status */}
            <div className="flex items-center gap-4 pl-5 pr-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                <ClipboardList className="h-5 w-5" />
                <div className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-black text-background shadow-lg ring-2 ring-background">
                  {selectedCount}
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-black uppercase tracking-tighter text-foreground">
                  Sélection active
                </span>
                <span className="text-[9px] font-bold uppercase text-primary/70 tracking-widest">
                  {model}
                </span>
              </div>
            </div>

            <Separator orientation="vertical" className="h-10 bg-border/20" />

            {/* Bulk Actions Cluster */}
            <div className="flex items-center gap-2 rounded-[1.75rem] bg-muted/40 p-1.5">
              {/* Extraction Group */}
              <div className="flex items-center gap-1">
                {pdfTemplates.length > 0 && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                          >
                            <FileText className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="rounded-lg bg-blue-600 font-bold uppercase text-[9px] tracking-widest text-white"
                      >
                        Extractions PDF
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      align="center"
                      className="w-72 rounded-3xl border-none p-2 shadow-3xl backdrop-blur-2xl bg-background/95"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Génération PDF Multi-lignes
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/40" />
                      <div className="p-1">
                        {pdfTemplates.map((t) => (
                          <DropdownMenuItem
                            key={t.key}
                            onClick={() => handleRunTemplate(t, selectedRows)}
                            className="rounded-xl py-3 text-xs font-bold gap-4 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            {t.title || t.key}
                            <ArrowRight className="ml-auto h-3 w-3 opacity-20" />
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {excelTemplates.length > 0 && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          >
                            <FileSpreadsheet className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="rounded-lg bg-emerald-600 font-bold uppercase text-[9px] tracking-widest text-white"
                      >
                        Extractions Excel
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      align="center"
                      className="w-72 rounded-3xl border-none p-2 shadow-3xl backdrop-blur-2xl bg-background/95"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                        Extraction Excel Combinée
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/40" />
                      <div className="p-1">
                        {excelTemplates.map((t) => (
                          <DropdownMenuItem
                            key={t.key}
                            onClick={() => handleRunTemplate(t, selectedRows)}
                            className="rounded-xl py-3 text-xs font-bold gap-4 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            {t.title || t.key}
                            <ArrowRight className="ml-auto h-3 w-3 opacity-20" />
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <Separator
                orientation="vertical"
                className="h-6 bg-border/40 mx-1"
              />

              {/* Dangerous Group */}
              <div className="flex items-center gap-1">
                <AlertDialog
                  open={bulkDeleteDialogOpen}
                  onOpenChange={setBulkDeleteDialogOpen}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="rounded-lg bg-rose-600 font-bold uppercase text-[9px] tracking-widest text-white"
                    >
                      Suppression en masse
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialogContent className="max-w-[450px] rounded-[3rem] border-none shadow-3xl overflow-hidden p-0 bg-background/95 backdrop-blur-2xl">
                    <div className="relative h-32 w-full bg-rose-500 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                        <Trash2 className="h-10 w-10 text-rose-500" />
                      </div>
                    </div>
                    <div className="p-10 text-center">
                      <AlertDialogHeader className="space-y-4">
                        <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter">
                          Action Critique
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                          Vous êtes sur le point de supprimer définitivement{" "}
                          <span className="font-black text-rose-500">
                            {selectedCount}
                          </span>{" "}
                          enregistrements de{" "}
                          <span className="font-black text-foreground">
                            {model}
                          </span>
                          . Cette opération est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <AlertDialogCancel className="h-14 flex-1 rounded-2xl border-none bg-muted/50 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-muted active:scale-95">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            console.info(
                              "Bulk delete confirmed",
                              selectedRowIds,
                            );
                            setBulkDeleteDialogOpen(false);
                            setRowSelection({});
                            toast.success(
                              `${selectedCount} éléments supprimés.`,
                            );
                          }}
                          className="h-14 flex-1 rounded-2xl bg-rose-500 font-black uppercase text-[10px] tracking-widest text-white shadow-2xl shadow-rose-200 dark:shadow-rose-900/40 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95"
                        >
                          Confirmer la suppression
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted transition-all"
                      onClick={() => setRowSelection({})}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="rounded-lg bg-foreground font-bold uppercase text-[9px] tracking-widest text-background"
                  >
                    Désélectionner tout
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays / Dialogs */}
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
          if (!printTemplate || !printTemplateRowIds.length) return;
          const template = printTemplate;
          const rowIds = printTemplateRowIds;
          closePrintDialog();
          void runTemplate(template, rowIds, values).catch((e) =>
            toast.error(
              e instanceof Error ? e.message : "Erreur d'extraction.",
            ),
          );
        }}
      />
    </TooltipProvider>
  );
}
