import type { ModelMetadata } from "@/lib/metadata/types";
import type {
  BuildModelQueryVariablesOptions,
  ModelListQueryVariablesInput,
  ModelPageQueryVariablesInput,
  ModelSingleQueryVariablesInput,
} from "./types";
import { toCamelCase, toGraphqlFieldName, toSnakeCase } from "./naming";

/**
 * Filters unknown input to string array.
 */
function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter(
    (entry): entry is string => typeof entry === "string",
  );
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Creates a metadata-aware orderBy normalizer.
 */
export function createOrderByNormalizer(
  metadata?: ModelMetadata | null,
): (value: string) => string | null {
  const rootCanonicalByKey = new Map<string, string>();

  /**
   * Registers all key variants for canonical root lookups.
   */
  const register = (key: string | undefined, canonical: string): void => {
    if (!key) return;
    rootCanonicalByKey.set(key, canonical);
    rootCanonicalByKey.set(toGraphqlFieldName(key), canonical);
    rootCanonicalByKey.set(toSnakeCase(key), canonical);
    rootCanonicalByKey.set(toCamelCase(key), canonical);
  };

  (metadata?.fields || []).forEach((field) => {
    const canonical = toGraphqlFieldName(field.name || field.fieldName || "");
    if (!canonical) return;
    register(field.name, canonical);
    register(field.fieldName, canonical);
    register(canonical, canonical);
  });

  (metadata?.relationships || []).forEach((relation) => {
    const canonical = toGraphqlFieldName(
      relation.name || relation.fieldName || "",
    );
    if (!canonical) return;
    register(relation.name, canonical);
    register(relation.fieldName, canonical);
    register(canonical, canonical);
  });

  return (value: string): string | null => {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const isDesc = raw.startsWith("-");
    const normalized = isDesc ? raw.slice(1) : raw;
    const separator = normalized.includes("__")
      ? "__"
      : normalized.includes(".")
        ? "."
        : null;

    const parts = separator
      ? normalized.split(separator).filter(Boolean)
      : [normalized];
    if (parts.length === 0) return null;

    const [root, ...rest] = parts;
    const canonicalRoot = rootCanonicalByKey.get(root);
    if (!canonicalRoot) return null;

    const canonicalRest = rest
      .map((entry) => toGraphqlFieldName(entry))
      .filter(Boolean);
    const rebuilt = [canonicalRoot, ...canonicalRest].join(separator ?? "__");
    if (!rebuilt) return null;
    return isDesc ? `-${rebuilt}` : rebuilt;
  };
}

/**
 * Resolves quick-search support using overrides and metadata.
 */
function resolveQuickSupport(
  metadata: ModelMetadata | null | undefined,
  options: BuildModelQueryVariablesOptions,
): boolean {
  if (typeof options.supportsQuick === "boolean") {
    return options.supportsQuick;
  }
  return Boolean(metadata?.filterConfig?.supportsQuick);
}

/**
 * Normalizes common list/page variable payload.
 */
function buildCommonVariables(
  raw:
    | ModelPageQueryVariablesInput
    | ModelListQueryVariablesInput
    | undefined,
  options: BuildModelQueryVariablesOptions,
): Record<string, unknown> {
  const orderBy = toStringArray(raw?.orderBy);
  const presets = toStringArray(raw?.presets);
  const distinctOn = toStringArray(raw?.distinctOn);
  const normalizeOrderBy = createOrderByNormalizer(options.metadata);
  const sanitizedOrderBy = orderBy
    ?.map((entry) => normalizeOrderBy(entry))
    .filter((entry): entry is string => Boolean(entry));

  const supportsQuick = resolveQuickSupport(options.metadata, options);

  return {
    ...(sanitizedOrderBy && sanitizedOrderBy.length > 0
      ? { orderBy: sanitizedOrderBy }
      : {}),
    ...(supportsQuick && raw?.quick ? { quick: raw.quick } : {}),
    ...(raw?.where ? { where: raw.where } : {}),
    ...(presets && presets.length > 0 ? { presets } : {}),
    ...(distinctOn && distinctOn.length > 0 ? { distinctOn } : {}),
    ...(raw?.extra || {}),
  };
}

/**
 * Builds normalized variables for page queries.
 */
export function buildModelPageQueryVariables(
  variables: ModelPageQueryVariablesInput | undefined,
  options: BuildModelQueryVariablesOptions = {},
): Record<string, unknown> {
  const payload = {
    page: variables?.page ?? 1,
    perPage: variables?.perPage ?? 20,
    ...buildCommonVariables(variables, options),
  } as Record<string, unknown>;

  if (typeof variables?.skipCount === "boolean") {
    payload.skipCount = variables.skipCount;
  }

  return payload;
}

/**
 * Builds normalized variables for list queries.
 */
export function buildModelListQueryVariables(
  variables: ModelListQueryVariablesInput | undefined,
  options: BuildModelQueryVariablesOptions = {},
): Record<string, unknown> {
  return buildCommonVariables(variables, options);
}

/**
 * Builds normalized variables for single queries.
 */
export function buildModelSingleQueryVariables(
  variables: ModelSingleQueryVariablesInput | undefined,
): Record<string, unknown> {
  return {
    ...(variables?.id !== undefined && variables?.id !== null
      ? { id: variables.id }
      : {}),
    ...(variables?.where ? { where: variables.where } : {}),
    ...(variables?.extra || {}),
  };
}
