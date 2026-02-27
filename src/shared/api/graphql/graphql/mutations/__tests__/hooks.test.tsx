import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { print } from "graphql";
import { describe, expect, it } from "vitest";
import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "../modelFormQueries";
import type { ModelFormContract } from "@/shared/api/graphql/graphql/model-form/generatedContract";
import { buildModelMutationDocument } from "../mutationBuilder";
import {
  buildModelCreateMutationVariables,
  buildModelMethodMutationVariables,
} from "../variables";
import { useModelBulkDeleteMutation } from "../hooks/useModelBulkDeleteMutation";
import { useModelCreateMutation } from "../hooks/useModelCreateMutation";
import { useModelMethodMutation } from "../hooks/useModelMethodMutation";
import { useModelUpdateMutation } from "../hooks/useModelUpdateMutation";

const contractFixture = {
  id: "inventory.Product.UPDATE",
  appLabel: "inventory",
  modelName: "Product",
  mode: "UPDATE",
  version: "1",
  configVersion: "1",
  generatedAt: "2026-02-21T00:00:00Z",
  fields: [
    {
      name: "id",
      path: "id",
      fieldName: "id",
      label: "Id",
      kind: "TEXT",
      graphqlType: "ID",
      pythonType: "str",
      required: true,
      nullable: false,
      readOnly: true,
      hidden: false,
      validators: [],
    },
    {
      name: "name",
      path: "name",
      fieldName: "name",
      label: "Name",
      kind: "TEXT",
      graphqlType: "String",
      pythonType: "str",
      required: false,
      nullable: true,
      readOnly: false,
      hidden: false,
      validators: [],
    },
  ],
  sections: [],
  relations: [],
  permissions: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canView: true,
    create: {
      allowed: true,
      requiredPermissions: [],
      requiresAuthentication: false,
      reason: null,
    },
    update: {
      allowed: true,
      requiredPermissions: [],
      requiresAuthentication: false,
      reason: null,
    },
    delete: {
      allowed: true,
      requiredPermissions: [],
      requiresAuthentication: false,
      reason: null,
    },
    view: {
      allowed: true,
      requiredPermissions: [],
      requiresAuthentication: false,
      reason: null,
    },
    fieldPermissions: [
      {
        field: "name",
        canRead: true,
        canWrite: true,
        visibility: "VISIBLE",
      },
    ],
  },
  mutationBindings: {
    createOperation: "createProductFromContract",
    updateOperation: "updateProductFromContract",
    bulkCreateOperation: "bulkCreateProductFromContract",
    bulkUpdateOperation: "bulkUpdateProductFromContract",
    updateIdentifierKey: "id",
    updateTargetPolicy: "PRIMARY_KEY_ONLY",
    bulkCommitPolicy: "ATOMIC",
    conflictPolicy: "REJECT_STALE",
  },
  errorPolicy: {
    canonicalFormErrorKey: "__all__",
    fieldPathNotation: "dot",
    bulkRowPrefixPattern: "rows[{index}]",
  },
} as const;

const initialDataFixture = {
  appLabel: "inventory",
  modelName: "Product",
  objectId: "42",
  loadedAt: "2026-02-21T00:00:00Z",
  values: {
    id: "42",
    name: "Desk",
  },
  readonlyValues: {
    id: "42",
  },
} as const;

const initialDataStringFixture = {
  appLabel: "inventory",
  modelName: "Product",
  objectId: "42",
  loadedAt: "2026-02-21T00:00:00Z",
  values: JSON.stringify({
    id: "42",
    name: "Desk",
  }),
  readonlyValues: JSON.stringify({
    id: "42",
  }),
} as const;

describe("generated graphql mutation hooks", () => {
  it("executes create mutation with execute-time variables", async () => {
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
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.execute({
        input: { name: "Desk" },
      });
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
          modelFormOptions: {
            skipModelForm: true,
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
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.execute({
        id: "42",
        input: { limit: 5 },
      });
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

  it("hydrates model-form contract and initial object for update hooks", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "inventory",
            modelName: "Product",
            mode: "UPDATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContract: contractFixture,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_INITIAL_DATA_QUERY,
          variables: {
            appLabel: "inventory",
            modelName: "Product",
            objectId: "42",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormInitialData: initialDataFixture,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelUpdateMutation({
          app: "inventory",
          model: "Product",
          modelFormOptions: {
            objectId: "42",
          },
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.formLoading).toBe(false));
    expect(result.current.mutationName).toBe("updateProductFromContract");
    expect(result.current.fields.length).toBe(2);
    expect(result.current.permissions?.canUpdate).toBe(true);
    expect(result.current.initialValues?.name).toBe("Desk");
    expect(result.current.readonlyValues?.id).toBe("42");
  });

  it("parses JSON-string initial values for update hooks", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "inventory",
            modelName: "Product",
            mode: "UPDATE",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormContract: contractFixture,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_INITIAL_DATA_QUERY,
          variables: {
            appLabel: "inventory",
            modelName: "Product",
            objectId: "42",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormInitialData: initialDataStringFixture,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelUpdateMutation({
          app: "inventory",
          model: "Product",
          modelFormOptions: {
            objectId: "42",
            includeNested: true,
          },
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.formLoading).toBe(false));
    expect(result.current.initialValues?.name).toBe("Desk");
    expect(result.current.readonlyValues?.id).toBe("42");
  });

  it("keeps default naming when contract bindings are disabled", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelUpdateMutation({
          model: "Product",
          contract: contractFixture as unknown as ModelFormContract,
          preferContractBindings: false,
        }),
      { wrapper },
    );

    expect(result.current.mutationName).toBe("updateProduct");
  });

  it("returns explicit form error when update objectId is missing", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelUpdateMutation({
          app: "inventory",
          model: "Product",
          contract: contractFixture as unknown as ModelFormContract,
        }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.initialDataError?.message).toContain("objectId"),
    );
    expect(result.current.formError?.message).toContain("objectId");
  });
});
