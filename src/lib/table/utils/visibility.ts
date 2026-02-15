import { toCamelCase, toSnakeCase } from "./caseConversion";

function addVisibilityCandidates(
  target: Set<string>,
  key?: string | null,
): void {
  if (!key) return;
  const trimmed = key.trim();
  if (!trimmed) return;
  target.add(trimmed);
  target.add(toCamelCase(trimmed));
  target.add(toSnakeCase(trimmed));
}

export function resolveColumnVisibility(
  columnVisibility: Record<string, boolean>,
  keys: Array<string | null | undefined>,
): boolean {
  const candidates = new Set<string>();
  keys.forEach((key) => addVisibilityCandidates(candidates, key));

  for (const candidate of candidates) {
    const value = columnVisibility[candidate];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return true;
}

