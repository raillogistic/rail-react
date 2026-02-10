const LOOKUP_LABELS_FR: Record<string, string> = {
  eq: "Egal a",
  exact: "Egal a",
  iexact: "Egal a (ignore la casse)",
  neq: "Different de",
  noteq: "Different de",
  contains: "Contient",
  icontains: "Contient (ignore la casse)",
  startswith: "Commence par",
  istartswith: "Commence par (ignore la casse)",
  endswith: "Se termine par",
  iendswith: "Se termine par (ignore la casse)",
  range: "Entre",
  between: "Entre",
  in: "Parmi",
  notin: "Pas dans la liste",
  isnull: "Est vide",
  regex: "Correspond (regex)",
  iregex: "Correspond (regex insensible)",
  gt: "Superieur a",
  gte: "Superieur ou egal a",
  lt: "Inferieur a",
  lte: "Inferieur ou egal a",
  year: "Annee",
  month: "Mois",
  day: "Jour",
  weekday: "Jour de semaine",
  hour: "Heure",
  count: "Nombre egal a",
  countgt: "Nombre superieur a",
  countgte: "Nombre superieur ou egal a",
  countlt: "Nombre inferieur a",
  countlte: "Nombre inferieur ou egal a",
};

function normalizeOperatorKey(value: string): string {
  const suffix = value.includes("__") ? value.split("__").pop() || value : value;
  const snake = suffix
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  return snake.replace(/[^a-z0-9]/g, "");
}

export function translateLookupLabelFr(expr: string | undefined, fallback?: string): string {
  if (!expr) return fallback ?? "";
  const translated = LOOKUP_LABELS_FR[normalizeOperatorKey(expr)];
  if (translated) return translated;
  if (fallback && fallback.trim().length > 0) return fallback;
  return expr;
}

export function formatLookupLabelFr(expr: string | undefined, fallback?: string): string {
  if (!expr) return fallback ?? "";
  return `${translateLookupLabelFr(expr, fallback)} (${expr})`;
}

