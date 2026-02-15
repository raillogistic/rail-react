import { describe, expect, it } from "vitest";

import {
  buildNestedMutationPayload,
  classifyRelationInputShape,
  NestedMutationPayloadError,
  resolveNestedIdentityKey,
} from "../utils/nestedMutationPayload";
import {
  blockedCreateItemsRelation,
  blockedDeleteTagsRelation,
  blockedSetTagsRelation,
  manyItemsRelation,
  manyTagsRelation,
  singularCustomerRelation,
} from "./fixtures/nestedRelationPayloads";

describe("nested mutation payload builder", () => {
  it("passes allowed nested actions through", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: { connect: ["1"], create: [{ name: "new" }] },
      },
      [manyTagsRelation],
    );

    expect(payload.tags).toEqual({ connect: ["1"], create: [{ name: "new" }] });
  });

  it("throws when blocked nested action is used", () => {
    expect(() =>
      buildNestedMutationPayload(
        { tags: { delete: ["1"] } },
        [blockedDeleteTagsRelation],
      ),
    ).toThrowError(NestedMutationPayloadError);
  });

  it("maps direct singular scalar relation values to connect", () => {
    const payload = buildNestedMutationPayload(
      {
        customer: "Q3VzdG9tZXI6MQ==",
      },
      [singularCustomerRelation],
      "CREATE",
    );

    expect(payload.customer).toEqual({ connect: "Q3VzdG9tZXI6MQ==" });
  });

  it("maps update to-many scalar list values to set", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: ["VGFnOjE=", "VGFnOjI="],
      },
      [manyTagsRelation],
      "UPDATE",
    );

    expect(payload.tags).toEqual({ set: ["VGFnOjE=", "VGFnOjI="] });
  });

  it("supports connect override for update to-many scalar list values", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: ["VGFnOjE=", "VGFnOjI="],
      },
      [manyTagsRelation],
      {
        mode: "UPDATE",
        operationOverrides: {
          tags: {
            scalarListOperation: "connect",
          },
        },
      },
    );

    expect(payload.tags).toEqual({ connect: ["VGFnOjE=", "VGFnOjI="] });
  });

  it("normalizes relation values using contract camelCase relation name", () => {
    const payload = buildNestedMutationPayload(
      {
        orderItems: [5, 8, 17, 19, 29, "1"],
      },
      [
        {
          ...manyItemsRelation,
          name: "orderItems",
          path: "order_items",
        },
      ],
      "UPDATE",
    );

    expect(payload.orderItems).toEqual({ set: [5, 8, 17, 19, 29, "1"] });
  });

  it("emits canonical relation name when legacy snake_case key is present", () => {
    const payload = buildNestedMutationPayload(
      {
        order_items: [5, 8, 17],
      },
      [
        {
          ...manyItemsRelation,
          name: "orderItems",
          path: "order_items",
        },
      ],
      "UPDATE",
    );

    expect(payload.orderItems).toEqual({ set: [5, 8, 17] });
    expect(payload).not.toHaveProperty("order_items");
  });

  it("maps singular null relation values to disconnect operation payload", () => {
    const payload = buildNestedMutationPayload(
      {
        customer: null,
      },
      [singularCustomerRelation],
      "UPDATE",
    );

    expect(payload.customer).toEqual({ disconnect: true });
  });

  it("maps to-many null relation values to set [] in update mode", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: null,
      },
      [manyTagsRelation],
      "UPDATE",
    );

    expect(payload.tags).toEqual({ set: [] });
  });

  it("treats explicit clear on singular relation as disconnect operation payload", () => {
    const payload = buildNestedMutationPayload(
      {
        customer: { clear: true },
      },
      [singularCustomerRelation],
      "UPDATE",
    );

    expect(payload.customer).toEqual({ disconnect: true });
  });

  it("treats explicit clear on to-many relation as set []", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: { clear: true },
      },
      [manyTagsRelation],
      "UPDATE",
    );

    expect(payload.tags).toEqual({ set: [] });
  });

  it("preserves non-relation fields unchanged", () => {
    const values = {
      name: "Widget",
      customer: "Q3VzdG9tZXI6MQ==",
      metadata: { source: "imported" },
    };
    const payload = buildNestedMutationPayload(values, [singularCustomerRelation], "CREATE");

    expect(payload.name).toBe("Widget");
    expect(payload.metadata).toEqual({ source: "imported" });
    expect(payload.customer).toEqual({ connect: "Q3VzdG9tZXI6MQ==" });
  });

  it("infers mixed to-many object list entries as update/create buckets", () => {
    const payload = buildNestedMutationPayload(
      {
        items: [
          { pk: "item-1", quantity: 5 },
          { quantity: 2, sku: "SKU-2" },
          { objectId: "item-legacy", quantity: 9 },
        ],
      },
      [manyItemsRelation],
      "UPDATE",
    );

    expect(payload.items).toEqual({
      update: [
        { id: "item-1", quantity: 5 },
        { id: "item-legacy", quantity: 9 },
      ],
      create: [{ quantity: 2, sku: "SKU-2" }],
    });
  });

  it("normalizes explicit nested update identities to id", () => {
    const payload = buildNestedMutationPayload(
      {
        tags: {
          update: [{ object_id: "tag-1", name: "Tag One" }, { pk: "tag-2" }],
        },
      },
      [manyTagsRelation],
      "UPDATE",
    );

    expect(payload.tags).toEqual({
      update: [{ id: "tag-1", name: "Tag One" }, { id: "tag-2" }],
    });
  });

  it("supports removed persisted rows mapped to disconnect", () => {
    const payload = buildNestedMutationPayload(
      {
        items: [{ id: "item-2", quantity: 9 }],
      },
      [manyItemsRelation],
      {
        mode: "UPDATE",
        operationOverrides: {
          items: {
            removeOperation: "disconnect",
          },
        },
        baselineValues: {
          items: [{ id: "item-1", quantity: 2 }, { id: "item-2", quantity: 7 }],
        },
      },
    );

    expect(payload.items).toEqual({
      update: [{ id: "item-2", quantity: 9 }],
      disconnect: ["item-1"],
    });
  });

  it("rejects removeOperation delete without direct deleteMutation handling", () => {
    expect(() =>
      buildNestedMutationPayload(
        {
          items: [{ id: "item-2", quantity: 9 }],
        },
        [manyItemsRelation],
        {
          mode: "UPDATE",
          operationOverrides: {
            items: {
              removeOperation: "delete",
            },
          },
          baselineValues: {
            items: [{ id: "item-1", quantity: 2 }, { id: "item-2", quantity: 7 }],
          },
        },
      ),
    ).toThrowError(/deleteMutation\.enabled/i);
  });

  it("skips removed-row nested delete payload when direct deleteMutation handles deletion", () => {
    const payload = buildNestedMutationPayload(
      {
        items: [{ id: "item-2", quantity: 9 }],
      },
      [manyItemsRelation],
      {
        mode: "UPDATE",
        operationOverrides: {
          items: {
            removeOperation: "delete",
            deleteMutationEnabled: true,
          },
        },
        baselineValues: {
          items: [{ id: "item-1", quantity: 2 }, { id: "item-2", quantity: 7 }],
        },
      },
    );

    expect(payload.items).toEqual({
      update: [{ id: "item-2", quantity: 9 }],
    });
  });

  it("fails fast with relation-scoped error when inferred action is blocked", () => {
    expect(() =>
      buildNestedMutationPayload(
        {
          items: [{ quantity: 1 }],
        },
        [blockedCreateItemsRelation],
        "UPDATE",
      ),
    ).toThrowError(/relation 'items'/i);
  });

  it("fails update scalar replacement when set action is blocked", () => {
    expect(() =>
      buildNestedMutationPayload(
        {
          tags: ["1", "2"],
        },
        [blockedSetTagsRelation],
        "UPDATE",
      ),
    ).toThrowError(/SET/);
  });

  it("resolves canonical nested identity keys", () => {
    expect(resolveNestedIdentityKey({ id: "1" })?.key).toBe("id");
    expect(resolveNestedIdentityKey({ pk: 2 })?.key).toBe("pk");
    expect(resolveNestedIdentityKey({ objectId: "3" })?.key).toBe("objectId");
    expect(resolveNestedIdentityKey({ object_id: "4" })?.key).toBe("object_id");
  });

  it("classifies explicit operation objects and inferred shapes", () => {
    expect(classifyRelationInputShape({ connect: "1" })).toBe("EXPLICIT_OPERATION");
    expect(classifyRelationInputShape({ id: "1", name: "Nested" })).toBe(
      "INFERRED_INPUT",
    );
    expect(classifyRelationInputShape(["1", "2"])).toBe("INFERRED_INPUT");
  });
});
