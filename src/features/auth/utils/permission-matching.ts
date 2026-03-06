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

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const globToRegExp = (glob: string): RegExp => {
  // Very small glob subset:
  // - `*` matches any characters
  // Examples: `store.*`, `*.view_*`, `*.*`
  const escaped = escapeRegExp(glob).replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`);
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
    return globToRegExp(grantedTrimmed).test(requiredTrimmed);
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

  const granted: string[] = [];
  for (const perm of user.permissions ?? []) {
    if (typeof perm === "string") {
      granted.push(perm);
      continue;
    }
    if (perm?.codename) {
      granted.push(perm.codename);
      continue;
    }
    if (perm?.name) {
      granted.push(perm.name);
    }
  }

  for (const role of user.roles ?? []) {
    if (typeof role === "string") {
      continue;
    }

    for (const perm of role.permissions ?? []) {
      if (typeof perm === "string") {
        granted.push(perm);
      } else if (perm?.codename) {
        granted.push(perm.codename);
      } else if (perm?.name) {
        granted.push(perm.name);
      }
    }
  }

  return granted.some((g) => matchesPermission(g, requiredPermission));
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
