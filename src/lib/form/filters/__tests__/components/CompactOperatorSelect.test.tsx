import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompactOperatorSelect } from "../..";
import type { FilterableField } from "../..";

const field: FilterableField = {
  name: "name",
  fieldName: "name",
  fieldLabel: "Name",
  baseType: "String",
  graphqlType: "String",
  filterInputType: "StringFilterInput",
  operators: [
    { name: "eq", label: "Equals", graphqlType: "String", isList: false },
    { name: "contains", label: "Contains", graphqlType: "String", isList: false },
  ],
  defaultOperator: "eq",
  isRelation: false,
  uiHints: { widget: "text" },
};

describe("CompactOperatorSelect", () => {
  it("renders select trigger", () => {
    render(
      <CompactOperatorSelect
        field={field}
        value="eq"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("combobox", { name: /operator/i })).toBeInTheDocument();
  });
});
