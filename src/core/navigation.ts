import { ROUTES } from "@/routes/links";
import { NavigationSection, RailModule } from "./types/module";
import { ComponentType, ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import DashboardPage from "@/views/dashboard/DashboardPage";

// Define the core navigation (e.g. Dashboard)
// In a real reusable app, even Dashboard might be a module, but let's keep it core for now as a default.
export const CORE_NAVIGATION: NavigationSection[] = [
  {
    id: "home",
    label: "Accueil",
    items: [
      {
        id: "dashboard",
        title: "Tableau de bord",
        path: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        requiresAuth: true,
        description: "Vue synthese des indicateurs",
        component: <DashboardPage />,
      },
    ],
  },
];

export function buildNavigation(modules: RailModule[] = []): NavigationSection[] {
  const moduleSections = modules.flatMap(m => m.routes);
  return [...CORE_NAVIGATION, ...moduleSections];
}
