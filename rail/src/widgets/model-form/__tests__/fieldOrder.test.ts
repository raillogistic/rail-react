import { describe, expect, it } from "vitest";
import { normalizeFieldOrder } from "../inputs/fieldOrder";
import type { FormFieldConfig } from "../types/schema";

describe("normalizeFieldOrder", () => {
 it("returns fields unchanged when no order hints", () => {
 const fields: FormFieldConfig[] = [
 { name: "a", type: "text", label: "A" },
 { name: "b", type: "text", label: "B" },
 ];
 const result = normalizeFieldOrder(fields);
 expect(result.map((f) => f.name)).toEqual(["a", "b"]);
 });

 it("sorts fields by order hint", () => {
 const fields: FormFieldConfig[] = [
 { name: "b", type: "text", label: "B", order: 2 },
 { name: "a", type: "text", label: "A", order: 1 },
 { name: "c", type: "text", label: "C", order: 0 },
 ];
 const result = normalizeFieldOrder(fields);
 expect(result.map((f) => f.name)).toEqual(["c", "a", "b"]);
 });

 it("stable sorts by name when order is equal", () => {
 const fields: FormFieldConfig[] = [
 { name: "b", type: "text", label: "B", order: 1 },
 { name: "a", type: "text", label: "A", order: 1 },
 ];
 const result = normalizeFieldOrder(fields);
 expect(result.map((f) => f.name)).toEqual(["a", "b"]);
 });

 it("handles nested object field ordering", () => {
 const fields: FormFieldConfig[] = [
 {
 name: "details",
 type: "object",
 label: "Details",
 fields: [
 { name: "z", type: "text", label: "Z", order: 2 },
 { name: "a", type: "text", label: "A", order: 1 },
 ],
 },
 ];
 const result = normalizeFieldOrder(fields);
 const nested = (result[0] as any).fields;
 expect(nested.map((f: any) => f.name)).toEqual(["a", "z"]);
 });

 it("handles empty fields array", () => {
 expect(normalizeFieldOrder([])).toEqual([]);
 });

 it("handles single field", () => {
 const fields: FormFieldConfig[] = [
 { name: "only", type: "text", label: "Only" },
 ];
 const result = normalizeFieldOrder(fields);
 expect(result.map((f) => f.name)).toEqual(["only"]);
 });

 it("applies explicit start/end rule placement", () => {
 const fields: FormFieldConfig[] = [
 { name: "name", type: "text", label: "Name" },
 { name: "status", type: "text", label: "Status" },
 { name: "notes", type: "textarea", label: "Notes" },
 { name: "payload", type: "json", label: "Payload" },
 ];

 const result = normalizeFieldOrder(fields, {
 ordering: {
 rules: [
 { field: "notes", place: "start" },
 { field: "payload", place: "end" },
 ],
 },
 });

 expect(result.map((f) => f.name)).toEqual([
 "notes",
 "name",
 "status",
 "payload",
 ]);
 });

 it("applies middle placement with before/after anchor rules", () => {
 const fields: FormFieldConfig[] = [
 { name: "name", type: "text", label: "Name" },
 { name: "status", type: "text", label: "Status" },
 { name: "category", type: "text", label: "Category" },
 { name: "notes", type: "textarea", label: "Notes" },
 ];

 const result = normalizeFieldOrder(fields, {
 ordering: {
 rules: [
 { field: "notes", place: "after", anchor: "name" },
 { field: "category", place: "before", anchor: "status" },
 ],
 },
 });

 expect(result.map((f) => f.name)).toEqual([
 "name",
 "notes",
 "category",
 "status",
 ]);
 });

 it("supports index placement and section-level rules", () => {
 const fields: FormFieldConfig[] = [
 { name: "a", type: "text", label: "A" },
 { name: "b", type: "text", label: "B" },
 { name: "c", type: "text", label: "C" },
 { name: "d", type: "text", label: "D" },
 ];

 const result = normalizeFieldOrder(fields, {
 sectionId: "main",
 ordering: {
 sectionRules: {
 main: [{ field: "d", place: "index", index: 2 }],
 },
 },
 });

 expect(result.map((f) => f.name)).toEqual(["a", "b", "d", "c"]);
 });

 it("supports partial explicit ordering list at the start", () => {
 const fields: FormFieldConfig[] = [
 { name: "name", type: "text", label: "Name" },
 { name: "status", type: "text", label: "Status" },
 { name: "price", type: "number", label: "Price" },
 { name: "sku", type: "text", label: "SKU" },
 ];

 const result = normalizeFieldOrder(fields, {
 ordering: {
 order: ["sku", "status"],
 },
 });

 expect(result.map((f) => f.name)).toEqual([
 "sku",
 "status",
 "name",
 "price",
 ]);
 });

 it("supports partial explicit tailing list from the end", () => {
 const fields: FormFieldConfig[] = [
 { name: "name", type: "text", label: "Name" },
 { name: "status", type: "text", label: "Status" },
 { name: "price", type: "number", label: "Price" },
 { name: "sku", type: "text", label: "SKU" },
 ];

 const result = normalizeFieldOrder(fields, {
 ordering: {
 tailing: ["price", "name"],
 },
 });

 expect(result.map((f) => f.name)).toEqual([
 "status",
 "sku",
 "price",
 "name",
 ]);
 });
});
