import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import type { ModelFormContract } from "../types/generatedContract";
import type { FormSchema } from "../types/schema";
import { ModelForm } from "../components/ModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

vi.mock("../inputs/form", () => ({
  __esModule: true,
  default: ({
    schema,
    state,
    behavior,
    layout,
    actions,
    devtools,
  }: {
    schema: FormSchema<Record<string, unknown>>;
    state?: Record<string, unknown>;
    behavior?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    actions?: Record<string, unknown>;
    devtools?: Record<string, unknown>;
  }) => (
    <>
      <pre data-testid="model-form-schema">{JSON.stringify(schema)}</pre>
      <pre data-testid="model-form-config">
        {JSON.stringify({ state, behavior, layout, actions, devtools })}
      </pre>
    </>
  ),
}));

function renderWithMocks(
  ui: React.ReactElement,
  mocks: Array<Record<string, unknown>>,
) {
  return render(<MockedProvider mocks={mocks}>{ui}</MockedProvider>);
}

async function getRenderedSchema() {
  const schemaNode = await screen.findByTestId("model-form-schema");
  return JSON.parse(schemaNode.textContent ?? "{}");
}

async function getRenderedConfig() {
  const configNode = await screen.findByTestId("model-form-config");
  return JSON.parse(configNode.textContent ?? "{}");
}

describe("ModelForm", () => {
  it("renders generated schema for CREATE mode", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "CREATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContract: {
              ...sampleModelFormContract,
              appLabel: "store",
              modelName: "Product",
              mode: "CREATE",
            },
          },
        },
      },
    ];

    renderWithMocks(<ModelForm app="store" model="Product" mode="CREATE" />, mocks);

    const payload = await getRenderedSchema();
    const fieldNames = payload.sections[0].fields.map(
      (field: { name: string }) => field.name,
    );
    expect(fieldNames).toContain("name");
    expect(fieldNames).toContain("price");
  });

  it("loads initial data automatically for UPDATE mode with objectId", async () => {
    const onInitialDataLoaded = vi.fn();
    const updateContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Product",
      mode: "UPDATE",
      fields: sampleModelFormContract.fields.map((field) => ({
        ...field,
        constraints: JSON.stringify(field.constraints ?? {}) as unknown as Record<
          string,
          unknown
        >,
        ui: JSON.stringify(field.ui ?? {}) as unknown as Record<string, unknown>,
        metadata: JSON.stringify(field.metadata ?? {}) as unknown as Record<
          string,
          unknown
        >,
      })),
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "UPDATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContract: updateContract,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_INITIAL_DATA_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            objectId: "42",
            includeNested: false,
            runtimeOverrides: [],
          },
        },
        result: {
          data: {
            modelFormInitialData: {
              appLabel: "store",
              modelName: "Product",
              objectId: "42",
              values: JSON.stringify({ name: "Starter", price: 10 }),
              readonlyValues: null,
              loadedAt: "2026-02-12T12:00:00Z",
            },
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Product"
        mode="UPDATE"
        objectId="42"
        onInitialDataLoaded={onInitialDataLoaded}
      />,
      mocks,
    );

    await waitFor(() => {
      expect(onInitialDataLoaded).toHaveBeenCalledTimes(1);
    });

    const payload = await getRenderedSchema();
    expect(payload.initialValues.name).toBe("Starter");
    expect(payload.initialValues.price).toBe(10);
  });

  it("serializes runtime override values as JSONString variables", async () => {
    const updateContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Product",
      mode: "UPDATE",
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "UPDATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContract: updateContract,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_INITIAL_DATA_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            objectId: "42",
            includeNested: false,
            runtimeOverrides: [
              {
                path: "metadata",
                action: "MERGE",
                value:
                  '{"updated_from":"StoreProductUpdateModelFormExample"}',
              },
            ],
          },
        },
        result: {
          data: {
            modelFormInitialData: {
              appLabel: "store",
              modelName: "Product",
              objectId: "42",
              values: JSON.stringify({ name: "Starter", price: 10 }),
              readonlyValues: null,
              loadedAt: "2026-02-12T12:00:00Z",
            },
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Product"
        mode="UPDATE"
        objectId="42"
        runtimeOverrides={[
          {
            path: "metadata",
            action: "MERGE",
            value: { updated_from: "StoreProductUpdateModelFormExample" },
          },
        ]}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    expect(payload.initialValues.name).toBe("Starter");
  });

  it("applies nested field controls and overrides", async () => {
    const nestedContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Order",
      fields: [
        ...sampleModelFormContract.fields,
        {
          ...sampleModelFormContract.fields[0],
          path: "customer.email",
          fieldName: "email",
          label: "Customer Email",
        },
        {
          ...sampleModelFormContract.fields[0],
          path: "customer.phone",
          fieldName: "phone",
          label: "Customer Phone",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name", "price", "customer.email", "customer.phone"],
        },
      ],
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Order",
            mode: "CREATE",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormContract: nestedContract,
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Order"
        mode="CREATE"
        nested={{
          customer: {
            onlyFields: ["email"],
            fieldOverrides: {
              email: {
                label: "Email (Nested Override)",
              },
            },
          },
        }}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    const fields = payload.sections[0].fields as Array<{ name: string; label?: string }>;

    expect(fields.some((field) => field.name === "customer.phone")).toBe(false);
    const nestedEmail = fields.find((field) => field.name === "customer.email");
    expect(nestedEmail?.label).toBe("Email (Nested Override)");
  });

  it("filters nested relations using onlyRelationships", async () => {
    const nestedContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Order",
      fields: [
        ...sampleModelFormContract.fields,
        {
          ...sampleModelFormContract.fields[0],
          path: "customer.email",
          fieldName: "email",
          label: "Customer Email",
        },
        {
          ...sampleModelFormContract.fields[0],
          path: "supplier.name",
          fieldName: "name",
          label: "Supplier Name",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name", "customer.email", "supplier.name"],
        },
      ],
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Order",
            mode: "CREATE",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormContract: nestedContract,
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Order"
        mode="CREATE"
        nestedFields={["customer", "supplier"]}
        onlyRelationships={["customer"]}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    const fields = payload.sections[0].fields as Array<{ name: string }>;
    expect(fields.some((field) => field.name === "customer.email")).toBe(true);
    expect(fields.some((field) => field.name === "supplier.name")).toBe(false);
    expect(fields.some((field) => field.name === "name")).toBe(true);
  });

  it("supports legacy aliases and view defaults", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "VIEW",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContract: {
              ...sampleModelFormContract,
              appLabel: "store",
              modelName: "Product",
              mode: "VIEW",
            },
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        appName="store"
        modelName="Product"
        mutationMode="view"
        only={["name"]}
        formProps={{
          layout: { columns: 1 },
          actions: { submitLabel: "Save" },
        }}
        showSectionHeaders={false}
        inPopup
      />,
      mocks,
    );

    const schema = await getRenderedSchema();
    const fieldNames = schema.sections[0].fields.map(
      (field: { name: string }) => field.name,
    );
    expect(fieldNames).toEqual(["name"]);

    const config = await getRenderedConfig();
    expect(config.layout?.variant).toBe("popup");
    expect(config.layout?.showSectionHeaders).toBe(false);
    expect(config.state?.readOnly).toBe(true);
    expect(config.actions?.hidden).toBe(true);
    expect(config.actions?.submitLabel).toBe("Save");
  });
});
