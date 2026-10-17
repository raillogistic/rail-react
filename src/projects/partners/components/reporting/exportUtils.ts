/** Reusable Partners implementation using the host Rail runtime. */
import * as XLSX from "xlsx";
import { getAuthorizationHeader } from "@/shared/api/auth/token-storage";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";

export async function downloadBinaryFile(
  url: string,
  filename: string,
): Promise<void> {
  const authorizationHeader = getAuthorizationHeader();
  const backendUrl = getRuntimeBackendConfig().backendUrl;
  const targetUrl = url.startsWith("/") ? `${backendUrl}${url}` : url;

  const response = await fetch(targetUrl, {
    credentials: "include",
    headers: {
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
    },
  });
  if (!response.ok) {
    throw new Error("Impossible de generer l'export.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(objectUrl);
}

export function downloadWorkbook(
  sheets: Record<string, Array<Record<string, unknown>>>,
  filename: string,
): void {
  const workbook = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([sheetName, rows]) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  });

  XLSX.writeFile(workbook, filename);
}
