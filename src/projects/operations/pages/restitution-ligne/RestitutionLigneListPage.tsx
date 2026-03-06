import { DynamicModelTable } from "@/widgets/model-table";

export function RestitutionLigneListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="RestitutionLigne"
      create={{ type: "drawer" }}
      update={{ type: "drawer" }}
      detail={{ type: "modal" }}
      baseTable={{
        tableConfig: {
          title: "Détail des réstitution",
        },
      }}
    />
  );
}

export default RestitutionLigneListPage;
