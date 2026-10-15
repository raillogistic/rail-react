import { describe, expect, it } from "vitest";
import { LayoutDashboard } from "lucide-react";
import type { AppManifest, AppRouteConfig, NavigationGroup } from "../contracts";
import {
  buildAccessibleAppRailItems,
  buildRouteMembershipIndex,
  canAccessAppRoute,
  filterNavigationSectionsByProject,
  filterNavigationGroupsByAccess,
  findCurrentProjectId,
  resolveAccessibleDefaultRoute,
} from "../routeAccess";
import { toNavigationSections } from "../navigation";
import type { RouteAccessManifest } from "@/shared/routing/access";

const routes: AppRouteConfig[] = [
  {
    id: "dashboard.home",
    path: "/dashboard",
    guard: "protected",
    projectId: "core",
    element: "dashboard",
  },
  {
    id: "operations.orders",
    path: "/operations/orders",
    guard: "protected",
    projectId: "operations",
    element: "orders",
  },
  {
    id: "operations.shipments",
    path: "/operations/shipments",
    guard: "protected",
    projectId: "operations",
    element: "shipments",
  },
];

const navigationGroups: NavigationGroup[] = [
  {
    id: "operations-group",
    label: "Operations",
    projectId: "operations",
    access: {
      anyRoles: ["ops_manager"],
    },
    entries: [
      {
        id: "orders-entry",
        title: "Orders",
        path: "/operations/orders",
        guard: "protected",
        routeId: "operations.orders",
      },
      {
        id: "workspace-entry",
        title: "Workspace",
        path: "/operations",
        guard: "protected",
        children: [
          {
            id: "shipments-entry",
            title: "Shipments",
            path: "/operations/shipments",
            guard: "protected",
            routeId: "operations.shipments",
            access: {
              allPermissions: ["operations.view_shipments"],
            },
          },
        ],
      },
    ],
  },
];

const manifests: AppManifest[] = [
  {
    projectId: "core",
    label: "Core",
    icon: LayoutDashboard,
    defaultRoute: "/dashboard",
    routes: [routes[0]],
    navigation: [],
  },
  {
    projectId: "operations",
    label: "Operations",
    icon: LayoutDashboard,
    defaultRoute: "/operations/orders",
    routes: [routes[1], routes[2]],
    navigation: navigationGroups,
  },
];

describe("routeAccess", () => {
  it("tracks route membership across navigation groups and nested entries", () => {
    const membership = buildRouteMembershipIndex(routes, navigationGroups);

    expect(membership.get("operations.orders")).toEqual({
      groupIds: new Set(["operations-group"]),
      entryIds: new Set(["orders-entry"]),
    });
    expect(membership.get("operations.shipments")).toEqual({
      groupIds: new Set(["operations-group"]),
      entryIds: new Set(["workspace-entry", "shipments-entry"]),
    });
  });

  it("applies inline and backend access rules to routes", () => {
    const backendManifest: RouteAccessManifest = {
      version: "v1",
      rules: [
        {
          targetType: "route",
          target: "/operations/orders",
          anyPermissions: ["operations.view_orders"],
        },
      ],
    };
    const routeMembershipIndex = buildRouteMembershipIndex(routes, navigationGroups);

    expect(
      canAccessAppRoute(routes[1], {
        user: {
          roles: ["ops_manager"],
          permissions: ["operations.view_orders"],
        },
        isAuthenticated: true,
        groups: navigationGroups,
        routeMembershipIndex,
        backendManifest,
      }),
    ).toBe(true);

    expect(
      canAccessAppRoute(routes[1], {
        user: {
          roles: ["ops_manager"],
          permissions: [],
        },
        isAuthenticated: true,
        groups: navigationGroups,
        routeMembershipIndex,
        backendManifest,
      }),
    ).toBe(false);
  });

  it("filters navigation based on descendant route access and picks an accessible default", () => {
    const routeMembershipIndex = buildRouteMembershipIndex(routes, navigationGroups);
    const canAccessRoute = (route: AppRouteConfig): boolean =>
      canAccessAppRoute(route, {
        user: {
          roles: ["ops_manager"],
          permissions: ["operations.view_orders"],
        },
        isAuthenticated: true,
        groups: navigationGroups,
        routeMembershipIndex,
      });

    const filteredGroups = filterNavigationGroupsByAccess(
      navigationGroups,
      routes,
      {
        roles: ["ops_manager"],
        permissions: ["operations.view_orders"],
      },
      true,
      canAccessRoute,
    );

    expect(filteredGroups).toHaveLength(1);
    expect(filteredGroups[0]?.entries).toHaveLength(1);
    expect(filteredGroups[0]?.entries[0]?.id).toBe("orders-entry");

    expect(
      resolveAccessibleDefaultRoute(routes, "/operations/shipments", canAccessRoute),
    ).toBe("/dashboard");
  });

  it("builds app rail items and filters submenu sections for the active project", () => {
    const routeMembershipIndex = buildRouteMembershipIndex(routes, navigationGroups);
    const canAccessRoute = (route: AppRouteConfig): boolean =>
      canAccessAppRoute(route, {
        user: {
          roles: ["ops_manager"],
          permissions: ["operations.view_orders"],
        },
        isAuthenticated: true,
        groups: navigationGroups,
        routeMembershipIndex,
      });

    const appRailItems = buildAccessibleAppRailItems(
      manifests,
      routes,
      canAccessRoute,
    );
    const sections = toNavigationSections(navigationGroups);

    expect(appRailItems).toEqual([
      {
        projectId: "operations",
        label: "Operations",
        icon: LayoutDashboard,
        defaultRoute: "/operations/orders",
      },
    ]);
    // The core fixture has routes but no navigation: compatibility URLs remain usable.
    expect(canAccessRoute(routes[0])).toBe(true);
    expect(filterNavigationSectionsByProject(sections, "operations")).toEqual(
      sections,
    );
    expect(filterNavigationSectionsByProject(sections, "core")).toEqual([]);
  });

  it("resolves the current project id from static and parameterized routes", () => {
    expect(findCurrentProjectId("/operations/orders", routes)).toBe("operations");
    expect(
      findCurrentProjectId("/operations/shipments", [
        ...routes,
        {
          id: "operations.shipment.detail",
          path: "/operations/shipments/:shipmentId",
          guard: "protected",
          projectId: "operations",
          element: "shipment-detail",
        },
      ]),
    ).toBe("operations");
  });
});
