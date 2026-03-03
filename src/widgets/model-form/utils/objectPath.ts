export function normalizeObjectPath(path: string | null | undefined): string {
 if (!path) return "";
 return path
 .replace(/\[(\d+)\]/g, ".$1")
 .replace(/__/g, ".")
 .replace(/\.+/g, ".")
 .replace(/^\./, "")
 .replace(/\.$/, "");
}

export function getValueByPath<T = unknown>(
 source: Record<string, any> | null | undefined,
 path: string | null | undefined,
): T | undefined {
 const normalized = normalizeObjectPath(path);
 if (!normalized || !source) return undefined;
 return normalized.split(".").reduce<any>((current, segment) => {
 if (current == null) return undefined;
 if (/^\d+$/.test(segment)) {
 return Array.isArray(current) ? current[Number(segment)] : undefined;
 }
 return current?.[segment];
 }, source) as T | undefined;
}

export function setValueByPath(
 source: Record<string, any>,
 path: string,
 value: unknown,
): Record<string, any> {
 const normalized = normalizeObjectPath(path);
 if (!normalized) return source;
 const segments = normalized.split(".");
 const root = { ...(source ?? {}) };
 let cursor: any = root;

 for (let index = 0; index < segments.length - 1; index += 1) {
 const token = segments[index];
 const next = segments[index + 1];
 const asIndex = /^\d+$/.test(token) ? Number(token) : token;
 const nextIsIndex = /^\d+$/.test(next);

 if (typeof asIndex === "number") {
 if (!Array.isArray(cursor)) {
 throw new Error(`Cannot set array index on non-array path segment '${token}'.`);
 }
 if (cursor[asIndex] == null) cursor[asIndex] = nextIsIndex ? [] : {};
 cursor = cursor[asIndex];
 continue;
 }

 if (cursor[asIndex] == null || typeof cursor[asIndex] !== "object") {
 cursor[asIndex] = nextIsIndex ? [] : {};
 }
 cursor = cursor[asIndex];
 }

 const leaf = segments[segments.length - 1];
 if (/^\d+$/.test(leaf)) {
 const idx = Number(leaf);
 if (!Array.isArray(cursor)) {
 throw new Error(`Cannot set array index on non-array leaf '${leaf}'.`);
 }
 cursor[idx] = value;
 } else {
 cursor[leaf] = value;
 }
 return root;
}

export function unsetValueByPath(
 source: Record<string, any>,
 path: string,
): Record<string, any> {
 const normalized = normalizeObjectPath(path);
 if (!normalized) return source;
 const segments = normalized.split(".");
 const root = { ...(source ?? {}) };
 let cursor: any = root;
 for (let index = 0; index < segments.length - 1; index += 1) {
 const token = segments[index];
 const next = cursor?.[token];
 if (next == null || typeof next !== "object") return root;
 cursor = next;
 }
 const leaf = segments[segments.length - 1];
 if (Array.isArray(cursor) && /^\d+$/.test(leaf)) {
 cursor.splice(Number(leaf), 1);
 } else if (cursor && typeof cursor === "object") {
 delete cursor[leaf];
 }
 return root;
}

export function mergeValueByPath(
 source: Record<string, any>,
 path: string,
 value: Record<string, unknown>,
): Record<string, any> {
 const existing = getValueByPath<Record<string, unknown>>(source, path) ?? {};
 return setValueByPath(source, path, { ...existing, ...value });
}
