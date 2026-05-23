/**
 * Tests pour le composant AssetMetadataSection.
 *
 * Vérifie le rendu dynamique des champs de métadonnées
 * en fonction des définitions chargées, la gestion de la validation
 * et l'interaction avec les valeurs du formulaire parent.
 *
 * @module patrimoine/components/__tests__/AssetMetadataSection.test
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssetMetadataSection } from "../AssetMetadataSection";

const mockField = {
  definitionItemId: "field-1",
  sectionName: "Général",
  sectionOrder: 0,
  fieldName: "park_number",
  label: "Numéro de parc",
  fieldType: "text",
  isRequired: false,
  displayOrder: 0,
};

const mockRequiredField = {
  definitionItemId: "field-2",
  sectionName: "Général",
  sectionOrder: 0,
  fieldName: "serial",
  label: "Numéro de série",
  fieldType: "text",
  isRequired: true,
  displayOrder: 1,
};

const mockSection = {
  definitionId: "section-1",
  name: "Général",
  order: 0,
  fields: [mockField, mockRequiredField],
};

vi.mock("../../hooks/useAssetMetadata", () => ({
  useAssetMetadataDefinitions: () => ({
    sections: [mockSection],
    allFields: [mockField, mockRequiredField],
    loading: false,
    hasDefinitions: true,
  }),
  extractMetadataValue: (_fieldType: string, value: unknown) =>
    value ?? "",
}));

describe("AssetMetadataSection", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("affiche les champs de métadonnées définis pour la catégorie", () => {
    render(
      <AssetMetadataSection
        categoryId="category-1"
        familyId={null}
        values={{}}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByLabelText("Numéro de parc")).toBeInTheDocument();
    expect(screen.getByLabelText(/Numéro de série/)).toBeInTheDocument();
  });

  it("appelle onChange lors de la saisie", async () => {
    const user = userEvent.setup();

    render(
      <AssetMetadataSection
        categoryId="category-1"
        familyId="family-1"
        values={{}}
        onChange={mockOnChange}
      />,
    );

    const input = screen.getByLabelText("Numéro de parc");
    await user.type(input, "A");

    expect(mockOnChange).toHaveBeenCalledWith("park_number", "A");
  });

  it("affiche les valeurs initiales passées via props", () => {
    render(
      <AssetMetadataSection
        categoryId="category-1"
        familyId={null}
        values={{ park_number: "ABC-123", serial: "SN-001" }}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByLabelText("Numéro de parc")).toHaveValue("ABC-123");
    expect(screen.getByLabelText(/Numéro de série/)).toHaveValue("SN-001");
  });

  it("valide les champs obligatoires via la ref", () => {
    const ref = { current: null } as React.RefObject<any>;

    render(
      <AssetMetadataSection
        ref={ref}
        categoryId="category-1"
        familyId={null}
        values={{ park_number: "ABC" }}
        onChange={mockOnChange}
      />,
    );

    // serial est requis mais absent → validation doit échouer
    const errors = ref.current?.validate();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("Numéro de série");
  });

  it("la validation passe quand tous les champs requis sont remplis", () => {
    const ref = { current: null } as React.RefObject<any>;

    render(
      <AssetMetadataSection
        ref={ref}
        categoryId="category-1"
        familyId={null}
        values={{ park_number: "ABC", serial: "SN-001" }}
        onChange={mockOnChange}
      />,
    );

    const errors = ref.current?.validate();
    expect(errors).toHaveLength(0);
  });

  it("n'affiche rien quand aucune catégorie n'est sélectionnée", () => {
    const { container } = render(
      <AssetMetadataSection
        categoryId={null}
        familyId={null}
        values={{}}
        onChange={mockOnChange}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
