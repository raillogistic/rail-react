/**
 * @module AttachmentsSection
 * @description Section de pièces jointes pour la gestion de fichiers.
 * Supporte l'upload, le téléchargement, la suppression et l'aperçu.
 */
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import {
  File,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  Download,
  ExternalLink,
  UploadCloud,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";

export type AttachmentItem = {
  id: string;
  name: string;
  sizeBytes?: number;
  contentType?: string;
  uploadedAt?: string | number | Date;
  href?: string;
  status?: "uploading" | "ready" | "error";
  progress?: number;
};

export type AttachmentsSectionData =
  | AttachmentItem[]
  | {
      files: AttachmentItem[];
    };

export type AttachmentsSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<AttachmentsSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => AttachmentsSectionData | undefined;
  load?: SectionDefinition<AttachmentsSectionData>["load"];
  actions?: SectionDefinition<AttachmentsSectionData>["actions"];
  onUpload?: () => void | Promise<void>;
  onDownload?: (file: AttachmentItem) => void | Promise<void>;
  onDelete?: (file: AttachmentItem) => void | Promise<void>;
  skeleton?: SectionDefinition<AttachmentsSectionData>["skeleton"];
  empty?: SectionDefinition<AttachmentsSectionData>["empty"];
  error?: SectionDefinition<AttachmentsSectionData>["error"];
  testId?: string;
};

/** Extrait les fichiers depuis les données de la section. */
function resolveFiles(
  data: AttachmentsSectionData | undefined,
): AttachmentItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.files) ? data.files : [];
}

/** Formate la taille d'un fichier en unité lisible. */
function formatFileSize(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Icône de fichier contextuelle selon le type MIME. */
function FileIcon({ contentType }: { contentType?: string }) {
  const type = contentType?.toLowerCase() || "";

  if (type.includes("image"))
    return <FileImage className="size-4.5 text-blue-500" />;
  if (type.includes("pdf") || type.includes("word") || type.includes("text"))
    return <FileText className="size-4.5 text-emerald-500" />;
  if (type.includes("zip") || type.includes("rar") || type.includes("archive"))
    return <FileArchive className="size-4.5 text-amber-500" />;
  if (type.includes("code") || type.includes("json") || type.includes("script"))
    return <FileCode className="size-4.5 text-indigo-500" />;

  return <File className="size-4.5 text-muted-foreground" />;
}

export function createAttachmentsSection(
  config: AttachmentsSectionConfig,
): SectionDefinition<AttachmentsSectionData> {
  return {
    ...config,
    kind: "attachments",
    dataSource: "documents",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data }) => {
      const files = resolveFiles(data);
      return (
        <div className="space-y-4">
          {config.onUpload ? (
            <div
              className="relative group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => void config.onUpload?.()}
            >
              <div className="p-2.5 rounded-lg bg-primary/8 text-primary mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="size-5" />
              </div>
              <div className="text-sm font-medium">
                Click to upload or drag and drop
              </div>
              <div className="text-xs text-muted-foreground/50 mt-0.5">
                Maximum file size 50MB
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-3 px-3.5 py-3 rounded-lg border border-border/30 bg-card/20 transition-all hover:border-border/50 hover:bg-card/40"
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-muted/30 transition-colors group-hover:bg-muted/50">
                  <FileIcon contentType={file.contentType} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                      {file.name}
                    </span>
                    {file.status === "uploading" && (
                      <span className="animate-pulse text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Uploading…
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    {file.contentType && (
                      <>
                        <span className="size-0.5 rounded-full bg-border" />
                        <span className="truncate">{file.contentType}</span>
                      </>
                    )}
                  </div>

                  {file.status === "uploading" && (
                    <div className="mt-1.5 w-full h-0.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.href && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-md hover:bg-primary/8 hover:text-primary"
                    >
                      <a
                        href={file.href}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                  {config.onDownload && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-md hover:bg-emerald-500/8 hover:text-emerald-600"
                      onClick={() => void config.onDownload?.(file)}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-md"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 p-1 rounded-lg border-border/30 shadow-lg"
                    >
                      <DropdownMenuItem className="text-xs font-medium gap-2 rounded-md">
                        <FileText className="size-3.5" />
                        Properties
                      </DropdownMenuItem>
                      {config.onDelete && (
                        <DropdownMenuItem
                          className="text-xs font-medium gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/8 rounded-md"
                          onClick={() => void config.onDelete?.(file)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
  };
}

export default createAttachmentsSection;
