import { describe, expect, it } from "vitest";
import { print } from "graphql";
import { buildModelMutationDocument } from "../mutationBuilder";

describe("graphql mutation document builder", () => {
  it("builds create mutation using canonical defaults", () => {
    const built = buildModelMutationDocument({
      mode: "create",
      model: "Product",
    });
    const mutationText = print(built.mutationDocument);

    expect(built.mutationName).toBe("createProduct");
    expect(built.operationName).toBe("createProduct");
    expect(mutationText).toContain("$input: CreateProductInput!");
    expect(mutationText).toContain("response: createProduct(input: $input)");
    expect(mutationText).toContain("object");
    expect(mutationText).toContain("id");
  });

  it("builds update mutation with identifier overrides", () => {
    const built = buildModelMutationDocument({
      mode: "update",
      model: "Order",
      identifierVariableName: "pk",
      identifierArgumentName: "id",
      identifierType: "UUID!",
      selection: "id status",
    });
    const mutationText = print(built.mutationDocument);

    expect(mutationText).toContain("$pk: UUID!");
    expect(mutationText).toContain("$input: UpdateOrderInput!");
    expect(mutationText).toContain("response: updateOrder(id: $pk, input: $input)");
  });

  it("builds bulk update with default bulk input type", () => {
    const built = buildModelMutationDocument({
      mode: "bulkUpdate",
      model: "Order",
      selection: "id",
    });
    const mutationText = print(built.mutationDocument);

    expect(mutationText).toContain("$inputs: [BulkUpdateInput!]!");
    expect(mutationText).toContain("response: bulkUpdateOrder(inputs: $inputs)");
  });

  it("omits object block when selection is explicitly empty", () => {
    const built = buildModelMutationDocument({
      mode: "delete",
      model: "Order",
      selection: "",
    });
    const mutationText = print(built.mutationDocument);

    expect(mutationText).not.toContain("object");
    expect(mutationText).toContain("errors");
  });

  it("builds method mutation with includeInput and result selection", () => {
    const built = buildModelMutationDocument({
      mode: "method",
      model: "ReportingDataset",
      methodName: "run_query",
      includeInput: true,
      resultSelection: "preview sql",
    });
    const mutationText = print(built.mutationDocument);

    expect(built.mutationName).toBe("runQueryReportingDataset");
    expect(mutationText).toContain(
      "$input: ReportingDatasetRunQueryInput!",
    );
    expect(mutationText).toContain("response: runQueryReportingDataset");
    expect(mutationText).toContain("result");
    expect(mutationText).toContain("preview");
  });

  it("keeps naming independent from optional app context", () => {
    const withApp = buildModelMutationDocument({
      mode: "create",
      app: "inventory",
      model: "Product",
    });
    const withoutApp = buildModelMutationDocument({
      mode: "create",
      model: "Product",
    });

    expect(withApp.mutationName).toBe(withoutApp.mutationName);
    expect(withApp.operationName).toBe(withoutApp.operationName);
  });
});
