/**
 * @file PageHeader.test.tsx
 * @description Tests unitaires pour le composant PageHeader partagé.
 * Vérifie le rendu du titre (24px), de la description optionnelle (14px)
 * et des actions optionnelles, ainsi que l'alignement responsive.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("affiche correctement le titre et la description", () => {
    render(
      <PageHeader
        title="Détail du document"
        description="Consultez les informations et le circuit de validation."
      />,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Détail du document" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-2xl font-semibold tracking-tight");

    const description = screen.getByText(
      "Consultez les informations et le circuit de validation.",
    );
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass("text-sm text-muted-foreground");
  });

  it("affiche les actions optionnelles alignées à droite", () => {
    render(
      <PageHeader
        title="Commandes"
        actions={<button type="button">Nouvelle commande</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Nouvelle commande" }),
    ).toBeInTheDocument();
  });

  it("supporte un ReactNode personnalisé pour le titre avec badge", () => {
    render(
      <PageHeader
        title={
          <span data-testid="custom-title">
            BC-2026-001 <span data-testid="badge">Validé</span>
          </span>
        }
      />,
    );

    expect(screen.getByTestId("custom-title")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toHaveTextContent("Validé");
  });

  it("n'affiche pas de description ni de conteneur d'actions lorsqu'ils sont omis", () => {
    const { container } = render(<PageHeader title="Titre simple" />);

    expect(container.querySelector("p")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Titre simple",
    );
  });
});
