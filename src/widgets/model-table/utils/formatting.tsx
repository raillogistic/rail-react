import { format } from "date-fns";
import { Check, X } from "lucide-react";
import type { FieldSchema } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCellValue(value: any, field: FieldSchema) {
 if (value === null || value === undefined) return "-";

 if (Array.isArray(value)) {
 if (field.isRelation) {
 const relKey = field.relationLookupField;
 const rendered = value
 .map((item) => {
 if (!item || typeof item !== "object") return item;
 if (item.desc !== undefined && item.desc !== null) return item.desc;
 if (relKey && item[relKey] !== undefined && item[relKey] !== null) {
 return item[relKey];
 }
 return item.name ?? item.id ?? JSON.stringify(item);
 })
 .filter((item) => item !== undefined && item !== null && item !== "");
 if (!rendered.length) return "-";
 return (
 <span className="inline-flex flex-wrap items-center gap-1">
 {rendered.map((item, index) => (
 <span
 key={`${String(item)}-${index}`}
 className="inline-flex items-center border border-border/60 bg-muted px-1.5 py-0 text-[11px] leading-4 text-foreground"
 >
 {String(item)}
 </span>
 ))}
 </span>
 );
 }
 return JSON.stringify(value);
 }

 if (field.isBoolean) {
 return value ? (
 <Check className="h-4 w-4 text-green-500" />
 ) : (
 <X className="h-4 w-4 text-red-500" />
 );
 }

 if (field.isDate || field.isDatetime) {
 try {
 if (typeof value === "string") {
 if (field.isDate) {
 const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
 if (dateOnly?.[1]) return dateOnly[1];
 }
 if (field.isDatetime) {
 const dateTime = value.match(/^((\d{4}-\d{2}-\d{2}))[T\s](\d{2}):(\d{2})/);
 if (dateTime) {
 return`${dateTime[1]} ${dateTime[3]}:${dateTime[4]}`;
 }
 }
 }

 return format(
 new Date(value),
 field.isDatetime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd",
 );
 } catch {
 return String(value);
 }
 }

 if (field.choices) {
 const choice = field.choices.find((c) => c.value === value);
 return choice ? choice.label : value;
 }

 if (typeof value === "object") {
 if (field.isRelation) {
 const relKey = field.relationLookupField;
 if (value.desc !== undefined && value.desc !== null) {
 return value.desc;
 }
 if (relKey && value[relKey] !== undefined && value[relKey] !== null) {
 return value[relKey];
 }
 return value.name ?? value.id ?? JSON.stringify(value);
 }
 return value.name || value.id || JSON.stringify(value);
 }

 return String(value);
}
