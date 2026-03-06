import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ListOrdered,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { getAuthorizationHeader, getSecureHeaders } from "@/shared/api/auth/token-storage";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Separator } from "@/shared/ui/kit/separator";
import { toast } from "@/shared/ui/kit/sonner";
import { resolveModelImportTemplateDownloadUrl } from "../download-url";
import type { ImportColumnRule, ImportFileFormat, ModelImportTemplate } from "../types";

interface TemplateDownloadCardProps {
  template: ModelImportTemplate | null;
  loading?: boolean;
}

const formatColumnLabel = (column: ImportColumnRule): string => {
  const label = typeof column.label === "string" ? column.label.trim() : "";
  if (!label || label === column.name) {
    return column.name;
  }
  return `${label} (${column.name})`;
};

async function assertExpectedDownloadPayload(
  response: Response,
  blob: Blob,
  format: "csv" | "xlsx",
): Promise<void> {
  if (format !== "xlsx") {
    return;
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const looksLikeXlsxContentType =
    contentType.includes("spreadsheetml") || contentType.includes("application/octet-stream");

  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const looksLikeZipPayload =
    header.length >= 4
    && header[0] === 0x50
    && header[1] === 0x4b
    && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07)
    && (header[3] === 0x04 || header[3] === 0x06 || header[3] === 0x08);

  if (!looksLikeXlsxContentType && !looksLikeZipPayload) {
    throw new Error("Server did not return a valid XLSX payload.");
  }
}

