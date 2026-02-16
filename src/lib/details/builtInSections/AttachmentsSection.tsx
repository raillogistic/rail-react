import { Button } from "@/lib/components/ui/button";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type AttachmentItem = {
  id: string;
  name: string;
  sizeBytes?: number;
  contentType?: string;
  uploadedAt?: string | number | Date;
  href?: string;
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
  onUpload?: () => void | Promise<void>;
  onDownload?: (file: AttachmentItem) => void | Promise<void>;
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
        <div className="space-y-3">
          {config.onUpload ? (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void config.onUpload?.();
                }}
              >
                Upload file
              </Button>
            </div>
          ) : null}
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.sizeBytes)}
                    {file.contentType ? ` • ${file.contentType}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.href ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={file.href} target="_blank" rel="noreferrer noopener">
                        Open
                      </a>
                    </Button>
                  ) : null}
                  {config.onDownload ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void config.onDownload?.(file);
                      }}
                    >
                      Download
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    },
  };
}

export default createAttachmentsSection;
