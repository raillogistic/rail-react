import React from "react";
import { gql } from "@apollo/client";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
 MODEL_FORM_CONTRACT_QUERY,
 MODEL_FORM_CONTRACT_PAGES_QUERY,
 MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/shared/api/graphql/legacy/modelFormContract";
import type { ModelFormContract } from "../types/generatedContract";
import type { FormSchema } from "../types/schema";
import { buildGeneratedMutationDocument } from "../mutations";
import { ModelForm } from "../components/ModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";
import {
 blockedDeleteTagsRelation,
 manyItemsRelation,
 singularCustomerRelation,
} from "./fixtures/nestedRelationPayloads";

type MockDynamicFormProps = {
 schema: FormSchema<Record<string, unknown>>;
 state?: Record<string, unknown>;
 behavior?: Record<string, unknown>;
 layout?: Record<string, unknown>;
 actions?: Record<string, unknown>;
 devtools?: Record<string, unknown>;
};

let latestDynamicFormProps: MockDynamicFormProps | null = null;

vi.mock("../inputs/form", () => ({
 __esModule: true,
 default: ({
 schema,
 state,
 behavior,
 layout,
 actions,
 devtools,
 }: MockDynamicFormProps) => {
 latestDynamicFormProps = {
 schema,
 state,
 behavior,
 layout,
 actions,
 devtools,
 };
 return (
 <>
 <pre data-testid="model-form-schema">{JSON.stringify(schema)}</pre>
 <pre data-testid="model-form-config">
 {JSON.stringify({ state, behavior, layout, actions, devtools })}
 </pre>
 </>
 );
 },
}));

