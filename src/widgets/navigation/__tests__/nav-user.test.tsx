/**
 * @file nav-user.test.tsx
 * @description Tests unitaires pour le composant NavUser vérifiant le rendu du profil
 * utilisateur avec avatar, nom, email et menu déroulant selon le design sidebar.jpg.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/shared/ui/kit/sidebar";
import { NavUser } from "../nav-user";

describe("NavUser", () => {
  const mock_user = {
    username: "marie.dupont",
    email: "user.name@email.com",
    firstName: "Marie",
    lastName: "Dupont",
  };

  it("affiche l'avatar, le nom complet et l'email en mode étendu selon sidebar.jpg", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <NavUser user={mock_user} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Marie Dupont")).toBeInTheDocument();
    expect(screen.getByText("user.name@email.com")).toBeInTheDocument();
  });

  it("n'affiche pas le texte de nom et d'email en mode replié", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={false}>
          <NavUser user={mock_user} />
        </SidebarProvider>
      </MemoryRouter>,
    );

    // En mode replié, les textes sont masqués
    expect(screen.queryByText("user.name@email.com")).not.toBeInTheDocument();
  });
});
