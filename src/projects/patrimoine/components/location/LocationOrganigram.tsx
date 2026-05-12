/**
 * Vue organigramme des localisations.
 *
 * Utilise le widget générique HierarchyOrganigram
 * pour afficher la hiérarchie des sites, bâtiments, étages et bureaux
 * avec les opérations CRUD intégrées.
 */
import { HierarchyOrganigram } from "@/widgets/hierarchy-organigram";

/**
 * Organigramme interactif des localisations.
 * Affiche un arbre hiérarchique avec badge de niveau (site, bâtiment, etc.)
 * et formulaire intégré pour créer, modifier et supprimer des emplacements.
 */
export function LocationOrganigram() {
  return (
    <HierarchyOrganigram
      app="locations"
      model="Location"
      badgeField="level"
      rootAddLabel="Nouveau site"
      childAddLabel="Ajouter un sous-emplacement"
      emptyMessage="Aucune localisation à afficher. Commencez par créer un site."
      formConfig={{
        parentFieldName: "parent",
        generatedSections: [
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "level"],
          },
          {
            id: "hierarchy",
            title: "Hiérarchie & Emplacement",
            columns: 1,
            fields: ["parent", "address"],
          },
        ],
        fieldOverrides: {
          code: { hidden: true },
          address: { type: "textarea" },
        },
      }}
    />
  );
}

export default LocationOrganigram;
