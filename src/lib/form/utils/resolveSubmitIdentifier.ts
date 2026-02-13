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

function resolveIdentifierKey(options: ResolveSubmitIdentifierOptions): string {
  const key =
    options.contractIdentifierKey ??
    options.identifierKeyOverride ??
    options.mutationBindings?.updateIdentifierKey ??
    options.defaultIdentifierKey ??
    FALLBACK_IDENTIFIER_KEY;
  const normalized = String(key ?? "").trim();
  if (!normalized) {
    throw new Error("Unable to resolve update identifier key.");
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
      `Missing update identifier value for key '${key}'.`,
    );
  }

  return {
    key,
    value,
  };
}
