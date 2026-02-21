import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { print } from "graphql";
import { describe, expect, it } from "vitest";
import { buildModelMutationDocument } from "../mutationBuilder";
import {
  buildModelCreateMutationVariables,
  buildModelMethodMutationVariables,
} from "../variables";
import { useModelBulkDeleteMutation } from "../hooks/useModelBulkDeleteMutation";
import { useModelCreateMutation } from "../hooks/useModelCreateMutation";
import { useModelMethodMutation } from "../hooks/useModelMethodMutation";

describe("generated graphql mutation hooks", () => {
  it("executes create mutation with default variables", async () => {
    const built = buildModelMutationDocument({
      mode: "create",
      model: "Product",
      selection: "id name",
    });
    const variables = buildModelCreateMutationVariables({
      input: { name: "Desk" },
    });

    const mocks = [
      {
        request: {
          query: built.mutationDocument,
          variables,
        },
        result: {
          data: {
            response: {
              ok: true,
              object: {
                id: "1",
                name: "Desk",
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelCreateMutation({
          model: "Product",
          selection: "id name",
          variables: {
            input: { name: "Desk" },
          },
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const response = result.current.data as {
      ok: boolean;
      object: { id: string; name: string };
    };
    expect(result.current.mutationName).toBe("createProduct");
    expect(response.ok).toBe(true);
    expect(response.object.name).toBe("Desk");
  });

  it("builds grouped-option bulk-delete mutation metadata", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelBulkDeleteMutation({
          identity: {
            app: "inventory",
            model: "Product",
          },
          selectionOptions: {
            selection: "id",
          },
          executionOptions: {
            operationName: "deleteManyProducts",
            mutationName: "bulkDeleteProduct",
          },
          variables: {
            ids: ["1", "2"],
          },
        }),
      { wrapper },
    );

    const mutationText = print(result.current.mutationDocument);
    expect(result.current.mutationName).toBe("bulkDeleteProduct");
    expect(result.current.operationName).toBe("deleteManyProducts");
    expect(mutationText).toContain("$ids: [ID!]!");
  });

  it("executes method mutation with includeInput", async () => {
    const built = buildModelMutationDocument({
      mode: "method",
      model: "ReportingDataset",
      methodName: "run_query",
      includeInput: true,
      resultSelection: "preview",
    });
    const variables = buildModelMethodMutationVariables({
      id: "42",
      input: { limit: 5 },
    });

    const mocks = [
      {
        request: {
          query: built.mutationDocument,
          variables,
        },
        result: {
          data: {
            response: {
              ok: true,
              result: {
                preview: "rows",
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelMethodMutation({
          model: "ReportingDataset",
          methodName: "run_query",
          includeInput: true,
          resultSelection: "preview",
          variables: {
            id: "42",
            input: { limit: 5 },
          },
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const response = result.current.data as {
      ok: boolean;
      result: { preview: string };
    };
    expect(result.current.mutationName).toBe("runQueryReportingDataset");
    expect(response.ok).toBe(true);
    expect(response.result.preview).toBe("rows");
  });
});
