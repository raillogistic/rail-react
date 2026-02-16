import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MODEL_DETAIL_CONTRACT_QUERY } from "@/lib/metadata/queries";

import { ModelDetailV2 } from "../v2";
import { buildDetailQuery } from "../v2/utils/buildDetailQuery";

const CONTRACT_VARIABLES = {
  input: {
    app: "test_app",
    model: "Product",
    objectId: "1",
  },
};

const DETAIL_QUERY = buildDetailQuery({
  modelName: "Product",
  fields: ["id", "name", "secretCode"],
});

describe("ModelDetailV2 permission matrix", () => {
  it("applies fail-closed visibility to fields and model actions", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_DETAIL_CONTRACT_QUERY,
          variables: CONTRACT_VARIABLES,
        },
        result: {
          data: {
            modelDetailContract: {
              ok: true,
              reason: null,
              contract: {
                appLabel: "test_app",
                modelName: "Product",
                queryRoot: "product",
                identifierArg: "id",
                layoutVersion: "v2",
                defaultIncludeFields: ["id", "name", "secretCode"],
                defaultExcludeFields: [],
                metadataVersion: "fixture-permissions-v1",
                permissions: {
                  modelReadable: true,
                  fieldVisibility: {
                    id: true,
                    name: true,
                    secretCode: false,
                  },
                  relationVisibility: {},
                  actionExecutability: {
                    deleteProduct: true,
                    updateProduct: false,
                  },
                  sourceFlags: {},
                  policy: "FAIL_CLOSED",
                },
                layoutNodes: [
                  {
                    id: "main",
                    type: "SECTION",
                    title: "Main",
                    order: 0,
                    relationSourceId: null,
                    visibilityRule: null,
                    fields: [
                      { name: "name", title: "Name", type: "CharField" },
                      { name: "secretCode", title: "Secret", type: "CharField" },
                    ],
                    children: [],
                    actions: [],
                  },
                ],
                relationDataSources: [],
                actions: [
                  {
                    key: "deleteProduct",
                    label: "Delete record",
                    scope: "MODEL",
                    mutationName: "deleteProduct",
                    inputTemplate: { id: "{{record.id}}" },
                    confirmationTemplate: null,
                    permissionKey: null,
                    auditEnabled: true,
                    allowed: true,
                    reason: null,
                  },
                  {
                    key: "updateProduct",
                    label: "Update record",
                    scope: "MODEL",
                    mutationName: "updateProduct",
                    inputTemplate: { id: "{{record.id}}" },
                    confirmationTemplate: null,
                    permissionKey: null,
                    auditEnabled: true,
                    allowed: true,
                    reason: null,
                  },
                ],
              },
            },
          },
        },
      },
      {
        request: {
          query: DETAIL_QUERY,
          variables: { id: "1" },
        },
        result: {
          data: {
            record: {
              __typename: "Product",
              id: "1",
              name: "Desk",
              secretCode: "S3CR3T",
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("S3CR3T")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete record" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update record" })).not.toBeInTheDocument();
  });
});
