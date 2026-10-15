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

  it("applies primitive field transforms while sanitizing nested values", () => {
    const generatedSchema: FormSchema<Record<string, unknown>> = {
      id: "mission.BaremePrimeMission.CREATE",
      sections: [
        {
          id: "default",
          fields: [
            {
              name: "lignes",
              type: "list",
              label: "Lignes",
              fields: [
                {
                  name: "montantRepas",
                  type: "decimal",
                  label: "Montant repas",
                  transform: (value) =>
                    typeof value === "number" ? String(value) : value,
                },
                {
                  name: "montantHebergement",
                  type: "decimal",
                  label: "Montant hebergement",
                  transform: (value) =>
                    typeof value === "number" ? String(value) : value,
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
        lignes: [{ montantRepas: 8000, montantHebergement: 6000 }],
      }),
    ).toEqual({
      lignes: [{ montantRepas: "8000", montantHebergement: "6000" }],
    });
  });

  it("rebuilds generated schema sections from generatedSections selectors", () => {
    const generatedSchema: FormSchema<Record<string, unknown>> = {
      id: "operations.Decharge.CREATE",
      sections: [
        {
          id: "default",
          fields: [
            { name: "objet", type: "text", label: "Objet" },
            { name: "beneficiaire", type: "text", label: "Beneficiaire" },
            { name: "date_retour", type: "date", label: "Date retour" },
            { name: "date_depart", type: "date", label: "Date depart" },
            { name: "notes", type: "textarea", label: "Notes" },
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
        generatedSections: [
          {
            title: "General",
            fields: ["objet", "beneficiaire"],
          },
          {
            title: "Dates",
            fields: ["date_retour", "date_depart"],
          },
        ],
        generatedEnabled: true,
        contract: null,
        generatedSchema,
        relatedContractsByModel: new Map(),
        nestedControls: undefined,
        resolvedOnlyRelationships: [],
        resolvedExcludeRelationships: [],
      }),
    );

    expect(result.current.finalSchema.sections?.map((section) => section.id)).toEqual([
      "general",
      "dates",
    ]);
    expect(
      result.current.finalSchema.sections?.[0]?.fields.map((field) => field.name),
    ).toEqual(["objet", "beneficiaire"]);
    expect(
      result.current.finalSchema.sections?.[1]?.fields.map((field) => field.name),
    ).toEqual(["date_retour", "date_depart"]);
  });

  it("supports custom fields inside generatedSections", () => {
    const generatedSchema: FormSchema<Record<string, unknown>> = {
      id: "operations.Decharge.CREATE",
      sections: [
        {
          id: "default",
          fields: [
            { name: "date_retour", type: "date", label: "Date retour" },
            { name: "date_depart", type: "date", label: "Date depart" },
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
        generatedSections: [
          {
            id: "dates",
            title: "Dates",
            fields: [
              "date_retour",
              "date_depart",
              { name: "custom", type: "text", label: "Custom" },
            ],
          },
        ],
        generatedEnabled: true,
        contract: null,
        generatedSchema,
        relatedContractsByModel: new Map(),
        nestedControls: undefined,
        resolvedOnlyRelationships: [],
        resolvedExcludeRelationships: [],
      }),
    );

    expect(
      result.current.finalSchema.sections?.[0]?.fields.map((field) => field.name),
    ).toEqual(["date_retour", "date_depart", "custom"]);
  });
});
