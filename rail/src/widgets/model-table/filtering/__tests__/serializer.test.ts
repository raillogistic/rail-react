import { describe, expect, it } from "vitest";
import { serializeFilterToGraphQL } from "../serializer";
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
 app: "store",
 model: "Order",
 verboseName: "Order",
 verboseNamePlural: "Orders",
 config: {
 inputTypeName: "OrderWhereInput",
 supportsAnd: true,
 supportsOr: true,
 supportsNot: true,
 supportsFts: false,
 supportsAggregation: false,
 supportsDistinct: false,
 },
 fields,
 relationFilters,
 presets: [],
 distinctFields: [],
 fieldGroups: [],
 };
}

function makeState(condition: FilterCondition): FilterFormState {
 return {
 root: {
 id: "root",
 type: "group",
 logic: "AND",
 negated: false,
 conditions: [condition],
 },
 selectedPresets: [],
 distinctOn: [],
 orderBy: [],
 relationFunctions: [],
 };
}

describe("serializeFilterToGraphQL", () => {
 it("handles relation path using relation name even when fieldName differs", () => {
 const nestedSchema = makeSchema([makeField("tags")]);
 const schema = makeSchema([makeField("id")], [
 {
 name: "items",
 fieldName: "order_items",
 fieldLabel: "Items",
 relationType: "REVERSE_FK",
 relatedApp: "store",
 relatedModel: "OrderItem",
 nestedFilterType: "OrderItemWhereInput",
 supportsDirectFilter: false,
 supportsSome: true,
 supportsEvery: true,
 supportsNone: true,
 supportsCount: true,
 supportsIsNull: false,
 nestedSchema,
 },
 ]);

 const state = makeState({
 id: "cond-1",
 type: "condition",
 fieldPath: ["items", "tags"],
 fieldName: "tags",
 operator: "icontains",
 value: "promo",
 });

 const result = serializeFilterToGraphQL(state.root, schema, 3);

 expect(result).toEqual({
 itemsSome: {
 tags: {
 icontains: "promo",
 },
 },
 });
 });

 it("uses nested alias key for to-one relation when available", () => {
 const nestedSchema = makeSchema([makeField("name")]);
 const schema = makeSchema(
 [
 makeField("id"),
 {
 ...makeField("categoryRel"),
 fieldName: "category_rel",
 baseType: "Relationship",
 graphqlType: "CategoryWhereInput",
 filterInputType: "CategoryWhereInput",
 isRelation: true,
 },
 ],
 [
 {
 name: "category",
 fieldName: "category",
 fieldLabel: "Category",
 relationType: "FOREIGN_KEY",
 relatedApp: "store",
 relatedModel: "Category",
 nestedFilterType: "CategoryWhereInput",
 supportsDirectFilter: true,
 supportsSome: false,
 supportsEvery: false,
 supportsNone: false,
 supportsCount: false,
 supportsIsNull: true,
 nestedSchema,
 },
 ]
 );

 const state = makeState({
 id: "cond-2",
 type: "condition",
 fieldPath: ["category", "name"],
 fieldName: "name",
 operator: "icontains",
 value: "aa",
 });

 const result = serializeFilterToGraphQL(state.root, schema, 3);

 expect(result).toEqual({
 categoryRel: {
 name: {
 icontains: "aa",
 },
 },
 });
 });
});
