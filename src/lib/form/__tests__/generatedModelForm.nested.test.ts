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

  it("maps singular null relation values to clear", () => {
    const payload = buildNestedMutationPayload(
      {
        customer: null,
      },
      [singularCustomerRelation],
      "UPDATE",
    );

    expect(payload.customer).toEqual({ clear: true });
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
          { id: "item-1", quantity: 5 },
          { quantity: 2, sku: "SKU-2" },
          { object_id: "item-legacy", quantity: 9 },
        ],
      },
      [manyItemsRelation],
      "UPDATE",
    );

    expect(payload.items).toEqual({
      update: [
        { id: "item-1", quantity: 5 },
        { object_id: "item-legacy", quantity: 9 },
      ],
      create: [{ quantity: 2, sku: "SKU-2" }],
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
