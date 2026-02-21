import { ReactNode, ComponentType } from "react";

export interface NavigationPage {
  title: string;
  path: string;
  component: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  description?: string;
  hidden?: boolean;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string; // Base path for the item
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  component?: ReactNode; // If it's a direct link
  description?: string;
  hidden?: boolean;
  children?: NavigationPage[];
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

export interface RailModule {
  id: string;
  routes: NavigationSection[];
  init?: () => void;
}

export interface RailConfig {
  defaultRoute?: string;
  theme?: {
    defaultTheme?: string;
    // other theme defaults
  };
}
