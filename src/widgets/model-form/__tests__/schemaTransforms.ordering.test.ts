import { describe, expect, it } from "vitest";
import type { FormSchema } from "../types";
import { applySchemaControls } from "../components/modelForm/schemaTransforms";

describe("applySchemaControls ordering", () => {
 it("moves textarea/json fields to the end before non-relation list fields", () => {
 const schema: FormSchema<Record<string, unknown>> = {
 sections: [
 {
 id: "main",
 fields: [
 { name: "name", type: "text", label: "Name" },
 { name: "details", type: "textarea", label: "Details" },
 { name: "status", type: "text", label: "Status" },
 { name: "payload", type: "json", label: "Payload" },
 {
 name: "items",
 type: "list",
 label: "Items",
 fields: [{ name: "value", type: "text", label: "Value" }],
 },
 ],
 },
 ],
 };

 const result = applySchemaControls(schema, {
 nestedControls: null,
 });

 expect(result.sections?.[0]?.fields.map((field) => field.name)).toEqual([
 "name",
 "status",
 "details",
 "payload",
 "items",
 ]);
 });
});
