vi.mock('@rail/application', () => ({ default: { quickLogin: { password: 'test-password' } } }));
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as AuthContext from "@/features/auth/context";
import { SiteHeader } from "@/app/shell/AppContent";

vi.mock("@/widgets/navigation/command-menu", () => ({
  CommandMenu: () => <div data-testid="command-menu" />,
}));

vi.mock("@/widgets/navigation/nav-user-menu", () => ({
  UserNav: () => <div data-testid="user-nav" />,
}));

vi.mock("@/shared/ui/kit/themeToggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

vi.mock("@/shared/ui/kit/sidebar", () => ({
  SidebarTrigger: () => <button type="button">Sidebar</button>,
}));

vi.mock("@/app/router/routeAccess", () => ({
  useRouteAccess: () => ({
    defaultRoute: "/achat",
    navigationLinks: [],
    projectNavigationLinks: [],
    canAccessRoute: () => true,
  }),
}));

describe("SiteHeader", () => {
  const loginMock = vi.fn();
  const logoutMock = vi.fn().mockResolvedValue(undefined);
  const clearErrorMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_USERS", "milia,rouini");
    vi.spyOn(AuthContext, "useAuthContext").mockReturnValue({
      login: loginMock,
      logout: logoutMock,
      clearError: clearErrorMock,
      verifyMFA: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
      status: "authenticated",
      user: {
        id: "1",
        username: "milia",
        email: "milia@example.com",
        roles: [],
        permissions: [],
      },
      error: null,
      isAuthenticated: true,
      isLoading: false,
      lastActivity: null,
      sessionExpiresAt: null,
      mfaSetupRequired: false,
      ephemeralToken: null,
    } as ReturnType<typeof AuthContext.useAuthContext>);
  });

  it("renders quick switch users from env", async () => {
    render(
      <MemoryRouter>
        <SiteHeader title="Tableau de bord" />
      </MemoryRouter>,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: /connexion rapide/i }),
    );

    expect(await screen.findByText("milia")).toBeInTheDocument();
    expect(screen.getByText("rouini")).toBeInTheDocument();
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("logs into the selected quick switch user and refreshes", async () => {
    loginMock.mockResolvedValue({ success: true });
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });

    render(
      <MemoryRouter>
        <SiteHeader title="Tableau de bord" />
      </MemoryRouter>,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: /connexion rapide/i }),
    );
    fireEvent.click(await screen.findByText("rouini"));

    await waitFor(() => {
      expect(clearErrorMock).toHaveBeenCalled();
      expect(logoutMock).toHaveBeenCalledWith({
        reason: "forced_logout",
        silent: true,
      });
      expect(loginMock).toHaveBeenCalledWith({
        username: "rouini",
        password: 'test-password',
        rememberMe: true,
      });
      expect(reloadMock).toHaveBeenCalled();
    });
  });
});
