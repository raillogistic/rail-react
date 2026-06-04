import type { AssignmentsAssetAssignment } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import {
  activeOnlyWhere,
  combineWhereClauses,
  extractScalarId,
} from "@/shared/utils/modelFormFilters";

/**
 * Composant de formulaire pour le modèle AssetAssignment (Affectation de Bien).
 * Gère l'affectation d'un bien à un employé ou un service.
 */
export interface AssetAssignmentFormProps {
  mode?: "CREATE" | "UPDATE" | "VIEW";
  objectId?: string | number | null;
  onSuccess?: (data: any) => void;
}

export function AssetAssignmentForm({
  mode = "CREATE",
  objectId,
  onSuccess,
}: AssetAssignmentFormProps) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<AssignmentsAssetAssignment>
      title={isUpdate ? "Modifier l'Affectation" : "Nouvelle Affectation"}
      description="Définissez le bénéficiaire (employé ou service) et la période d'utilisation du bien."
      app="assignments"
      model="AssetAssignment"
      mode={mode}
      objectId={objectId}
      onSubmitResult={(result) => {
        if (result.ok) onSuccess?.(result.object);
      }}
      devtools={{ enabled: true }}
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
          fields: ["assignedToEmployee", "assignedToService"],
        },
        {
          id: "period",
          title: "Période & Motif",
          columns: 2,

          fields: ["startDate", "physicalCondition", "reason"],
        },
        {
          id: "documentation",
          title: "Génération Documentaire",
          columns: 2,
          fields: ["descriptionTemplate", "descriptionCustom"],
        },
      ]}
      fieldOverrides={{
        asset: {
          disabled: isUpdate,
          graphql: {
            where: combineWhereClauses(
              { isAssignable: true },
              { isActive: { eq: true } },
            ),
          },
        },

        // RG-AFF-02: Responsabilité exclusive Employé vs Service
        assignedToEmployee: (field) => ({
          ...field,
          type: "select-query",
          dependsOn: ["assignedToService"],
          disabledWhen: (values) =>
            Array.isArray(values.assignedToService)
              ? values.assignedToService.length > 0
              : Boolean(values.assignedToService),
          graphql: {
            // @ts-ignore
            ...(field.graphql ?? {}),
            where: (ctx: any) => {
              const serviceId = extractScalarId(ctx.values.assignedToService);

              return activeOnlyWhere(
                serviceId
                  ? {
                      service: { eq: serviceId },
                    }
                  : undefined,
              );
            },
          },
        }),
        assignedToService: {
          dependsOn: ["assignedToEmployee"],
          disabledWhen: (values) =>
            Array.isArray(values.assignedToEmployee)
              ? values.assignedToEmployee.length > 0
              : Boolean(values.assignedToEmployee),
          graphql: {
            where: ACTIVE_ONLY_SERVICE_WHERE,
          },
        },

        reason: {
          type: "textarea",
          colSpan: 2,
        },
        endDate: {
          hidden: true,
          transform: (value: unknown) =>
            value === "" || value === null ? undefined : value,
        },
        descriptionTemplate: {
          type: "textarea",
        },
        descriptionCustom: {
          type: "textarea",
        },
      }}
      behavior={{
        validate: (values: Record<string, unknown>) => {
          const errors: Record<string, string> = {};
          const hasEmployee = Array.isArray(values.assignedToEmployee)
            ? values.assignedToEmployee.length > 0
            : Boolean(values.assignedToEmployee);
          const hasService = Array.isArray(values.assignedToService)
            ? values.assignedToService.length > 0
            : Boolean(values.assignedToService);

          if (hasEmployee && hasService) {
            errors.assignedToEmployee =
              "Un bien ne peut pas être assigné à la fois à un employé et à un service.";
            errors.assignedToService =
              "Un bien ne peut pas être assigné à la fois à un employé et à un service.";
          } else if (!hasEmployee && !hasService) {
            errors.assignedToEmployee = "Un employé ou un service est requis.";
            errors.assignedToService = "Un employé ou un service est requis.";
          }

          return errors;
        },
      }}
      runtimeOverrides={[{ path: "endDate", action: "UNSET" }]}
      nested={{
        documents: {
          title: "Pièces Jointes",
          itemLabel: "Document",
          columns: 1,
        },
      }}
    />
  );
}

const ACTIVE_ONLY_SERVICE_WHERE = {
  isActive: { eq: true },
};
