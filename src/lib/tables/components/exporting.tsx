import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";
import { ColumnFiltersState } from "@tanstack/react-table";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/components/ui/sonner";
import { getSecureHeaders } from "@/auth/utils/token-storage";
import {
  ComplexFilterInput,
  ModelPagination,
  ModelTableType,
  TableFieldMetadataType,
} from "../types";

type FileExtension = "csv" | "xlsx";

type FieldOption = {
  name: string;
  title: string;
  accessor: string;
};

type AdditionalFilterConfig =
  | string
  | {
      accessor: string;
      title?: string;
    };

type ExportFieldPayload = string | { accessor: string; title: string };

type ExportPayload = {
  app_name: string;
  model_name: string;
  file_extension: FileExtension;
  filename: string;
  fields: ExportFieldPayload[];
  ordering?: string;
  variables?: Record<string, unknown>;
};

export type ModelTableExportDrawerHandle = {
  open: () => void;
  close: () => void;
};

export type ModelTableExportDrawerProps = {
  meta: ModelTableType | null;
  fields: TableFieldMetadataType[];
  pageInfo?: ModelPagination | null;
  columnFilters: ColumnFiltersState;
  filtersPayload: ComplexFilterInput<string> | null;
  orderingPayload: string[] | string | undefined;
  quick?: string;
  columnStorageKey?: string;
  additionalFilters?: AdditionalFilterConfig[];
};

const ModelTableExportDrawer = forwardRef<
  ModelTableExportDrawerHandle,
  ModelTableExportDrawerProps
