import type { LocationsAssetMovement } from "@/models";
import {
  ModelDynamicDetail,
  type ModelDynamicDetailHandle,
} from "@/widgets/model-details";

const detailHandle: ModelDynamicDetailHandle<LocationsAssetMovement> | null = null;
void detailHandle?.getSnapshot().data?.reason;
void detailHandle?.getSnapshot().data?.asset?.name;

const validDechargeDetail = (
  <ModelDynamicDetail<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    id="1"
    baseDetail={{
      header: {
        title: (data) => data?.reason ?? "AssetMovement",
        actions: ({ data }) =>
          data
            ? [
                {
                  render: ({ data: actionData }) => (
                    <span>{actionData?.reason ?? "-"}</span>
                  ),
                },
              ]
            : [],
      },
      layout: {
        includeFields: ["reason", "asset.name", "movementDate"],
        sections: [
          {
            id: "main",
            fields: [
              "reason",
              {
                path: "asset.name",
                label: "Asset",
                render: ({ record }) => record.asset.name,
              },
            ],
          },
        ],
        customSections: [
          {
            id: "summary",
            render: ({ data }) => <div>{data?.reason ?? "-"}</div>,
          },
        ],
      },
      actions: {
        onUpdate: ({ data }) => {
          void data?.asset?.name;
        },
        updateForm: {
          modelFormProps: {
            onlyFields: ["reason", "status"],
          },
        },
      },
    }}
    ref={null}
  />
);

void validDechargeDetail;

const invalidDetailFieldPath = (
  <ModelDynamicDetail<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    id="1"
    baseDetail={{
      layout: {
        // @ts-expect-error unknownField is not present on LocationsAssetMovement
        includeFields: ["unknownField"],
      },
    }}
  />
);

void invalidDetailFieldPath;

const invalidDetailRenderAccess = (
  <ModelDynamicDetail<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    id="1"
    baseDetail={{
      layout: {
        sections: [
          {
            id: "invalid-render",
            fields: [
              {
                path: "reason",
                // @ts-expect-error missingField does not exist on LocationsAssetMovement
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
  <ModelDynamicDetail<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    id="1"
    baseDetail={{
      actions: {
        updateForm: {
          modelFormProps: {
            // @ts-expect-error update form overrides must use LocationsAssetMovement form fields
            onlyFields: ["missingField"],
          },
        },
      },
    }}
  />
);

void invalidUpdateFormField;
