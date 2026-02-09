import type { ModelSchema } from "../../types";
import { toCamelCase, toGraphqlFieldName, toSnakeCase } from "../../utils";

type FilterVariablesInput = {
  where?: unknown;
  presets?: unknown;
  distinctOn?: unknown;
  orderBy?: unknown;
} | null | undefined;

export function createOrderByNormalizer(metadata?: ModelSchema | null) {
  const rootCanonicalByKey = new Map<string, string>();
  const register = (key: string | undefined, canonical: string) => {
    if (!key) return;
    rootCanonicalByKey.set(key, canonical);
    rootCanonicalByKey.set(toGraphqlFieldName(key), canonical);
    rootCanonicalByKey.set(toSnakeCase(key), canonical);
    rootCanonicalByKey.set(toCamelCase(key), canonical);
  };

  metadata?.fields.forEach((field) => {
    const canonical = toGraphqlFieldName(field.name || field.fieldName);
    if (!canonical) return;
    register(field.name, canonical);
    register(field.fieldName, canonical);
    register(canonical, canonical);
  });

  metadata?.relationships?.forEach((relation) => {
    const canonical = toGraphqlFieldName(relation.name || relation.fieldName);
    if (!canonical) return;
    register(relation.name, canonical);
    register(relation.fieldName, canonical);
    register(canonical, canonical);
  });

  return (value: string): string | null => {
    if (!value) return null;
    const isDesc = value.startsWith("-");
    const normalized = isDesc ? value.slice(1) : value;
    const separator = normalized.includes("__")
      ? "__"
      : normalized.includes(".")
        ? "."
        : null;
    const segments = separator
      ? normalized.split(separator).filter(Boolean)
      : [normalized];
    if (segments.length === 0) return null;
    const [root, ...rest] = segments;
    const canonicalRoot = rootCanonicalByKey.get(root);
    if (!canonicalRoot) return null;
    const canonicalRest = rest.map((segment) => toGraphqlFieldName(segment));
    const rebuilt = [canonicalRoot, ...canonicalRest.filter(Boolean)].join(
      separator ?? "__",
    );
    if (!rebuilt) return null;
    return isDesc ? `-${rebuilt}` : rebuilt;
  };
}

export function buildQueryVariables(options: {
  page: number;
  perPage: number;
  debouncedQuickSearch: string;
  supportsQuick: boolean;
  filterVariables?: FilterVariablesInput;
  skipCount: boolean;
  normalizeOrderByValue: (value: string) => string | null;
}) {
  const where = options.filterVariables?.where;
  const presetsRaw = options.filterVariables?.presets;
  const distinctOnRaw = options.filterVariables?.distinctOn;
  const orderByRaw = options.filterVariables?.orderBy;

  const presets = Array.isArray(presetsRaw)
    ? presetsRaw.filter((entry): entry is string => typeof entry === "string")
    : undefined;
  const distinctOn = Array.isArray(distinctOnRaw)
    ? distinctOnRaw.filter((entry): entry is string => typeof entry === "string")
    : undefined;
  const orderBy = Array.isArray(orderByRaw)
    ? orderByRaw.filter((entry): entry is string => typeof entry === "string")
    : undefined;

  const sanitizedOrderBy = orderBy
    ?.map((entry) => options.normalizeOrderByValue(entry))
    .filter((entry): entry is string => !!entry);

  return {
    page: options.page,
    perPage: options.perPage,
    orderBy:
      sanitizedOrderBy && sanitizedOrderBy.length > 0
        ? sanitizedOrderBy
        : undefined,
    ...(options.supportsQuick
      ? { quick: options.debouncedQuickSearch || undefined }
      : {}),
    where,
    presets,
    distinctOn,
    skipCount: options.skipCount,
  };
}
