import { describe, expect, it } from "vitest";
import type { AppRouteConfig, NavigationGroup } from "../contracts";
import {
  buildRouteMembershipIndex,
  canAccessAppRoute,
  filterNavigationGroupsByAccess,
  resolveAccessibleDefaultRoute,
} from "../routeAccess";
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
});
