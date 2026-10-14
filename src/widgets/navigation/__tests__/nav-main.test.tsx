import { describe, expect, it } from "vitest";
import { get_best_matching_path } from "../nav-main";

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

  it("devrait retourner null s'il n'y a pas de correspondance", () => {
    const match = get_best_matching_path("/autre-module", paths);
    expect(match).toBeNull();
  });
});
