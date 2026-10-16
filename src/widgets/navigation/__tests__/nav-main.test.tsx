import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SidebarProvider } from "@/shared/ui/kit/sidebar";
import type { NavigationSection } from "@/shared/routing/navigation";
import { get_best_matching_path, NavMain } from "../nav-main";

/**
 * @file nav-main.test.tsx
 * @description Tests unitaires pour la logique de correspondance de chemins dans la barre latérale.
 */

describe("NavMain Path Matching Logic", () => {
  const paths = [
    "/achat",
    "/achat/bons-de-commande",
    "/achat/bons-de-commande/tous",
    "/achat/bons-de-commande/creer",
    "/achat/bons-de-commande/:id",
    "/achat/bons-de-commande/:id/modifier",
    "/achat/validations",
    "/achat/administration/departements",
  ];

  it("devrait retourner la correspondance exacte pour le cockpit de base", () => {
    const match = get_best_matching_path("/achat", paths);
    expect(match).toBe("/achat");
  });

  it("devrait retourner la correspondance exacte pour Tous les BC", () => {
    const match = get_best_matching_path("/achat/bons-de-commande/tous", paths);
    expect(match).toBe("/achat/bons-de-commande/tous");
  });

  it("devrait retourner la correspondance exacte pour Mes BC", () => {
    const match = get_best_matching_path("/achat/bons-de-commande", paths);
    expect(match).toBe("/achat/bons-de-commande");
  });

  it("devrait retourner la correspondance exacte pour la création de BC", () => {
    const match = get_best_matching_path("/achat/bons-de-commande/creer", paths);
    expect(match).toBe("/achat/bons-de-commande/creer");
  });

  it("devrait retourner le chemin paramétré pour le détail d'un BC", () => {
    const match = get_best_matching_path("/achat/bons-de-commande/123", paths);
    expect(match).toBe("/achat/bons-de-commande/:id");
  });

  it("devrait retourner le chemin paramétré pour la modification d'un BC", () => {
    const match = get_best_matching_path("/achat/bons-de-commande/123/modifier", paths);
    expect(match).toBe("/achat/bons-de-commande/:id/modifier");
  });

  it("devrait retourner la correspondance exacte pour les validations", () => {
    const match = get_best_matching_path("/achat/validations", paths);
    expect(match).toBe("/achat/validations");
  });

});

describe("NavMain Rendering & Badge Notifications", () => {
  const sample_sections: NavigationSection[] = [
    {
      id: "mail-section",
      label: "MAIL",
      items: [
        {
          id: "inbox",
          title: "Inbox",
          path: "/mail/inbox",
          badge: "14",
          requiresAuth: true,
        },
        {
          id: "messages",
          title: "Messages",
          path: "/mail/messages",
          badge: 9,
          requiresAuth: true,
        },
        {
          id: "tags",
          title: "Tags",
          path: "/mail/tags",
          requiresAuth: true,
        },
      ],
    },
  ];

  it("affiche les libellés de section uppercase et les badges en mode étendu", () => {
    render(
      <MemoryRouter initialEntries={["/mail/inbox"]}>
        <SidebarProvider defaultOpen={true}>
          <NavMain navigationLinks={sample_sections} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("MAIL")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("affiche les pastilles de notification rouges uniquement sur les éléments avec badge en mode replié", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/mail/inbox"]}>
        <SidebarProvider defaultOpen={false}>
          <NavMain navigationLinks={sample_sections} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    // Les badges textuels sont masqués en mode replié
    expect(screen.queryByText("14")).not.toBeInTheDocument();

    // Les pastilles rouges de notification existent pour inbox (badge "14") et messages (badge 9)
    const red_dots = container.querySelectorAll(".bg-\\[\\#EF4444\\]");
    expect(red_dots.length).toBe(2);
  });
});

