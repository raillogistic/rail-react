import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_CONTRACT_PAGES_QUERY,
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

  it("materializes nested relation forms for requested relation paths", async () => {
    const updateContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Product",
      mode: "UPDATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Name",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name"],
        },
      ],
      relations: [
        {
          path: "category",
          label: "Category",
          relationType: "FOREIGN_KEY",
          toMany: false,
          relatedAppLabel: "store",
          relatedModelName: "Category",
          policy: {
            path: "category",
            allowedActions: ["CONNECT", "CREATE", "UPDATE", "SET"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: JSON.stringify({
            enabled: true,
            fields: ["name", "description"],
            layout: { columns: 2 },
          }) as unknown as Record<string, unknown>,
        },
        {
          path: "tags",
          label: "Tags",
          relationType: "MANY_TO_MANY",
          toMany: true,
          relatedAppLabel: "store",
          relatedModelName: "Tag",
          policy: {
            path: "tags",
            allowedActions: ["CONNECT", "CREATE", "UPDATE", "SET", "CLEAR"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: JSON.stringify({
            enabled: true,
            fields: ["name"],
            minItems: 0,
            maxItems: 10,
          }) as unknown as Record<string, unknown>,
        },
      ],
    };

    const categoryContract: ModelFormContract = {
      ...sampleModelFormContract,
      id: "store.Category.UPDATE",
      appLabel: "store",
      modelName: "Category",
      mode: "UPDATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Category Name",
          kind: "TEXT",
        },
        {
          ...sampleModelFormContract.fields[0],
          path: "description",
          fieldName: "description",
          label: "Category Description",
          kind: "TEXTAREA",
          required: false,
          nullable: true,
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name", "description"],
        },
      ],
      relations: [
        {
          path: "product",
          label: "Product",
          relationType: "ONE_TO_ONE",
          toMany: false,
          relatedAppLabel: "store",
          relatedModelName: "Product",
          policy: {
            path: "product",
            allowedActions: ["CONNECT", "SET"],
            blockedActions: [],
            nestedEnabled: false,
          },
          nestedForm: null,
        },
      ],
    };

    const tagContract: ModelFormContract = {
      ...sampleModelFormContract,
      id: "store.Tag.UPDATE",
      appLabel: "store",
      modelName: "Tag",
      mode: "UPDATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Tag Name",
          kind: "TEXT",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name"],
        },
      ],
      relations: [],
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "UPDATE",
            includeNested: true,
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
            includeNested: true,
            nestedFields: ["category", "tags"],
            runtimeOverrides: [],
          },
        },
        result: {
          data: {
            modelFormInitialData: {
              appLabel: "store",
              modelName: "Product",
              objectId: "42",
              values: JSON.stringify({
                name: "Starter",
                category: { id: "1", name: "Hardware", description: "Devices" },
                tags: [{ id: "2", name: "Featured" }],
              }),
              readonlyValues: null,
              loadedAt: "2026-02-12T12:00:00Z",
            },
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_CONTRACT_PAGES_QUERY,
          variables: {
            page: 1,
            perPage: 2,
            models: [
              { appLabel: "store", modelName: "Category" },
              { appLabel: "store", modelName: "Tag" },
            ],
            mode: "UPDATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContractPages: {
              page: 1,
              perPage: 2,
              total: 2,
              results: [categoryContract, tagContract],
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
        nested={["category", "tags"]}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    const fields = payload.sections[0].fields as Array<
      Record<string, unknown>
    >;
    const categoryField = fields.find((field) => field.name === "category") as
      | Record<string, unknown>
      | undefined;
    const tagsField = fields.find((field) => field.name === "tags") as
      | Record<string, unknown>
      | undefined;

    expect(categoryField?.type).toBe("object");
    expect(
      (categoryField?.fields as Array<{ name: string }>).map(
        (field) => field.name,
      ),
    ).toEqual(["name", "description"]);
    expect(
      (categoryField?.fields as Array<{ name: string }>).some(
        (field) => field.name === "product",
      ),
    ).toBe(false);

    expect(tagsField?.type).toBe("list");
    expect(
      (tagsField?.fields as Array<{ name: string }>).map(
        (field) => field.name,
      ),
    ).toEqual(["name"]);
    expect((payload.initialValues?.category as { product?: unknown })?.product).toBe(
      undefined,
    );
  });

  it("applies extended nested controls for relation forms", async () => {
    const rootContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Product",
      mode: "CREATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Name",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name"],
        },
      ],
      relations: [
        {
          path: "tags",
          label: "Tags",
          relationType: "MANY_TO_MANY",
          toMany: true,
          relatedAppLabel: "store",
          relatedModelName: "Tag",
          policy: {
            path: "tags",
            allowedActions: ["CONNECT", "CREATE", "UPDATE", "SET", "CLEAR"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: null,
        },
      ],
    };

    const tagContract: ModelFormContract = {
      ...sampleModelFormContract,
      id: "store.Tag.CREATE",
      appLabel: "store",
      modelName: "Tag",
      mode: "CREATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Tag Name",
          kind: "TEXT",
        },
        {
          ...sampleModelFormContract.fields[1],
          path: "order",
          fieldName: "order",
          label: "Order",
          kind: "NUMBER",
          required: false,
          nullable: true,
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name", "order"],
        },
      ],
      relations: [],
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "CREATE",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormContract: rootContract,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_CONTRACT_PAGES_QUERY,
          variables: {
            page: 1,
            perPage: 1,
            models: [{ appLabel: "store", modelName: "Tag" }],
            mode: "CREATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContractPages: {
              page: 1,
              perPage: 1,
              total: 1,
              results: [tagContract],
            },
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Product"
        mode="CREATE"
        nested={{
          tags: {
            title: "Tag Entries",
            addButton: { enabled: false, label: "Add Tag Row" },
            sortable: { enabled: true, orderField: "order", mode: "buttons" },
            customOrder: ["order", "name"],
            itemLabel: "Tag Row",
          },
        }}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    const fields = payload.sections[0].fields as Array<Record<string, unknown>>;
    const tagsField = fields.find((field) => field.name === "tags") as
      | Record<string, unknown>
      | undefined;

    expect(tagsField?.type).toBe("list");
    expect(tagsField?.label).toBe("Tag Entries");
    expect(tagsField?.itemLabel).toBe("Tag Row");
    expect(tagsField?.showAddButton).toBe(false);
    expect(tagsField?.addLabel).toBe("Add Tag Row");
    expect(tagsField?.sortable).toBe(true);
    expect(tagsField?.sortingMode).toBe("buttons");
    expect((tagsField?.ordering as { toField?: string } | undefined)?.toField).toBe(
      "order",
    );
    expect(
      (tagsField?.fields as Array<{ name: string }>).map((field) => field.name),
    ).toEqual(["order", "name"]);
  });

  it("applies nested sectionOverrides to related contracts", async () => {
    const rootContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Product",
      mode: "CREATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Name",
        },
      ],
      sections: [
        {
          ...sampleModelFormContract.sections[0],
          fieldPaths: ["name"],
        },
      ],
      relations: [
        {
          path: "tags",
          label: "Tags",
          relationType: "MANY_TO_MANY",
          toMany: true,
          relatedAppLabel: "store",
          relatedModelName: "Tag",
          policy: {
            path: "tags",
            allowedActions: ["CONNECT", "CREATE", "UPDATE", "SET", "CLEAR"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: null,
        },
      ],
    };

    const tagContract: ModelFormContract = {
      ...sampleModelFormContract,
      id: "store.Tag.CREATE",
      appLabel: "store",
      modelName: "Tag",
      mode: "CREATE",
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          path: "name",
          fieldName: "name",
          label: "Tag Name",
          kind: "TEXT",
        },
        {
          ...sampleModelFormContract.fields[1],
          path: "order",
          fieldName: "order",
          label: "Order",
          kind: "NUMBER",
          required: false,
          nullable: true,
        },
      ],
      sections: [
        {
          id: "main",
          title: "Main",
          description: null,
          fieldPaths: ["name"],
          order: 0,
          layout: null,
          visible: true,
        },
        {
          id: "advanced",
          title: "Advanced",
          description: null,
          fieldPaths: ["order"],
          order: 1,
          layout: null,
          visible: true,
        },
      ],
      relations: [],
    };

    const mocks = [
      {
        request: {
          query: MODEL_FORM_CONTRACT_QUERY,
          variables: {
            appLabel: "store",
            modelName: "Product",
            mode: "CREATE",
            includeNested: true,
          },
        },
        result: {
          data: {
            modelFormContract: rootContract,
          },
        },
      },
      {
        request: {
          query: MODEL_FORM_CONTRACT_PAGES_QUERY,
          variables: {
            page: 1,
            perPage: 1,
            models: [{ appLabel: "store", modelName: "Tag" }],
            mode: "CREATE",
            includeNested: false,
          },
        },
        result: {
          data: {
            modelFormContractPages: {
              page: 1,
              perPage: 1,
              total: 1,
              results: [tagContract],
            },
          },
        },
      },
    ];

    renderWithMocks(
      <ModelForm
        app="store"
        model="Product"
        mode="CREATE"
        nested={{
          tags: {
            sectionOverrides: {
              advanced: {
                ui: { card: false, accordion: true },
                visible: () => false,
              },
            },
          },
        }}
      />,
      mocks,
    );

    const payload = await getRenderedSchema();
    const fields = payload.sections[0].fields as Array<Record<string, unknown>>;
    const tagsField = fields.find((field) => field.name === "tags") as
      | Record<string, unknown>
      | undefined;

    expect(
      (tagsField?.fields as Array<{ name: string }>).map((field) => field.name),
    ).toEqual(["name"]);
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