export function TemplateDownloadCard({ template, loading }: TemplateDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<ImportFileFormat>("CSV");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFormats = useMemo<ImportFileFormat[]>(() => {
    const acceptedFormats = template?.acceptedFormats ?? ["CSV"];
    if (!acceptedFormats.length) {
      return ["CSV"];
    }
    return acceptedFormats.filter(
      (format): format is ImportFileFormat => format === "CSV" || format === "XLSX",
    );
  }, [template?.acceptedFormats]);

  const templateColumns = useMemo<ImportColumnRule[]>(() => {
    const seen = new Set<string>();
    const columns: ImportColumnRule[] = [];
    for (const column of [...(template?.requiredColumns ?? []), ...(template?.optionalColumns ?? [])]) {
      if (!column.name || seen.has(column.name)) {
        continue;
      }
      seen.add(column.name);
      columns.push(column);
    }
    return columns;
  }, [template?.optionalColumns, template?.requiredColumns]);

  const requiredFieldNames = useMemo(
    () => new Set((template?.requiredColumns ?? []).map((column) => column.name)),
    [template?.requiredColumns],
  );

  useEffect(() => {
    if (availableFormats.includes(downloadFormat)) {
      return;
    }
    setDownloadFormat(availableFormats[0] ?? "CSV");
  }, [availableFormats, downloadFormat]);

  useEffect(() => {
    const orderedFieldNames = templateColumns.map((column) => column.name);
    if (!orderedFieldNames.length) {
      setSelectedFields([]);
      return;
    }

    setSelectedFields((current) => {
      if (!current.length) {
        return [...orderedFieldNames];
      }

      const currentSet = new Set(current);
      const normalized = orderedFieldNames.filter(
        (fieldName) => requiredFieldNames.has(fieldName) || currentSet.has(fieldName),
      );

      if (!normalized.length) {
        return [...orderedFieldNames];
      }

      if (
        normalized.length === current.length
        && normalized.every((fieldName, index) => fieldName === current[index])
      ) {
        return current;
      }

      return normalized;
    });
  }, [requiredFieldNames, templateColumns]);

  const selectedFieldSet = useMemo(() => new Set(selectedFields), [selectedFields]);

  const displayLabelByField = useMemo(() => {
    const map = new Map<string, string>();
    for (const column of templateColumns) {
      map.set(column.name, formatColumnLabel(column));
    }
    return map;
  }, [templateColumns]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader className="pb-4">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Info className="h-5 w-5" />
            <CardTitle>Template unavailable</CardTitle>
          </div>
          <CardDescription>Model metadata could not be loaded.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const downloadFormatQuery = downloadFormat === "XLSX" ? "xlsx" : "csv";

  const templateDownloadUrl = resolveModelImportTemplateDownloadUrl({
    appLabel: template.appLabel,
    modelName: template.modelName,
    downloadUrl: template.downloadUrl,
    format: downloadFormatQuery,
    fields: selectedFields,
  });

  const toggleField = (fieldName: string, checked: boolean) => {
    if (requiredFieldNames.has(fieldName)) {
      return;
    }

    setSelectedFields((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(fieldName);
      } else {
        next.delete(fieldName);
      }

      for (const requiredFieldName of requiredFieldNames) {
        next.add(requiredFieldName);
      }

      return templateColumns
        .map((column) => column.name)
        .filter((name) => next.has(name));
    });
  };

  const downloadTemplate = async () => {
    if (!templateDownloadUrl || downloading || selectedFields.length === 0) {
      return;
    }

    setDownloading(true);
    try {
      const authorizationHeader = getAuthorizationHeader();
      const response = await fetch(templateDownloadUrl, {
        method: "GET",
        headers: {
          ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
          ...getSecureHeaders(),
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Template download failed (${response.status}).`);
      }

      const blob = await response.blob();
      await assertExpectedDownloadPayload(response, blob, downloadFormatQuery);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${template.modelName.toLowerCase()}-template-v${template.version}.${downloadFormatQuery}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Template downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download template.";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden border-primary/10 shadow-md">
      <CardHeader className="bg-primary/5 pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Import template
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              Version <Badge variant="outline" className="font-mono">{template.exactVersion ?? template.version}</Badge>
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {template.acceptedFormats.map((format) => (
              <Badge key={format} variant="secondary" className="bg-background">
                {format}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListOrdered className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Max rows</p>
              <p className="text-sm font-semibold">{template.maxRows.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Max size</p>
              <p className="text-sm font-semibold">{(template.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Matching keys
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.matchingKeyFields.length > 0 ? (
                template.matchingKeyFields.map((fieldName) => (
                  <Badge key={fieldName} variant="outline" className="py-0 text-[11px]">
                    {displayLabelByField.get(fieldName) ?? fieldName}
                  </Badge>
                ))
              ) : (
                <span className="text-xs italic text-muted-foreground">None (create only)</span>
              )}
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" /> Required columns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.requiredColumns.map((column) => (
                <Badge
                  key={column.name}
                  variant="secondary"
                  className="bg-primary/5 py-0 text-[11px] text-primary hover:bg-primary/10"
                >
                  {formatColumnLabel(column)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Fields in template ({selectedFields.length}/{templateColumns.length})
            </p>
            <div className="max-h-44 space-y-2 overflow-auto rounded-lg border bg-muted/20 p-3">
              {templateColumns.map((column) => {
                const checked = selectedFieldSet.has(column.name);
                const required = requiredFieldNames.has(column.name);
                return (
                  <label key={column.name} className="flex items-center justify-between gap-2 rounded px-1 py-1 text-sm">
                    <span className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        disabled={required || downloading}
                        onCheckedChange={(value) => toggleField(column.name, value === true)}
                        aria-label={`Include field ${column.name}`}
                      />
                      <span>{formatColumnLabel(column)}</span>
                    </span>
                    {required ? <Badge variant="outline">Required</Badge> : null}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Required fields remain selected.</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 pt-6 sm:flex-row">
        <div className="w-full flex-1 sm:w-auto">
          <Select
            value={downloadFormat}
            onValueChange={(value) => setDownloadFormat(value as ImportFileFormat)}
            disabled={downloading || availableFormats.length <= 1}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Template format">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {availableFormats.map((format) => (
                <SelectItem key={format} value={format} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {format === "XLSX" ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {format}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="h-10 w-full gap-2 px-6 shadow-sm transition-all hover:shadow-md sm:w-auto"
          onClick={() => void downloadTemplate()}
          disabled={downloading || !templateDownloadUrl || selectedFields.length === 0}
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "Downloading..." : "Download template"}
        </Button>
      </CardFooter>
    </Card>
  );
}
