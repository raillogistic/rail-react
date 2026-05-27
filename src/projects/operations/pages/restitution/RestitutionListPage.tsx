import type { AssignmentsRestitution } from "@/models";
import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

/**
 * Page de liste pour les restitutions de biens.
 */
export function RestitutionListPage() {
  return (
    <DynamicModelTable<AssignmentsRestitution>
      app="assignments"
      model="Restitution"
      create={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Restitutions de Biens",
        },
        customMutations: ({ row }) => {
          return {
            overrides: {
              cancel: {
                hidden: row.status === "cancelled",
              },
            },
          };
        },
      }}
    />
  );
}

export default RestitutionListPage;
