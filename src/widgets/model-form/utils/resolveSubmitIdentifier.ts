import type { ModelFormMutationBindings, ModelFormMode } from "../types/generatedContract";
import { getValueByPath } from "./objectPath";

export type ResolvedSubmitIdentifier = {
  key: string;
  value: string | number;
};

export type ResolveSubmitIdentifierOptions = {
  mode: ModelFormMode;
  values: Record<string, unknown>;
  objectId?: string | number | null;
  mutationBindings?: ModelFormMutationBindings | null;
  contractIdentifierKey?: string | null;
  identifierKeyOverride?: string | null;
  defaultIdentifierKey?: string;
};

const FALLBACK_IDENTIFIER_KEY = "objectId";

function toCamelToken(token: string): string {
  return token.replace(/_([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase());
}

function toSnakeToken(token: string): string {
  return token
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function transformPathTokens(
  path: string,
  transformer: (token: string) => string,
): string {
  return path
    .split(".")
    .map((token) => (/^\d+$/.test(token) ? token : transformer(token)))
    .join(".");
}

function resolveIdentifierKey(options: ResolveSubmitIdentifierOptions): string {
  const key =
    options.contractIdentifierKey ??
    options.identifierKeyOverride ??
    options.mutationBindings?.updateIdentifierKey ??
    options.defaultIdentifierKey ??
    FALLBACK_IDENTIFIER_KEY;
  const normalized = String(key ?? "").trim();
  if (!normalized) {
    throw new Error("Impossible de résoudre la clé d'identification de mise à jour.");
  }
  return normalized;
}

function resolveIdentifierValue(
  key: string,
  values: Record<string, unknown>,
  objectId?: string | number | null,
): string | number | null {
  if (objectId !== undefined && objectId !== null && String(objectId).trim() !== "") {
    return objectId;
  }

  const direct = values[key];
  if (typeof direct === "string" || typeof direct === "number") {
    return direct;
  }

  const byPath = getValueByPath(values, key);
  if (typeof byPath === "string" || typeof byPath === "number") {
    return byPath;
  }

  const alternateKeys = Array.from(
    new Set([
      transformPathTokens(key, toCamelToken),
      transformPathTokens(key, toSnakeToken),
    ]),
  );

  for (const alternateKey of alternateKeys) {
    if (!alternateKey || alternateKey === key) continue;
    const alternateDirect = values[alternateKey];
    if (typeof alternateDirect === "string" || typeof alternateDirect === "number") {
      return alternateDirect;
    }
    const alternateByPath = getValueByPath(values, alternateKey);
    if (typeof alternateByPath === "string" || typeof alternateByPath === "number") {
      return alternateByPath;
    }
  }

  return null;
}

export function resolveSubmitIdentifier(
  options: ResolveSubmitIdentifierOptions,
): ResolvedSubmitIdentifier | null {
  if (options.mode !== "UPDATE") {
    return null;
  }

  const key = resolveIdentifierKey(options);
  const value = resolveIdentifierValue(key, options.values, options.objectId);

  if (value === null) {
    throw new Error(
      `Valeur d'identifiant de mise à jour manquante pour la clé '${key}'.`,
    );
  }

  return {
    key,
    value,
  };
}
