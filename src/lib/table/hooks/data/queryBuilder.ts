import { gql } from "@apollo/client";
import type {
  BaseModelTableField,
  BaseModelTableFieldsInput,
  BaseModelTableRelationConfig,
  FieldSchema,
  FilterConfig,
  RelationshipSchema,
} from "../../types";
import {
  buildModelQueryField,
  getSyntheticRelationCountSource,
  mergeBaseModelTableFields,
  normalizeBaseModelTableFieldsInput,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../../utils";

export type TableDataConfig = {
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  queryManager?: string;
  skipCount?: boolean;
  dataMode?: "pagination" | "infinite";
  visibleAccessors?: string[];
  requiredAccessors?: string[];
};

export function buildDynamicQuery(
  _app: string,
  model: string,
  fields: FieldSchema[],
  relationships: RelationshipSchema[] | undefined,
  filterConfig?: FilterConfig,
  fieldConfig?: TableDataConfig,
) {
  const queryName = buildModelQueryField(
    model,
    "page",
    fieldConfig?.queryManager,
  );

  const relationLookup = new Map<string, RelationshipSchema>();
  const relationCanonicalByKey = new Map<string, string>();
  const relationByCanonical = new Map<string, RelationshipSchema>();
  relationships?.forEach((relation) => {
    const canonicalName = toGraphqlFieldName(
      relation.name || relation.fieldName,
    );
    if (!canonicalName) return;
    relationByCanonical.set(canonicalName, relation);
    [
      relation.name,
      relation.fieldName,
      canonicalName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => {
        relationLookup.set(entry, relation);
        relationCanonicalByKey.set(entry, canonicalName);
      });
  });

  const fieldCanonicalByKey = new Map<string, string>();
  fields.forEach((field) => {
    const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
    if (!canonicalName) return;
    [
      field.name,
      field.fieldName,
      canonicalName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => fieldCanonicalByKey.set(entry, canonicalName));
  });

  const canonicalizeRoot = (root: string) =>
    relationCanonicalByKey.get(root) ??
    fieldCanonicalByKey.get(root) ??
    toGraphqlFieldName(root);

  const canonicalizeAccessor = (accessor: string) => {
    const parts = accessor.replace(/__/g, ".").split(".").filter(Boolean);
    if (parts.length === 0) return "";
    const [root, ...rest] = parts;
    const normalizedRoot = canonicalizeRoot(root);
    if (!normalizedRoot) return "";
    const normalizedRest = rest.map((segment) => toGraphqlFieldName(segment));
    return [normalizedRoot, ...normalizedRest.filter(Boolean)].join(".");
  };

  const relationCountSourceLookup = new Map<string, string>();
  fields.forEach((field) => {
    const source = getSyntheticRelationCountSource(field);
    if (!source) return;
    const canonicalSource =
      relationCanonicalByKey.get(source) ?? toGraphqlFieldName(source);
    if (!canonicalSource) return;
    [
      field.name,
      field.fieldName,
      toGraphqlFieldName(field.name || field.fieldName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => relationCountSourceLookup.set(entry, canonicalSource));
  });

  const relationConfig = fieldConfig?.relations ?? {};
  const normalizedFieldsConfig = normalizeBaseModelTableFieldsInput(
    fieldConfig?.fields,
  );
  const excludedAccessors = new Set<string>();
  normalizedFieldsConfig.exclude.forEach((entry) => {
    if (!entry) return;
    excludedAccessors.add(entry);
    excludedAccessors.add(toGraphqlFieldName(entry));
    excludedAccessors.add(toSnakeCase(entry));
    excludedAccessors.add(toCamelCase(entry));
    const root = entry.split(".")[0]?.split("__")[0];
    if (!root) return;
    excludedAccessors.add(root);
    excludedAccessors.add(toGraphqlFieldName(root));
    excludedAccessors.add(toSnakeCase(root));
    excludedAccessors.add(toCamelCase(root));
  });

  const resolveRelationNameForCountAccessor = (accessor: string) => {
    const explicit =
      relationCountSourceLookup.get(accessor) ??
      relationCountSourceLookup.get(canonicalizeRoot(accessor));
    if (explicit) return explicit;
    const stripped = accessor.replace(/count$/i, "");
    if (!stripped || stripped === accessor) return null;
    const candidates = new Set<string>([
      stripped,
      stripped.charAt(0).toLowerCase() + stripped.slice(1),
      stripped.charAt(0).toUpperCase() + stripped.slice(1),
      stripped
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, ""),
      stripped.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
      ),
    ]);
    for (const candidate of candidates) {
      const canonical = relationCanonicalByKey.get(candidate);
      if (canonical) return canonical;
    }
    return null;
  };

  const isRelationField = (name: string) => {
    const canonical = canonicalizeRoot(name);
    if (!canonical) return false;
    if (relationByCanonical.has(canonical)) return true;
    return fields.some((field) => {
      if (!field.isRelation) return false;
      const fieldCanonical = toGraphqlFieldName(field.name || field.fieldName);
      return fieldCanonical === canonical;
    });
  };

  const resolveRelationConfig = (
    canonicalName: string,
    relation?: RelationshipSchema,
  ) => {
    const candidates = [
      canonicalName,
      relation?.name,
      relation?.fieldName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ].filter((entry): entry is string => !!entry);
    for (const candidate of candidates) {
      if (relationConfig[candidate]) return relationConfig[candidate];
    }
    return undefined;
  };

  const defaultDisplayFields: BaseModelTableField[] = fields
    .filter((field) => field.visibility !== "hidden")
    .map((field) => toGraphqlFieldName(field.name || field.fieldName))
    .filter(Boolean);

  const resolvedIncludeFields = mergeBaseModelTableFields({
    include: normalizedFieldsConfig.include,
    defaults: defaultDisplayFields,
    add: normalizedFieldsConfig.add,
    excludedAccessors,
  });

  const normalizedVisibleAccessors = (fieldConfig?.visibleAccessors ?? [])
    .map((entry) => canonicalizeAccessor(entry))
    .filter(Boolean);
  const visibleAccessorSet =
    normalizedVisibleAccessors.length > 0
      ? new Set(normalizedVisibleAccessors)
      : null;
  const normalizedRequiredAccessors = (fieldConfig?.requiredAccessors ?? [])
    .map((entry) => canonicalizeAccessor(entry))
    .filter(Boolean);

  const resolvedQueryFields = (() => {
    const nextFields: BaseModelTableField[] = [];
    const seen = new Set<string>();

    const pushField = (entry: BaseModelTableField) => {
      const accessor = canonicalizeAccessor(
        typeof entry === "string" ? entry : entry.accessor,
      );
      if (!accessor || seen.has(accessor)) return;
      seen.add(accessor);
      if (typeof entry === "string") {
        nextFields.push(accessor);
        return;
      }
      nextFields.push({
        ...entry,
        accessor,
      });
    };

    resolvedIncludeFields.forEach((entry) => {
      if (!visibleAccessorSet) {
        pushField(entry);
        return;
      }
      const rawAccessor = typeof entry === "string" ? entry : entry.accessor;
      const accessor = canonicalizeAccessor(rawAccessor);
      if (!accessor || !visibleAccessorSet.has(accessor)) return;
      pushField(entry);
    });

    normalizedRequiredAccessors.forEach((accessor) => {
      pushField(accessor);
    });

    if (visibleAccessorSet) {
      normalizedVisibleAccessors.forEach((accessor) => {
        pushField(accessor);
      });
      if (nextFields.length === 0 && normalizedVisibleAccessors.length > 0) {
        return resolvedIncludeFields;
      }
    }

    return nextFields;
  })();

  const fieldSelection = (() => {
    interface SelectionTree {
      [key: string]: SelectionTree | true;
    }
    const tree: SelectionTree = {};

    const ensureObject = (node: SelectionTree, key: string) => {
      if (!node[key] || node[key] === true) {
        node[key] = {};
      }
      return node[key] as SelectionTree;
    };

    const addPathToTree = (node: SelectionTree, parts: string[]) => {
      const [head, ...rest] = parts;
      if (!head) return;
      if (rest.length === 0) {
        node[head] = true;
        return;
      }
      const child = ensureObject(node, head);
      addPathToTree(child, rest);
    };

    const addRelationDefaults = (relationName: string) => {
      const relation = relationLookup.get(relationName);
      const relationNode = ensureObject(tree, relationName);
      const config = relationConfig[relationName];
      const defaults = new Set<string>(config?.fields ?? []);
      defaults.add("id");
      defaults.add("desc");
      if (config?.display) {
        defaults.add(config.display);
      }
      if (
        relation?.lookupField &&
        relation.lookupField !== "id" &&
        relation.lookupField !== "__str__"
      ) {
        defaults.add(relation.lookupField);
      }
      defaults.forEach((field) => addPathToTree(relationNode, [field]));
    };

    resolvedQueryFields.forEach((entry) => {
      const rawAccessor = typeof entry === "string" ? entry : entry.accessor;
      if (!rawAccessor) return;
      const accessor = canonicalizeAccessor(rawAccessor);
      if (!accessor) return;
      const parts = accessor.split(".");
      const [root, ...rest] = parts;
      if (!root) return;

      if (rest.length === 0) {
        const countSource = resolveRelationNameForCountAccessor(root);
        if (countSource) {
          addRelationDefaults(countSource);
          return;
        }
        if (isRelationField(root)) {
          addRelationDefaults(root);
        } else {
          addPathToTree(tree, [root]);
        }
        return;
      }

      addRelationDefaults(root);
      const relationNode = ensureObject(tree, root);
      addPathToTree(relationNode, rest);
    });

    const serializeTree = (node: SelectionTree): string =>
      Object.entries(node)
        .map(([key, value]) =>
          value === true ? key : `${key} {\n        ${serializeTree(value)}\n      }`,
        )
        .join("\n      ");

    return serializeTree(tree);
  })();

  const rowPermissionsSelection = `
      rowPermissions {
        canUpdate
        canDelete
        updateReason
        deleteReason
      }`;

  const finalFieldSelection = [fieldSelection, rowPermissionsSelection]
    .map((selection) => selection?.trim())
    .filter((selection) => selection)
    .join("\n      ");

  const whereType = filterConfig?.inputTypeName || `${model}WhereInput`;
  const supportsQuick = !!filterConfig?.supportsQuick;

  return gql`
    query ${queryName}(
      $page: Int
      $perPage: Int
      $orderBy: [String]
      ${supportsQuick ? "$quick: String" : ""}
      $where: ${whereType}
      $presets: [String]
      $distinctOn: [String]
      $skipCount: Boolean
    ) {
      ${queryName}(
        page: $page
        perPage: $perPage
        orderBy: $orderBy
        ${supportsQuick ? "quick: $quick" : ""}
        where: $where
        presets: $presets
        distinctOn: $distinctOn
        skipCount: $skipCount
      ) {
        pageInfo {
          totalCount
          pageCount
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          ${finalFieldSelection}
        }
      }
    }
  `;
}
