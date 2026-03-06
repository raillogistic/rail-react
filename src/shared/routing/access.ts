export type RouteAccessTargetType =
  | "project"
  | "route"
  | "navigation-group"
  | "navigation-entry";

export interface RouteAccessRequirement {
  requireAuthentication?: boolean;
  anyPermissions?: string[];
  allPermissions?: string[];
  anyRoles?: string[];
  allRoles?: string[];
}

export interface RouteAccessRule extends RouteAccessRequirement {
  targetType: RouteAccessTargetType;
  target: string;
  allowed?: boolean;
  denialReason?: string | null;
}

export interface RouteAccessManifest {
  version: string;
  rules: RouteAccessRule[];
}

const normalizeList = (values?: string[] | null): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  );

export const normalizeRouteAccessRequirement = (
  requirement?: RouteAccessRequirement | null,
): RouteAccessRequirement | null => {
  if (!requirement) {
    return null;
  }

  const normalized: RouteAccessRequirement = {
    requireAuthentication:
      requirement.requireAuthentication === false ? false : undefined,
    anyPermissions: normalizeList(requirement.anyPermissions),
    allPermissions: normalizeList(requirement.allPermissions),
    anyRoles: normalizeList(requirement.anyRoles),
    allRoles: normalizeList(requirement.allRoles),
  };

  if (
    normalized.requireAuthentication === undefined &&
    normalized.anyPermissions?.length === 0 &&
    normalized.allPermissions?.length === 0 &&
    normalized.anyRoles?.length === 0 &&
    normalized.allRoles?.length === 0
  ) {
    return null;
  }

  return normalized;
};

export const isRouteAccessRequirementEmpty = (
  requirement?: RouteAccessRequirement | null,
): boolean => !normalizeRouteAccessRequirement(requirement);
