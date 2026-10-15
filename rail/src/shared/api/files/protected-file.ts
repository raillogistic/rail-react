import {
  getAuthorizationHeader,
  getSecureHeaders,
} from "@/shared/api/auth/token-storage";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const DEFAULT_PROTECTED_MEDIA_PREFIX = "/api/v1/media/";
const DJANGO_MEDIA_PREFIX = "/media/";

export type ProtectedFileFetchResult = {
  blob: Blob;
  filename: string;
  response: Response;
  requestUrl: string;
};

function getBackendBaseUrl(): string | null {
  const raw = getRuntimeBackendConfig().backendUrl.trim();
  if (!raw) {
    return null;
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function normalizeRelativeFilePath(rawValue: string): string | null {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const segments = normalized
    .split("/")
    .map((segment) => segment.trim())
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

  if (segments.length === 0) {
    return null;
  }

  return segments.join("/");
}

function extractRelativeFilePath(rawValue: string): string | null {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith(DEFAULT_PROTECTED_MEDIA_PREFIX)) {
        return normalizeRelativeFilePath(
          decodeURIComponent(
            parsed.pathname.slice(DEFAULT_PROTECTED_MEDIA_PREFIX.length),
          ),
        );
      }
      if (parsed.pathname.startsWith(DJANGO_MEDIA_PREFIX)) {
        return normalizeRelativeFilePath(
          decodeURIComponent(parsed.pathname.slice(DJANGO_MEDIA_PREFIX.length)),
        );
      }
      return normalizeRelativeFilePath(decodeURIComponent(parsed.pathname));
    } catch {
      return normalizeRelativeFilePath(trimmed);
    }
  }

  if (trimmed.startsWith(DEFAULT_PROTECTED_MEDIA_PREFIX)) {
    return normalizeRelativeFilePath(
      decodeURIComponent(trimmed.slice(DEFAULT_PROTECTED_MEDIA_PREFIX.length)),
    );
  }

  if (trimmed.startsWith(DJANGO_MEDIA_PREFIX)) {
    return normalizeRelativeFilePath(
      decodeURIComponent(trimmed.slice(DJANGO_MEDIA_PREFIX.length)),
    );
  }

  return normalizeRelativeFilePath(trimmed.replace(/^\/+/, ""));
}

export function getProtectedFileDisplayName(value: string): string {
  const relativePath = extractRelativeFilePath(value);
  if (!relativePath) {
    return String(value ?? "").trim() || "-";
  }

  const segments = relativePath.split("/");
  const lastSegment = segments[segments.length - 1] ?? relativePath;
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

export function isProtectedPdfValue(value: string): boolean {
  return /\.pdf(?:[?#].*)?$/i.test(getProtectedFileDisplayName(value));
}

export function resolveProtectedFileUrl(value: string): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith(DEFAULT_PROTECTED_MEDIA_PREFIX)) {
        return parsed.toString();
      }
    } catch {
      // Fall through to protected path resolution.
    }
  }

  const relativePath = extractRelativeFilePath(trimmed);
  if (!relativePath) {
    return null;
  }

  const encodedPath = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const protectedPath = `${DEFAULT_PROTECTED_MEDIA_PREFIX}${encodedPath}`;
  const backendBaseUrl = getBackendBaseUrl();

  if (!backendBaseUrl) {
    return protectedPath;
  }

  try {
    return new URL(protectedPath, backendBaseUrl).toString();
  } catch {
    return protectedPath;
  }
}

export function resolveProtectedFileRequestFilename(
  contentDisposition: string | null,
  rawValue: string,
): string {
  const fallbackName = getProtectedFileDisplayName(rawValue);
  if (!contentDisposition) {
    return fallbackName;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim()) || fallbackName;
    } catch {
      return utf8Match[1].trim() || fallbackName;
    }
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (!basicMatch?.[1]) {
    return fallbackName;
  }

  const decoded = basicMatch[1].trim();
  return decoded || fallbackName;
}

export async function fetchProtectedFile(
  value: string,
): Promise<ProtectedFileFetchResult> {
  const requestUrl = resolveProtectedFileUrl(value);
  if (!requestUrl) {
    throw new Error("Fichier introuvable.");
  }

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
    let detail = "Impossible d'ouvrir le fichier.";
    try {
      const payload = (await response.json()) as {
        error?: string;
        detail?: string;
        data?: { message?: string };
      };
      detail =
        payload.detail ||
        payload.error ||
        payload.data?.message ||
        detail;
    } catch {
      // Keep fallback message.
    }
    throw new Error(detail);
  }

  const filename = resolveProtectedFileRequestFilename(
    response.headers.get("content-disposition"),
    value,
  );

  return {
    blob: await response.blob(),
    filename,
    response,
    requestUrl,
  };
}
