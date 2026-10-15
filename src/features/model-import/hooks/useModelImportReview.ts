import { useCallback, useMemo, useState } from "react";
import {
  createModelImportBatch,
  fetchModelImportBatch,
  updateModelImportBatch,
} from "../api";
import {
  humanizeImportError,
  humanizeImportUploadError,
  summarizeImportIssues,
} from "../error-messages";
import type {
  CreateModelImportBatchPayload,
  ImportIssue,
  ImportRowPatchInput,
  ModelImportBatch,
  ModelImportRow,
  ModelImportTemplate,
  UpdateModelImportBatchPayload,
} from "../types";

type ReviewState = {
  batch: ModelImportBatch | null;
  rows: ModelImportRow[];
  issues: ImportIssue[];
  loading: boolean;
  error: string | null;
};

export function useModelImportReview(appLabel: string, modelName: string) {
  const [state, setState] = useState<ReviewState>({
    batch: null,
    rows: [],
    issues: [],
    loading: false,
    error: null,
  });

  const refreshBatch = useCallback(async (batchId: string) => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const batch = await fetchModelImportBatch(batchId);
      setState((previous) => ({
        ...previous,
        batch,
        rows: batch?.rows ?? [],
        issues: batch?.issues ?? [],
        loading: false,
      }));
      return batch;
    } catch (error) {
      const readableMessage = humanizeImportError(error);
      setState((previous) => ({
        ...previous,
        loading: false,
        error: readableMessage || "Impossible de rafraichir le lot d'import.",
      }));
      return null;
    }
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      template: ModelImportTemplate,
      format: "CSV" | "XLSX",
    ): Promise<CreateModelImportBatchPayload> => {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const payload = await createModelImportBatch({
          appLabel,
          modelName,
          templateId: template.templateId,
          templateVersion: template.exactVersion ?? template.version,
          file,
          fileFormat: format,
        });

        if (!payload.ok) {
          throw new Error(
            summarizeImportIssues(
              payload.issues,
              "Le televersement a echoue pendant la validation du fichier.",
            ),
          );
        }

        if (payload.batch?.id) {
          await refreshBatch(payload.batch.id);
        } else {
          setState((previous) => ({
            ...previous,
            loading: false,
            issues: payload.issues ?? [],
          }));
        }
        return payload;
      } catch (error) {
        const readableMessage = humanizeImportUploadError(error);
        setState((previous) => ({
          ...previous,
          loading: false,
          error: readableMessage,
        }));
        throw new Error(readableMessage);
      }
    },
    [appLabel, modelName, refreshBatch],
  );

  const patchRows = useCallback(
    async (batchId: string, patches: ImportRowPatchInput[]): Promise<UpdateModelImportBatchPayload> => {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const payload = await updateModelImportBatch({
          batchId,
          action: "PATCH_ROWS",
          patches,
        });
        await refreshBatch(batchId);
        return payload;
    } catch (error) {
      const readableMessage = humanizeImportError(error);
      setState((previous) => ({
        ...previous,
        loading: false,
        error: readableMessage || "Echec de la mise a jour de la ligne.",
      }));
      return { ok: false, rows: [], issues: [] };
    }
    },
    [refreshBatch],
  );

  const issueSummary = useMemo(() => {
    const blocking = state.issues.filter((issue) => issue.severity === "ERROR").length;
    const warnings = state.issues.filter((issue) => issue.severity === "WARNING").length;
    return { blocking, warnings };
  }, [state.issues]);

  return {
    ...state,
    issueSummary,
    uploadFile,
    patchRows,
    refreshBatch,
    setBatch: (batch: ModelImportBatch | null) =>
      setState((previous) => ({
        ...previous,
        batch,
        rows: batch?.rows ?? [],
        issues: batch?.issues ?? [],
      })),
  };
}
