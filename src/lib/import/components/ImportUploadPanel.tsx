import { useMemo, useState, useRef } from "react";
import { Upload, FileUp, X, CheckCircle2, AlertCircle, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Progress } from "@/lib/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ModelImportTemplate } from "../types";

interface ImportUploadPanelProps {
  template: ModelImportTemplate | null;
  loading?: boolean;
  onUpload: (file: File, format: "CSV" | "XLSX") => Promise<void> | void;
}

function detectFormat(file: File): "CSV" | "XLSX" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "CSV";
  if (name.endsWith(".xlsx")) return "XLSX";
  return null;
}

export function ImportUploadPanel({
  template,
  loading,
  onUpload,
}: ImportUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const format = useMemo(() => (file ? detectFormat(file) : null), [file]);
  const formatAllowed =
    !!format &&
    (!!template?.acceptedFormats?.includes(format) ||
      !template?.acceptedFormats?.length);
  const sizeAllowed =
    !file || !template || file.size <= template.maxFileSizeBytes;

  const canUpload =
    !!file && !!format && formatAllowed && sizeAllowed && !submitting;

  const handleUpload = async () => {
    if (!file || !format || !canUpload) return;
    setSubmitting(true);
    setError(null);
    try {
      await onUpload(file, format);
      setFile(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Échec du téléversement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="bg-primary/5 pb-6">
        <CardTitle className="text-xl flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Téléverser les données
        </CardTitle>
        <CardDescription>
          Glissez-déposez votre fichier rempli selon le modèle.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 py-6 flex flex-col gap-6">
        <div
          className={cn(
            "relative group flex flex-col items-center justify-center w-full min-h-[160px] p-6 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer",
            dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
            file ? "border-solid border-primary/30 bg-primary/5" : "",
            loading || submitting ? "opacity-50 pointer-events-none" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            aria-label="Fichier de donnees d'import"
            className="hidden"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null;
              setFile(nextFile);
              setError(null);
            }}
          />

          {!file ? (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Cliquer pour parcourir ou glisser-déposer
                </p>
                <p className="text-xs text-muted-foreground">
                  Fichiers CSV ou XLSX acceptés (max {(template?.maxFileSizeBytes ?? 0) / (1024 * 1024)} Mo)
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center gap-4 p-2">
              <div className="h-14 w-14 rounded-lg bg-background border flex items-center justify-center text-primary shadow-sm">
                {format === "XLSX" ? <FileSpreadsheet className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-bold truncate pr-6">{file.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="uppercase font-mono bg-muted px-1 rounded">{format ?? "???"}</span>
                  <span>•</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} Mo</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {file && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {(!formatAllowed || !sizeAllowed) ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold uppercase tracking-tight">Erreur de validation</p>
                  {!formatAllowed && (
                    <p>Format non supporté. Attendu : {template?.acceptedFormats.join(", ") || "CSV, XLSX"}.</p>
                  )}
                  {!sizeAllowed && (
                    <p>La taille dépasse la limite autorisée ({(template?.maxFileSizeBytes ?? 0) / (1024 * 1024)} Mo).</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-medium">Fichier prêt pour le téléversement</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-xs italic">
                {error}
              </div>
            )}

            {submitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Envoi en cours...</span>
                </div>
                <Progress value={undefined} className="h-1.5" />
              </div>
            )}

            <Button 
              className="w-full h-11 gap-2 shadow-sm transition-all hover:shadow-md"
              onClick={handleUpload} 
              disabled={!canUpload || submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {submitting ? "Téléversement..." : "Téléverser et analyser"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
