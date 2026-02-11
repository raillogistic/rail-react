import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Info, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck, ListOrdered } from "lucide-react";
import { getAuthorizationHeader, getSecureHeaders } from "@/auth/utils/token-storage";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/components/ui/select";
import { toast } from "@/lib/components/ui/sonner";
import { Separator } from "@/lib/components/ui/separator";
import { resolveModelImportTemplateDownloadUrl } from "../download-url";
import type { ImportFileFormat, ModelImportTemplate } from "../types";

interface TemplateDownloadCardProps {
  template: ModelImportTemplate | null;
  loading?: boolean;
}

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
    contentType.includes("spreadsheetml")
    || contentType.includes("application/octet-stream");

  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const looksLikeZipPayload =
    header.length >= 4
    && header[0] === 0x50
    && header[1] === 0x4b
    && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07)
    && (header[3] === 0x04 || header[3] === 0x06 || header[3] === 0x08);

  if (!looksLikeXlsxContentType && !looksLikeZipPayload) {
    throw new Error("Le serveur n'a pas renvoye un fichier XLSX valide.");
  }
}

export function TemplateDownloadCard({ template, loading }: TemplateDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<ImportFileFormat>("CSV");

  const availableFormats = useMemo<ImportFileFormat[]>(() => {
    const acceptedFormats = template?.acceptedFormats ?? ["CSV"];
    if (!acceptedFormats.length) {
      return ["CSV"];
    }
    return acceptedFormats.filter(
      (format): format is ImportFileFormat => format === "CSV" || format === "XLSX",
    );
  }, [template?.acceptedFormats]);

  useEffect(() => {
    if (availableFormats.includes(downloadFormat)) {
      return;
    }
    setDownloadFormat(availableFormats[0] ?? "CSV");
  }, [availableFormats, downloadFormat]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader className="pb-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
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
            <CardTitle>Modèle indisponible</CardTitle>
          </div>
          <CardDescription>Les métadonnées du modèle n'ont pas pu être chargées.</CardDescription>
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
  });

  const downloadTemplate = async () => {
    if (!templateDownloadUrl || downloading) {
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
      });

      if (!response.ok) {
        throw new Error(`Échec du téléchargement du modèle (${response.status}).`);
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
      toast.success("Modèle téléchargé avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de télécharger le modèle.";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md border-primary/10">
      <CardHeader className="bg-primary/5 pb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Modèle de structure
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
      
      <CardContent className="flex-1 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ListOrdered className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Max lignes</p>
              <p className="text-sm font-semibold">{template.maxRows.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Taille max</p>
              <p className="text-sm font-semibold">{(template.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} Mo</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Clés de correspondance
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.matchingKeyFields.length > 0 ? (
                template.matchingKeyFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-[11px] py-0">{field}</Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">Aucune (Création uniquement)</span>
              )}
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Colonnes obligatoires
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.requiredColumns.map((column) => (
                <Badge key={column.name} variant="secondary" className="text-[11px] py-0 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">
                  {column.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 border-t pt-6 gap-3 flex-col sm:flex-row">
        <div className="w-full sm:w-auto flex-1">
          <Select
            value={downloadFormat}
            onValueChange={(value) => setDownloadFormat(value as ImportFileFormat)}
            disabled={downloading || availableFormats.length <= 1}
          >
            <SelectTrigger className="w-full h-10" aria-label="Format du modèle">
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
          className="w-full sm:w-auto h-10 gap-2 px-6 shadow-sm transition-all hover:shadow-md"
          onClick={() => void downloadTemplate()} 
          disabled={downloading || !templateDownloadUrl}
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "Téléchargement..." : `Télécharger le modèle`}
        </Button>
      </CardFooter>
    </Card>
  );
}
