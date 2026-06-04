import type { LocationsAssetMovement } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import {
  activeOnlyWhere,
  combineWhereClauses,
  extractScalarId,
} from "@/shared/utils/modelFormFilters";

/**
 * Composant de formulaire pour le modèle AssetMovement (Mouvement de Bien).
 * Permet de tracer le déplacement d'un bien d'un emplacement à un autre.
 */
export interface AssetMovementFormProps {
  mode?: "CREATE" | "UPDATE" | "VIEW";
  objectId?: string | number | null;
  onSuccess?: (data: any) => void;
}

export function AssetMovementForm({
  mode = "CREATE",
  objectId,
  onSuccess,
}: AssetMovementFormProps) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<LocationsAssetMovement>
      title={isUpdate ? "Modifier le Mouvement" : "Déplacer un Bien"}
      description="Enregistrez le changement de localisation physique d'un bien patrimonial."
      app="locations"
      model="AssetMovement"
      mode={mode}
      objectId={objectId}
      onSubmitResult={(result) => {
        if (result.ok) onSuccess?.(result.object);
      }}
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
          fields: ["fromLocation", "toLocation", "physicalCondition", "reason"],
        },
      ]}
      fieldOverrides={{
        reference: { hidden: true },
        asset: {
          disabled: isUpdate,
          graphql: {
            where: combineWhereClauses(
              { isActive: { eq: true } },
              {
                administrativeStatus: {
                  notIn: ["reformed", "disposed", "archived", "lost"],
                },
              },
            ),
          },
        },
        fromLocation: {
          visible: (values) => isUpdate || Boolean(values.fromLocation),
          dependsOn: ["asset"],
        },
        toLocation: {
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        reason: {
          type: "textarea",
          colSpan: 2,
        },
      }}
      behavior={{
        validate: (values: Record<string, unknown>) => {
          const fromLocationId = extractScalarId(values.fromLocation);
          const toLocationId = extractScalarId(values.toLocation);

          if (
            fromLocationId !== undefined &&
            toLocationId !== undefined &&
            String(fromLocationId) === String(toLocationId)
          ) {
            return {
              toLocation:
                "La nouvelle localisation doit être différente de l'ancienne.",
            };
          }

          return undefined;
        },
      }}
    />
  );
}
