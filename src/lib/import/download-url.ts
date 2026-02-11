const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const LEGACY_TEMPLATE_PATH_PATTERN = /^\/api\/excel\/[^/]+\/[^/]+\/template\/?$/i;
const IMPORT_TEMPLATE_PATH_PATTERN = /^\/api\/v1\/import\/templates\/[^/]+\/[^/]+\/?$/i;

const getBackendBaseUrl = (): string | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined)?.trim();
  if (!raw) {
    return null;
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
};

export const resolveModelImportDownloadUrl = (downloadUrl: string | null | undefined): string => {
  if (!downloadUrl) {
    return "";
  }

  const trimmed = downloadUrl.trim();
  if (!trimmed) {
    return "";
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    return trimmed;
  }

  try {
    return new URL(trimmed, backendBaseUrl).toString();
  } catch {
    return trimmed;
  }
};

const isLegacyTemplateDownloadUrl = (downloadUrl: string): boolean => {
  if (!downloadUrl) {
    return false;
  }

  try {
    const backendBaseUrl = getBackendBaseUrl() ?? "http://localhost/";
    const parsed = new URL(downloadUrl, backendBaseUrl);
    return LEGACY_TEMPLATE_PATH_PATTERN.test(parsed.pathname);
  } catch {
    return LEGACY_TEMPLATE_PATH_PATTERN.test(downloadUrl);
  }
};

const applyTemplateFormatToUrl = (
  downloadUrl: string,
  format: "csv" | "xlsx",
): string => {
  if (!downloadUrl) {
    return downloadUrl;
  }

  try {
    const backendBaseUrl = getBackendBaseUrl() ?? "http://localhost/";
    const wasAbsolute = ABSOLUTE_URL_PATTERN.test(downloadUrl);
    const parsed = new URL(downloadUrl, backendBaseUrl);

    if (!IMPORT_TEMPLATE_PATH_PATTERN.test(parsed.pathname)) {
      return downloadUrl;
    }

    parsed.searchParams.set("format", format);
    if (wasAbsolute) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return downloadUrl;
  }
};

export const buildModelImportTemplateDownloadUrl = (
  appLabel: string,
  modelName: string,
  format: "csv" | "xlsx" = "csv",
): string => {
  const safeAppLabel = String(appLabel).trim();
  const safeModelName = String(modelName).trim().toLowerCase();
  const path = `/api/v1/import/templates/${safeAppLabel}/${safeModelName}/?format=${format}`;
  return resolveModelImportDownloadUrl(path);
};

export const resolveModelImportTemplateDownloadUrl = (
  input: {
    appLabel: string;
    modelName: string;
    downloadUrl?: string | null;
    format?: "csv" | "xlsx";
  },
): string => {
  const desiredFormat = input.format ?? "csv";
  const preferred = resolveModelImportDownloadUrl(input.downloadUrl ?? "");
  if (preferred && !isLegacyTemplateDownloadUrl(preferred)) {
    return applyTemplateFormatToUrl(preferred, desiredFormat);
  }

  return buildModelImportTemplateDownloadUrl(
    input.appLabel,
    input.modelName,
    desiredFormat,
  );
};
