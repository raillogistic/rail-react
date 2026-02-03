import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { toast } from "@/lib/components/ui/sonner";
import { getSecureHeaders } from "@/auth/utils/token-storage";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import type {
  FilterGroup,
  FilterQueryVariables,
} from "../../form/filters/types";
import type { ModelSchema, SortingState } from "../types";
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

const buildOrderingPayload = (
  metadata: ModelSchema,
  sorting: SortingState[],
  fallback?: string[],
) => {
  if (sorting.length > 0) {
    return sorting.map((sort) => {
      const accessor = resolveAccessor(metadata, sort.id);
      return sort.desc ? `-${accessor}` : accessor;
    });
  }
  if (fallback && fallback.length > 0) {
    return fallback.map((entry) => {
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
    const accessor = field.fieldName || field.name;
    selection[accessor] = field.verboseName || field.name;
  });
  return selection;
};

const buildRootFieldOrder = (
  metadata: ModelSchema,
  columnOrder: string[],
) => {
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
}) {
  const { metadata } = useMetadata();
  const {
    columnOrder,
    columnVisibility,
    sorting,
    filterVariables,
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

  const canExport = !!metadata?.permissions?.canExport;

  useEffect(() => {
    if (!open || !metadata) return;
    setExportError(null);
    const initialOrder = buildRootFieldOrder(metadata, columnOrder);
    setFieldOrder(initialOrder);
    setSelectedFields(
      buildRootFieldSelection(
        metadata,
        initialOrder,
        columnVisibility,
        false,
      ),
    );
    setExportFilename(metadata.verboseNamePlural || metadata.model || "export");
  }, [open, metadata, columnOrder, columnVisibility]);

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
    return buildOrderingPayload(metadata, sorting, filterPayload?.orderBy);
  }, [metadata, sorting, filterPayload?.orderBy]);

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
      const accessor = field.fieldName || field.name;
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
    fieldOrder,
    columnOrder,
  ]);

  const handleExport = useCallback(async () => {
    if (!metadata) {
      setExportError("Les metadonnees ne sont pas disponibles.");
      return;
    }
    const payload = buildExportPayload();
    if (!payload) {
      setExportError("Selectionnez au moins un champ a exporter.");
      return;
    }

    setExporting(true);
    setExportError(null);

    const exportEndpoint =
      (import.meta.env.VITE_API_EXPORTING as string | undefined) ??
      "/api/v1/export/";

    try {
      const response = await fetch(exportEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getSecureHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Echec de l'export.");
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const result = await response.json();
        throw new Error(
          result.error ||
            "Export en file d'attente. Utilisez l'endpoint des exports pour telecharger.",
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

      toast.success(`Export ${fileExtension.toUpperCase()} genere.`);
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Echec de l'export.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }, [metadata, buildExportPayload, fileExtension]);

  if (!metadata || !canExport) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={labels?.buttonAria ?? "Exporter les donnees"}
        >
          <Download className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {labels?.title ??
              `Exporter ${metadata.verboseNamePlural || metadata.model}`}
          </DialogTitle>
          <DialogDescription>
            {labels?.description ??
              "Choisissez les champs et le format pour la demande d'export."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {labels?.fieldsTitle ?? "Champs a exporter"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {labels?.selectedCount?.(selectedCount) ??
                    `${selectedCount} selectionne(s)`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllRootFields}>
                  {labels?.selectAll ?? "Tout selectionner"}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearFields}>
                  {labels?.clear ?? "Effacer"}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[360px] rounded-md border p-3">
              <ExportFieldTree
                metadata={metadata}
                selected={selectedFields}
                onToggle={handleToggleField}
                maxDepth={MAX_NESTED_DEPTH}
                fieldOrder={fieldOrder}
                onFieldOrderChange={setFieldOrder}
              />
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-3 space-y-3">
              <div>
                <Label htmlFor="export-filename">
                  {labels?.filenameLabel ?? "Nom du fichier"}
                </Label>
                <Input
                  id="export-filename"
                  value={exportFilename}
                  onChange={(event) => setExportFilename(event.target.value)}
                  placeholder={labels?.filenamePlaceholder ?? "ex. data_export"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{labels?.formatLabel ?? "Format"}</Label>
                <Select
                  value={fileExtension}
                  onValueChange={(value: FileExtension) =>
                    setFileExtension(value)
                  }
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  {labels?.quickSearchLabel ??
                    "Recherche rapide (table uniquement)"}
                </span>
                <span>
                  {quickSearch
                    ? labels?.quickSearchActive ?? "Actif"
                    : labels?.quickSearchNone ?? "Aucun"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{labels?.advancedFiltersLabel ?? "Filtres avances"}</span>
                <span>{filterCount || labels?.advancedFiltersNone || "Aucun"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{labels?.orderingLabel ?? "Tri"}</span>
                <span>
                  {orderingPayload?.length
                    ? orderingPayload.join(", ")
                    : labels?.orderingNone ?? "Aucun"}
                </span>
              </div>
            </div>
            {exportError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {exportError}
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {labels?.footerSelectedCount?.(selectedCount) ??
              `${selectedCount} champ${selectedCount === 1 ? "" : "s"} seront exportes.`}
          </div>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {labels?.cancel ?? "Annuler"}
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || selectedCount === 0}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {labels?.download ?? "Telecharger"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
