import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  FileText,
  Settings2,
  Database,
  Filter,
  ArrowUpDown,
  X,
  CheckCircle2,
  Info,
  Search,
  ListTree,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/kit/dialog";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { toast } from "@/shared/ui/kit/sonner";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import {
  getAuthorizationHeader,
  getSecureHeaders,
} from "@/features/auth/utils/token-storage";
import { cn } from "@/shared/utils";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import type { FilterGroup, FilterQueryVariables } from "../../filters/types";
import type { ModelSchema } from "../types";
import {
  ExportFieldTree,
  isReadableField,
  type ExportFieldSelection,
} from "./ExportFieldTree";

type FileExtension = "xlsx" | "csv";

const MAX_NESTED_DEPTH = 2;

const countFilterConditions = (group: FilterGroup): number =>
  group.conditions.reduce((total, condition) => {
    if (condition.type === "group") {
      return total + countFilterConditions(condition);
    }
    return total + 1;
  }, 0);

const resolveAccessor = (metadata: ModelSchema, raw: string) => {
  const field =
    metadata.fields.find((item) => item.name === raw) ??
    metadata.fields.find((item) => item.fieldName === raw);
  return field?.fieldName || raw;
};

const buildOrderingPayload = (metadata: ModelSchema, orderBy?: string[]) => {
  if (orderBy && orderBy.length > 0) {
    return orderBy.map((entry) => {
      const desc = entry.startsWith("-");
      const raw = desc ? entry.slice(1) : entry;
      const accessor = resolveAccessor(metadata, raw);
      return desc ? `-${accessor}` : accessor;
    });
  }
  return undefined;
};

const buildRootFieldSelection = (
  metadata: ModelSchema,
  orderedFieldNames: string[],
  columnVisibility: Record<string, boolean>,
  selectAll: boolean,
): ExportFieldSelection => {
  const selection: ExportFieldSelection = {};
  orderedFieldNames.forEach((fieldName) => {
    const field = metadata.fields.find((item) => item.name === fieldName);
    if (!field || !isReadableField(field)) return;
    if (!selectAll && columnVisibility[field.name] === false) return;
    const accessor = field.name || field.fieldName;
    selection[accessor] = field.verboseName || field.name;
  });
  return selection;
};

const buildRootFieldOrder = (metadata: ModelSchema, columnOrder: string[]) => {
  const readableFields = metadata.fields.filter(isReadableField);
  const fieldNames = readableFields.map((field) => field.name);
  const ordered = columnOrder.length ? columnOrder : fieldNames;
  const fieldLookup = new Set(fieldNames);
  const unique: string[] = [];

  ordered.forEach((fieldName) => {
    if (fieldLookup.has(fieldName) && !unique.includes(fieldName)) {
      unique.push(fieldName);
    }
  });

  fieldNames.forEach((fieldName) => {
    if (!unique.includes(fieldName)) {
      unique.push(fieldName);
    }
  });

  return unique;
};

