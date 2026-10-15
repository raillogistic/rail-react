import type { ComponentType, ReactNode } from "react";
import type { RouteAccessRequirement } from "@/shared/routing/access";

export type RouteGuard = "public" | "protected";

export interface AppRouteConfig {
  id: string;
  path: string;
  guard: RouteGuard;
  projectId: string;
  moduleId?: string;
  requiredPermission?: string;
  access?: RouteAccessRequirement;
  title?: string;
  description?: string;
  hidden?: boolean;
  icon?: ComponentType<{ className?: string }>;
  element?: ReactNode;
}

export interface NavigationEntry {
  id: string;
  title: string;
  path: string;
  guard: RouteGuard;
  requiredPermission?: string;
  access?: RouteAccessRequirement;
  hidden?: boolean;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  children?: NavigationEntry[];
  routeId?: string;
}

export interface NavigationGroup {
  id: string;
  label: string;
  projectId: string;
  moduleId?: string;
  order?: number;
  access?: RouteAccessRequirement;
  entries: NavigationEntry[];
}

export interface AppRailItem {
  projectId: string;
  moduleId?: string;
  label: string;
  shortLabel?: string;
  defaultRoute: string;
  icon: ComponentType<{ className?: string }>;
}

export interface AppManifest {
  projectId: string;
  moduleId?: string;
  order?: number;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
  defaultRoute: string;
  routes: AppRouteConfig[];
  navigation: NavigationGroup[];
}

export const normalizePath = (path: string): string =>
  path.endsWith("/") ? path.slice(0, -1) || "/" : path;
