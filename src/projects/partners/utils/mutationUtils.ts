/** Reusable Partners implementation using the host Rail runtime. */
type PurchaseOrderMutationError = { field?: string | null; message?: string | null };

type MutationPayload = {
  ok?: boolean | null;
  object?: Record<string, unknown> | null;
  errors?: PurchaseOrderMutationError[] | null;
};

export function extractMutationPayload(
  data: Record<string, unknown> | null | undefined,
  preferredKey: string,
): MutationPayload | null {
  if (!data) {
    return null;
  }
  const preferred = data[preferredKey];
  if (preferred && typeof preferred === "object") {
    return preferred as MutationPayload;
  }
  const firstPayload = Object.values(data).find(
    (value) => value && typeof value === "object",
  );
  return (firstPayload as MutationPayload | undefined) ?? null;
}

export function getFirstMutationErrorMessage(
  payload: MutationPayload | null | undefined,
  fallback: string,
): string {
  const message = payload?.errors?.find((entry) => entry?.message)?.message;
  return message?.trim() || fallback;
}
