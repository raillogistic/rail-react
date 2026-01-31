import { describe, it, expect } from "vitest";
import { buildQueryVariables } from "../..";
import type { FilterFormState, UnifiedFilterSchema } from "../..";

const schema: UnifiedFilterSchema = {
  app: "store",
  model: "Product",
  verboseName: "Product",
  verboseNamePlural: "Products",
  config: {
    inputTypeName: "ProductWhereInput",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    supportsFts: false,
    supportsAggregation: false,
    supportsDistinct: true,
  },
  fields: [
    {
      name: "name",
      fieldName: "name",
      fieldLabel: "Name",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "text" },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

describe("Filter integration", () => {
  it("builds query variables from filter state", () => {
    const state: FilterFormState = {
      root: {
        id: "root",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Acme" },
        ],
        negated: false,
      },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    };

    const variables = buildQueryVariables({
      filterState: state.root,
      schema,
      selectedPresets: state.selectedPresets,
      distinctOn: state.distinctOn,
      orderBy: state.orderBy,
    });

    expect(variables.where).toBeDefined();
  });
});
