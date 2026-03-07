import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useModelFormSchema } from "../useModelFormSchema";
import type { FormSchema } from "../../../types";

describe("useModelFormSchema", () => {
  it("preserves nested row identity keys while stripping non-editable values", () => {
    const generatedSchema: FormSchema<Record<string, unknown>> = {
      id: "operations.Decharge.UPDATE",
      sections: [
        {
          id: "default",
          fields: [
            {
              name: "commentaire",
              type: "textarea",
              label: "Commentaire",
            },
            {
              name: "lignes",
              type: "list",
              label: "Lignes",
              fields: [
                {
                  name: "libelle",
                  type: "text",
                  label: "Libelle",
                },
                {
                  name: "qteSortie",
                  type: "number",
                  label: "Quantite",
                },
              ],
            },
          ],
        },
      ],
    };

    const { result } = renderHook(() =>
      useModelFormSchema({
        onlyFields: undefined,
        excludeFields: undefined,
        onlyRequired: false,
        fieldOverrides: undefined,
        sectionOverrides: undefined,
        generatedEnabled: false,
        contract: null,
        generatedSchema,
        relatedContractsByModel: new Map(),
        nestedControls: undefined,
        resolvedOnlyRelationships: [],
        resolvedExcludeRelationships: [],
      }),
    );

    expect(
      result.current.sanitizeValuesForControlledSchema({
        id: "decharge-1",
        commentaire: "updated",
        lignes: [
          {
            id: "ligne-1",
            libelle: "PC",
            qteSortie: 2,
            metadataSnapshot: { stale: true },
          },
          {
            objectId: "ligne-legacy",
            libelle: "Ecran",
            qteSortie: 1,
            extra: "ignored",
          },
        ],
      }),
    ).toEqual({
      commentaire: "updated",
      lignes: [
        {
          id: "ligne-1",
          libelle: "PC",
          qteSortie: 2,
        },
        {
          objectId: "ligne-legacy",
          libelle: "Ecran",
          qteSortie: 1,
        },
      ],
    });
  });
});
