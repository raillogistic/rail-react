import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  fetchProtectedFile,
  getProtectedFileDisplayName,
  isProtectedPdfValue,
} from "@/shared/api/files/protected-file";
import type { TemplatePdfPreviewPayload } from "../utils/templateExecution";

type ProtectedFileCellProps = {
  value: string;
  label?: string;
  className?: string;
  onPdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
};

/**
 * Opens model file fields through the authenticated backend media endpoint.
 */
export function ProtectedFileCell({
  value,
  label,
  className,
  onPdfPreview,
}: ProtectedFileCellProps) {
  const [loading, setLoading] = useState(false);

  const displayLabel = (label || getProtectedFileDisplayName(value)).trim();

  const handleClick = async () => {
    if (loading) {
      return;
    }

    const shouldPreviewPdf = Boolean(onPdfPreview && isProtectedPdfValue(value));
    const popup =
      typeof window !== "undefined" && !shouldPreviewPdf
        ? window.open("", "_blank", "noopener,noreferrer")
        : null;

    setLoading(true);
    try {
      const { blob, filename } = await fetchProtectedFile(value);

      if (shouldPreviewPdf && onPdfPreview) {
        onPdfPreview({ blob, filename });
        return;
      }

      const objectUrl = window.URL.createObjectURL(blob);
      if (popup && !popup.closed) {
        popup.location.replace(objectUrl);
        popup.document.title = filename;
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      if (popup && !popup.closed) {
        popup.close();
      }
      toast.error(
        error instanceof Error ? error.message : "Impossible d'ouvrir le fichier.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={
        className ||
        "inline-flex max-w-full items-center gap-1 truncate text-left text-primary underline underline-offset-4 transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
      }
      onClick={() => void handleClick()}
      disabled={loading}
      title={displayLabel}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      <span className="truncate">
        {loading ? "Ouverture..." : displayLabel || "Ouvrir le fichier"}
      </span>
    </button>
  );
}
