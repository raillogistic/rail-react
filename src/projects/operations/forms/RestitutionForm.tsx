import { ModelForm } from "@/widgets/model-form";
import type { AssignmentsRestitution } from "@/models";
import {
  activeOnlyWhere,
  combineWhereClauses,
} from "@/shared/utils/modelFormFilters";

/**
 * Formulaire pour l'enregistrement d'une restitution de bien.
 * Cette opération clôture l'affectation active et met à jour l'état du bien.
 */
export interface RestitutionFormProps {
  mode?: "CREATE" | "UPDATE" | "VIEW";
  objectId?: string | number | null;
  onSuccess?: (data: any) => void;
  state?: {
    defaultValues?: any;
  };
}

export function RestitutionForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  state,
}: RestitutionFormProps) {
  return (
    <ModelForm<AssignmentsRestitution>
      title={mode === "UPDATE" ? "Modifier la Restitution" : "Nouvelle Restitution"}
      description="Enregistrez le retour d'un bien pour clôturer son affectation et mettre à jour sa localisation."
      app="assignments"
      model="Restitution"
      mode={mode}
      objectId={objectId}
      onSubmitResult={(result) => {
        if (result.ok) onSuccess?.(result.object);
      }}
      state={state}
      generatedSections={[
        {
          id: "general",
          title: "Informations Générales",
          columns: 2,
          fields: ["restitutionDate", "asset"],
        },
        {
          id: "state_location",
          title: "État & Localisation de Retour",
          columns: 2,
          fields: ["physicalCondition", "location"],
        },
        {
          id: "status_after",
          title: "Statut Après Retour",
          columns: 1,
          fields: ["administrativeStatus"],
        },
        {
          id: "restitution_comment",
          title: "Commentaires",
          columns: 1,
          fields: ["comment"],
        },
      ]}
      fieldOverrides={{
        asset: {
          disabled: mode === "UPDATE",
          graphql: {
            where: combineWhereClauses(
              { administrativeStatus: { eq: "assigned" } },
              { isActive: { eq: true } },
            ),
          },
        },
        location: {
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        comment: {
          type: "textarea",
        },
      }}
    />
  );
}
