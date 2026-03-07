import type { FormSchema } from "@/widgets/model-form/inputs/types";
import {
  getAuthorizationHeader,
  getSecureHeaders,
} from "@/shared/api/auth/token-storage";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";
import * as XLSX from "xlsx";
import type { TemplateClientField, TemplateInfo } from "../types";

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const SHEET_NAME_MAX_LENGTH = 31;
const INVALID_SHEET_NAME_PATTERN = /[:\\/?*\[\]]/g;

export type TemplateActionType = "pdf" | "excel";
type TemplateFormFieldType = "text" | "number" | "checkbox" | "date";
export type TemplatePdfPreviewPayload = {
  blob: Blob;
  filename: string;
  onRefresh?: (() => Promise<void>) | (() => void);
};

function getBackendBaseUrl(): string | null {
  const raw = getRuntimeBackendConfig().backendUrl.trim();
  if (!raw) return null;
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function resolveTemplateUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (ABSOLUTE_URL_PATTERN.test(trimmed)) return trimmed;

  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) return trimmed;

  try {
    return new URL(trimmed, backendBaseUrl).toString();
  } catch {
    return trimmed;
  }
}

function normalizeTemplateApiPath(url: string): string {
  if (!url) return url;

  try {
    const backendBaseUrl =
      getBackendBaseUrl() ??
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost/");
    const isAbsolute = ABSOLUTE_URL_PATTERN.test(url);
    const parsed = new URL(url, backendBaseUrl);
    parsed.pathname = parsed.pathname.replace(
      /^\/api\/(?=(templates|excel)\/)/i,
      "/api/v1/",
    );
    if (isAbsolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function appendQueryParams(
  url: string,
  params: Record<string, unknown>,
): string {
  if (!url) return url;

  try {
    const backendBaseUrl =
      getBackendBaseUrl() ??
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost/");
    const isAbsolute = ABSOLUTE_URL_PATTERN.test(url);
    const parsed = new URL(url, backendBaseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const normalized = String(value).trim();
      if (!normalized) return;
      parsed.searchParams.set(key, normalized);
    });
    if (isAbsolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function normalizeTemplateType(
  template: TemplateInfo,
): TemplateActionType {
  const declared = String(template.templateType ?? "").toLowerCase();
  if (declared === "excel") return "excel";
  if (declared === "pdf") return "pdf";

  const endpoint = String(template.endpoint ?? "").toLowerCase();
  const urlPath = String(template.urlPath ?? "").toLowerCase();
  if (endpoint.includes("/excel/") || urlPath.includes("excel")) {
    return "excel";
  }
  return "pdf";
}

function humanizeFieldName(value: string): string {
  const withSpaces = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();
  if (!withSpaces) return value;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function resolveTemplateFormFieldType(
  rawType?: string | null,
): TemplateFormFieldType {
  const normalized = String(rawType ?? "").toLowerCase();
  if (normalized.includes("bool")) return "checkbox";
  if (
    normalized.includes("int") ||
    normalized.includes("decimal") ||
    normalized.includes("float") ||
    normalized.includes("number")
  ) {
    return "number";
  }
  if (normalized.includes("date")) return "date";
  return "text";
}

export function parseTemplateClientFields(
  template: TemplateInfo,
): TemplateClientField[] {
  const seen = new Set<string>();
  const normalized: TemplateClientField[] = [];

  const pushField = (field: TemplateClientField | null | undefined) => {
    const name = String(field?.name ?? "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    normalized.push({
      name,
      type: field?.type ?? "string",
    });
  };

  const schemaValue = template.clientDataSchema;
  if (Array.isArray(schemaValue)) {
    schemaValue.forEach((entry) => pushField(entry));
  } else if (typeof schemaValue === "string") {
    try {
      const parsed = JSON.parse(schemaValue) as unknown;
      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          if (!entry || typeof entry !== "object") return;
          const payload = entry as { name?: unknown; type?: unknown };
          pushField({
            name: String(payload.name ?? "").trim(),
            type: payload.type ? String(payload.type) : "string",
          });
        });
      }
    } catch {
      // Ignore malformed schema payloads and fallback to clientDataFields.
    }
  }

  (template.clientDataFields ?? []).forEach((name) => {
    pushField({ name, type: "string" });
  });

  return normalized;
}

export function buildTemplateClientSchema(
  fields: TemplateClientField[],
): FormSchema {
  return {
    fields: fields.map((field) => ({
      name: field.name,
      label: humanizeFieldName(field.name),
      type: resolveTemplateFormFieldType(field.type),
    })),
  };
}

function buildTemplateRequestUrl(
  template: TemplateInfo,
  rowId: string,
  templateType: TemplateActionType,
  clientData: Record<string, unknown>,
): string {
  const resolved = normalizeTemplateApiPath(
    resolveTemplateUrl(template.endpoint ?? ""),
  );
  if (!resolved) return "";

  let baseUrl = resolved;
  if (templateType === "pdf") {
    if (/<pk>|%3Cpk%3E/i.test(resolved)) {
      baseUrl = resolved.replace(/<pk>|%3Cpk%3E/gi, encodeURIComponent(rowId));
    } else {
      const normalizedBase = resolved.endsWith("/") ? resolved : `${resolved}/`;
      baseUrl = `${normalizedBase}${encodeURIComponent(rowId)}/`;
    }
  } else {
    baseUrl = appendQueryParams(resolved, { pk: rowId });
  }

  return appendQueryParams(baseUrl, clientData);
}

function resolveDownloadFilename(
  contentDisposition: string | null,
  fallbackName: string,
): string {
  if (!contentDisposition) return fallbackName;
  const match = contentDisposition.match(
    /filename\*?=(?:UTF-8''|")?([^\";]+)/i,
  );
  if (!match?.[1]) return fallbackName;
  return decodeURIComponent(match[1].replace(/"/g, "").trim()) || fallbackName;
}

function sanitizeFileBase(value: string): string {
  return value.replace(/[^\w.-]+/g, "-");
}

function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function sanitizeSheetName(value: string): string {
  const cleaned = value.replace(INVALID_SHEET_NAME_PATTERN, "_").trim();
  if (!cleaned) return "Sheet";
  return cleaned.slice(0, SHEET_NAME_MAX_LENGTH);
}

function ensureUniqueSheetName(name: string, used: Set<string>): string {
  let next = sanitizeSheetName(name);
  if (!used.has(next)) {
    used.add(next);
    return next;
  }
  let index = 2;
  while (true) {
    const suffix = `_${index}`;
    const candidate = sanitizeSheetName(
      `${next.slice(0, SHEET_NAME_MAX_LENGTH - suffix.length)}${suffix}`,
    );
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    index += 1;
  }
}

async function fetchTemplateBlob(
  template: TemplateInfo,
  rowId: string,
  clientData: Record<string, unknown>,
  extraQueryParams: Record<string, unknown> = {},
): Promise<{ blob: Blob; response: Response }> {
  const templateType = normalizeTemplateType(template);
  const baseUrl = buildTemplateRequestUrl(
    template,
    rowId,
    templateType,
    clientData,
  );
  if (!baseUrl) {
    throw new Error("URL du template introuvable.");
  }
  const requestUrl = appendQueryParams(baseUrl, extraQueryParams);

  const authorizationHeader = getAuthorizationHeader();
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
      ...getSecureHeaders(),
    },
    credentials: "include",
  });
  if (!response.ok) {
    let detail = "Ã‰chec de gÃ©nÃ©ration du template.";
    try {
      const payload = (await response.json()) as {
        error?: string;
        detail?: string;
      };
      detail = payload.detail || payload.error || detail;
    } catch {
      // Keep fallback detail message.
    }
    throw new Error(detail);
  }
  return { blob: await response.blob(), response };
}

async function mergeExcelBlobs(blobs: Blob[], rowIds: string[]): Promise<Blob> {
  const mergedWorkbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (let index = 0; index < blobs.length; index += 1) {
    const blob = blobs[index];
    const rowId = rowIds[index];
    const bytes = await blob.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetNames = workbook.SheetNames ?? [];
    if (!sheetNames.length) continue;

    for (const sourceName of sheetNames) {
      const worksheet = workbook.Sheets[sourceName];
      if (!worksheet) continue;
      const sheetName = ensureUniqueSheetName(
        `${rowId}_${sourceName}`,
        usedNames,
      );
      XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, sheetName);
    }
  }

  if (!mergedWorkbook.SheetNames.length) {
    throw new Error("Aucune feuille Excel n'a Ã©tÃ© gÃ©nÃ©rÃ©e.");
  }
  const mergedBytes = XLSX.write(mergedWorkbook, {
    type: "array",
    bookType: "xlsx",
  });
  return new Blob([mergedBytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function executeTemplateForRows(
  template: TemplateInfo,
  rowIds: string[],
  clientData: Record<string, unknown> = {},
  options?: {
    onPdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
  },
): Promise<{ templateType: TemplateActionType; count: number }> {
  const orderedIds = rowIds.filter(Boolean);
  if (!orderedIds.length) {
    throw new Error("SÃ©lectionnez au moins une ligne.");
  }

  const templateType = normalizeTemplateType(template);
  const safeBase = sanitizeFileBase(
    template.key || template.title || "template",
  );

  if (orderedIds.length === 1) {
    const rowId = orderedIds[0];
    const { blob, response } = await fetchTemplateBlob(
      template,
      rowId,
      clientData,
    );

    if (templateType === "pdf") {
      const fallbackName = `${safeBase}-${rowId}.pdf`;
      const filename = resolveDownloadFilename(
        response.headers.get("content-disposition"),
        fallbackName,
      );
      if (options?.onPdfPreview) {
        options.onPdfPreview({ blob, filename });
        return { templateType, count: 1 };
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        downloadBlob(blob, filename);
      }
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60_000);
      return { templateType, count: 1 };
    }

    const fallbackName = `${safeBase}-${rowId}.xlsx`;
    const filename = resolveDownloadFilename(
      response.headers.get("content-disposition"),
      fallbackName,
    );
    downloadBlob(blob, filename);
    return { templateType, count: 1 };
  }

  if (templateType === "pdf") {
    const mergedResponse = await fetchTemplateBlob(
      template,
      orderedIds[0],
      clientData,
      { merge_pks: orderedIds.join(",") },
    );
    const filename = `${safeBase}-merged.pdf`;
    if (options?.onPdfPreview) {
      options.onPdfPreview({ blob: mergedResponse.blob, filename });
      return { templateType, count: orderedIds.length };
    }
    downloadBlob(mergedResponse.blob, filename);
    return { templateType, count: orderedIds.length };
  }

  const responses = await Promise.all(
    orderedIds.map((rowId) => fetchTemplateBlob(template, rowId, clientData)),
  );
  const blobs = responses.map((entry) => entry.blob);
  const mergedWorkbook = await mergeExcelBlobs(blobs, orderedIds);
  downloadBlob(mergedWorkbook, `${safeBase}-combined.xlsx`);
  return { templateType, count: orderedIds.length };
}
