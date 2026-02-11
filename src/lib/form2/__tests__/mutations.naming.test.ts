import { describe, expect, it } from "vitest";
import { build_method_mutation } from "../mutations";

describe("form2 method mutation naming", () => {
  it("builds methodNameModelName field names by default", () => {
    const mutation = build_method_mutation("ReportingDataset", "describe", {
      include_input: true,
    });
    expect(mutation).toContain(
      "mutation describeReportingDataset($id: ID!, $input: ReportingDatasetDescribeInput!)",
    );
    expect(mutation).toContain(
      "response: describeReportingDataset(id: $id, input: $input)",
    );
  });

  it("normalizes snake_case methods to camelCase", () => {
    const mutation = build_method_mutation("ReportingDataset", "run_query", {
      include_input: true,
    });
    expect(mutation).toContain(
      "mutation runQueryReportingDataset($id: ID!, $input: ReportingDatasetRunQueryInput!)",
    );
    expect(mutation).toContain(
      "response: runQueryReportingDataset(id: $id, input: $input)",
    );
  });

  it("keeps custom field_name override", () => {
    const mutation = build_method_mutation("ReportingDataset", "describe", {
      field_name: "customMutationField",
    });
    expect(mutation).toContain("mutation customMutationField($id: ID!)");
    expect(mutation).toContain("response: customMutationField(id: $id)");
  });
});
