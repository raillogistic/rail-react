import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ModelTableV2TableConfig } from "../config/types";
import type { TemplatePdfPreviewPayload } from "../utils/templateExecution";
import {
  getPdfLabel,
  resolvePdfPreviewSrc,
} from "../components/DynamicModelTable.shared";

type ModelTablePdfPreviewConfig = ModelTableV2TableConfig["pdfPreview"];

export function useModelTablePdfPreview(config?: ModelTablePdfPreviewConfig) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("");
  const [pdfPreviewReloadKey, setPdfPreviewReloadKey] = useState(0);
  const [pdfPreviewRefreshing, setPdfPreviewRefreshing] = useState(false);
  const pdfPreviewObjectUrlRef = useRef<string | null>(null);
  const pdfPreviewRefreshRef = useRef<
    (() => Promise<void>) | (() => void) | null
  >(null);

  const pdfPreviewEnabled = config?.enabled ?? false;

  const openPdfPreview = useCallback(
    (pdfUrl: string, fallbackTitle?: string) => {
      if (
        pdfPreviewObjectUrlRef.current &&
        pdfPreviewObjectUrlRef.current !== pdfUrl
      ) {
        window.URL.revokeObjectURL(pdfPreviewObjectUrlRef.current);
        pdfPreviewObjectUrlRef.current = null;
      }
      setPdfPreviewUrl(pdfUrl);
      setPdfPreviewReloadKey(0);
      setPdfPreviewRefreshing(false);
      if (!pdfUrl.startsWith("blob:")) {
        pdfPreviewRefreshRef.current = null;
      }
      setPdfPreviewTitle(
        fallbackTitle || config?.title || getPdfLabel(pdfUrl),
      );
    },
    [config?.title],
  );

  const handleTemplatePdfPreview = useCallback(
    ({ blob, filename, onRefresh }: TemplatePdfPreviewPayload) => {
      if (pdfPreviewObjectUrlRef.current) {
        window.URL.revokeObjectURL(pdfPreviewObjectUrlRef.current);
      }
      const objectUrl = window.URL.createObjectURL(blob);
      pdfPreviewObjectUrlRef.current = objectUrl;
      pdfPreviewRefreshRef.current = onRefresh ?? null;
      openPdfPreview(objectUrl, filename);
    },
    [openPdfPreview],
  );

  const closePdfPreview = useCallback(() => {
    if (pdfPreviewObjectUrlRef.current) {
      window.URL.revokeObjectURL(pdfPreviewObjectUrlRef.current);
      pdfPreviewObjectUrlRef.current = null;
    }
    setPdfPreviewUrl(null);
    setPdfPreviewTitle("");
    setPdfPreviewReloadKey(0);
    setPdfPreviewRefreshing(false);
    pdfPreviewRefreshRef.current = null;
  }, []);

  useEffect(() => () => closePdfPreview(), [closePdfPreview]);

  const pdfPreviewSrc = useMemo(
    () =>
      pdfPreviewUrl
        ? resolvePdfPreviewSrc(pdfPreviewUrl, pdfPreviewReloadKey)
        : null,
    [pdfPreviewReloadKey, pdfPreviewUrl],
  );

  const refreshPdfPreview = useCallback(async () => {
    if (pdfPreviewRefreshRef.current) {
      setPdfPreviewRefreshing(true);
      try {
        await pdfPreviewRefreshRef.current();
      } finally {
        setPdfPreviewRefreshing(false);
      }
      return;
    }
    setPdfPreviewReloadKey((current) => current + 1);
  }, []);

  return {
    pdfPreviewEnabled,
    pdfPreviewUrl,
    pdfPreviewTitle,
    pdfPreviewSrc,
    pdfPreviewRefreshing,
    openPdfPreview,
    closePdfPreview,
    refreshPdfPreview,
    handleTemplatePdfPreview,
  };
}
