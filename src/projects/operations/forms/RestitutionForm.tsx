import { ModelForm, type ModelFormProps } from "@/widgets/model-form";
import type { AssignmentsRestitution } from "@/models";

/**
 * Formulaire pour l'enregistrement d'une restitution de bien.
 * Cette opération clôture l'affectation active et met à jour l'état du bien.
 */
export function RestitutionForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  ...props
}: Partial<ModelFormProps<AssignmentsRestitution>>) {
  return (
    <ModelForm<AssignmentsRestitution>
      title={mode === "UPDATE" ? "Modifier la Restitution" : "Nouvelle Restitution"}
      description="Enregistrez le retour d'un bien pour clôturer son affectation et mettre à jour sa localisation."
      app="assignments"
      model="Restitution"
      mode={mode}
      objectId={objectId}
      onSuccess={onSuccess}
      generatedSections={[
        {
          id: "asset_info",
          title: "Bien & Date",
          columns: 2,
          fields: ["asset", "restitutionDate", "administrativeStatus"],
        },
        {
          id: "return_details",
          title: "Conditions de Retour",
          columns: 2,
          fields: ["physicalCondition", "location"],
        },
        {
          id: "execution",
          title: "Commentaire de retour",
          columns: 1,
          fields: ["comment"],
        },
      ]}
      fieldOverrides={{
        comment: {
          type: "textarea",
        },
        asset: {
          disabled: mode === "UPDATE",
        },
      }}
      {...props}
    />
  );
}
