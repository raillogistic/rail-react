/**
 * @file AppSidebar.test.tsx
 * @description Tests unitaires pour AppSidebar vérifiant l'affichage de tous les menus
 * et sous-menus en mode barre latérale complète sans menu déroulant de sélection.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "../AppSidebar";
import type { NavigationSection } from "@/shared/routing/navigation";

const mock_use_theme = vi.fn();
const mock_use_sidebar = vi.fn();
const mock_use_route_access = vi.fn();

vi.mock("@/shared/ui/theme", () => ({
  useTheme: () => mock_use_theme(),
}));

vi.mock("@/widgets/navigation/nav-notifications", () => ({
  NavNotifications: () => <div data-testid="nav-notifications" />,
}));

vi.mock("@/shared/ui/kit/themeToggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

vi.mock("@/widgets/navigation/nav-user", () => ({
  NavUser: () => <div data-testid="nav-user" />,
}));

vi.mock("@/shared/ui/kit/sidebar", () => ({
  Sidebar: ({ children, ...props }: any) => (
    <aside data-testid="sidebar" {...props}>
      {children}
    </aside>
  ),
  SidebarHeader: ({ children, ...props }: any) => (
    <header {...props}>{children}</header>
  ),
  SidebarContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  SidebarFooter: ({ children, ...props }: any) => (
    <footer {...props}>{children}</footer>
  ),
  SidebarSeparator: () => <hr />,
  SidebarTrigger: () => <button>trigger</button>,
  useSidebar: () => mock_use_sidebar(),
}));

vi.mock("@/features/auth/context", () => ({
  useAuthContext: () => ({
    user: { username: "admin", email: "admin@rail.com" },
    logout: vi.fn(),
  }),
}));

const mock_project_links: NavigationSection[] = [
  {
    id: "achat-ops",
    label: "Achat - Opérations",
    projectId: "achat",
    items: [
      {
        id: "orders",
        title: "Bons de commande",
        path: "/achat/bons-de-commande",
        requiresAuth: true,
        children: [
          { title: "Mes BC", path: "/achat/bons-de-commande/mes-bc", requiresAuth: true },
        ],
      },
      {
        id: "requests",
        title: "Demandes d'achat",
        path: "/achat/demandes-achat",
        requiresAuth: true,
      },
    ],
  },
];

const mock_all_links: NavigationSection[] = [
  ...mock_project_links,
  {
    id: "core-settings",
    label: "Paramètres Généraux",
    projectId: "core",
    items: [
      {
        id: "appearance",
        title: "Apparence",
        path: "/settings/appearance",
        requiresAuth: true,
      },
    ],
  },
  {
    id: "users-management",
    label: "Gestion Utilisateurs",
    projectId: "users",
    items: [
      {
        id: "users-list",
        title: "Utilisateurs",
        path: "/users",
        requiresAuth: true,
      },
    ],
  },
];

vi.mock("@/app/router/routeAccess", () => ({
  useRouteAccess: () => mock_use_route_access(),
}));

vi.mock("@/widgets/navigation/nav-main", () => ({
  NavMain: ({ navigationLinks }: { navigationLinks: NavigationSection[] }) => (
    <div data-testid="nav-main">
      {navigationLinks.map((section) => (
        <div key={section.id} data-testid={`section-${section.id}`}>
          <span>{section.label}</span>
          {section.items.map((item) => (
            <div key={item.id} data-testid={`item-${item.id}`}>
              <span>{item.title}</span>
              {item.children?.map((child) => (
                <span key={child.path}>{child.title}</span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe("AppSidebar", () => {
  it("affiche tous les menus et sous-menus sans menu déroulant dans la barre latérale", () => {
    mock_use_sidebar.mockReturnValue({
      state: "expanded",
      isMobile: false,
    });
    mock_use_route_access.mockReturnValue({
      appRailItems: [
        { projectId: "achat", label: "Achat", defaultRoute: "/achat" },
        { projectId: "core", label: "Paramètres", defaultRoute: "/settings" },
      ],
      currentProjectId: "achat",
      navigationLinks: mock_all_links,
      projectNavigationLinks: mock_project_links,
      canAccessRoute: () => true,
    });

    render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>,
    );

    // Vérifie que toutes les sections de tous les modules sont affichées dans la barre latérale
    expect(screen.getByTestId("section-achat-ops")).toBeInTheDocument();
    expect(screen.getByTestId("section-core-settings")).toBeInTheDocument();
    expect(screen.getByTestId("section-users-management")).toBeInTheDocument();
    expect(screen.getByText("Mes BC")).toBeInTheDocument();

    // Vérifie qu'aucun dropdown de sélection d'espace n'est affiché
    expect(screen.queryByText("Espaces de travail")).not.toBeInTheDocument();

    // Vérifie la présence du profil utilisateur dans le footer
    expect(screen.getByTestId("nav-user")).toBeInTheDocument();
  });

  it("affiche la marque une seule fois sur bureau et omet les badges vides", () => {
    mock_use_sidebar.mockReturnValue({
      state: "expanded",
      isMobile: false,
    });
    mock_use_route_access.mockReturnValue({
      defaultRoute: "/achat",
      navigationLinks: mock_all_links,
      projectNavigationLinks: mock_project_links,
      canAccessRoute: () => true,
    });

    render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /rail/i })).toBeInTheDocument();
    expect(screen.queryByText(/enterprise edition/i)).not.toBeInTheDocument();
  });
});
