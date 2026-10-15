import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRailList } from "../AppRail";
import { ThemeProviderContext } from "@/shared/ui/theme/ThemeProvider";

vi.mock("@/app/router/routeAccess", () => {
  const Icon = () => null;

  return {
    useRouteAccess: () => ({
      appRailItems: [
        {
          projectId: "core",
          moduleId: "core",
          label: "Core",
          shortLabel: "Core",
          icon: Icon,
          defaultRoute: "/settings/account",
        },
        {
          projectId: "achat",
          moduleId: "achat",
          label: "Achat",
          shortLabel: "Achat",
          icon: Icon,
          defaultRoute: "/achat",
        },
      ],
      currentProjectId: "core",
      navigationLinks: [
        {
          id: "core-settings",
          label: "Paramètres",
          projectId: "core",
          items: [
            {
              id: "account",
              title: "Compte",
              path: "/settings/account",
              requiresAuth: true,
            },
          ],
        },
        {
          id: "achat-ops",
          label: "Opérations",
          projectId: "achat",
          items: [
            {
              id: "orders",
              title: "Bons de commande",
              path: "/achat/bons-de-commande",
              requiresAuth: true,
              children: [
                {
                  title: "Mes BC",
                  path: "/achat/bons-de-commande",
                  requiresAuth: true,
                },
                {
                  title: "Tous les BC",
                  path: "/achat/bons-de-commande/tous",
                  requiresAuth: true,
                },
              ],
            },
          ],
        },
      ],
    }),
  };
});

vi.mock("@/shared/ui/kit/sidebar", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useSidebar: () => ({
      isMobile: false,
      state: "expanded",
    }),
  };
});

const baseThemeContext = {
  theme: "transtev",
  mode: "light" as const,
  layout: "vertical" as const,
  navigationPattern: "rail-flyout" as const,
  sidebarMode: "icons" as const,
  sidebarCollapseMode: "offcanvas" as const,
  fontSize: "md" as const,
  fontFamily: "inter" as const,
  lineHeight: "normal" as const,
  letterSpacing: "normal" as const,
  setTheme: vi.fn(),
  setMode: vi.fn(),
  toggleMode: vi.fn(),
  setLayout: vi.fn(),
  setNavigationPattern: vi.fn(),
  setSidebarMode: vi.fn(),
  setSidebarCollapseMode: vi.fn(),
  setFontSize: vi.fn(),
  setFontFamily: vi.fn(),
  setLineHeight: vi.fn(),
  setLetterSpacing: vi.fn(),
  availableThemes: [],
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

describe("AppRailList flyout mode", () => {
  it("keeps inactive apps neutral and opens a flyout on hover", async () => {
    render(
      <MemoryRouter initialEntries={["/settings/account"]}>
        <ThemeProviderContext.Provider value={baseThemeContext}>
          <AppRailList />
          <LocationProbe />
        </ThemeProviderContext.Provider>
      </MemoryRouter>,
    );

    const achatLink = screen.getByRole("link", { name: /achat/i });
    expect(achatLink).toHaveClass("text-muted-foreground");

    fireEvent.mouseEnter(achatLink);

    expect(await screen.findByText("Mes BC")).toBeInTheDocument();
    expect(screen.getByText("Tous les BC")).toBeInTheDocument();
  });

  it("opens the first submenu route when the rail item is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/settings/account"]}>
        <ThemeProviderContext.Provider value={baseThemeContext}>
          <AppRailList />
          <LocationProbe />
        </ThemeProviderContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: /achat/i }));

    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/achat/bons-de-commande",
    );
  });
});
