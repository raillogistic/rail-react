import { describe, expect, it } from "vitest";

import type { ModelFormContract } from "@/widgets/model-form/types/generatedContract";
import { sampleModelFormContract } from "@/widgets/model-form/__tests__/fixtures/modelFormContract";

import {
  buildRelationModelKey,
  expandInitialDataNestedFieldsWithRelatedContracts,
} from "../queryLifecycle";

describe("queryLifecycle nested field expansion", () => {
  it("adds child relation paths for nested initial data and skips back-references", () => {
    const orderContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "Order",
      mode: "UPDATE",
      relations: [
        {
          name: "items",
          path: "items",
          label: "Items",
          relationType: "REVERSE_FK",
          toMany: true,
          relatedAppLabel: "store",
          relatedModelName: "OrderItem",
          policy: {
            path: "items",
            allowedActions: [
              "CONNECT",
              "CREATE",
              "UPDATE",
              "DISCONNECT",
              "SET",
              "CLEAR",
            ],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: null,
        },
      ],
    };

    const orderItemContract: ModelFormContract = {
      ...sampleModelFormContract,
      appLabel: "store",
      modelName: "OrderItem",
      mode: "UPDATE",
      relations: [
        {
          name: "order",
          path: "order",
          label: "Order",
          relationType: "FOREIGN_KEY",
          toMany: false,
          relatedAppLabel: "store",
          relatedModelName: "Order",
          policy: {
            path: "order",
            allowedActions: ["CONNECT", "SET"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: null,
        },
        {
          name: "product",
          path: "product",
          label: "Product",
          relationType: "FOREIGN_KEY",
          toMany: false,
          relatedAppLabel: "store",
          relatedModelName: "Product",
          policy: {
            path: "product",
            allowedActions: ["CONNECT", "SET"],
            blockedActions: [],
            nestedEnabled: true,
          },
          nestedForm: null,
        },
      ],
    };

    const relatedContractsByModel = new Map<string, ModelFormContract>([
      [buildRelationModelKey("store", "OrderItem"), orderItemContract],
    ]);

    const expanded = expandInitialDataNestedFieldsWithRelatedContracts(
      ["items"],
      orderContract,
      { items: { enabled: true } },
      relatedContractsByModel,
    );

    expect(expanded).toEqual(expect.arrayContaining(["items", "items.product"]));
    expect(expanded).not.toContain("items.order");
  });
});
