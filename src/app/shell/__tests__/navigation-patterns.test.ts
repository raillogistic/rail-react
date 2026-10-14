/**
 * @file navigation-patterns.test.ts
 * @description Tests unitaires pour les utilitaires de motifs de navigation et options de barre latérale.
 */

import { describe, expect, it } from "vitest";
import {
  getActiveProjectNavigationPath,
  getProjectNavigationEntries,
  groupProjectNavigationEntries,
  splitProjectNavigationEntries,
  SIDEBAR_MODE_OPTIONS,
  NAVIGATION_PATTERN_OPTIONS,
} from "../navigation-patterns";
import type { NavigationSection } from "@/shared/routing/navigation";

describe("navigation-patterns helpers", () => {
  const sections: NavigationSection[] = [
    {
      id: "operations",
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
        {
          id: "approvals",
          title: "Validations",
          path: "/achat/validations",
          requiresAuth: true,
        },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      projectId: "achat",
      items: [
        {
          id: "settings",
          title: "Paramètres",
          path: "/achat/parametres",
          requiresAuth: true,
          hidden: true,
        },
      ],
    },
  ];

  it("flattens visible project pages and preserves their section labels", () => {
    const entries = getProjectNavigationEntries(sections);

    expect(entries.map((entry) => entry.title)).toEqual([
      "Mes BC",
      "Tous les BC",
      "Validations",
    ]);
    expect(groupProjectNavigationEntries(entries)).toEqual([
      {
        label: "Opérations",
        entries,
      },
    ]);
  });

  it("finds the active path and separates overflow entries", () => {
    const entries = getProjectNavigationEntries(sections);

    expect(
      getActiveProjectNavigationPath("/achat/bons-de-commande/tous", entries),
    ).toBe("/achat/bons-de-commande/tous");

    const { primaryEntries, overflowEntries } = splitProjectNavigationEntries(
      [...entries, ...entries, ...entries],
      5,
    );

    expect(primaryEntries).toHaveLength(5);
    expect(overflowEntries).toHaveLength(4);
  });

  it("exposes sidebar mode options with icon and complete modes", () => {
    expect(SIDEBAR_MODE_OPTIONS).toEqual([
      {
        value: "icons",
        label: "Menu avec icônes",
        description:
          "Barre d'icônes compacte. L'affichage des sous-menus est défini par le type de navigation.",
      },
      {
        value: "complete",
        label: "Barre latérale complète",
        description:
          "Barre latérale complète affichant directement le menu et les sous-menus.",
      },
    ]);
  });
});
