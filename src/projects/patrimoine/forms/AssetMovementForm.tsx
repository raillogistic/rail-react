import type { LocationsAssetMovement } from "@/models";
import { ModelForm, type ModelFormProps } from "@/widgets/model-form";

/**
 * Composant de formulaire pour le modèle AssetMovement (Mouvement de Bien).
 * Permet de tracer le déplacement d'un bien d'un emplacement à un autre.
 */
export function AssetMovementForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  ...props
}: Partial<ModelFormProps<LocationsAssetMovement>>) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<LocationsAssetMovement>
      title={isUpdate ? "Modifier le Mouvement" : "Déplacer un Bien"}
      description="Enregistrez le changement de localisation physique d'un bien patrimonial."
      app="locations"
      model="AssetMovement"
      mode={mode}
      objectId={objectId}
      onSuccess={onSuccess}
      generatedSections={[
        {
          id: "asset_selection",
          title: "Bien concerné",
          columns: 1,
          fields: ["asset"],
        },
        {
          id: "movement_details",
          title: "Détails du Mouvement",
          columns: 2,
          fields: ["fromLocation", "toLocation", "reason"],
        },
      ]}
      fieldOverrides={{
        reference: { hidden: true },
        asset: {
          // Désactivé en modification car on ne change pas le bien d'un mouvement existant
          disabled: isUpdate,
        },

        fromLocation: {
          // Affiché en lecture seule (géré par le backend via GraphQLMeta)
          // On le cache si vide à la création pour ne pas encombrer
          visible: (values) => isUpdate || Boolean(values.fromLocation),
          dependsOn: ["asset"],
        },

        reason: {
          type: "textarea",
          colSpan: 2,
        },
      }}
      {...props}
    />
  );
}
