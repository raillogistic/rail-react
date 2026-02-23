/**
 * Browser download helpers.
 */

/**
 * Safely trigger a browser download for a Blob.
 *
 * @param blob - File content.
 * @param filename - Suggested filename for the browser.
 * @param mimeType - Optional mimeType override.
 */
export function downloadBlob(blob: Blob, filename: string, mimeType?: string): void {
  const fileBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const url = URL.createObjectURL(fileBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

