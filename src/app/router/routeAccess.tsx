import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useQuery } from "@apollo/client";
import type {
  AppRouteConfig,
  NavigationEntry,
  NavigationGroup,
} from "./contracts";
import { normalizePath } from "./contracts";
import { getAllRoutes, getDefaultRoute, getNavigationGroups } from "./manifestRegistry";
import { toNavigationSections } from "./navigation";
import { useAuthContext } from "@/features/auth/context";
import {
  userMeetsRouteAccessRequirement,
  type PermissionMatchingUser,
} from "@/features/auth/utils/permission-matching";
import {
  FRONTEND_ROUTE_ACCESS_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";
import { useEnabledModules } from "./useEnabledModules";
import type {
  RouteAccessManifest,
  RouteAccessRequirement,
  RouteAccessRule,
  RouteAccessTargetType,
} from "@/shared/routing/access";
import { normalizeRouteAccessRequirement } from "@/shared/routing/access";
import type { NavigationSection } from "@/shared/routing/navigation";

type RouteMembership = {
  groupIds: Set<string>;
  entryIds: Set<string>;
};

type FrontendRouteAccessQueryData = {
  frontendRouteAccess?: {
    version?: string | null;
    rules?: Array<{
      targetType?: string | null;
      target?: string | null;
      requireAuthentication?: boolean | null;
      anyPermissions?: string[] | null;
      allPermissions?: string[] | null;
      anyRoles?: string[] | null;
      allRoles?: string[] | null;
      allowed?: boolean | null;
      denialReason?: string | null;
    } | null> | null;
  } | null;
};

const ALLOWED_TARGET_TYPES: RouteAccessTargetType[] = [
  "project",
  "route",
  "navigation-group",
  "navigation-entry",
];

interface RouteAccessContextValue {
  defaultRoute: string;
  isLoading: boolean;
  navigationLinks: NavigationSection[];
  canAccessRoute: (route: AppRouteConfig) => boolean;
}

const RouteAccessContext = createContext<RouteAccessContextValue | null>(null);

const findRouteByEntry = (
  entry: NavigationEntry,
  routeById: Map<string, AppRouteConfig>,
  routesByPath: Map<string, AppRouteConfig>,
): AppRouteConfig | null => {
  if (entry.routeId) {
    return routeById.get(entry.routeId) ?? null;
  }

  return routesByPath.get(normalizePath(entry.path)) ?? null;
};

const toAccessRequirement = (
  access?: RouteAccessRequirement | null,
  requiredPermission?: string,
): RouteAccessRequirement | null => {
  const normalized = normalizeRouteAccessRequirement(access) ?? {};
  const allPermissions = [
    ...(normalized.allPermissions ?? []),
    ...(
      requiredPermission && requiredPermission.trim().length > 0
        ? [requiredPermission.trim()]
        : []
    ),
  ];

  return normalizeRouteAccessRequirement({
    ...normalized,
    allPermissions,
  });
};

export const buildRouteMembershipIndex = (
  routes: AppRouteConfig[],
  groups: NavigationGroup[],
): Map<string, RouteMembership> => {
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const routesByPath = new Map(
    routes.map((route) => [normalizePath(route.path), route]),
  );
  const membership = new Map<string, RouteMembership>();

  const ensureMembership = (routeId: string): RouteMembership => {
    const existing = membership.get(routeId);
    if (existing) {
      return existing;
    }

    const created: RouteMembership = {
      groupIds: new Set<string>(),
      entryIds: new Set<string>(),
    };
    membership.set(routeId, created);
    return created;
  };

  const applyEntryMembership = (
    entry: NavigationEntry,
    groupId: string,
    activeEntryIds: string[],
  ) => {
    const nextActiveEntryIds = [...activeEntryIds, entry.id];
    const route = findRouteByEntry(entry, routeById, routesByPath);

    if (route) {
      const target = ensureMembership(route.id);
      target.groupIds.add(groupId);
      for (const entryId of nextActiveEntryIds) {
        target.entryIds.add(entryId);
      }
    }

    for (const child of entry.children ?? []) {
      applyEntryMembership(child, groupId, nextActiveEntryIds);
    }
  };

  for (const group of groups) {
    for (const entry of group.entries) {
      applyEntryMembership(entry, group.id, []);
    }
  }

  return membership;
};

const normalizeBackendManifest = (
  payload: FrontendRouteAccessQueryData["frontendRouteAccess"],
): RouteAccessManifest | null => {
  if (!payload) {
    return null;
  }

  const rules: RouteAccessRule[] = (payload.rules ?? [])
    .filter((rule): rule is NonNullable<typeof rule> => !!rule)
    .map((rule) => {
      const targetType = String(rule.targetType ?? "").trim() as RouteAccessTargetType;
      const target = String(rule.target ?? "").trim();
      const requirement = normalizeRouteAccessRequirement({
        requireAuthentication: rule.requireAuthentication ?? undefined,
        anyPermissions: rule.anyPermissions ?? undefined,
        allPermissions: rule.allPermissions ?? undefined,
        anyRoles: rule.anyRoles ?? undefined,
        allRoles: rule.allRoles ?? undefined,
      }) ?? {
        requireAuthentication:
          rule.requireAuthentication === false ? false : undefined,
      };

      if (
        !ALLOWED_TARGET_TYPES.includes(targetType) ||
        target.length === 0
      ) {
        return null;
      }

      return {
        targetType,
        target,
        ...requirement,
        allowed:
          typeof rule.allowed === "boolean" ? rule.allowed : undefined,
        denialReason: rule.denialReason ?? null,
      } satisfies RouteAccessRule;
    })
    .filter((rule): rule is NonNullable<typeof rule> => rule !== null);

  return {
    version: String(payload.version ?? "unknown"),
    rules,
  };
};

const ruleAppliesToRoute = (
  rule: RouteAccessRule,
  route: AppRouteConfig,
  membership: RouteMembership | undefined,
): boolean => {
  switch (rule.targetType) {
    case "project":
      return rule.target === route.projectId;
    case "route":
      return (
        rule.target === route.id ||
        normalizePath(rule.target) === normalizePath(route.path)
      );
    case "navigation-group":
      return Boolean(membership?.groupIds.has(rule.target));
    case "navigation-entry":
      return Boolean(membership?.entryIds.has(rule.target));
    default:
      return false;
  }
};

const getRouteInlineRequirements = (
  route: AppRouteConfig,
  groups: NavigationGroup[],
  membership: RouteMembership | undefined,
): RouteAccessRequirement[] => {
  const requirements: RouteAccessRequirement[] = [];
  const routeRequirement = toAccessRequirement(
    route.access,
    route.requiredPermission,
  );
  if (routeRequirement) {
    requirements.push(routeRequirement);
  }

  for (const group of groups) {
    if (!membership?.groupIds.has(group.id)) {
      continue;
    }

    const groupRequirement = toAccessRequirement(group.access);
    if (groupRequirement) {
      requirements.push(groupRequirement);
    }

    const visitEntry = (entry: NavigationEntry) => {
      if (membership.entryIds.has(entry.id)) {
        const entryRequirement = toAccessRequirement(
          entry.access,
          entry.requiredPermission,
        );
        if (entryRequirement) {
          requirements.push(entryRequirement);
        }
      }

      for (const child of entry.children ?? []) {
        visitEntry(child);
      }
    };

    for (const entry of group.entries) {
      visitEntry(entry);
    }
  }

  return requirements;
};

const doesRuleAllowAccess = (
  user: PermissionMatchingUser | null,
  isAuthenticated: boolean,
  rule: RouteAccessRule,
): boolean => {
  if (typeof rule.allowed === "boolean") {
    return rule.allowed;
  }

  return userMeetsRouteAccessRequirement(user, rule, { isAuthenticated });
};

export const canAccessAppRoute = (
  route: AppRouteConfig,
  options: {
    user: PermissionMatchingUser | null;
    isAuthenticated: boolean;
    groups: NavigationGroup[];
    routeMembershipIndex: Map<string, RouteMembership>;
    backendManifest?: RouteAccessManifest | null;
  },
): boolean => {
  if (route.guard === "public") {
    return true;
  }

  if (!options.isAuthenticated) {
    return false;
  }

  const membership = options.routeMembershipIndex.get(route.id);
  const inlineRequirements = getRouteInlineRequirements(
    route,
    options.groups,
    membership,
  );

  if (
    inlineRequirements.some(
      (requirement) =>
        !userMeetsRouteAccessRequirement(options.user, requirement, {
          isAuthenticated: options.isAuthenticated,
        }),
    )
  ) {
    return false;
  }

  const backendRules = (options.backendManifest?.rules ?? []).filter((rule) =>
    ruleAppliesToRoute(rule, route, membership),
  );

  return backendRules.every((rule) =>
    doesRuleAllowAccess(options.user, options.isAuthenticated, rule),
  );
};

const filterNavigationEntriesByAccess = (
  entries: NavigationEntry[],
  group: NavigationGroup,
  routeById: Map<string, AppRouteConfig>,
  routesByPath: Map<string, AppRouteConfig>,
  user: PermissionMatchingUser | null,
  isAuthenticated: boolean,
  canAccessRoute: (route: AppRouteConfig) => boolean,
): NavigationEntry[] => {
  return entries.flatMap((entry) => {
    const route = findRouteByEntry(entry, routeById, routesByPath);
    const children = filterNavigationEntriesByAccess(
      entry.children ?? [],
      group,
      routeById,
      routesByPath,
      user,
      isAuthenticated,
      canAccessRoute,
    );
    const ownRequirement = toAccessRequirement(
      entry.access,
      entry.requiredPermission,
    );
    const groupRequirement = toAccessRequirement(group.access);
    const routeAllowed = route ? canAccessRoute(route) : false;
    const groupAllowed = groupRequirement
      ? userMeetsRouteAccessRequirement(user, groupRequirement, {
          isAuthenticated,
        })
      : true;
    const entryAllowed = ownRequirement
      ? userMeetsRouteAccessRequirement(user, ownRequirement, {
          isAuthenticated,
        })
      : true;

    if (!groupAllowed || !entryAllowed) {
      return [];
    }

    if (children.length > 0) {
      return [{ ...entry, children }];
    }

    if (routeAllowed) {
      return [{ ...entry, children: undefined }];
    }

    return [];
  });
};

export const filterNavigationGroupsByAccess = (
  groups: NavigationGroup[],
  routes: AppRouteConfig[],
  user: PermissionMatchingUser | null,
  isAuthenticated: boolean,
  canAccessRoute: (route: AppRouteConfig) => boolean,
): NavigationGroup[] => {
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const routesByPath = new Map(
    routes.map((route) => [normalizePath(route.path), route]),
  );

  return groups.flatMap((group) => {
    const groupRequirement = toAccessRequirement(group.access);
    if (
      groupRequirement &&
      !userMeetsRouteAccessRequirement(user, groupRequirement, {
        isAuthenticated,
      })
    ) {
      return [];
    }

    const entries = filterNavigationEntriesByAccess(
      group.entries,
      group,
      routeById,
      routesByPath,
      user,
      isAuthenticated,
      canAccessRoute,
    );

    if (entries.length === 0) {
      return [];
    }

    return [{ ...group, entries }];
  });
};

export const resolveAccessibleDefaultRoute = (
  routes: AppRouteConfig[],
  fallbackRoute: string,
  canAccessRoute: (route: AppRouteConfig) => boolean,
): string => {
  const normalizedFallback =
    routes.find((route) => route.path === fallbackRoute) ?? null;
  if (normalizedFallback && canAccessRoute(normalizedFallback)) {
    return normalizedFallback.path;
  }

  return (
    routes.find(
      (route) =>
        route.guard === "protected" &&
        !!route.element &&
        canAccessRoute(route),
    )?.path ?? fallbackRoute
  );
};

export const RouteAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuthContext();
  const { modules: enabledModules, isLoading: modulesLoading } = useEnabledModules();
  
  const allRoutes = useMemo(() => getAllRoutes(), []);
  const allGroups = useMemo(() => getNavigationGroups(), []);

  const routes = useMemo(() => {
    if (modulesLoading) return [];
    return allRoutes.filter(route => 
      !route.moduleId || 
      route.moduleId === "core" || 
      enabledModules.includes(route.moduleId)
    );
  }, [allRoutes, enabledModules, modulesLoading]);

  const groups = useMemo(() => {
    if (modulesLoading) return [];
    return allGroups.filter(group => 
      !group.moduleId || 
      group.moduleId === "core" || 
      enabledModules.includes(group.moduleId)
    );
  }, [allGroups, enabledModules, modulesLoading]);

  const routeMembershipIndex = useMemo(
    () => buildRouteMembershipIndex(routes, groups),
    [groups, routes],
  );
  const { data, loading: accessLoading } = useQuery<FrontendRouteAccessQueryData>(
    FRONTEND_ROUTE_ACCESS_QUERY,
    {
      skip: !isAuthenticated,
      fetchPolicy: "cache-first",
    },
  );

  const backendManifest = useMemo(
    () => normalizeBackendManifest(data?.frontendRouteAccess),
    [data?.frontendRouteAccess],
  );

  const canAccessRoute = useCallback(
    (route: AppRouteConfig) =>
      canAccessAppRoute(route, {
        user,
        isAuthenticated,
        groups,
        routeMembershipIndex,
        backendManifest,
      }),
    [backendManifest, groups, isAuthenticated, routeMembershipIndex, user],
  );

  const navigationLinks = useMemo(
    () =>
      toNavigationSections(
        filterNavigationGroupsByAccess(
          groups,
          routes,
          user,
          isAuthenticated,
          canAccessRoute,
        ),
      ),
    [canAccessRoute, groups, isAuthenticated, routes, user],
  );

  const isLoading = (isAuthenticated && accessLoading) || modulesLoading;

  const effectiveNavigationLinks = useMemo(
    () => (isAuthenticated && isLoading ? [] : navigationLinks),
    [isAuthenticated, isLoading, navigationLinks],
  );

  const defaultRoute = useMemo(
    () =>
      resolveAccessibleDefaultRoute(routes, getDefaultRoute(), canAccessRoute),
    [canAccessRoute, routes],
  );

  const value = useMemo<RouteAccessContextValue>(
    () => ({
      defaultRoute,
      isLoading,
      navigationLinks: effectiveNavigationLinks,
      canAccessRoute,
    }),
    [
      canAccessRoute,
      defaultRoute,
      effectiveNavigationLinks,
      isLoading,
    ],
  );

  return (
    <RouteAccessContext.Provider value={value}>
      {children}
    </RouteAccessContext.Provider>
  );
};

export const useRouteAccess = (): RouteAccessContextValue => {
  const context = useContext(RouteAccessContext);
  if (!context) {
    throw new Error("useRouteAccess must be used within RouteAccessProvider");
  }
  return context;
};

export const useOptionalRouteAccess = (): RouteAccessContextValue | null =>
  useContext(RouteAccessContext);
