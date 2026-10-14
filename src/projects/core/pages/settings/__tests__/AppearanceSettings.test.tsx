/**
 * @file AppearanceSettings.test.tsx
 * @description Tests unitaires pour la page des paramètres d'apparence.
 * Vérifie le sélecteur de disposition de la barre latérale (icônes vs complète)
 * et l'affichage conditionnel du sélecteur de type de navigation.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppearanceSettings } from "../AppearanceSettings";

// Mock du hook useTheme
const mock_set_sidebar_mode = vi.fn();
const mock_set_navigation_pattern = vi.fn();

let mock_theme_state = {
  theme: "transtev",
  setTheme: vi.fn(),
  mode: "light",
  setMode: vi.fn(),
  fontSize: "md",
  setFontSize: vi.fn(),
  fontFamily: "inter",
  setFontFamily: vi.fn(),
  lineHeight: "normal",
  setLineHeight: vi.fn(),
  letterSpacing: "normal",
  setLetterSpacing: vi.fn(),
  navigationPattern: "secondary-sidebar",
  setNavigationPattern: mock_set_navigation_pattern,
  sidebarMode: "icons",
  setSidebarMode: mock_set_sidebar_mode,
};

vi.mock("@/shared/ui/theme", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTheme: () => mock_theme_state,
  };
});

describe("AppearanceSettings", () => {
  it("affiche le sélecteur de disposition de la barre latérale et le type de navigation en mode icônes", () => {
    mock_theme_state = {
      ...mock_theme_state,
      sidebarMode: "icons",
      navigationPattern: "secondary-sidebar",
    };

    render(<AppearanceSettings />);

    expect(screen.getByText("Disposition de la barre latérale")).toBeInTheDocument();
    expect(screen.getByText("Type de navigation")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Barre d'icônes compacte. L'affichage des sous-menus est défini par le type de navigation.",
      ),
    ).toBeInTheDocument();
  });

  it("masque le type de navigation lorsque la barre latérale complète est sélectionnée", () => {
    mock_theme_state = {
      ...mock_theme_state,
      sidebarMode: "complete",
    };

    render(<AppearanceSettings />);

    expect(screen.getByText("Disposition de la barre latérale")).toBeInTheDocument();
    expect(screen.queryByText("Type de navigation")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Barre latérale complète affichant directement le menu et les sous-menus.",
      ),
    ).toBeInTheDocument();
  });
});
