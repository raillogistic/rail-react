export function parseJsonValue(value: unknown): unknown {
 if (typeof value !== "string") {
 return value;
 }

 const trimmed = value.trim();
 if (!trimmed) {
 return value;
 }

 try {
 return JSON.parse(trimmed);
 } catch {
 return value;
 }
}

export function asRecord(
 value: unknown,
): Record<string, unknown> | undefined {
 const parsed = parseJsonValue(value);
 if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
 return undefined;
 }
 return parsed as Record<string, unknown>;
}

export function toGraphQLJSONString(value: unknown): string | undefined {
 if (value === undefined) {
 return undefined;
 }
 if (typeof value === "string") {
 return value;
 }
 try {
 return JSON.stringify(value);
 } catch {
 return String(value);
 }
}

export type RuntimeOverrideInputShape = {
 path: string;
 action?: string;
 value?: unknown;
};

export function serializeRuntimeOverridesForQuery(
 runtimeOverrides: RuntimeOverrideInputShape[] = [],
) {
 return runtimeOverrides.map((override) => {
 const serializedValue = toGraphQLJSONString(override.value);
 if (serializedValue === undefined) {
 return {
 path: override.path,
 ...(override.action ? { action: override.action } : {}),
 };
 }
 return {
 path: override.path,
 ...(override.action ? { action: override.action } : {}),
 value: serializedValue,
 };
 });
}
