import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
 selectGeneratedSubmitOperation,
} from "../mutations";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import {
 sampleModelFormContract,
 sampleModelFormContractWithRelations,
} from "./fixtures/modelFormContract";
import {
 blockedCreateItemsRelation,
 blockedDeleteTagsRelation,
 manyItemsRelation,
 manyTagsRelation,
 singularCustomerRelation,
} from "./fixtures/nestedRelationPayloads";

describe("generated submit workflow", () => {
 it("selects submit operation from mode-driven bindings", () => {
 expect(
 selectGeneratedSubmitOperation(
 {
 createOperation: "createProductFromContract",
 updateOperation: "updateProductFromContract",
 },
 "CREATE",
 ),
 ).toBe("createProductFromContract");

 expect(
 selectGeneratedSubmitOperation(
 {
 createOperation: "createProductFromContract",
 updateOperation: "updateProductFromContract",
 },
 "UPDATE",
 ),
 ).toBe("updateProductFromContract");
 });

 it("dispatches create/update submissions and maps runtime overrides into payload", async () => {
 const createExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: sampleModelFormContract,
 submitMode: "CREATE",
 runtimeOverrides: [{ path: "price", value: 42, action: "REPLACE" }],
 executeMutation: createExecutor,
 }),
 );

 await act(async () => {
 await result.current.submit({ name: "Widget", price: 5 });
 });

 expect(createExecutor).toHaveBeenCalledTimes(1);
 expect(createExecutor).toHaveBeenCalledWith(
 "createProduct",
 { input: { name: "Widget", price: 42 } },
 expect.objectContaining({
 operationName: "createProduct",
 }),
 );

 const updateExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const updateHook = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: sampleModelFormContract,
 submitMode: "UPDATE",
 identifierKeyOverride: "sku",
 executeMutation: updateExecutor,
 }),
 );

 await act(async () => {
 await updateHook.result.current.submit({
 sku: "SKU-001",
 name: "Widget",
 price: 12,
 });
 });

 expect(updateExecutor).toHaveBeenCalledTimes(1);
 expect(updateExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 sku: "SKU-001",
 input: { sku: "SKU-001", name: "Widget", price: 12 },
 },
 expect.objectContaining({
 operationName: "updateProduct",
 identifier: { key: "sku", value: "SKU-001" },
 }),
 );
 });

 it("uses provided camelCase values without case normalization before dispatching generated mutations", async () => {
 const createExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: sampleModelFormContract,
 submitMode: "CREATE",
 executeMutation: createExecutor,
 }),
 );

 await act(async () => {
 await result.current.submit({
 costPrice: "13.74",
 createdAt: "2026-02-07T19:38:42.943382+00:00",
 metadataBlob: {
 updatedFrom: "StoreProductUpdateModelFormExample",
 },
 });
 });

 expect(createExecutor).toHaveBeenCalledTimes(1);
 expect(createExecutor).toHaveBeenCalledWith(
 "createProduct",
 {
 input: {
 costPrice: "13.74",
 createdAt: "2026-02-07T19:38:42.943382+00:00",
 metadataBlob: {
 updatedFrom: "StoreProductUpdateModelFormExample",
 },
 },
 },
 expect.objectContaining({
 operationName: "createProduct",
 }),
 );
 });

 it("resolves snake_case update identifiers from camelCase values", async () => {
 const updateExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContract,
 mutationBindings: {
 ...sampleModelFormContract.mutationBindings,
 updateIdentifierKey: "sku_code",
 },
 },
 submitMode: "UPDATE",
 executeMutation: updateExecutor,
 }),
 );

 await act(async () => {
 await result.current.submit({
 skuCode: "SKU-001",
 name: "Widget",
 });
 });

 expect(updateExecutor).toHaveBeenCalledTimes(1);
 expect(updateExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 sku_code: "SKU-001",
 input: {
 skuCode: "SKU-001",
 name: "Widget",
 },
 },
 expect.objectContaining({
 identifier: { key: "sku_code", value: "SKU-001" },
 }),
 );
 });

 it("maps direct relation values into generated submit payloads", async () => {
 const createExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const createHook = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContract,
 relations: [singularCustomerRelation],
 },
 submitMode: "CREATE",
 executeMutation: createExecutor,
 }),
 );

 await act(async () => {
 await createHook.result.current.submit({
 name: "Widget",
 customer: "Q3VzdG9tZXI6MQ==",
 });
 });

 expect(createExecutor).toHaveBeenCalledWith(
 "createProduct",
 {
 input: {
 name: "Widget",
 customer: { connect: "Q3VzdG9tZXI6MQ==" },
 },
 },
 expect.objectContaining({
 operationName: "createProduct",
 }),
 );

 const updateExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const updateHook = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [manyTagsRelation],
 },
 submitMode: "UPDATE",
 objectId: "T3JkZXI6MTA=",
 executeMutation: updateExecutor,
 }),
 );

 await act(async () => {
 await updateHook.result.current.submit({
 name: "Widget",
 tags: ["VGFnOjE=", "VGFnOjI="],
 });
 });

 expect(updateExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 objectId: "T3JkZXI6MTA=",
 input: {
 name: "Widget",
 tags: { set: ["VGFnOjE=", "VGFnOjI="] },
 },
 },
 expect.objectContaining({
 operationName: "updateProduct",
 }),
 );
 });

 it("builds mixed inferred update/create relation buckets during submit", async () => {
 const updateExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [manyItemsRelation],
 },
 submitMode: "UPDATE",
 objectId: "order-1",
 executeMutation: updateExecutor,
 }),
 );

 await act(async () => {
 await result.current.submit({
 items: [
 { id: "item-1", quantity: 5 },
 { quantity: 2, sku: "SKU-2" },
 ],
 });
 });

 expect(updateExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 objectId: "order-1",
 input: {
 items: {
 update: [{ id: "item-1", quantity: 5 }],
 create: [{ quantity: 2, sku: "SKU-2" }],
 },
 },
 },
 expect.anything(),
 );
 });

 it("applies nested operation overrides during submit payload build", async () => {
 const updateExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [manyItemsRelation],
 },
 submitMode: "UPDATE",
 objectId: "order-1",
 relationOperationOverrides: {
 items: {
 removeOperation: "disconnect",
 },
 },
 initialData: {
 appLabel: "store",
 modelName: "Product",
 objectId: "order-1",
 values: {
 items: [
 { id: "item-1", quantity: 2 },
 { id: "item-2", quantity: 1 },
 ],
 },
 readonlyValues: null,
 loadedAt: "2026-02-14T00:00:00Z",
 },
 executeMutation: updateExecutor,
 }),
 );

 await act(async () => {
 await result.current.submit({
 items: [{ id: "item-2", quantity: 9 }],
 });
 });

 expect(updateExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 objectId: "order-1",
 input: {
 items: {
 update: [{ id: "item-2", quantity: 9 }],
 disconnect: ["item-1"],
 },
 },
 },
 expect.anything(),
 );
 });

 it("fails fast with relation-scoped validation errors for blocked inferred actions", async () => {
 const executeMutation = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [blockedCreateItemsRelation],
 },
 submitMode: "UPDATE",
 objectId: "order-1",
 executeMutation,
 }),
 );

 let outcome: Awaited<ReturnType<typeof result.current.submit>> | null = null;
 await act(async () => {
 outcome = await result.current.submit({
 items: [{ quantity: 4 }],
 });
 });

 expect(executeMutation).not.toHaveBeenCalled();
 expect(outcome?.ok).toBe(false);
 expect(outcome?.errors[0]?.field).toBe("items");
 expect(outcome?.errors[0]?.source).toBe("OPERATION");
 expect(outcome?.errors[0]?.message).toMatch(/(blocked|bloqu)/i);
 });

 it("preserves explicit operation payloads and still enforces blocked explicit actions", async () => {
 const allowedExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const allowedHook = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [manyTagsRelation],
 },
 submitMode: "UPDATE",
 objectId: "order-1",
 executeMutation: allowedExecutor,
 }),
 );

 await act(async () => {
 await allowedHook.result.current.submit({
 tags: {
 connect: ["VGFnOjE="],
 create: [{ name: "Featured" }],
 },
 });
 });

 expect(allowedExecutor).toHaveBeenCalledWith(
 "updateProduct",
 {
 objectId: "order-1",
 input: {
 tags: {
 connect: ["VGFnOjE="],
 create: [{ name: "Featured" }],
 },
 },
 },
 expect.anything(),
 );

 const blockedExecutor = vi.fn().mockResolvedValue({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 const blockedHook = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: {
 ...sampleModelFormContractWithRelations,
 relations: [blockedDeleteTagsRelation],
 },
 submitMode: "UPDATE",
 objectId: "order-1",
 executeMutation: blockedExecutor,
 }),
 );

 let blockedOutcome: Awaited<ReturnType<typeof blockedHook.result.current.submit>> | null =
 null;
 await act(async () => {
 blockedOutcome = await blockedHook.result.current.submit({
 tags: {
 delete: ["VGFnOjE="],
 },
 });
 });

 expect(blockedExecutor).not.toHaveBeenCalled();
 expect(blockedOutcome?.ok).toBe(false);
 expect(blockedOutcome?.errors[0]?.field).toBe("tags");
 });
});
