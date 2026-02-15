export type PermissionMatchingUser = {
  permissions?:
    | Array<string | { codename?: string | null; name?: string | null }>
    | null;
  roles?:
    | Array<
        | string
        | {
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
