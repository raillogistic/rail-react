import { describe, expect, it } from "vitest";

import { normalizeColumnOrderEntries } from "../useTableLayout";

describe("normalizeColumnOrderEntries", () => {
  it("matches persisted snake_case entries to canonical camelCase column ids", () => {
    const availableIds = [
      "id",
      "typeBeneficiaire",
      "nom",
      "prenom",
      "categorieSocioProfessionnelle",
    ];

    expect(
      normalizeColumnOrderEntries(
        [
          "id",
          "categorie_socio_professionnelle",
          "prenom",
          "type_beneficiaire",
        ],
        availableIds,
      ),
    ).toEqual([
      "id",
      "categorieSocioProfessionnelle",
      "prenom",
      "typeBeneficiaire",
    ]);
  });

  it("matches dotted and double-underscore relation accessors", () => {
    const availableIds = ["createdBy.desc", "updatedBy.desc", "name"];

    expect(
      normalizeColumnOrderEntries(
        ["updated_by__desc", "name", "created_by.desc"],
        availableIds,
      ),
    ).toEqual(["updatedBy.desc", "name", "createdBy.desc"]);
  });
});
