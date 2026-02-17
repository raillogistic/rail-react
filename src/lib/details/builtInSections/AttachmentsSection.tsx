import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
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
  Trash2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/lib/components/ui/dropdown-menu";

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

function resolveFiles(data: AttachmentsSectionData | undefined): AttachmentItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.files) ? data.files : [];
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function FileIcon({ contentType }: { contentType?: string }) {
  const type = contentType?.toLowerCase() || "";
  
  if (type.includes("image")) return <FileImage className="size-5 text-blue-500" />;
  if (type.includes("pdf") || type.includes("word") || type.includes("text")) return <FileText className="size-5 text-emerald-500" />;
  if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return <FileArchive className="size-5 text-amber-500" />;
  if (type.includes("code") || type.includes("json") || type.includes("script")) return <FileCode className="size-5 text-indigo-500" />;
  
  return <File className="size-5 text-muted-foreground" />;
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
        <div className="space-y-6">
          {config.onUpload ? (
            <div 
              className="relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer shadow-inner"
              onClick={() => void config.onUpload?.()}
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <UploadCloud className="size-6" />
              </div>
              <div className="text-sm font-bold tracking-tight">Click to upload or drag and drop</div>
              <div className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-widest">Maximum file size 50MB</div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-muted/50 transition-transform group-hover:scale-105">
                  <FileIcon contentType={file.contentType} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="truncate text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                      {file.name}
                    </span>
                    {file.status === "uploading" && (
                      <span className="animate-pulse text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Uploading...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    {file.contentType && (
                      <>
                        <span className="size-1 rounded-full bg-border" />
                        <span>{file.contentType}</span>
                      </>
                    )}
                  </div>
                  
                  {file.status === "uploading" && (
                    <div className="mt-2 w-full h-1 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${file.progress || 0}%` }} 
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.href && (
                    <Button asChild size="icon" variant="ghost" className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <a href={file.href} target="_blank" rel="noreferrer noopener">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                  {config.onDownload && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                      onClick={() => void config.onDownload?.(file)}
                    >
                      <Download className="size-4" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/40 shadow-xl backdrop-blur-md">
                      <DropdownMenuItem className="text-xs font-bold gap-2">
                        <FileText className="size-3.5" />
                        Properties
                      </DropdownMenuItem>
                      {config.onDelete && (
                        <DropdownMenuItem 
                          className="text-xs font-bold gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
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
