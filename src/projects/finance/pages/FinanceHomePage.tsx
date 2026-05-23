import DynamicForm from "@/widgets/model-form";
import React from "react";

export const FinanceHomePage: React.FC = () => {
  return (
    <div className="p-6">
      <DynamicForm
        schema={{
          fields: [
            {
              type: "json-nested",

              name: "json",
              // Titre et sous-titre globaux affichés au-dessus des sections (Optionnel)
              title: "Informations Financières Complémentaires",
              subtitle: "Veuillez remplir les données structurées ci-dessous.",
              // Configuration de la structure du JSON
              sections: [
                {
                  id: "general_info",
                  name: "Informations Générales",
                  order: 1, // Optionnel: pour l'ordre d'affichage
                  fields: [
                    {
                      fieldKey: "code_projet", // La clé qui sera utilisée dans l'objet JSON généré
                      label: "Code du Projet",
                      fieldType: "text", // "text", "number", "date", ou "boolean"
                      isRequired: true,
                      displayOrder: 1,
                      placeholder: "Ex: PROJ-2026-X",
                      helpText: "Code interne utilisé par la comptabilité.",
                    },
                    {
                      fieldKey: "budget_alloue",
                      label: "Budget Alloué (€)",
                      fieldType: "number",
                      isRequired: true,
                      displayOrder: 2,
                    },
                  ],
                },
                {
                  id: "status_info",
                  name: "État d'Avancement",
                  order: 2,
                  fields: [
                    {
                      fieldKey: "date_lancement",
                      label: "Date de Lancement",
                      fieldType: "date",
                      isRequired: false,
                      displayOrder: 1,
                    },
                    {
                      fieldKey: "est_facturable",
                      label: "Est Facturable",
                      fieldType: "boolean",
                      isRequired: false,
                      displayOrder: 2,
                    },
                  ],
                },
              ],
              // Affichera ceci s'il n'y a aucune section fournie (Optionnel)
              emptyMessage: "Aucune donnée financière configurée.",
            },
          ],
        }}
        behavior={{
          onSubmit: (values, ctx) => {
            console.log("Valeurs du formulaire :", values);
            /* 
              Le paramètre `values.json` contiendra :
              {
                "code_projet": "PROJ-2026-X",
                "budget_alloue": 50000,
                "date_lancement": "2026-05-22",
                "est_facturable": true
              }
            */
          },
        }}
        devtools={{ enabled: true }}
      />
    </div>
  );
};
