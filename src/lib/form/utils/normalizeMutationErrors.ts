import type {
  ModelFormErrorSource,
  NormalizedModelFormError,
} from "../types/generatedContract";

const DEFAULT_SOURCE: ModelFormErrorSource = "OPERATION";
const DEFAULT_FORM_ERROR_KEY = "__all__";
const CONFLICT_CODES = new Set(["CONFLICT", "STALE_OBJECT", "VERSION_CONFLICT"]);

export type NormalizeGeneratedMutationErrorsOptions = {
  formErrorKey?: string;
  visibleFieldPaths?: Iterable<string>;
};

function normalizeFieldPath(field: unknown, formErrorKey: string): string {
  if (!field || typeof field !== "string") return formErrorKey;
  const placeholder = "FORM_ERROR_KEY_SENTINEL";
  const normalized = field
    .replace(/__all__/g, placeholder)
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/__/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "")
    .replace(new RegExp(placeholder, "g"), "__all__");
  return normalized || formErrorKey;
}

function normalizeSource(source: unknown): ModelFormErrorSource {
  const value = String(source ?? DEFAULT_SOURCE).toUpperCase();
  if (value === "EXECUTION" || value === "TRANSPORT") {
    return value;
  }
  return "OPERATION";
}

function normalizeRowIndex(payload: Record<string, unknown>): number | null {
  if (typeof payload.rowIndex === "number") {
    return payload.rowIndex;
  }
  if (typeof payload.row_index === "number") {
    return payload.row_index;
  }
  return null;
}

function normalizeMeta(payload: Record<string, unknown>) {
  if (payload.meta && typeof payload.meta === "object") {
    return { ...(payload.meta as Record<string, unknown>) };
  }
  return null;
}

function detectConflict(payload: Record<string, unknown>) {
  if (payload.conflict === true || payload.isConflict === true) {
    return true;
  }
  const code = String(payload.code ?? payload.errorCode ?? "").toUpperCase();
  return CONFLICT_CODES.has(code);
}

export function normalizeGeneratedMutationErrors(
  errors: unknown,
  options: NormalizeGeneratedMutationErrorsOptions = {},
): NormalizedModelFormError[] {
  if (!errors) return [];
  const formErrorKey = String(options.formErrorKey ?? DEFAULT_FORM_ERROR_KEY);
  const visibleFields = options.visibleFieldPaths
    ? new Set(Array.from(options.visibleFieldPaths))
    : null;
  const list = Array.isArray(errors) ? errors : [errors];

  return list
    .filter(Boolean)
    .map((item): NormalizedModelFormError => {
      if (typeof item === "string") {
        return {
          field: formErrorKey,
          message: item,
          source: DEFAULT_SOURCE,
          conflict: false,
          meta: null,
        };
      }
      if (typeof item !== "object") {
        return {
          field: formErrorKey,
          message: "An unexpected error occurred.",
          source: DEFAULT_SOURCE,
          conflict: false,
          meta: null,
        };
      }

      const payload = item as Record<string, unknown>;
      const rawField = normalizeFieldPath(payload.field, formErrorKey);
      const visible = !visibleFields || visibleFields.has(rawField) || rawField === formErrorKey;
      const field = visible ? rawField : formErrorKey;
      const conflict = detectConflict(payload);
      const rowIndex = normalizeRowIndex(payload);
      const meta = normalizeMeta(payload);

      if (!visible && rawField !== formErrorKey) {
        const nextMeta = { ...(meta ?? {}) };
        nextMeta.originalField = rawField;
        return {
          field,
          message: String(payload.message ?? "An unexpected error occurred."),
          code: payload.code ? String(payload.code) : null,
          source: normalizeSource(payload.source),
          conflict,
          rowIndex,
          meta: nextMeta,
        };
      }

      if (conflict && meta) {
        meta.refreshRequired = meta.refreshRequired ?? true;
      }

      return {
        field,
        message: String(payload.message ?? "An unexpected error occurred."),
        code: payload.code ? String(payload.code) : null,
        source: normalizeSource(payload.source),
        conflict,
        rowIndex,
        meta,
      };
    });
}

export function mapBulkErrorField(
  error: Pick<NormalizedModelFormError, "field" | "rowIndex">,
  formErrorKey = DEFAULT_FORM_ERROR_KEY,
): string {
  if (typeof error.rowIndex !== "number") {
    return error.field || formErrorKey;
  }
  const field =
    error.field && error.field !== formErrorKey ? error.field : formErrorKey;
  if (field.startsWith("items.")) return field;
  return `items.${error.rowIndex}.${field}`;
}
