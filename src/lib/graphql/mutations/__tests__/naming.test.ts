import { describe, expect, it } from "vitest";
import {
  buildModelMethodMutationField,
  buildModelMutationField,
} from "../naming";

describe("graphql mutation naming", () => {
  it("builds canonical CRUD and bulk mutation names", () => {
    expect(buildModelMutationField("Product", "create")).toBe("createProduct");
    expect(buildModelMutationField("Product", "update")).toBe("updateProduct");
    expect(buildModelMutationField("Product", "delete")).toBe("deleteProduct");
    expect(buildModelMutationField("Product", "bulkCreate")).toBe(
      "bulkCreateProduct",
    );
    expect(buildModelMutationField("Product", "bulkUpdate")).toBe(
      "bulkUpdateProduct",
    );
    expect(buildModelMutationField("Product", "bulkDelete")).toBe(
      "bulkDeleteProduct",
    );
  });

  it("normalizes snake_case model and method names", () => {
    expect(buildModelMutationField("order_item", "create")).toBe(
      "createOrderItem",
    );
    expect(buildModelMethodMutationField("ReportingDataset", "run_query")).toBe(
      "runQueryReportingDataset",
    );
  });
});
