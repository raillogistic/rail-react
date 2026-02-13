import type {
  ModelFormErrorSource,
  NormalizedModelFormError,
} from "../types/generatedContract";

const DEFAULT_SOURCE: ModelFormErrorSource = "OPERATION";
const DEFAULT_FIELD = "__all__";

function normalizeField(field: unknown): string {
  if (!field || typeof field !== "string") return DEFAULT_FIELD;
  const placeholder = "FORM_ERROR_KEY_SENTINEL";
  const normalized = field
    .replace(/__all__/g, placeholder)
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/__/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "")
    .replace(new RegExp(placeholder, "g"), "__all__");
  return normalized || DEFAULT_FIELD;
}

function normalizeSource(source: unknown): ModelFormErrorSource {
  const value = String(source ?? DEFAULT_SOURCE).toUpperCase();
  if (value === "EXECUTION" || value === "TRANSPORT") {
    return value;
  }
  return "OPERATION";
}

export function normalizeGeneratedMutationErrors(
  errors: unknown,
): NormalizedModelFormError[] {
  if (!errors) return [];
  const list = Array.isArray(errors) ? errors : [errors];
  return list
    .filter(Boolean)
    .map((item): NormalizedModelFormError => {
      if (typeof item === "string") {
        return {
          field: DEFAULT_FIELD,
          message: item,
          source: DEFAULT_SOURCE,
        };
      }
      if (typeof item !== "object") {
        return {
          field: DEFAULT_FIELD,
          message: "An unexpected error occurred.",
          source: DEFAULT_SOURCE,
        };
      }
      const payload = item as Record<string, unknown>;
      return {
        field: normalizeField(payload.field),
        message: String(payload.message ?? "An unexpected error occurred."),
        code: payload.code ? String(payload.code) : null,
        source: normalizeSource(payload.source),
        rowIndex:
          typeof payload.rowIndex === "number"
            ? payload.rowIndex
            : typeof payload.row_index === "number"
              ? payload.row_index
              : null,
        meta:
          payload.meta && typeof payload.meta === "object"
            ? (payload.meta as Record<string, unknown>)
            : null,
      };
    });
}

export function mapBulkErrorField(error: NormalizedModelFormError): string {
  if (typeof error.rowIndex !== "number") {
    return error.field || DEFAULT_FIELD;
  }
  const field = error.field && error.field !== DEFAULT_FIELD ? error.field : DEFAULT_FIELD;
  if (field.startsWith("items.")) return field;
  return `items.${error.rowIndex}.${field}`;
}
