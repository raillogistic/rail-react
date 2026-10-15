import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainApp } from "../MainApp";
import { ThemeProviderContext } from "@/shared/ui/theme/ThemeProvider";

vi.mock("@/widgets/components/OfflineAlert", () => ({
  OfflineAlert: () => <div data-testid="offline-alert" />,
  useOfflineAlert: () => ({
    showAlert: false,
    lastError: null,
    showOfflineAlert: vi.fn(),
    hideOfflineAlert: vi.fn(),
    retryConnection: vi.fn(),
  }),
}));

vi.mock("../AppRail", () => ({
  AppRail: () => <div data-testid="app-rail" />,
}));

vi.mock("../AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock("../AppContent", () => ({
  __esModule: true,
  default: () => <div data-testid="app-content" />,
}));

vi.mock("@/app/router/routeAccess", () => ({
  useRouteAccess: () => ({
    defaultRoute: "/achat",
    navigationLinks: [],
    projectNavigationLinks: [],
  }),
}));

const baseThemeContext = {
  theme: "transtev",
  mode: "light" as const,
  layout: "vertical" as const,
  navigationPattern: "secondary-sidebar" as const,
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

describe("MainApp", () => {
  beforeAll(() => {
    window.matchMedia ??= vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it.each(["vertical", "horizontal", "mixed"] as const)(
    "résout la valeur d'agencement héritée %s vers l'espace de travail à barre latérale complète",
    (layout) => {
      render(
        <MemoryRouter>
          <ThemeProviderContext.Provider
            value={{ ...baseThemeContext, layout }}
          >
            <MainApp />
          </ThemeProviderContext.Provider>
        </MemoryRouter>,
      );

      expect(screen.getByTestId("offline-alert")).toBeInTheDocument();
      expect(screen.queryByTestId("app-rail")).not.toBeInTheDocument();
      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("app-content")).toBeInTheDocument();
    },
  );

  it("conserve l'agencement à barre latérale unique quel que soit le mode hérité", () => {
    render(
      <MemoryRouter>
        <ThemeProviderContext.Provider
          value={{ ...baseThemeContext, sidebarMode: "icons" }}
        >
          <MainApp />
        </ThemeProviderContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("app-rail")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("app-content")).toBeInTheDocument();
  });
});
