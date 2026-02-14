import type {
  ModelFormContractRelation,
  ModelFormNestedAction,
} from "../../types/generatedContract";

function toCamelToken(token: string) {
  return token.replace(/_([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase());
}

function toCamelPath(path: string) {
  return path
    .split(".")
    .map((token) => (/^\d+$/.test(token) ? token : toCamelToken(token)))
    .join(".");
}

function buildRelation(
  path: string,
  options: {
    name?: string;
    toMany: boolean;
    allowedActions?: ModelFormNestedAction[];
    blockedActions?: ModelFormNestedAction[];
  },
): ModelFormContractRelation {
  return {
    name: options.name ?? toCamelPath(path),
    path,
    label: path,
    relationType: options.toMany ? "MANY_TO_MANY" : "FOREIGN_KEY",
    toMany: options.toMany,
    relatedAppLabel: "store",
    relatedModelName: options.toMany ? "Tag" : "Category",
    policy: {
      path,
      allowedActions:
        options.allowedActions ??
        [
          "CONNECT",
          "CREATE",
          "UPDATE",
          "DISCONNECT",
          "DELETE",
          "SET",
          "CLEAR",
        ],
      blockedActions: options.blockedActions ?? [],
      nestedEnabled: true,
    },
    nestedForm: null,
  };
}

export const singularCustomerRelation = buildRelation("customer", {
  toMany: false,
});

export const manyTagsRelation = buildRelation("tags", {
  toMany: true,
});

export const manyItemsRelation = buildRelation("items", {
  toMany: true,
});

export const blockedDeleteTagsRelation = buildRelation("tags", {
  toMany: true,
  blockedActions: ["DELETE"],
  allowedActions: ["CONNECT", "CREATE", "UPDATE", "SET", "CLEAR"],
});

export const blockedSetTagsRelation = buildRelation("tags", {
  toMany: true,
  blockedActions: ["SET"],
  allowedActions: ["CONNECT", "CREATE", "UPDATE", "CLEAR"],
});

export const blockedCreateItemsRelation = buildRelation("items", {
  toMany: true,
  blockedActions: ["CREATE"],
  allowedActions: ["CONNECT", "UPDATE", "SET", "CLEAR"],
});

export const allNestedRelationFixtures = [
  singularCustomerRelation,
  manyTagsRelation,
  manyItemsRelation,
];
