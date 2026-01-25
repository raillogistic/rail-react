import { useParams } from "react-router-dom";
import ModelDetail from "./ModelDetail";

export default function DetailExample() {
  const id = "1";
  // return <BaseDetail data={{ id: "EQ-1", name: "Capteur", status: "active", logs: [{ created_at: "2025-11-21", level: "INFO", message: "OK" }] }} tabs={tabs} initialTab="details" />
  return (
    <>
      <ModelDetail
        appName="assets"
        modelName="Equipment"
        id={"af4373a4-0424-4184-b7d9-997605bd182f"}
        updateForm={{
          formProps: {
            onChange: (values) => {
              console.log(values);
            },
          },
          description: "dsds",
          title: "dsd",
          // mode: "drawer",
          width: "50vw",
        }}
        nested={[
          {
            category: {
              allowUpdate: true,
              updateForm: {
                layout: { columns: 1 },
              },
              title: "dsdsd",
              showSectionHeaders: false,
              // fields: ["name", "desc"],
            },
          },
        ]}
        // relatedTableConfigs={{
        //   equipments: {
        //     mode: "model-table",

        //     modelTableProps: {
        //       enableQuickSearch: true,
        //       selection: { enabled: true },
        //       creationForm: {
        //         formProps: {
        //           initialValues: { category: id },
        //           onlyRequired: true,
        //         },
        //         mode: "modal",
        //         triggerLabel: "Ajouter un équipement",
        //       },
        //       options: { enable_column_drag: false },
        //     },
        //   },
        //   maintenanceplans: {
        //     simple: {
        //       fields: ["code"],
        //       //   fields: ["code", "status", "created_at"],
        //       enableQuickSearch: true,
        //       rowActions: {
        //         enableEdit: true,
        //         enableDelete: true,
        //         onEdit: ({ row }) => console.log("edit maintenance plan", row),
        //         onDelete: ({ row }) =>
        //           console.log("delete maintenance plan", row),
        //       },
        //       headerActions: [
        //         {
        //           key: "refresh",
        //           label: "Rafraîchir",
        //           onClick: ({ reload }) => reload(),
        //         },
        //       ],
        //     },
        //   },
        // }}
      />
    </>
  );
}
