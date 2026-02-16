import type { DetailContractResult } from "../../v2/types";

export const MODEL_DETAIL_V2_CONTRACT_FIXTURE: DetailContractResult = {
  ok: true,
  reason: null,
  contract: {
    appLabel: "test_app",
    modelName: "Product",
    queryRoot: "product",
    identifierArg: "id",
    layoutVersion: "v2",
    defaultIncludeFields: ["id", "name", "price"],
    defaultExcludeFields: [],
    metadataVersion: "fixture-v1",
    permissions: {
      modelReadable: true,
      fieldVisibility: {
        id: true,
        name: true,
        price: true,
      },
      relationVisibility: {},
      actionExecutability: {},
      sourceFlags: {
        metadata: {
          fields: ["id", "name", "price"],
        },
        backend: {
          canRetrieve: true,
          canList: true,
        },
      },
      policy: "FAIL_CLOSED",
    },
    layoutNodes: [
      {
        id: "primary",
        type: "SECTION",
        title: "Product",
        order: 0,
        relationSourceId: null,
        visibilityRule: null,
        fields: [
          { name: "name", title: "Name", type: "CharField" },
          { name: "price", title: "Price", type: "DecimalField" },
        ],
        children: [],
        actions: [],
      },
    ],
    relationDataSources: [],
    actions: [],
  },
};
