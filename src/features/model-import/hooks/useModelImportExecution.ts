import { useCallback, useState } from "react";
import {
  deleteModelImportBatch,
  fetchModelImportErrorReport,
  updateModelImportBatch,
} from "../api";
import { humanizeImportError, summarizeImportIssues } from "../error-messages";
import type {
  DeleteModelImportBatchPayload,
  ImportFileDownload,
  UpdateModelImportBatchPayload,
} from "../types";

type ExecutionState = {
  loading: boolean;
  error: string | null;
  validationSummary: UpdateModelImportBatchPayload["validationSummary"] | null;
  simulationSummary: UpdateModelImportBatchPayload["simulationSummary"] | null;
  commitSummary: UpdateModelImportBatchPayload["commitSummary"] | null;
};

export function useModelImportExecution() {
  const [state, setState] = useState<ExecutionState>({
    loading: false,
    error: null,
    validationSummary: null,
    simulationSummary: null,
    commitSummary: null,
  });

  const runAction = useCallback(
    async (
      batchId: string,
      action: "VALIDATE" | "SIMULATE" | "COMMIT",
    ): Promise<UpdateModelImportBatchPayload> => {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const payload = await updateModelImportBatch({ batchId, action });
        const actionLabel = action.toLowerCase();
        if (!payload.ok) {
          console.error(`[ModelImport] ${action} failed`, payload);
          const readableMessage = summarizeImportIssues(
            payload.issues,
            `Echec de l'action ${actionLabel}.`,
          );
          setState((previous) => ({
            ...previous,
            loading: false,
            error: readableMessage,
            validationSummary: payload.validationSummary ?? previous.validationSummary,
            simulationSummary: payload.simulationSummary ?? previous.simulationSummary,
            commitSummary: payload.commitSummary ?? previous.commitSummary,
          }));
          return payload;
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          error: null,
          validationSummary: payload.validationSummary ?? previous.validationSummary,
          simulationSummary: payload.simulationSummary ?? previous.simulationSummary,
          commitSummary: payload.commitSummary ?? previous.commitSummary,
        }));
        return payload;
      } catch (error) {
        console.error(`[ModelImport] ${action} unexpected error`, error);
        const readableMessage = humanizeImportError(error);
        setState((previous) => ({
          ...previous,
          loading: false,
          error: readableMessage,
        }));
        return { ok: false, rows: [], issues: [] };
      }
    },
    [],
  );

  const validate = useCallback(
    async (batchId: string) => runAction(batchId, "VALIDATE"),
    [runAction],
  );
  const simulate = useCallback(
    async (batchId: string) => runAction(batchId, "SIMULATE"),
    [runAction],
  );
  const commit = useCallback(
    async (batchId: string) => runAction(batchId, "COMMIT"),
    [runAction],
  );

  const removeBatch = useCallback(async (batchId: string): Promise<DeleteModelImportBatchPayload> => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const payload = await deleteModelImportBatch({ batchId });
      setState((previous) => ({ ...previous, loading: false }));
      return payload;
    } catch (error) {
      console.error("[ModelImport] delete batch unexpected error", error);
      const readableMessage = humanizeImportError(error);
      setState((previous) => ({
        ...previous,
        loading: false,
        error: readableMessage || "Echec de la suppression du lot.",
      }));
      return { ok: false, deletedBatchId: null };
    }
  }, []);

  const fetchErrorReport = useCallback(async (batchId: string): Promise<ImportFileDownload | null> => {
    try {
      return await fetchModelImportErrorReport(batchId, "CSV");
    } catch {
      return null;
    }
  }, []);

  return {
    ...state,
    validate,
    simulate,
    commit,
    removeBatch,
    fetchErrorReport,
  };
}
