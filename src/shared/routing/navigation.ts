import type { ComponentType, ReactNode } from "react";

export interface NavigationPage {
  title: string;
  path: string;
  component?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  description?: string;
  hidden?: boolean;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  component?: ReactNode;
  description?: string;
  hidden?: boolean;
  children?: NavigationPage[];
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}
