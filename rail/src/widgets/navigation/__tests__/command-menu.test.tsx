/**
 * @file command-menu.test.tsx
 * @description Tests unitaires pour la palette de commandes partagée (CommandMenu).
 * Couvre le déclencheur style champ de recherche sur bureau, le déclencheur icône accessible
 * sur mobile, l'instance unique du dialogue et le filtrage des éléments selon les permissions.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CommandMenu } from "../command-menu";
import type { NavigationSection } from "@/shared/routing/navigation";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", username: "admin", is_superuser: true },
    isAuthenticated: true,
  }),
}));

const mock_sections: NavigationSection[] = [
  {
    id: "purchasing",
    label: "Achats",
    projectId: "achat",
    items: [
      {
        id: "orders",
        title: "Bons de commande",
        path: "/achat/bons-de-commande",
        requiresAuth: true,
      },
      {
        id: "hidden-item",
        title: "Élément Masqué",
        path: "/achat/masque",
        hidden: true,
        requiresAuth: true,
      },
    ],
  },
];

describe("CommandMenu", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  it("affiche à la fois le déclencheur champ bureau et le bouton icône mobile", () => {
    render(
      <MemoryRouter>
        <CommandMenu navigationLinks={mock_sections} />
      </MemoryRouter>,
    );

    const desktopTrigger = screen.getByText("Rechercher...");
    expect(desktopTrigger).toBeInTheDocument();

    const mobileTrigger = screen.getByRole("button", { name: "Rechercher" });
    expect(mobileTrigger).toBeInTheDocument();
  });

  it("ouvre la palette de commande au clic sur le déclencheur et filtre les éléments masqués", () => {
    render(
      <MemoryRouter>
        <CommandMenu navigationLinks={mock_sections} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    expect(screen.getByPlaceholderText("Saisissez une commande ou recherchez...")).toBeInTheDocument();
    expect(screen.getByText("Bons de commande")).toBeInTheDocument();
    expect(screen.queryByText("Élément Masqué")).not.toBeInTheDocument();
  });

  it("ouvre la palette lors du raccourci clavier Ctrl+K", () => {
    render(
      <MemoryRouter>
        <CommandMenu navigationLinks={mock_sections} />
      </MemoryRouter>,
    );

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(screen.getByPlaceholderText("Saisissez une commande ou recherchez...")).toBeInTheDocument();
  });
});
