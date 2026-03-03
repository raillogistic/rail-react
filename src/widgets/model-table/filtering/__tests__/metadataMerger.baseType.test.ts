import { describe, expect, it } from "vitest";
import { mergeFilterMetadata } from "../metadataMerger";

/**
 * Build the minimal metadata payload needed by mergeFilterMetadata.
 */
function makeMetadataPayload(overrides: {
 modelFields: any[];
 filterFields: any[];
}) {
 return {
 modelSchemaData: {
 modelSchema: {
 app: "store",
 model: "Product",
 verboseName: "Product",
 verboseNamePlural: "Products",
 fields: overrides.modelFields,
 relationships: [],
 filterConfig: {},
 relationFilters: [],
 fieldGroups: [],
 },
 },
 filterSchemaData: {
 filterSchema: overrides.filterFields,
 },
 };
}

describe("mergeFilterMetadata base type resolution", () => {
 it("keeps text fields as String even when isNull operator exposes Boolean input", () => {
 const { modelSchemaData, filterSchemaData } = makeMetadataPayload({
 modelFields: [
 {
 name: "name",
 fieldName: "name",
 graphqlType: "String",
 choices: [],
 },
 ],
 filterFields: [
 {
 name: "name",
 fieldName: "name",
 fieldLabel: "Name",
 baseType: "String",
 isNested: false,
 filterInputType: "StringFilterInput",
 options: [
 { name: "eq", label: "Equals", graphqlType: "String", isList: false },
 {
 name: "isNull",
 label: "Is null",
 graphqlType: "Boolean",
 isList: false,
 },
 ],
 },
 ],
 });

 const merged = mergeFilterMetadata(
 modelSchemaData as any,
 filterSchemaData as any,
 null,
 );

 expect(merged.fields[0]?.baseType).toBe("String");
 expect(merged.fields[0]?.uiHints.widget).toBe("text");
 });
});
