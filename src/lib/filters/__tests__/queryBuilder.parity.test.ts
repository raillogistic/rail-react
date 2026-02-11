import { describe, expect, it } from "vitest";
import {
  buildQueryVariables,
  buildQueryVariablesFromState,
} from "../queryBuilder";
import {
  getActiveFilterStats,
  migrateLegacyRelationState,
} from "../engine";
import type {
  FilterCondition,
  FilterFormState,
  FilterableField,
  RelationFilter,
  UnifiedFilterSchema,
} from "../types";

function makeField(name: string): FilterableField {
  return {
    name,
    fieldName: name,
    fieldLabel: name,
    baseType: "String",
    graphqlType: "String",
    filterInputType: "StringFilterInput",
    operators: [],
    defaultOperator: "eq",
    isRelation: false,
    uiHints: { widget: "text" },
  };
}

function makeSchema(
  fields: FilterableField[],
  relationFilters: RelationFilter[] = [],
): UnifiedFilterSchema {
  return {
    app: "core",
    model: "Invoice",
    verboseName: "Invoice",
    verboseNamePlural: "Invoices",
    config: {
      inputTypeName: "InvoiceWhereInput",
      supportsAnd: true,
      supportsOr: true,
      supportsNot: true,
      supportsFts: false,
      supportsAggregation: true,
      supportsDistinct: false,
    },
    fields,
    relationFilters,
    presets: [
      {
        id: "static_recent",
        name: "recent",
        source: "static",
        filterJson: { createdAt: { gte: "2026-01-01" } },
      },
      {
        id: "saved_high_value",
        name: "high_value",
        source: "saved",
        filterJson: { amount: { gte: 1000 } },
      },
    ],
    distinctFields: [],
    fieldGroups: [],
  };
}

function makeState(
  conditions: FilterCondition[],
  overrides: Partial<FilterFormState> = {},
): FilterFormState {
  return {
    root: {
      id: "root",
      type: "group",
      logic: "AND",
      negated: false,
      conditions,
    },
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
    relationFunctions: [],
    ...overrides,
  };
}

describe("query builder parity", () => {
  it("produces identical variables for panel and header state paths", () => {
    const schema = makeSchema([makeField("status"), makeField("amount")]);
    const state = makeState(
      [
        {
          id: "c1",
          type: "condition",
          fieldPath: ["status"],
          fieldName: "status",
          operator: "eq",
          value: "PAID",
        },
      ],
      {
        selectedPresets: ["static_recent", "saved_high_value"],
        orderBy: ["-createdAt"],
        relationFunctions: [
          {
            id: "items:count",
            relationName: "items",
            relationPath: ["items"],
            mode: "count",
            operator: "gte",
            value: 2,
          },
        ],
      },
    );

    const panelVariables = buildQueryVariables({
      filterState: state.root,
      schema,
      selectedPresets: state.selectedPresets,
      distinctOn: state.distinctOn,
      orderBy: state.orderBy,
      relationFunctions: state.relationFunctions,
      maxDepth: 3,
    });
    const headerVariables = buildQueryVariablesFromState(state, {
      schema,
      maxDepth: 3,
    });

    expect(headerVariables).toEqual(panelVariables);
  });

  it("supports nested groups and relation functions in one canonical payload", () => {
    const schema = makeSchema([makeField("status"), makeField("customer")], [
      {
        name: "items",
        fieldName: "items",
        fieldLabel: "Items",
        relationType: "REVERSE_FK",
        relatedApp: "core",
        relatedModel: "InvoiceItem",
        nestedFilterType: "InvoiceItemWhereInput",
        supportsDirectFilter: false,
        supportsSome: true,
        supportsEvery: true,
        supportsNone: true,
        supportsCount: true,
        supportsIsNull: false,
      },
    ]);

    const state = makeState(
      [
        {
          id: "grp",
          type: "group",
          logic: "OR",
          negated: false,
          conditions: [
            {
              id: "status-cond",
              type: "condition",
              fieldPath: ["status"],
              fieldName: "status",
              operator: "eq",
              value: "DRAFT",
            },
            {
              id: "customer-cond",
              type: "condition",
              fieldPath: ["customer"],
              fieldName: "customer",
              operator: "icontains",
              value: "acme",
            },
          ],
        },
      ],
      {
        relationFunctions: [
          {
            id: "items:some",
            relationName: "items",
            relationPath: ["items"],
            mode: "some",
            fieldName: "sku",
            operator: "icontains",
            value: "pro",
          },
        ],
      },
    );

    const variables = buildQueryVariablesFromState(state, {
      schema,
      maxDepth: 3,
    });

    expect(variables.where).toEqual({
      AND: [
        {
          OR: [
            { status: { eq: "DRAFT" } },
            { customer: { icontains: "acme" } },
          ],
        },
        {
          itemsSome: {
            sku: {
              icontains: "pro",
            },
          },
        },
      ],
    });
  });

  it("migrates legacy relation fragments and strips legacy keys", () => {
    const legacyVariables: Record<string, unknown> = {
      __headerRelationFilters: {
        itemsCount: {
          itemsCount: { gte: 3 },
        },
      },
      __baseWhere: {
        status: { eq: "PAID" },
      },
      where: {
        AND: [{ status: { eq: "PAID" } }, { itemsCount: { gte: 3 } }],
      },
    };

    const migration = migrateLegacyRelationState({
      state: makeState([]),
      variables: legacyVariables,
    });

    expect(migration.migrated).toBe(true);
    expect(migration.state.relationFunctions).toEqual([
      {
        id: "items:count",
        relationName: "items",
        relationPath: ["items"],
        mode: "count",
        operator: "gte",
        value: 3,
      },
    ]);
    expect(migration.variables).toEqual({
      where: {
        AND: [{ status: { eq: "PAID" } }, { itemsCount: { gte: 3 } }],
      },
    });
  });

  it("reports active filter stats from one shared selector", () => {
    const stats = getActiveFilterStats(
      makeState(
        [
          {
            id: "c1",
            type: "condition",
            fieldPath: ["status"],
            fieldName: "status",
            operator: "eq",
            value: "PAID",
          },
        ],
        {
          selectedPresets: ["recent"],
          relationFunctions: [
            {
              id: "items:count",
              relationName: "items",
              relationPath: ["items"],
              mode: "count",
              operator: "gte",
              value: 1,
            },
          ],
        },
      ),
    );

    expect(stats.activeConditionCount).toBe(1);
    expect(stats.activePresetCount).toBe(1);
    expect(stats.activeRelationFunctionCount).toBe(1);
    expect(stats.activeCount).toBe(3);
    expect(stats.hasActiveFilters).toBe(true);
  });
});
