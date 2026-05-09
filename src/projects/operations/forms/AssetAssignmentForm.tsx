import type { AssignmentsAssetAssignment } from "@/models";
import { ModelForm, type ModelFormProps } from "@/widgets/model-form";

/**
 * Composant de formulaire pour le modèle AssetAssignment (Affectation de Bien).
 * Gère l'affectation d'un bien à un employé ou un service.
 */
export function AssetAssignmentForm({ 
  mode = "CREATE", 
  objectId, 
  onSuccess,
  ...props 
}: Partial<ModelFormProps<AssignmentsAssetAssignment>>) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<AssignmentsAssetAssignment>
      title={isUpdate ? "Modifier l'Affectation" : "Nouvelle Affectation"}
      description="Définissez le bénéficiaire (employé ou service) et la période d'utilisation du bien."
      app="assignments"
      model="AssetAssignment"
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
          id: "beneficiary",
          title: "Bénéficiaire",
          columns: 2,
          fields: ["assigned_to_employee", "assigned_to_service"],
        },
        {
          id: "period",
          title: "Période & Motif",
          columns: 2,
          fields: ["start_date", "end_date", "reason"],
        },
        {
          id: "documentation",
          title: "Génération Documentaire",
          columns: 2,
          fields: ["description_template", "description_custom"],
        },
      ]}
      fieldOverrides={{
        asset: {
          disabled: isUpdate,
        },

        // RG-AFF-02: Responsabilité exclusive Employé vs Service
        assigned_to_employee: {
          dependsOn: ["assigned_to_service"],
          disabledWhen: (values) => Boolean(values.assigned_to_service),
        },
        assigned_to_service: {
          dependsOn: ["assigned_to_employee"],
          disabledWhen: (values) => Boolean(values.assigned_to_employee),
        },

        reason: {
          type: "textarea",
          colSpan: 2,
        },
        description_template: {
          type: "textarea",
        },
        description_custom: {
          type: "textarea",
        },
      }}
      nested={{
        documents: {
          title: "Pièces Jointes",
          itemLabel: "Document",
          columns: 1,
        },
      }}
      {...props}
    />
  );
}
