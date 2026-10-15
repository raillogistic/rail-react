export function toCamelCase(value: string): string {
 return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function toSnakeCase(value: string): string {
 return value
 .replace(/([A-Z])/g, "_$1")
 .toLowerCase()
 .replace(/^_/, "");
}

export function toGraphqlFieldName(value: string): string {
 const camel = toCamelCase(value || "");
 if (!camel) return "";
 return camel.charAt(0).toLowerCase() + camel.slice(1);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
 return !!value && typeof value === "object" && !Array.isArray(value);
}