export function ModelTableExportDialog({
  labels,
  trigger,
}: {
  labels?: {
    buttonAria?: string;
    title?: string;
    description?: string;
    fieldsTitle?: string;
    selectedCount?: (count: number) => string;
    selectAll?: string;
    clear?: string;
    filenameLabel?: string;
    filenamePlaceholder?: string;
    formatLabel?: string;
    quickSearchLabel?: string;
    quickSearchActive?: string;
    quickSearchNone?: string;
    advancedFiltersLabel?: string;
    advancedFiltersNone?: string;
    orderingLabel?: string;
    orderingNone?: string;
    footerSelectedCount?: (count: number) => string;
    cancel?: string;
    download?: string;
  };
  trigger?: React.ReactNode;
}) {
  const { metadata } = useMetadata();
  const {
    columnOrder,
    columnVisibility,
    filterVariables,
    groupingField,
    quickSearch,
    advancedFilters,
  } = useTable();
  const filterPayload = filterVariables as FilterQueryVariables | undefined;

  const [open, setOpen] = useState(false);
  const [fileExtension, setFileExtension] = useState<FileExtension>("xlsx");
  const [exportFilename, setExportFilename] = useState("");
  const [selectedFields, setSelectedFields] = useState<ExportFieldSelection>(
    {},
  );
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const hasGrouping = !!groupingField;

  const canExport = !!metadata?.permissions?.canExport;

  useEffect(() => {
    if (!open || !metadata) return;
    setExportError(null);
    const initialOrder = buildRootFieldOrder(metadata, columnOrder);
    setFieldOrder(initialOrder);
    setSelectedFields(
      buildRootFieldSelection(metadata, initialOrder, columnVisibility, false),
    );
    setExportFilename(metadata.verboseNamePlural || metadata.model || "export");
  }, [open, metadata, columnOrder, columnVisibility]);

  useEffect(() => {
    if (!hasGrouping) return;
    if (fileExtension !== "xlsx") {
      setFileExtension("xlsx");
    }
  }, [hasGrouping, fileExtension]);

  const handleToggleField = useCallback((accessor: string, label: string) => {
    setSelectedFields((prev) => {
      const next = { ...prev };
      if (next[accessor]) {
        delete next[accessor];
      } else {
        next[accessor] = label;
      }
      return next;
    });
  }, []);

  const selectAllRootFields = useCallback(() => {
    if (!metadata) return;
    const ordered = fieldOrder.length
      ? fieldOrder
      : buildRootFieldOrder(metadata, columnOrder);
    setSelectedFields(
      buildRootFieldSelection(metadata, ordered, columnVisibility, true),
    );
  }, [metadata, columnOrder, columnVisibility, fieldOrder]);

  const clearFields = useCallback(() => {
    setSelectedFields({});
  }, []);

  const selectedCount = Object.keys(selectedFields).length;
  const filterCount = useMemo(
    () => countFilterConditions(advancedFilters.root),
    [advancedFilters.root],
  );
  const orderingPayload = useMemo(() => {
    if (!metadata) return undefined;
    return buildOrderingPayload(metadata, filterPayload?.orderBy);
  }, [metadata, filterPayload?.orderBy]);

  const buildExportPayload = useCallback(() => {
    if (!metadata || selectedCount === 0) return null;
    const orderedRootFields = fieldOrder.length
      ? fieldOrder
      : buildRootFieldOrder(metadata, columnOrder);
    const orderedEntries: [string, string][] = [];
    const seen = new Set<string>();

    orderedRootFields.forEach((fieldName) => {
      const field = metadata.fields.find((item) => item.name === fieldName);
      if (!field) return;
      const accessor = field.name || field.fieldName;
      const label = selectedFields[accessor];
      if (!label) return;
      orderedEntries.push([accessor, label]);
      seen.add(accessor);
    });

    Object.entries(selectedFields).forEach(([accessor, label]) => {
      if (seen.has(accessor)) return;
      orderedEntries.push([accessor, label]);
    });

    const fieldsPayload = orderedEntries.map(([accessor, label]) => {
      if (label === accessor) {
        return accessor;
      }
      return { accessor, title: label };
    });

    const variables: Record<string, unknown> = {};
    if (filterPayload?.where) variables.where = filterPayload.where;

    const payload: Record<string, unknown> = {
      app_name: metadata.app,
      model_name: metadata.model,
      file_extension: fileExtension,
      fields: fieldsPayload,
    };

    if (exportFilename.trim()) {
      payload.filename = exportFilename.trim().replace(/\.(csv|xlsx)$/i, "");
    }
    if (orderingPayload?.length) {
      payload.ordering = orderingPayload;
    }
    if (filterPayload?.presets?.length) {
      payload.presets = filterPayload.presets;
    }
    if (filterPayload?.distinctOn?.length) {
      payload.distinct_on = filterPayload.distinctOn;
    }
    if (groupingField) {
      payload.group_by = resolveAccessor(metadata, groupingField);
    }
    if (Object.keys(variables).length) {
      payload.variables = variables;
    }

    return payload;
  }, [
    metadata,
    selectedCount,
    selectedFields,
    fileExtension,
    exportFilename,
    orderingPayload,
    filterPayload,
    groupingField,
    fieldOrder,
    columnOrder,
  ]);

  const handleExport = useCallback(async () => {
    if (!metadata) {
      setExportError("Les métadonnées ne sont pas disponibles.");
      return;
    }
    const payload = buildExportPayload();
    if (!payload) {
      setExportError("Sélectionnez au moins un champ à exporter.");
      return;
    }
    if (hasGrouping && fileExtension !== "xlsx") {
      setExportError("Le regroupement est disponible uniquement pour Excel.");
      return;
    }

    setExporting(true);
    setExportError(null);

    const exportEndpoint =
      (import.meta.env.VITE_API_EXPORTING as string | undefined) ??
      "/api/v1/export/";

    try {
      const authorizationHeader = getAuthorizationHeader();
      const response = await fetch(exportEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorizationHeader
            ? { Authorization: authorizationHeader }
            : {}),
          ...getSecureHeaders(),
        },
        body: JSON.stringify(payload),
      });
      console.log(JSON.stringify(payload));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Échec de l'export.");
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const result = await response.json();
        throw new Error(
          result.error ||
            "Export en file d'attente. Utilisez l'endpoint des exports pour télécharger.",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename =
        typeof payload.filename === "string" && payload.filename.trim()
          ? payload.filename
          : metadata.model.toLowerCase();
      link.href = url;
      link.download = `${filename}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${fileExtension.toUpperCase()} généré.`);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Échec de l'export.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }, [metadata, buildExportPayload, fileExtension, hasGrouping]);

  if (!metadata || !canExport) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/40 hover:bg-primary/5 hover:text-primary transition-all active:scale-90"
            aria-label={labels?.buttonAria ?? "Exporter les données"}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] max-h-[900px] gap-0 p-0 overflow-hidden border-none shadow-2xl backdrop-blur-2xl bg-background/95 rounded-[2rem] flex flex-col animate-in zoom-in-95 duration-300">
        <DialogHeader className="flex-none px-8 py-6 bg-muted/10 border-b border-border/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Database className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {labels?.title ??
                  `Export ${metadata.verboseNamePlural || metadata.model}`}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Info className="h-3 w-3" />
                {labels?.description ??
                  "Configuration de l'extraction des données"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid gap-0 md:grid-cols-[2.5fr,1fr] overflow-hidden">
          {/* Structure Section */}
          <div className="flex flex-col border-r border-border/20 bg-background/50 overflow-hidden">
            <div className="flex-none space-y-4 px-8 py-4 bg-muted/5 border-b border-border/10 z-10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <ListTree className="h-4 w-4 text-primary/60" />
                    <span className="text-sm font-black uppercase tracking-widest text-foreground/80">
                      {labels?.fieldsTitle ?? "Structure de l'export"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-primary animate-in fade-in slide-in-from-left-2 duration-500">
                    {selectedCount} champ{selectedCount > 1 ? "s" : ""}{" "}
                    sélectionné{selectedCount > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllRootFields}
                    className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                  >
                    {labels?.selectAll ?? "Tout"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFields}
                    className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                  >
                    {labels?.clear ?? "Effacer"}
                  </Button>
                </div>
              </div>

              {/* Search Bar - Fixed here */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Rechercher un champ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-background border-border/40 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-all"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <ExportFieldTree
                metadata={metadata}
                selected={selectedFields}
                onToggle={handleToggleField}
                maxDepth={MAX_NESTED_DEPTH}
                fieldOrder={fieldOrder}
                onFieldOrderChange={setFieldOrder}
                searchFilter={searchQuery}
              />
            </div>
          </div>

          {/* Configuration Section */}
          <div className="flex flex-col bg-muted/5 overflow-hidden">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Configuration Group */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                    Configuration
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="export-filename"
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1"
                    >
                      {labels?.filenameLabel ?? "Nom du fichier"}
                    </Label>
                    <div className="relative group">
                      <Input
                        id="export-filename"
                        value={exportFilename}
                        onChange={(event) =>
                          setExportFilename(event.target.value)
                        }
                        placeholder={
                          labels?.filenamePlaceholder ?? "export_donnees"
                        }
                        className="h-9 bg-background/50 border-border/30 focus:ring-4 focus:ring-primary/5 rounded-lg text-xs font-bold transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest pointer-events-none">
                        .{fileExtension}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                      {labels?.formatLabel ?? "Format"}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFileExtension("xlsx")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all duration-300",
                          fileExtension === "xlsx"
                            ? "bg-primary border-primary shadow-md shadow-primary/10 text-primary-foreground"
                            : "bg-background/50 border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary",
                        )}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Excel
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFileExtension("csv")}
                        disabled={hasGrouping}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all duration-300",
                          hasGrouping && "cursor-not-allowed opacity-50",
                          fileExtension === "csv"
                            ? "bg-primary border-primary shadow-md shadow-primary/10 text-primary-foreground"
                            : "bg-background/50 border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary",
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          CSV
                        </span>
                      </button>
                    </div>
                    {hasGrouping ? (
                      <p className="text-[10px] font-bold text-primary/80">
                        Export groupé actif: Excel uniquement.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator className="bg-border/5" />

              {/* Status Group */}
              {exportError ? (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-[10px] font-bold text-red-500 animate-in shake duration-300">
                  <div className="flex gap-2">
                    <X className="h-3.5 w-3.5 shrink-0" />
                    <span>{exportError}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-muted/5 border-t border-border/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-none">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
            {labels?.footerSelectedCount?.(selectedCount) ??
              `${selectedCount} champ${selectedCount <= 1 ? "" : "s"} prêt${selectedCount <= 1 ? "" : "s"} pour l'export`}
          </div>
          <div className="flex w-full justify-end gap-3 sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-11 px-6 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-background transition-all"
            >
              {labels?.cancel ?? "Annuler"}
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || selectedCount === 0}
              className="h-11 px-8 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {labels?.download ?? "Générer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
