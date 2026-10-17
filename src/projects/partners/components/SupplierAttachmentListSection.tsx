/** Reusable Partners implementation using the host Rail runtime. */
import { useMemo } from "react";
import { Download, FileText } from "lucide-react";
import { useModelSingleQuery } from "@/shared/api/graphql/graphql/queries/hooks/useModelSingleQuery";
import { Button } from "@/shared/ui/kit/button";
import { UploadFile } from "@/widgets/components/UploadFile";

type SupplierAttachmentRecord = {
  id: number | string;
  title: string;
  sortOrder?: number | null;
  file?: string | null;
  filename?: string | null;
  uploadedAt?: string | null;
  uploadedBy?: {
    username?: string | null;
  } | null;
};

type SupplierAttachmentSectionData = {
  id: number | string;
  attachments?: SupplierAttachmentRecord[] | null;
};

type SupplierAttachmentListSectionProps = {
  supplierId: string;
};

function formatUploadedAt(value?: string | null): string {
  if (!value) {
    return "Aucun fichier";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SupplierAttachmentListSection({
  supplierId,
}: SupplierAttachmentListSectionProps) {
  const { data, loading, error, refetch } =
    useModelSingleQuery<SupplierAttachmentSectionData>({
      app: "suppliers",
      model: "Supplier",
      id: supplierId,
      selection: `
        id
        attachments {
          id
          title
          sortOrder
          file
          filename
          uploadedAt
          uploadedBy {
            username
          }
        }
      `,
    });

  const attachments = useMemo(
    () =>
      [...(data?.attachments ?? [])].sort(
        (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
      ),
    [data?.attachments],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement des pieces jointes...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Les pieces jointes n&apos;ont pas pu etre chargees.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{attachment.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {attachment.filename || "Fichier manquant"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatUploadedAt(attachment.uploadedAt)}
              {attachment.uploadedBy?.username
                ? ` • ${attachment.uploadedBy.username}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {attachment.file ? (
              <Button asChild variant="outline">
                <a
                  href={(() => {
                    if (attachment.file.startsWith("http")) return attachment.file;
                    const path = attachment.file.startsWith("/") ? attachment.file : `/${attachment.file}`;
                    const mediaPath = path.startsWith("/media/") ? path : `/media${path}`;
                    return `${import.meta.env.VITE_BACKEND_URL || ""}${mediaPath}`;
                  })()}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Ouvrir
                </a>
              </Button>
            ) : null}
            <UploadFile
              model="SupplierAttachment"
              id={attachment.id}
              field="file"
              title={attachment.file ? "Remplacer" : "Televerser"}
              onUploaded={() => {
                void refetch();
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SupplierAttachmentListSection;
