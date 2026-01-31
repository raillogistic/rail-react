import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { FieldSchema } from "./types";

// Helper to format cell value
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCellValue(value: any, field: FieldSchema) {
  if (value === null || value === undefined) return "-";

  if (field.isBoolean) {
    return value ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  }

  if (field.isDate || field.isDatetime) {
    try {
      return format(new Date(value), field.isDatetime ? "PP p" : "PP");
    } catch {
      return String(value);
    }
  }

  if (field.choices) {
    const choice = field.choices.find((c) => c.value === value);
    return choice ? choice.label : value;
  }

  if (typeof value === "object") {
    // Basic handling for relations if fetched as objects
    return value.name || value.id || JSON.stringify(value);
  }

  return String(value);
}
