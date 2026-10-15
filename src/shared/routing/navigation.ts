import type { ComponentType, ReactNode } from "react";

export interface NavigationPage {
  title: string;
  path: string;
  component?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  requiredPermission?: string;
  description?: string;
  hidden?: boolean;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  requiredPermission?: string;
  component?: ReactNode;
  description?: string;
  hidden?: boolean;
  badge?: ReactNode;
  children?: NavigationPage[];
}

export interface NavigationSection {
  id: string;
  label: string;
  projectId?: string;
  items: NavigationItem[];
}
