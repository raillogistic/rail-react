import * as React from "react";
import { toast } from "@/lib/components/ui/sonner";
import type { MutationResult } from "@apollo/client";
import type { MutationError } from "../types";
import { isBlockingError } from "../utils/errors";

export function useMutationFeedback(options: {
  mutationErrors: MutationError[];
  createState: MutationResult<any>;
  updateState: MutationResult<any>;
  mutationMode: "create" | "update" | null;
  successMessage?:
    | string
    | ((ctx: { payload: any; mode: "create" | "update" }) => string);
  showSuccessToast?: boolean;
  onSuccessRedirect?: (payload: any) => void;
}) {
  const {
    mutationErrors,
    createState,
    updateState,
    mutationMode,
    successMessage,
    showSuccessToast,
    onSuccessRedirect,
  } = options;

  const lastSuccessDataRef = React.useRef<any>(null);
  const lastNetworkErrorRef = React.useRef<any>(null);

  React.useEffect(() => {
    const networkError = createState.error ?? updateState.error;
    const hasBlockingErrors = mutationErrors.some(isBlockingError);
    if (!networkError || lastNetworkErrorRef.current === networkError) {
      return;
    }
    if (hasBlockingErrors) {
      return;
    }
    lastNetworkErrorRef.current = networkError;
    toast.error(
      (networkError as Error).message ?? "Network error while submitting the form."
    );
  }, [createState.error, updateState.error, mutationErrors]);

  const successPayload = React.useMemo(() => {
    return (createState.data as any)?.response ?? (updateState.data as any)?.response ?? null;
  }, [createState.data, updateState.data]);

  React.useEffect(() => {
    const isMutating = createState.loading || updateState.loading;
    const hasBlockingErrors = mutationErrors.some(isBlockingError);
    if (!successPayload?.ok || isMutating || hasBlockingErrors) {
      return;
    }
    if (lastSuccessDataRef.current === successPayload) {
      return;
    }
    lastSuccessDataRef.current = successPayload;
    const defaultMessage =
      mutationMode === "update"
        ? "Update completed successfully."
        : "Creation completed successfully.";
    const message =
      typeof successMessage === "function"
        ? successMessage({ payload: successPayload, mode: mutationMode ?? "create" })
        : successMessage ?? defaultMessage;
    if (showSuccessToast) {
      toast.success(message);
    }
    onSuccessRedirect?.(successPayload);
  }, [
    createState.loading,
    updateState.loading,
    successPayload,
    mutationErrors,
    successMessage,
    mutationMode,
    onSuccessRedirect,
    showSuccessToast,
  ]);
}