>((props, ref) => {
  const {
    meta,
    fields,
    pageInfo,
    columnFilters,
    filtersPayload,
    orderingPayload,
    quick,
    columnStorageKey,
    additionalFilters = [],
  } = props;

  const [isExportOpen, setExportOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFilename, setExportFilename] = useState("");
  const [fileExtension, setFileExtension] = useState<FileExtension>("xlsx");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fieldOptions = useMemo<FieldOption[]>(() => {
    const base = fields.map((field) => ({
      name: field.name,
      title: field.title || field.name,
      accessor: field.accessor || field.name,
    }));

    const existing = new Set(base.map((option) => option.name));
    const extras: FieldOption[] = [];
    additionalFilters?.forEach((filter, index) => {
      if (typeof filter === "string") {
        const key = `custom:${filter}:${index}`;
        if (existing.has(key)) return;
        existing.add(key);
        extras.push({
          name: key,
          title: filter,
          accessor: filter,
        });
        return;
      }
      const key = `custom:${filter.accessor}:${index}`;
      if (existing.has(key)) return;
      existing.add(key);
      extras.push({
        name: key,
        title: filter.title || filter.accessor,
        accessor: filter.accessor,
      });
    });

    return [...base, ...extras];
  }, [fields, additionalFilters]);

  const readVisibleColumns = useCallback(() => {
    const allowed = new Set(fieldOptions.map((f) => f.name));
    let stored: string[] | null = null;
    if (
      columnStorageKey &&
      columnStorageKey.trim().length > 0 &&
      typeof window !== "undefined"
    ) {
      try {
        const raw = window.localStorage.getItem(columnStorageKey);
        if (raw) {
          stored = JSON.parse(raw);
        }
      } catch {
        stored = null;
      }
    }
    const sanitized = stored?.filter((name) => allowed.has(name)) ?? [];
    if (sanitized.length > 0) {
      fieldOptions
        .filter((option) => option.name.startsWith("custom:"))
        .forEach((option) => {
          if (!sanitized.includes(option.name)) {
            sanitized.push(option.name);
          }
        });
      return sanitized;
    }
    return fieldOptions.map((f) => f.name);
  }, [columnStorageKey, fieldOptions]);

  const openDialog = useCallback(() => {
    setExportError(null);
    setSelectedFields(readVisibleColumns());
    setExportOpen(true);
  }, [readVisibleColumns]);
  const closeDialog = useCallback(() => setExportOpen(false), []);

  useImperativeHandle(
    ref,
    () => ({
      open: openDialog,
      close: closeDialog,
    }),
    [openDialog, closeDialog],
  );

  useEffect(() => {
    if (!meta?.model) return;
    setExportFilename(meta.verboseNamePlural || meta.model);
  }, [meta?.model, meta?.verboseNamePlural]);

  const selectedFieldMetadata = useMemo(() => {
    if (!selectedFields.length) return [];
    const lookup = new Set(selectedFields);
    return fieldOptions.filter((option) => lookup.has(option.name));
  }, [fieldOptions, selectedFields]);

  const normalizedFilename = useMemo(() => {
    const fallback = meta?.model
      ? `${meta.model.toLowerCase()}_export`
      : "export";
    const raw = exportFilename.trim() || fallback;
    return raw.replace(/\.(csv|xlsx)$/i, "");
  }, [exportFilename, meta?.model]);

  const orderingValue = useMemo(() => {
    if (
      !orderingPayload ||
      (Array.isArray(orderingPayload) && orderingPayload.length === 0)
    ) {
      return undefined;
    }
    return Array.isArray(orderingPayload)
      ? orderingPayload[0]
      : orderingPayload;
  }, [orderingPayload]);

  const columnFilterSummary = useMemo(() => {
    if (!columnFilters?.length) return [];
    return columnFilters.map((filter) => ({
      id: filter.id,
      value:
        typeof filter.value === "object"
          ? JSON.stringify(filter.value)
          : `${filter.value ?? ""}`,
    }));
  }, [columnFilters]);

  const buildVariables = useCallback(() => {
    const vars: Record<string, unknown> = {};
    if (filtersPayload) {
      vars.filters = JSON.parse(JSON.stringify(filtersPayload));
    }
    if (quick && quick.trim().length) {
      vars.quick = quick.trim();
    }
    return vars;
  }, [filtersPayload, quick]);

  const buildExportPayload = useCallback((): ExportPayload | null => {
    if (!meta || !selectedFieldMetadata.length) return null;

    const fieldsPayload: ExportFieldPayload[] = selectedFieldMetadata.map(
      (field) => {
        if (field.accessor === field.title) {
          return field.accessor;
        }
        return { accessor: field.accessor, title: field.title };
      },
    );

    const variables = buildVariables();
    const hasVariables = Object.keys(variables).length > 0;

    const payload: ExportPayload = {
      app_name: meta.app,
      model_name: meta.model,
      file_extension: fileExtension,
      filename: normalizedFilename,
      fields: fieldsPayload,
    };

    if (orderingValue) {
      payload.ordering = orderingValue;
    }

    if (hasVariables) {
      payload.variables = variables;
    }

    return payload;
  }, [
    meta,
    selectedFieldMetadata,
    buildVariables,
    fileExtension,
    normalizedFilename,
    orderingValue,
  ]);

  const exportPayloadPreview = useMemo(
    () => buildExportPayload(),
    [buildExportPayload],
  );
  const filtersPreview = useMemo(() => {
    if (!filtersPayload) return null;
    return JSON.parse(JSON.stringify(filtersPayload));
  }, [filtersPayload]);

  const toggleField = (fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName)
        ? prev.filter((name) => name !== fieldName)
        : [...prev, fieldName],
    );
  };

  const selectAllFields = () => {
    setSelectedFields(fieldOptions.map((field) => field.name));
  };

  const clearFields = () => {
    setSelectedFields([]);
  };

  const handleDialogChange = (open: boolean) => {
    setExportOpen(open);
    if (!open) {
      setExportError(null);
    }
  };

  const handleExport = async () => {
    if (!meta) {
      setExportError("Les métadonnées ne sont pas disponibles.");
      return;
    }
    const payload = buildExportPayload();
    console.log(payload);
    if (!payload) {
      setExportError("Sélectionnez au moins un champ à exporter.");
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
        throw new Error(errorData.error || "L'export a échoué.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${payload.filename}.${payload.file_extension}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${fileExtension.toUpperCase()} généré.`);
      closeDialog();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "L'export a échoué.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const datasetLabel =
    meta?.verboseNamePlural ?? meta?.verboseName ?? "données";
  const totalRows = pageInfo?.total_count ?? "—";

  return (
    <Dialog open={isExportOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Exporter les {datasetLabel}</DialogTitle>
          <DialogDescription>
            Sélectionnez les colonnes à inclure et vérifiez les filtres transmis
            à <code>/api/v1/export/</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto space-y-6">
          <div className="grid gap-4">
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Champs à exporter</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFieldMetadata.length} sélectionné
                    {selectedFieldMetadata.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllFields}>
                    Tout sélectionner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFields}>
                    Effacer
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                {fieldOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun champ disponible.
                  </p>
                ) : (
                  fieldOptions.map((field) => (
                    <label
                      key={field.name}
                      className="flex cursor-pointer items-start gap-2 rounded-md border px-2 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleField(field.name)}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {field.title}
                        </span>
                        {/* <span className="text-xs text-muted-foreground truncate">{field.accessor}</span> */}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3 grid  gap-2 grid-cols-1 md:grid-cols-2">
              <div>
                <Label htmlFor="export-file-name">Nom du fichier</Label>
                <Input
                  id="export-file-name"
                  value={exportFilename}
                  onChange={(event) => setExportFilename(event.target.value)}
                  placeholder="Ex: pieces_export"
                  className="mt-1"
                />
                {/* <p className="text-xs text-muted-foreground mt-1">L'extension sera ajoutée automatiquement.</p> */}
              </div>
              <div>
                <Label>Format</Label>
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
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFieldMetadata.length} champ(s) seront envoyés.
          </div>
          {exportError ? (
            <p className="text-sm text-destructive">{exportError}</p>
          ) : null}
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button variant="ghost" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || !selectedFieldMetadata.length || !meta}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Télécharger
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ModelTableExportDrawer.displayName = "ModelTableExportDrawer";

export default ModelTableExportDrawer;
