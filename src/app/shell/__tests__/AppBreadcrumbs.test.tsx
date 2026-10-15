/**
 * @file AppBreadcrumbs.test.tsx
 * @description Tests unitaires pour le fil d'Ariane partagé (AppBreadcrumbs).
 * Couvre le masquage sur la route d'atterrissage, la déduplication des niveaux consécutifs,
 * la cliquabilité des ancêtres avec destination valide, et le repli sur les métadonnées de route
 * pour les pages absentes de la navigation.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppBreadcrumbs, deriveBreadcrumbItems } from "../AppBreadcrumbs";
import type { NavigationSection } from "@/shared/routing/navigation";
import type { AppRouteConfig } from "@/app/router/contracts";

const mock_routes: AppRouteConfig[] = [
  {
    id: "route-achat-home",
    path: "/achat",
    guard: "public",
    projectId: "achat",
    title: "Accueil Achats",
  },
  {
    id: "route-orders-list",
    path: "/achat/bons-de-commande",
    guard: "public",
    projectId: "achat",
    title: "Bons de commande",
  },
  {
    id: "route-orders-detail",
    path: "/achat/bons-de-commande/:id",
    guard: "public",
    projectId: "achat",
    title: "Détail du bon de commande",
  },
  {
    id: "route-suppliers-list",
    path: "/achat/fournisseurs",
    guard: "public",
    projectId: "achat",
    title: "Fournisseurs",
  },
];

const mock_navigation_links: NavigationSection[] = [
  {
    id: "orders-section",
    label: "Gestion des Achats",
    projectId: "achat",
    items: [
      {
        id: "orders",
        title: "Bons de commande",
        path: "/achat/bons-de-commande",
        requiresAuth: true,
        children: [
          {
            title: "Tous les BC",
            path: "/achat/bons-de-commande/tous",
            requiresAuth: true,
          },
        ],
      },
      {
        id: "suppliers",
        title: "Fournisseurs",
        path: "/achat/fournisseurs",
        requiresAuth: true,
      },
    ],
  },
];

vi.mock("@/app/router/routeAccess", () => ({
  useRouteAccess: () => ({
    defaultRoute: "/achat",
    navigationLinks: mock_navigation_links,
  }),
}));

vi.mock("@/app/router/manifestRegistry", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getAllRoutes: () => mock_routes,
  };
});

describe("deriveBreadcrumbItems", () => {
  it("masque le fil d'Ariane sur la page d'atterrissage (landing route)", () => {
    const items = deriveBreadcrumbItems(
      "/achat",
      mock_navigation_links,
      "/achat",
      mock_routes,
    );
    expect(items).toEqual([]);

    const rootItems = deriveBreadcrumbItems(
      "/",
      mock_navigation_links,
      "/achat",
      mock_routes,
    );
    expect(rootItems).toEqual([]);
  });

  it("génère les éléments pour une route de navigation avec ancêtres cliquables", () => {
    const items = deriveBreadcrumbItems(
      "/achat/fournisseurs",
      mock_navigation_links,
      "/achat",
      mock_routes,
    );

    expect(items.length).toBeGreaterThanOrEqual(2);
    // Racine cliquable
    expect(items[0]).toEqual({
      title: "Accueil Achats",
      path: "/achat",
      isClickable: true,
    });
    // Page courante non cliquable
    const lastItem = items[items.length - 1];
    expect(lastItem.title).toBe("Fournisseurs");
    expect(lastItem.isClickable).toBe(false);
  });

  it("déduplique les niveaux consécutifs ayant le même titre", () => {
    const duplicatedNav: NavigationSection[] = [
      {
        id: "orders-section",
        label: "Bons de commande",
        projectId: "achat",
        items: [
          {
            id: "orders",
            title: "Bons de commande",
            path: "/achat/bons-de-commande",
            requiresAuth: true,
          },
        ],
      },
    ];

    const items = deriveBreadcrumbItems(
      "/achat/bons-de-commande",
      duplicatedNav,
      "/achat",
      mock_routes,
    );

    const titles = items.map((i) => i.title);
    const duplicates = titles.filter(
      (title, idx) => idx > 0 && title.toLowerCase() === titles[idx - 1].toLowerCase(),
    );
    expect(duplicates).toEqual([]);
  });

  it("résout le titre de route pour une page absente de la navigation", () => {
    const items = deriveBreadcrumbItems(
      "/achat/bons-de-commande/123",
      mock_navigation_links,
      "/achat",
      mock_routes,
    );

    expect(items.some((i) => i.title === "Détail du bon de commande")).toBe(true);
    // Vérifie que le parent préfixe est présent et cliquable
    const parent = items.find((i) => i.path === "/achat/bons-de-commande");
    expect(parent).toBeDefined();
    expect(parent?.isClickable).toBe(true);
  });
});

describe("AppBreadcrumbs component", () => {
  it("ne rend rien sur la page d'atterrissage", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/achat"]}>
        <AppBreadcrumbs />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("affiche les liens de navigation sur une page imbriquée", () => {
    render(
      <MemoryRouter initialEntries={["/achat/fournisseurs"]}>
        <AppBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Fil d'Ariane" })).toBeInTheDocument();
    expect(screen.getByText("Fournisseurs")).toBeInTheDocument();
  });
});
