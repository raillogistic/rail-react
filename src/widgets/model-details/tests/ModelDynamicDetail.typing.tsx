import type { OperationsDecharge } from "@/models";
import {
  ModelDynamicDetail,
  type ModelDynamicDetailHandle,
} from "@/widgets/model-details";

const detailHandle: ModelDynamicDetailHandle<OperationsDecharge> | null = null;
void detailHandle?.getSnapshot().data?.site;
void detailHandle?.getSnapshot().data?.beneficiaire?.nom;

const validDechargeDetail = (
  <ModelDynamicDetail<OperationsDecharge>
    app="operations"
    model="Decharge"
    id="1"
    baseDetail={{
      header: {
        title: (data) => data?.site ?? "Decharge",
        actions: ({ data }) =>
          data
            ? [
                {
                  render: ({ data: actionData }) => (
                    <span>{actionData?.site ?? "-"}</span>
                  ),
                },
              ]
            : [],
      },
      layout: {
        includeFields: ["site", "beneficiaire.nom", "dateDecharge"],
        sections: [
          {
            id: "main",
            fields: [
              "site",
              {
                path: "beneficiaire.nom",
                label: "Beneficiaire",
                render: ({ record }) => record.beneficiaire.nom,
              },
            ],
          },
        ],
        customSections: [
          {
            id: "summary",
            render: ({ data }) => <div>{data?.site ?? "-"}</div>,
          },
        ],
      },
      nestedFields: {
        restitutions: {
          fields: ["dateRestitution", "commentaire"],
        },
      },
      actions: {
        onUpdate: ({ data }) => {
          void data?.beneficiaire?.nom;
        },
        updateForm: {
          modelFormProps: {
            onlyFields: ["site", "commentaire"],
          },
        },
      },
    }}
    ref={null}
  />
);

void validDechargeDetail;

const invalidDetailFieldPath = (
  <ModelDynamicDetail<OperationsDecharge>
    app="operations"
    model="Decharge"
    id="1"
    baseDetail={{
      layout: {
        // @ts-expect-error unknownField is not present on OperationsDecharge
        includeFields: ["unknownField"],
      },
    }}
  />
);

void invalidDetailFieldPath;

const invalidDetailRenderAccess = (
  <ModelDynamicDetail<OperationsDecharge>
    app="operations"
    model="Decharge"
    id="1"
    baseDetail={{
      layout: {
        sections: [
          {
            id: "invalid-render",
            fields: [
              {
                path: "site",
                // @ts-expect-error missingField does not exist on OperationsDecharge
                render: ({ record }) => record.missingField,
              },
            ],
          },
        ],
      },
    }}
  />
);

void invalidDetailRenderAccess;

const invalidUpdateFormField = (
  <ModelDynamicDetail<OperationsDecharge>
    app="operations"
    model="Decharge"
    id="1"
    baseDetail={{
      actions: {
        updateForm: {
          modelFormProps: {
            // @ts-expect-error update form overrides must use OperationsDecharge form fields
            onlyFields: ["missingField"],
          },
        },
      },
    }}
  />
);

void invalidUpdateFormField;
