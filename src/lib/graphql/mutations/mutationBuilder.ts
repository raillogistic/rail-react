import { gql } from "@apollo/client";
import {
  buildModelMethodInputType,
  buildModelMethodMutationField,
  buildModelMutationField,
  buildModelMutationInputType,
} from "./naming";
import type {
  BuildModelMutationDocumentOptions,
  BuiltModelMutationDocument,
  ModelMutationMode,
} from "./types";

/**
 * Resolves identifier variable name with `id` fallback.
 */
function resolveIdentifierVariableName(
  options: BuildModelMutationDocumentOptions,
): string {
  return options.identifierVariableName?.trim() || "id";
}

/**
 * Resolves identifier argument name with variable-name fallback.
 */
function resolveIdentifierArgumentName(
  options: BuildModelMutationDocumentOptions,
): string {
  return (
    options.identifierArgumentName?.trim() ||
    resolveIdentifierVariableName(options)
  );
}

/**
 * Resolves identifier GraphQL type with `ID!` fallback.
 */
function resolveIdentifierType(
  options: BuildModelMutationDocumentOptions,
): string {
  return options.identifierType?.trim() || "ID!";
}

/**
 * Resolves selection for object/objects blocks with default `id`.
 */
function resolveObjectSelection(selection: string | undefined): string {
  if (typeof selection !== "string") return "id";
  return selection.trim();
}

/**
 * Resolves response alias with `response` fallback.
 */
function resolveResponseAlias(
  options: BuildModelMutationDocumentOptions,
): string {
  return options.responseAlias?.trim() || "response";
}

/**
 * Resolves method input type name for method mode.
 */
function resolveMethodInputTypeName(
  options: BuildModelMutationDocumentOptions,
): string {
  if (options.inputTypeName?.trim()) {
    return options.inputTypeName.trim();
  }
  return buildModelMethodInputType(options.model, options.methodName || "");
}

/**
 * Resolves root mutation field name using defaults and overrides.
 */
function resolveMutationName(
  options: BuildModelMutationDocumentOptions,
): string {
  if (options.mutationName?.trim()) {
    return options.mutationName.trim();
  }

  if (options.mode === "method") {
    if (options.methodFieldName?.trim()) {
      return options.methodFieldName.trim();
    }
    return buildModelMethodMutationField(
      options.model,
      String(options.methodName || "").trim(),
    );
  }

  return buildModelMutationField(options.model, options.mode);
}

/**
 * Resolves operation name using mutation-name fallback.
 */
function resolveOperationName(
  options: BuildModelMutationDocumentOptions,
  mutationName: string,
): string {
  return options.operationName?.trim() || mutationName;
}

/**
 * Builds default variable definitions and argument assignments for mutation mode.
 */
function buildDefaultArguments(
  options: BuildModelMutationDocumentOptions,
): {
  definitions: string[];
  assignments: string[];
} {
  const mode = options.mode;

  if (mode === "create") {
    const inputTypeName =
      options.inputTypeName?.trim() ||
      buildModelMutationInputType(options.model, "create");
    return {
      definitions: [`$input: ${inputTypeName}!`],
      assignments: [`input: $input`],
    };
  }

  if (mode === "update") {
    const inputTypeName =
      options.inputTypeName?.trim() ||
      buildModelMutationInputType(options.model, "update");
    const identifierVariableName = resolveIdentifierVariableName(options);
    const identifierArgumentName = resolveIdentifierArgumentName(options);
    const identifierType = resolveIdentifierType(options);
    return {
      definitions: [
        `$${identifierVariableName}: ${identifierType}`,
        `$input: ${inputTypeName}!`,
      ],
      assignments: [
        `${identifierArgumentName}: $${identifierVariableName}`,
        `input: $input`,
      ],
    };
  }

  if (mode === "delete") {
    const identifierVariableName = resolveIdentifierVariableName(options);
    return {
      definitions: [`$${identifierVariableName}: ID!`],
      assignments: [`id: $${identifierVariableName}`],
    };
  }

  if (mode === "bulkCreate") {
    const inputTypeName =
      options.inputTypeName?.trim() ||
      buildModelMutationInputType(options.model, "create");
    return {
      definitions: [`$inputs: [${inputTypeName}!]!`],
      assignments: [`inputs: $inputs`],
    };
  }

  if (mode === "bulkUpdate") {
    const inputTypeName = options.bulkInputTypeName?.trim() || "BulkUpdateInput";
    return {
      definitions: [`$inputs: [${inputTypeName}!]!`],
      assignments: [`inputs: $inputs`],
    };
  }

  if (mode === "bulkDelete") {
    return {
      definitions: [`$ids: [ID!]!`],
      assignments: [`ids: $ids`],
    };
  }

  const methodName = String(options.methodName || "").trim();
  if (!methodName) {
    throw new Error("methodName is required for method mutation generation.");
  }

  const definitions = [`$id: ID!`];
  const assignments = [`id: $id`];
  if (options.includeInput === true) {
    definitions.push(`$input: ${resolveMethodInputTypeName(options)}!`);
    assignments.push(`input: $input`);
  }

  return {
    definitions,
    assignments,
  };
}

/**
 * Builds response selection body for current mutation mode.
 */
function buildResponseSelectionBlock(
  mode: ModelMutationMode,
  options: BuildModelMutationDocumentOptions,
): string {
  const lines: string[] = ["ok"];

  if (mode === "method") {
    const resultSelection = String(options.resultSelection || "").trim();
    if (resultSelection) {
      lines.push(`result { ${resultSelection} }`);
    } else {
      lines.push("result");
    }
  } else if (mode === "bulkCreate" || mode === "bulkUpdate" || mode === "bulkDelete") {
    const objectSelection = resolveObjectSelection(options.selection);
    if (objectSelection) {
      lines.push(`objects { ${objectSelection} }`);
    }
  } else {
    const objectSelection = resolveObjectSelection(options.selection);
    if (objectSelection) {
      lines.push(`object { ${objectSelection} }`);
    }
  }

  lines.push("errors { field message code severity details }");
  return lines.join("\n        ");
}

/**
 * Builds backend-compatible GraphQL document for model mutations.
 */
export function buildModelMutationDocument(
  options: BuildModelMutationDocumentOptions,
): BuiltModelMutationDocument {
  const mutationName = resolveMutationName(options);
  const operationName = resolveOperationName(options, mutationName);
  const responseAlias = resolveResponseAlias(options);

  const defaultArguments = buildDefaultArguments(options);
  const definitions =
    options.customArgumentDefinitions || defaultArguments.definitions;
  const assignments =
    options.customArgumentAssignments || defaultArguments.assignments;

  const definitionBlock = definitions.filter(Boolean).join("\n      ");
  const assignmentBlock = assignments.filter(Boolean).join("\n        ");
  const variableSection = definitionBlock
    ? `(
      ${definitionBlock}
    )`
    : "";
  const argumentSection = assignmentBlock
    ? `(
        ${assignmentBlock}
      )`
    : "";
  const responseSelection = buildResponseSelectionBlock(options.mode, options);

  const mutationDocument = gql`
    mutation ${operationName}${variableSection} {
      ${responseAlias}: ${mutationName}${argumentSection} {
        ${responseSelection}
      }
    }
  `;

  return {
    mutationDocument,
    mutationName,
    operationName,
    responseAlias,
  };
}
