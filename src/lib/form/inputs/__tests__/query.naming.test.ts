import { describe, expect, it } from "vitest";
import { print } from "graphql";
import { buildGraphQLRecipe } from "../query";

describe("form query recipe naming", () => {
  it("defaults relatedModel datasource to modelList", () => {
    const recipe = buildGraphQLRecipe({ relatedModel: "ReportingDataset" });
    expect(recipe.document).toBeTruthy();
    expect(recipe.resultPath).toBe("reportingDatasetList");
    expect(print(recipe.document!)).toContain("reportingDatasetList");
  });

  it("normalizes app-qualified and snake_case relatedModel names", () => {
    const recipe = buildGraphQLRecipe({ relatedModel: "reporting.reporting_dataset" });
    expect(recipe.document).toBeTruthy();
    expect(recipe.resultPath).toBe("reportingDatasetList");
    expect(print(recipe.document!)).toContain("reportingDatasetList");
  });

  it("ignores legacy plural listFieldName and enforces modelNameList", () => {
    const recipe = buildGraphQLRecipe({
      relatedModel: "Category",
      listFieldName: "categories",
    });
    expect(recipe.document).toBeTruthy();
    expect(recipe.resultPath).toBe("categoryList");
    expect(print(recipe.document!)).toContain("categoryList");
    expect(print(recipe.document!)).not.toContain("categories");
  });
});
