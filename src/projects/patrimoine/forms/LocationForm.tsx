import type { LocationsLocation } from "@/models";
import { ModelForm, type ModelFormProps } from "@/widgets/model-form";

/**
 * Composant de formulaire pour le modèle Location (Localisation).
 * Gère la hiérarchie des sites, bâtiments, étages et bureaux.
 */
export function LocationForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  ...props
}: Partial<ModelFormProps<LocationsLocation>>) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<LocationsLocation>
      title={
        isUpdate
          ? "Modifier la Localisation"
          : "Créer une nouvelle Localisation"
      }
      description="Définissez les sites, bâtiments et locaux de l'organisation."
      app="locations"
      model="Location"
      mode={mode}
      objectId={objectId}
      onSuccess={onSuccess}
      generatedSections={[
        {
          id: "general",
          title: "Informations Générales",
          columns: 2,
          fields: ["name", "level"],
        },
        {
          id: "hierarchy",
          title: "Hiérarchie & Emplacement",
          columns: 1,
          fields: ["parent", "address"],
        },
      ]}
      fieldOverrides={{
        // Le code est auto-généré et en lecture seule
        code: { hidden: true },

        // Filtrage du parent en fonction du niveau sélectionné
        // EC-REF-05: Validation de la hiérarchie
        parent: (field) => ({
          ...field,
          type: "select-query",
          dependsOn: ["level"],
          visible: (values) => values.level !== "site",
          inputProps: {
            // On pourrait filtrer ici les parents valides (niveau < niveau actuel)
            // Mais pour simplifier et éviter des requêtes complexes, on laisse le backend valider
            // ou on peut ajouter un filtre basique si on connaît l'ordre des niveaux.
          },
        }),

        address: {
          type: "textarea",
        },
      }}
      {...props}
    />
  );
}
