type WhereClause =
  | Record<string, unknown>
  | null
  | undefined
  | false;

export const ACTIVE_ONLY_WHERE = {
  isActive: { eq: true },
};

export function combineWhereClauses(
  ...clauses: WhereClause[]
): Record<string, unknown> {
  const normalized = clauses.filter(
    (clause): clause is Record<string, unknown> =>
      Boolean(clause) && Object.keys(clause).length > 0,
  );

  if (normalized.length === 0) {
    return {};
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return {
    AND: normalized,
  };
}

export function activeOnlyWhere(
  ...clauses: WhereClause[]
): Record<string, unknown> {
  return combineWhereClauses(ACTIVE_ONLY_WHERE, ...clauses);
}

export function extractScalarId(
  value: unknown,
): string | number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return extractScalarId(value[0]);
  }

  if (typeof value === "object" && "id" in (value as Record<string, unknown>)) {
    return extractScalarId((value as { id?: unknown }).id);
  }

  return undefined;
}
