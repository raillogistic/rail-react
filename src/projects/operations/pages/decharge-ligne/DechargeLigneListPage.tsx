import { DynamicModelTable } from "@/widgets/model-table";

export function DechargeLigneListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="DechargeLigne"
      create={{ type: "drawer" }}
      update={{ type: "drawer" }}
      detail={{ type: "modal" }}
      baseTable={{
        tableConfig: {
          title: "Détail des décharges",
        },
      }}
    />
  );
}

export default DechargeLigneListPage;
