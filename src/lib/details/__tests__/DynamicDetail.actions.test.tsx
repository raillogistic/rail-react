import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DynamicDetail from "../v2/components/DynamicDetail";
import { buildDetailActionMutation } from "../v2/hooks/useDetailActions";
import type { DetailViewContract } from "../v2/types";

const ACTION_CONTRACT: DetailViewContract = {
  appLabel: "test_app",
  modelName: "Product",
  queryRoot: "product",
  identifierArg: "id",
  layoutVersion: "v2",
  defaultIncludeFields: ["id", "name"],
  defaultExcludeFields: [],
  metadataVersion: "fixture-actions-v1",
  permissions: {
    modelReadable: true,
    fieldVisibility: {
      id: true,
      name: true,
    },
    relationVisibility: {},
    actionExecutability: {
      deleteProduct: true,
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
      fields: [{ name: "name", title: "Name", type: "CharField" }],
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
      inputTemplate: {
        id: "{{record.id}}",
      },
      confirmationTemplate: null,
      permissionKey: null,
      auditEnabled: true,
      allowed: true,
      reason: null,
    },
  ],
};

describe("DynamicDetail action toolbar", () => {
  it("renders execution states, retry UX, and read-only notice", async () => {
    const action = ACTION_CONTRACT.actions[0];
    const mutation = buildDetailActionMutation(action, "Product");
    if (!mutation) {
      throw new Error("Failed to create action mutation");
    }
    const onRefresh = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: mutation,
              variables: { id: "1" },
            },
            result: {
              data: {
                response: {
                  ok: false,
                  errors: [{ field: "__all__", message: "Delete failed" }],
                },
              },
            },
          },
          {
            request: {
              query: mutation,
              variables: { id: "1" },
            },
            result: {
              data: {
                response: {
                  ok: true,
                  errors: [],
                },
              },
            },
          },
        ]}
      >
        <DynamicDetail
          data={{
            appName: "test_app",
            modelName: "Product",
            contract: ACTION_CONTRACT,
            record: { id: "1", name: "Desk" },
          }}
          state={{ status: "ready" }}
          behavior={{ onRefresh }}
        />
      </MockedProvider>,
    );

    expect(screen.getByTestId("detail-read-only-state")).toBeInTheDocument();
    expect(screen.getByText("Read-only detail view. Inline editing is disabled.")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Delete record" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete record" }));
    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
    const retryButton = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Delete record completed.")).toBeInTheDocument();
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });
});
