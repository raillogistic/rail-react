/** Preserve caller credentials regardless of HTTP header-name casing. */
export const hasExplicitAuthorizationHeader = (
  headers: Record<string, unknown> | undefined,
): boolean => {
  if (!headers) {
    return false;
  }

  return Object.entries(headers).some(([name, value]) =>
    name.toLowerCase() === 'authorization' && typeof value === 'string' && value.trim().length > 0,
  );
};
