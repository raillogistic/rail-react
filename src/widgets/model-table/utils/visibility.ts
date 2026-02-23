import { toCamelCase, toSnakeCase } from "./caseConversion";

/**
 * Standardizes visibility resolution by preferring camelCase internal keys.
 * Reduces casing jitter by prioritizing the most likely matches.
 */
function addVisibilityCandidates(
  target: Set<string>,
  key?: string | null,
): void {
  if (!key) return;
  const trimmed = key.trim();
  if (!trimmed) return;
  
  // Preference order: Exact -> camelCase -> snake_case
  target.add(trimmed);
  const camel = toCamelCase(trimmed);
  if (camel !== trimmed) target.add(camel);
  
  // Snake case is legacy, but kept for fallback
  const snake = toSnakeCase(trimmed);
  if (snake !== trimmed && snake !== camel) target.add(snake);
}

export function resolveColumnVisibility(
  columnVisibility: Record<string, boolean>,
  keys: Array<string | null | undefined>,
): boolean {
  if (!columnVisibility || Object.keys(columnVisibility).length === 0) return true;

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

