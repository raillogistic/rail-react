import type { RouteAccessRequirement } from "@/shared/routing/access";

export type PermissionMatchingUser = {
  is_superuser?: boolean | null;
  permissions?:
    | Array<string | { codename?: string | null; name?: string | null }>
    | null;
  roles?:
    | Array<
        | string
        | {
            name?: string | null;
            permissions?:
              | Array<
                  | string
                  | { codename?: string | null; name?: string | null }
                >
              | null;
          }
      >
    | null;
};

/** Match the existing literal-plus-star syntax without exponential regexp backtracking. */
const matchesGlob = (pattern: string, value: string): boolean => {
  let patternIndex = 0;
  let valueIndex = 0;
  let starIndex = -1;
  let retryIndex = 0;
  while (valueIndex < value.length) {
    if (pattern[patternIndex] === "*") {
      starIndex = patternIndex++;
      retryIndex = valueIndex;
    } else if (pattern[patternIndex] === value[valueIndex]) {
      patternIndex++;
      valueIndex++;
    } else if (starIndex >= 0 && !/[\n\r\u2028\u2029]/.test(value[retryIndex])) {
      patternIndex = starIndex + 1;
      valueIndex = ++retryIndex;
    } else {
      return false;
    }
  }
  while (pattern[patternIndex] === "*") patternIndex++;
  return patternIndex === pattern.length;
};

const matchesPermission = (granted: string, required: string): boolean => {
  const grantedTrimmed = granted.trim();
  const requiredTrimmed = required.trim();

  if (!grantedTrimmed || !requiredTrimmed) {
    return false;
  }

  // Common super-permissions.
  if (grantedTrimmed === "*" || grantedTrimmed === "*.*") {
    return true;
  }

  // Wildcard / glob patterns.
  if (grantedTrimmed.includes("*")) {
    return matchesGlob(grantedTrimmed, requiredTrimmed);
  }

  // Exact match.
  if (grantedTrimmed === requiredTrimmed) {
    return true;
  }

  // Compatibility for older UI permissions like `users.view` when the backend uses Django-style
  // permissions like `users.view_user`. Treat the shorter form as a prefix.
  const isShortForm =
    grantedTrimmed.includes(".") && !grantedTrimmed.split(".", 2)[1]?.includes("_");

  if (isShortForm && requiredTrimmed.startsWith(`${grantedTrimmed}_`)) {
    return true;
  }

  return false;
};

export const userHasPermission = (
  user: PermissionMatchingUser | null | undefined,
  requiredPermission: string
): boolean => {
  if (!user) {
    return false;
  }

  if (user.is_superuser) {
    return true;
  }

  /** Stop at the first grant without allocating a flattened permission list. */
  const matches = (permission: NonNullable<PermissionMatchingUser["permissions"]>[number]): boolean => {
    const value = typeof permission === "string" ? permission : permission?.codename || permission?.name;
    return !!value && matchesPermission(value, requiredPermission);
  };
  for (const perm of user.permissions ?? []) {
    if (matches(perm)) return true;
  }

  for (const role of user.roles ?? []) {
    if (typeof role === "string") {
      continue;
    }

    for (const perm of role.permissions ?? []) {
      if (matches(perm)) return true;
    }
  }

  return false;
};

const collectRoleNames = (
  user: PermissionMatchingUser | null | undefined,
): string[] => {
  if (!user) {
    return [];
  }

  const names = new Set<string>();
  for (const role of user.roles ?? []) {
    if (typeof role === "string") {
      const normalized = role.trim();
      if (normalized) {
        names.add(normalized);
      }
      continue;
    }

    const normalized = String(role?.name ?? "").trim();
    if (normalized) {
      names.add(normalized);
    }
  }

  if (user.is_superuser) {
    names.add("superadmin");
  }

  return Array.from(names);
};

export const userHasRole = (
  user: PermissionMatchingUser | null | undefined,
  requiredRole: string,
): boolean => {
  const normalizedRole = String(requiredRole ?? "").trim();
  if (!normalizedRole) {
    return false;
  }

  return collectRoleNames(user).includes(normalizedRole);
};

export const userHasAnyRole = (
  user: PermissionMatchingUser | null | undefined,
  requiredRoles: string[],
): boolean =>
  requiredRoles.some((requiredRole) => userHasRole(user, requiredRole));

export const userHasAllRoles = (
  user: PermissionMatchingUser | null | undefined,
  requiredRoles: string[],
): boolean =>
  requiredRoles.every((requiredRole) => userHasRole(user, requiredRole));

export const userMeetsRouteAccessRequirement = (
  user: PermissionMatchingUser | null | undefined,
  requirement: RouteAccessRequirement | null | undefined,
  options?: {
    isAuthenticated?: boolean;
  },
): boolean => {
  if (!requirement) {
    return true;
  }

  const isAuthenticated =
    options?.isAuthenticated ?? Boolean(user);

  if (requirement.requireAuthentication !== false && !isAuthenticated) {
    return false;
  }

  const anyPermissions = requirement.anyPermissions ?? [];
  if (
    anyPermissions.length > 0 &&
    !anyPermissions.some((permission) => userHasPermission(user, permission))
  ) {
    return false;
  }

  const allPermissions = requirement.allPermissions ?? [];
  if (
    allPermissions.length > 0 &&
    !allPermissions.every((permission) => userHasPermission(user, permission))
  ) {
    return false;
  }

  const anyRoles = requirement.anyRoles ?? [];
  if (anyRoles.length > 0 && !userHasAnyRole(user, anyRoles)) {
    return false;
  }

  const allRoles = requirement.allRoles ?? [];
  if (allRoles.length > 0 && !userHasAllRoles(user, allRoles)) {
    return false;
  }

  return true;
};
