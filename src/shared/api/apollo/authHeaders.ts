export const hasExplicitAuthorizationHeader = (
  headers: Record<string, unknown> | undefined,
): boolean => {
  if (!headers) {
    return false;
  }

  const lowercaseAuthorization = headers.authorization;
  if (
    typeof lowercaseAuthorization === "string" &&
    lowercaseAuthorization.trim().length > 0
  ) {
    return true;
  }

  const uppercaseAuthorization = headers.Authorization;
  return (
    typeof uppercaseAuthorization === "string" &&
    uppercaseAuthorization.trim().length > 0
  );
};
