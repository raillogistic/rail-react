import { describe, expect, it } from "vitest";

import type { ModelFormContract } from "@/lib/form/types/generatedContract";
import { sampleModelFormContract } from "@/lib/form/__tests__/fixtures/modelFormContract";
import { buildRelationModelKey } from "../queryLifecycle";
import { buildSubmitRelationsFromContracts } from "../submitRelations";

describe("buildSubmitRelationsFromContracts", () => {
  it("includes dotted child submit relations for enabled nested lists", () => {
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

    const submitRelations = buildSubmitRelationsFromContracts({
      contract: orderContract,
      nestedControls: { items: { enabled: true } },
      relatedContractsByModel,
    });

    const relationPaths = submitRelations.map((relation) => relation.path);
    expect(relationPaths).toContain("items");
    expect(relationPaths).toContain("items.product");
    expect(relationPaths).not.toContain("items.order");
  });
});
