import { describe, expect, it } from "vitest";

import {
  buildGeneratedMutationDocument,
  resolveGeneratedMutationOperation,
} from "../mutations";

describe("generated mutation bindings", () => {
  it("selects operation names from contract metadata", () => {
    const operation = resolveGeneratedMutationOperation(
      {
        createOperation: "createProductFromContract",
      },
      "create",
      "Product",
    );
    expect(operation).toBe("createProductFromContract");
  });

  it("falls back to canonical mutation name when binding is missing", () => {
    const fallback = resolveGeneratedMutationOperation({}, "update", "Product");
    expect(fallback).toBe("updateProduct");
  });

  it("builds mutation documents with overridden operation names", () => {
    const document = buildGeneratedMutationDocument(
      "create",
      "createProductCustom",
      "Product",
      "id name",
    );
    expect(document).toContain("createProductCustom");
  });
});