function renderWithMocks(
 ui: React.ReactElement,
 mocks: readonly MockedResponse<Record<string, unknown>, Record<string, unknown>>[],
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

function createMockFormContext(initialMeta: Record<string, unknown> = {}) {
 const fieldMetaStore: Record<string, unknown> = { ...initialMeta };
 const form = {
 store: {
 getState: () => ({
 fieldMeta: fieldMetaStore,
 }),
 },
 setFieldMeta: vi.fn((name: string, updater: (prev: unknown) => unknown) => {
 fieldMetaStore[name] = updater(fieldMetaStore[name]);
 }),
 };
 return { form, fieldMetaStore };
}

describe("ModelForm", () => {
 it("rejects legacy top-level convenience props", () => {
 expect(() =>
 renderWithMocks(
 <ModelForm
 {...({
 app: "store",
 model: "Product",
 mode: "CREATE",
 inPopup: true,
 } as any)}
 />,
 [],
 ),
 ).toThrow(/Legacy props are not supported/);
 });

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

 it("reports initial-data authorization failures through onLoadError", async () => {
 const onLoadError = vi.fn();
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
 runtimeOverrides: [],
 },
 },
 error: new Error("Authentication required."),
 },
 ];

 renderWithMocks(
 <ModelForm
 app="store"
 model="Product"
 mode="UPDATE"
 objectId="42"
 onLoadError={onLoadError}
 />,
 mocks,
 );

 await waitFor(() => {
 expect(onLoadError).toHaveBeenCalled();
 });
 expect(
 onLoadError.mock.calls.some(
 ([, stage]) => stage === "initialData",
 ),
 ).toBe(true);
 });

 it("removes readonly and excluded values from DynamicForm defaults", async () => {
 const updateContract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "UPDATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "status",
 path: "status",
 fieldName: "status",
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "createdAt",
 path: "created_at",
 fieldName: "created_at",
 label: "Created at",
 readOnly: true,
 hidden: false,
 kind: "DATETIME",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "updatedAt",
 path: "updated_at",
 fieldName: "updated_at",
 label: "Updated at",
 readOnly: true,
 hidden: false,
 kind: "DATETIME",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "status", "created_at", "updated_at"],
 },
 ],
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
 values: JSON.stringify({
 name: "Starter",
 status: "ACTIVE",
 createdAt: "2026-02-12T12:00:00Z",
 updatedAt: "2026-02-13T12:00:00Z",
 }),
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
 excludeFields={["status"]}
 />,
 mocks,
 );

 const config = await getRenderedConfig();
 expect(config.state?.defaultValues?.name).toBe("Starter");
 expect(config.state?.defaultValues).not.toHaveProperty("status");
 expect(config.state?.defaultValues).not.toHaveProperty("createdAt");
 expect(config.state?.defaultValues).not.toHaveProperty("updatedAt");

 const schema = await getRenderedSchema();
 expect(schema.initialValues).toEqual({ name: "Starter" });
 });

 it("renders and submits only required fields when onlyRequired is enabled", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Name",
 required: true,
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "status",
 path: "status",
 fieldName: "status",
 label: "Status",
 required: false,
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "status"],
 },
 ],
 relations: [],
 };

 const createMutationSpy = vi.fn();
 const createMutationDocument = gql(
 buildGeneratedMutationDocument("create", "createProduct", "Product", "id"),
 );

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
 modelFormContract: contract,
 },
 },
 },
 {
 request: {
 query: createMutationDocument,
 variables: {
 input: {
 name: "Widget",
 },
 },
 },
 result: () => {
 createMutationSpy();
 return {
 data: {
 createProduct: {
 ok: true,
 object: { id: "UHJvZHVjdDox" },
 errors: [],
 },
 },
 };
 },
 },
 ];

 renderWithMocks(
 <ModelForm
 app="store"
 model="Product"
 mode="CREATE"
 onlyRequired
 />,
 mocks,
 );

 const payload = await getRenderedSchema();
 const fieldNames = payload.sections[0].fields.map(
 (field: { name: string }) => field.name,
 );
 expect(fieldNames).toEqual(["name"]);

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;
 expect(typeof onSubmit).toBe("function");

 const { form } = createMockFormContext({
 name: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 name: "Widget",
 status: "ACTIVE",
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(createMutationSpy).toHaveBeenCalledTimes(1);
 });
 });

 it("omits non-editable required relation fields in onlyRequired mode", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "status",
 path: "status",
 fieldName: "status",
 label: "Status",
 kind: "TEXT",
 required: false,
 nullable: true,
 readOnly: false,
 hidden: false,
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["status", "category"],
 },
 ],
 relations: [
 {
 name: "category",
 path: "category",
 label: "Category",
 relationType: "FOREIGN_KEY",
 toMany: false,
 required: true,
 nullable: false,
 relatedAppLabel: "store",
 relatedModelName: "Category",
 readable: true,
 writable: false,
 policy: {
 path: "category",
 allowedActions: [],
 blockedActions: ["CONNECT", "SET"],
 nestedEnabled: false,
 },
 },
 ],
 };

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
 modelFormContract: contract,
 },
 },
 },
 ];

 renderWithMocks(
 <ModelForm app="store" model="Product" mode="CREATE" onlyRequired />,
 mocks,
 );

 expect(
 await screen.findByText("Aucun champ n'est disponible pour ce formulaire."),
 ).toBeInTheDocument();
 expect(screen.queryByTestId("model-form-schema")).toBeNull();
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
 name: "customer.email",
 path: "customer.email",
 fieldName: "email",
 label: "Customer Email",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "customer.phone",
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
 name: "name",
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
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Category Name",
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "description",
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
 name: "name",
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

 it("keeps relation-backed nested blocks in onlyRequired mode when nested fields are required", async () => {
 const rootContract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "status",
 path: "status",
 fieldName: "status",
 label: "Status",
 required: false,
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["status"],
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
 }) as unknown as Record<string, unknown>,
 },
 ],
 };

 const categoryContract: ModelFormContract = {
 ...sampleModelFormContract,
 id: "store.Category.CREATE",
 appLabel: "store",
 modelName: "Category",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Category Name",
 required: true,
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "description",
 path: "description",
 fieldName: "description",
 label: "Category Description",
 required: false,
 readOnly: false,
 hidden: false,
 kind: "TEXTAREA",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "description"],
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
 models: [{ appLabel: "store", modelName: "Category" }],
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
 results: [categoryContract],
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
 nested={["category"]}
 onlyRequired
 />,
 mocks,
 );

 const payload = await getRenderedSchema();
 const fields = payload.sections[0].fields as Array<Record<string, unknown>>;
 const fieldNames = fields.map((field) => String(field.name ?? ""));
 expect(fieldNames).toEqual(["category"]);

 const categoryField = fields.find((field) => field.name === "category");
 expect(categoryField?.type).toBe("object");
 expect(
 (categoryField?.fields as Array<{ name: string }>).some(
 (field) => field.name === "name",
 ),
 ).toBe(true);
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
 name: "name",
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
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Tag Name",
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "order",
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
 scalarListOperation: "connect",
 removeOperation: "disconnect",
 deleteMutation: {
 enabled: true,
 operationName: "deleteTag",
 modelName: "Tag",
 idPath: "id",
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
 (tagsField?.relationOps as { scalarListOperation?: string } | undefined)
 ?.scalarListOperation,
 ).toBe("connect");
 expect(
 (tagsField?.relationOps as { removeOperation?: string } | undefined)
 ?.removeOperation,
 ).toBe("disconnect");
 expect(
 (tagsField?.deleteMutation as { operationName?: string } | undefined)
 ?.operationName,
 ).toBe("deleteTag");
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
 name: "name",
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
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Tag Name",
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "order",
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
 name: "customer.email",
 path: "customer.email",
 fieldName: "email",
 label: "Customer Email",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "supplier.name",
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
 nested={["customer", "supplier"]}
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

 it("keeps backend field order for relation-backed nested list fields", async () => {
 const rootContract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Name",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "status",
 path: "status",
 fieldName: "status",
 kind: "TEXT",
 label: "Status",
 graphqlType: "String",
 pythonType: "str",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "tags", "status"],
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
 name: "name",
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
 nested={["tags"]}
 />,
 mocks,
 );

 const payload = await getRenderedSchema();
 const fieldNames = payload.sections[0].fields.map(
 (field: { name: string }) => field.name,
 );
 expect(fieldNames).toEqual(["name", "tags", "status"]);
 });

 it("does not force nested list fields to the end when explicit order hints exist", async () => {
 const rootContract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 label: "Name",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "status",
 path: "status",
 fieldName: "status",
 kind: "TEXT",
 label: "Status",
 graphqlType: "String",
 pythonType: "str",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "tags", "status"],
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
 name: "name",
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
 nested={["tags"]}
 fieldOverrides={{
 tags: { order: 0 },
 name: { order: 1 },
 status: { order: 2 },
 }}
 />,
 mocks,
 );

 const payload = await getRenderedSchema();
 const fieldNames = payload.sections[0].fields.map(
 (field: { name: string }) => field.name,
 );
 expect(fieldNames).toEqual(["name", "tags", "status"]);
 });

 it("submits direct relation mappings through generated ModelForm behavior", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 relations: [singularCustomerRelation],
 };

 const createMutationSpy = vi.fn();
 const createMutationDocument = gql(
 buildGeneratedMutationDocument("create", "createProduct", "Product", "id"),
 );

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
 modelFormContract: contract,
 },
 },
 },
 {
 request: {
 query: createMutationDocument,
 variables: {
 input: {
 name: "Widget",
 customer: { connect: "Q3VzdG9tZXI6MQ==" },
 },
 },
 },
 result: () => {
 createMutationSpy();
 return {
 data: {
 createProduct: {
 ok: true,
 object: { id: "UHJvZHVjdDox" },
 errors: [],
 },
 },
 };
 },
 },
 ];

 renderWithMocks(
 <ModelForm app="store" model="Product" mode="CREATE" />,
 mocks,
 );

 await getRenderedSchema();

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;
 expect(typeof onSubmit).toBe("function");

 const { form } = createMockFormContext({
 customer: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 name: "Widget",
 status: "ACTIVE",
 customer: "Q3VzdG9tZXI6MQ==",
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(createMutationSpy).toHaveBeenCalledTimes(1);
 });
 });

 it("omits readonly and excluded fields from generated submit payload", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[1],
 name: "status",
 path: "status",
 fieldName: "status",
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "createdAt",
 path: "created_at",
 fieldName: "created_at",
 label: "Created at",
 readOnly: true,
 hidden: false,
 kind: "DATETIME",
 },
 {
 ...sampleModelFormContract.fields[0],
 name: "internalNote",
 path: "internal_note",
 fieldName: "internal_note",
 label: "Internal note",
 readOnly: false,
 hidden: false,
 kind: "TEXT",
 },
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["name", "status", "created_at", "internal_note"],
 },
 ],
 relations: [],
 };

 const createMutationSpy = vi.fn();
 const createMutationDocument = gql(
 buildGeneratedMutationDocument("create", "createProduct", "Product", "id"),
 );

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
 modelFormContract: contract,
 },
 },
 },
 {
 request: {
 query: createMutationDocument,
 variables: {
 input: {
 name: "Widget",
 status: "ACTIVE",
 },
 },
 },
 result: () => {
 createMutationSpy();
 return {
 data: {
 createProduct: {
 ok: true,
 object: { id: "UHJvZHVjdDox" },
 errors: [],
 },
 },
 };
 },
 },
 ];

 renderWithMocks(
 <ModelForm
 app="store"
 model="Product"
 mode="CREATE"
 excludeFields={["internalNote"]}
 />,
 mocks,
 );

 await getRenderedSchema();

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;
 expect(typeof onSubmit).toBe("function");

 const { form } = createMockFormContext({
 name: {},
 status: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 name: "Widget",
 status: "ACTIVE",
 createdAt: "2026-02-12T12:00:00Z",
 internalNote: "hidden",
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(createMutationSpy).toHaveBeenCalledTimes(1);
 });
 });

 it("submits mixed nested object lists as update/create buckets", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "UPDATE",
 relations: [manyItemsRelation],
 };

 const updateMutationSpy = vi.fn();
 const updateMutationDocument = gql(
 buildGeneratedMutationDocument("update", "updateProduct", "Product", "id", {
 identifierVariableName: "id",
 identifierArgumentName: "id",
 }),
 );

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
 modelFormContract: contract,
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
 values: JSON.stringify({ name: "Starter" }),
 readonlyValues: null,
 loadedAt: "2026-02-12T12:00:00Z",
 },
 },
 },
 },
 {
 request: {
 query: updateMutationDocument,
 variables: {
 id: "42",
 input: {
 items: {
 update: [{ id: "item-1", quantity: 5 }],
 create: [{ quantity: 2, sku: "SKU-2" }],
 },
 },
 },
 },
 result: () => {
 updateMutationSpy();
 return {
 data: {
 updateProduct: {
 ok: true,
 object: { id: "UHJvZHVjdDo0Mg==" },
 errors: [],
 },
 },
 };
 },
 },
 ];

 renderWithMocks(
 <ModelForm app="store" model="Product" mode="UPDATE" objectId="42" />,
 mocks,
 );

 await getRenderedSchema();

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;

 const { form } = createMockFormContext({
 items: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 items: [
 { id: "item-1", quantity: 5 },
 { quantity: 2, sku: "SKU-2" },
 ],
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(updateMutationSpy).toHaveBeenCalledTimes(1);
 });
 });

 it("renders relation-scoped submit errors for blocked nested actions", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "UPDATE",
 relations: [blockedDeleteTagsRelation],
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
 modelFormContract: contract,
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
 values: JSON.stringify({ name: "Starter" }),
 readonlyValues: null,
 loadedAt: "2026-02-12T12:00:00Z",
 },
 },
 },
 },
 ];

 renderWithMocks(
 <ModelForm app="store" model="Product" mode="UPDATE" objectId="42" />,
 mocks,
 );

 await getRenderedSchema();

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;

 const { form, fieldMetaStore } = createMockFormContext({
 tags: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 tags: {
 delete: ["VGFnOjE="],
 },
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(form.setFieldMeta).toHaveBeenCalled();
 });

 const tagsMeta = fieldMetaStore.tags as
 | { errorMap?: { onSubmit?: string } }
 | undefined;
 expect(tagsMeta?.errorMap?.onSubmit).toMatch(/(blocked|bloqu)/i);
 });

 it("maps unrendered submit errors to the canonical form-level key", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "CREATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "name",
 path: "name",
 fieldName: "name",
 readOnly: false,
 hidden: false,
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

 const createMutationDocument = gql(
 buildGeneratedMutationDocument("create", "createProduct", "Product", "id"),
 );

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
 modelFormContract: contract,
 },
 },
 },
 {
 request: {
 query: createMutationDocument,
 variables: {
 input: {
 name: "Widget",
 },
 },
 },
 result: {
 data: {
 createProduct: {
 ok: false,
 object: null,
 errors: [
 {
 field: "order_items",
 message: "Order items payload is invalid.",
 },
 ],
 },
 },
 },
 },
 ];

 renderWithMocks(
 <ModelForm app="store" model="Product" mode="CREATE" />,
 mocks,
 );

 await getRenderedSchema();

 const onSubmit = latestDynamicFormProps?.behavior?.onSubmit as
 | ((values: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>)
 | undefined;

 const { form, fieldMetaStore } = createMockFormContext({
 name: {},
 __all__: {},
 });

 await act(async () => {
 await onSubmit?.(
 {
 name: "Widget",
 },
 { form } as Record<string, unknown>,
 );
 });

 await waitFor(() => {
 expect(form.setFieldMeta).toHaveBeenCalled();
 });

 const calls = (form.setFieldMeta as any).mock.calls as Array<[string]>;
 expect(calls.some(([name]) => name === "__all__")).toBe(true);

 const formMeta = fieldMetaStore.__all__ as
 | { errorMap?: { onSubmit?: string } }
 | undefined;
 expect(formMeta?.errorMap?.onSubmit).toMatch(/order items/i);
 });

 it("exposes normalized mutation variables in ModelForm devtools transform", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "UPDATE",
 relations: [singularCustomerRelation, manyItemsRelation],
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
 modelFormContract: contract,
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
 values: JSON.stringify({ name: "Starter" }),
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
 devtools={{ enabled: true }}
 />,
 mocks,
 );

 await getRenderedSchema();

 const transformValues = latestDynamicFormProps?.devtools?.transformValues as
 | ((values: Record<string, unknown>) => Record<string, unknown>)
 | undefined;

 expect(typeof transformValues).toBe("function");

 const preview = transformValues?.({
 name: "Widget",
 customer: "Q3VzdG9tZXI6MQ==",
 items: [{ quantity: 2, sku: "SKU-2" }],
 });
 const previewValues = preview?.formValues as Record<string, unknown> | undefined;
 expect(previewValues?.name).toBe("Widget");
 expect(previewValues?.customer).toBe("Q3VzdG9tZXI6MQ==");
 expect(previewValues).not.toHaveProperty("mutationRequest");

 const request = preview?.mutationRequest as
 | {
 operationName?: string;
 variables?: Record<string, unknown>;
 }
 | undefined;

 expect(request?.operationName).toBe("updateProduct");
 expect(request?.variables?.id).toBe("42");
 expect(request?.variables).not.toHaveProperty("objectId");
 expect((request?.variables?.input as Record<string, unknown>)?.customer).toEqual({
 connect: "Q3VzdG9tZXI6MQ==",
 });
 expect((request?.variables?.input as Record<string, unknown>)?.items).toEqual({
 create: [{ quantity: 2, sku: "SKU-2" }],
 });
 });

 it("normalizes custom update identifier variables to backend`id`", async () => {
 const contract: ModelFormContract = {
 ...sampleModelFormContract,
 appLabel: "store",
 modelName: "Product",
 mode: "UPDATE",
 fields: [
 {
 ...sampleModelFormContract.fields[0],
 name: "sku",
 path: "sku",
 fieldName: "sku",
 label: "SKU",
 kind: "TEXT",
 required: true,
 },
 ...sampleModelFormContract.fields,
 ],
 sections: [
 {
 ...sampleModelFormContract.sections[0],
 fieldPaths: ["sku", ...sampleModelFormContract.sections[0].fieldPaths],
 },
 ],
 mutationBindings: {
 ...sampleModelFormContract.mutationBindings,
 updateIdentifierKey: "sku",
 },
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
 includeNested: false,
 },
 },
 result: {
 data: {
 modelFormContract: contract,
 },
 },
 },
 ];

 renderWithMocks(
 <ModelForm
 app="store"
 model="Product"
 mode="UPDATE"
 requireObjectIdForUpdate={false}
 devtools={{ enabled: true }}
 />,
 mocks,
 );

 await getRenderedSchema();

 const transformValues = latestDynamicFormProps?.devtools?.transformValues as
 | ((values: Record<string, unknown>) => Record<string, unknown>)
 | undefined;
 expect(typeof transformValues).toBe("function");

 const preview = transformValues?.({
 sku: "SKU-42",
 name: "Widget",
 price: "24.99",
 });

 const request = preview?.mutationRequest as
 | {
 operationName?: string;
 variables?: Record<string, unknown>;
 }
 | undefined;

 expect(request?.operationName).toBe("updateProduct");
 expect(request?.variables?.id).toBe("SKU-42");
 expect(request?.variables).not.toHaveProperty("sku");
 expect((request?.variables?.input as Record<string, unknown>)?.name).toBe(
 "Widget",
 );
 });

 it("applies view defaults with canonical props", async () => {
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
 app="store"
 model="Product"
 mode="view"
 onlyFields={["name"]}
 formProps={{
 layout: {
 columns: 1,
 showSectionHeaders: false,
 variant: "popup",
 },
 actions: { submitLabel: "Save" },
 }}
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
