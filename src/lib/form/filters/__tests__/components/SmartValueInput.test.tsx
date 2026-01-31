import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SmartValueInput } from "../..";
import type { FilterableField, FilterOperator } from "../..";

const field: FilterableField = {
  name: "createdAt",
  fieldName: "created_at",
  fieldLabel: "Created At",
  baseType: "Date",
  graphqlType: "Date",
  filterInputType: "DateFilterInput",
  operators: [{ name: "eq", label: "Equals", graphqlType: "Date", isList: false }],
  defaultOperator: "eq",
  isRelation: false,
  uiHints: { widget: "date", datePresets: [{ key: "today", label: "Today" }] },
};

const operator: FilterOperator = { name: "eq", label: "Equals", graphqlType: "Date", isList: false };

describe("SmartValueInput", () => {
  it("renders date preset picker when presets available", () => {
    render(
      <SmartValueInput
        field={field}
        operator={operator}
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /presets/i })).toBeInTheDocument();
  });
});
