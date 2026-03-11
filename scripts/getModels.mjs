#!/usr/bin/env node
/**
 * Purpose: Fetch protected backend model schemas and generate TypeScript interfaces.
 * Usage: npm run getModels
 * Required env:
 *   - VITE_TEST_USERNAME
 *   - VITE_TEST_PASSWORD
 *   - VITE_TEST_GRAPHQL_ENDPOINT
 * Optional env:
 *   - MODELS_APPS (comma-separated app labels allowlist)
 *   - MODELS_OUTPUT_PATH (default: src/models.ts)
 *   - MODELS_INCLUDE_REVERSE ("true"/"false", default: true)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const OUTPUT_PATH = path.resolve(
  __dirname,
  "..",
  process.env.MODELS_OUTPUT_PATH || "src/models.ts",
);
const INCLUDE_REVERSE =
  String(process.env.MODELS_INCLUDE_REVERSE || "true")
    .trim()
    .toLowerCase() !== "false";
const APP_FILTER = (process.env.MODELS_APPS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const LOGIN_MUTATION = `
  mutation IntegrationLogin($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      ok
      token
      errors
    }
  }
`;

const AVAILABLE_MODELS_QUERY = `
  query AvailableModels {
    availableModels {
      app
      model
    }
  }
`;

const MODEL_SCHEMA_QUERY = `
  query ModelSchemaForTypes($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      fields {
        name
        fieldName
        verboseName
        fieldType
        graphqlType
        pythonType
        required
        nullable
        blank
        isRelation
      }
      relationships {
        name
        fieldName
        verboseName
        relatedApp
        relatedModel
        relationType
        isReverse
        isToOne
        isToMany
        required
        nullable
      }
    }
  }
`;

const DJANGO_FIELD_TYPE_MAP = {
  AutoField: "number",
  BigAutoField: "number",
  SmallAutoField: "number",
  IntegerField: "number",
  PositiveIntegerField: "number",
  PositiveSmallIntegerField: "number",
  SmallIntegerField: "number",
  BigIntegerField: "number",
  PositiveBigIntegerField: "number",
  DecimalField: "number",
  FloatField: "number",
  DurationField: "number",
  DateField: "string",
  DateTimeField: "string",
  TimeField: "string",
  CharField: "string",
  TextField: "string",
  EmailField: "string",
  URLField: "string",
  SlugField: "string",
  UUIDField: "string",
  GenericIPAddressField: "string",
  BooleanField: "boolean",
  NullBooleanField: "boolean",
  JSONField: "Record<string, unknown>",
  ArrayField: "unknown[]",
  BinaryField: "string",
  FileField: "string",
  ImageField: "string",
  ForeignKey: "string | number",
  OneToOneField: "string | number",
  ManyToManyField: "Array<string | number>",
};

const GRAPHQL_TYPE_MAP = {
  ID: "string | number",
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  Date: "string",
  DateTime: "string",
  Time: "string",
  JSONString: "Record<string, unknown>",
  GenericScalar: "Record<string, unknown>",
};

function requireEnv(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toPascalCase(value) {
  return String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(value) {
  const tokens = String(value || "")
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean);

  if (!tokens.length) {
    return "";
  }

  const [head, ...rest] = tokens;
  return [
    head.charAt(0).toLowerCase() + head.slice(1),
    ...rest.map((token) => token.charAt(0).toUpperCase() + token.slice(1)),
  ].join("");
}

function interfaceNameFor(app, model) {
  return `${toPascalCase(app)}${model}`;
}

function isValidIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

function formatPropertyName(name) {
  if (isValidIdentifier(name)) {
    return name;
  }
  return `["${String(name).replace(/"/g, '\\"')}"]`;
}

async function postGraphQL(endpoint, query, variables = {}, token) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `GraphQL request failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }
  if (payload.errors?.length) {
    throw new Error(
      `GraphQL returned errors: ${JSON.stringify(payload.errors)}`,
    );
  }
  return payload.data || {};
}

async function login(endpoint, username, password) {
  const data = await postGraphQL(endpoint, LOGIN_MUTATION, {
    username,
    password,
  });
  const loginPayload = data.login;
  if (!loginPayload?.ok || !loginPayload?.token) {
    throw new Error(
      `Login failed: ${JSON.stringify(loginPayload?.errors || ["unknown error"])}`,
    );
  }
  return loginPayload.token;
}

function mapScalarFieldType(field) {
  const fromDjango = DJANGO_FIELD_TYPE_MAP[field.fieldType];
  const fromGraphQL = GRAPHQL_TYPE_MAP[field.graphqlType];
  const fromPython = String(field.pythonType || "").toLowerCase();

  if (fromDjango) return fromDjango;
  if (fromGraphQL) return fromGraphQL;
  if (fromPython.includes("bool")) return "boolean";
  if (
    fromPython.includes("int") ||
    fromPython.includes("float") ||
    fromPython.includes("decimal")
  ) {
    return "number";
  }
  if (
    fromPython.includes("date") ||
    fromPython.includes("datetime") ||
    fromPython.includes("time")
  ) {
    return "string";
  }
  if (fromPython.includes("dict") || fromPython.includes("json")) {
    return "Record<string, unknown>";
  }
  if (fromPython.includes("list") || fromPython.includes("tuple")) {
    return "unknown[]";
  }
  return "unknown";
}

function buildFieldProperty(field) {
  if (field.isRelation) {
    return null;
  }

  const name = toCamelCase(field.name || field.fieldName);
  if (!name) {
    return null;
  }

  const baseType = mapScalarFieldType(field);
  const nullable = Boolean(field.nullable || field.blank);
  return {
    name,
    description: field.verboseName || name,
    type: nullable ? `${baseType} | null` : baseType,
    optional: nullable || !field.required,
  };
}

function buildRelationProperty(relation, interfaceMap) {
  if (!INCLUDE_REVERSE && relation.isReverse) {
    return null;
  }

  const name = toCamelCase(relation.name || relation.fieldName);
  if (!name) {
    return null;
  }

  const relatedKey =
    relation.relatedApp && relation.relatedModel
      ? `${relation.relatedApp}.${relation.relatedModel}`
      : "";
  const relatedType = interfaceMap.get(relatedKey) || "Record<string, unknown>";

  let tsType = relation.isToMany ? `${relatedType}[]` : relatedType;
  const nullable = Boolean(relation.nullable || !relation.required);
  if (nullable) {
    tsType = `${tsType} | null`;
  }

  return {
    name,
    description: relation.verboseName || name,
    type: tsType,
    optional: nullable,
  };
}

function renderInterface(modelSchema, interfaceMap) {
  const interfaceName = interfaceNameFor(modelSchema.app, modelSchema.model);
  const properties = [];

  for (const field of modelSchema.fields || []) {
    const property = buildFieldProperty(field);
    if (!property) continue;
    properties.push(property);
  }

  for (const relation of modelSchema.relationships || []) {
    const property = buildRelationProperty(relation, interfaceMap);
    if (!property) continue;
    properties.push(property);
  }

  properties.sort((left, right) => left.name.localeCompare(right.name));

  const bodyLines = properties.length
    ? properties.map((property) => {
        const propertyName = formatPropertyName(property.name);
        const optional = property.optional ? "?" : "";
        const description = property.description
          ? `  /** ${property.description} */\n`
          : "";
        return `${description}  ${propertyName}${optional}: ${property.type};`;
      })
    : ["  [key: string]: unknown;"];

  return `export interface ${interfaceName} {\n${bodyLines.join("\n")}\n}`;
}

function buildOutput(modelSchemas) {
  const sortedSchemas = [...modelSchemas].sort((left, right) => {
    const byApp = left.app.localeCompare(right.app);
    if (byApp !== 0) return byApp;
    return left.model.localeCompare(right.model);
  });

  const interfaceMap = new Map();
  for (const schema of sortedSchemas) {
    interfaceMap.set(
      `${schema.app}.${schema.model}`,
      interfaceNameFor(schema.app, schema.model),
    );
  }

  const interfaces = sortedSchemas.map((schema) =>
    renderInterface(schema, interfaceMap),
  );

  const registryEntries = sortedSchemas.map((schema) => {
    const key = `${schema.app}.${schema.model}`;
    return `  "${key}": ${interfaceMap.get(key)};`;
  });

  const headerLines = [
    "// AUTO-GENERATED FILE. DO NOT EDIT.",
    "// Source: scripts/getModels.mjs",
    "// Command: npm run getModels",
    `// Generated at: ${new Date().toISOString()}`,
    "",
  ];

  const registry = [
    "export type DjangoModelMap = {",
    ...registryEntries,
    "};",
    "",
    "export type DjangoModelName = keyof DjangoModelMap;",
    "",
  ];

  return [...headerLines, ...interfaces, "", ...registry].join("\n");
}

async function run() {
  const endpoint = requireEnv("VITE_TEST_GRAPHQL_ENDPOINT");
  const username = requireEnv("VITE_TEST_USERNAME");
  const password = requireEnv("VITE_TEST_PASSWORD");

  console.log(`[getModels] Authenticating against ${endpoint}`);
  const token = await login(endpoint, username, password);

  console.log("[getModels] Fetching available models");
  const available = await postGraphQL(
    endpoint,
    AVAILABLE_MODELS_QUERY,
    {},
    token,
  );
  const discoveredModels = Array.isArray(available.availableModels)
    ? available.availableModels
    : [];

  let selectedModels = discoveredModels;
  if (APP_FILTER.length > 0) {
    const allow = new Set(APP_FILTER.map((app) => app.toLowerCase()));
    selectedModels = selectedModels.filter((entry) =>
      allow.has(String(entry.app || "").toLowerCase()),
    );
  }

  selectedModels = selectedModels
    .filter((entry) => entry?.app && entry?.model)
    .sort((left, right) => {
      const byApp = left.app.localeCompare(right.app);
      if (byApp !== 0) return byApp;
      return left.model.localeCompare(right.model);
    });

  if (selectedModels.length === 0) {
    throw new Error("No models discovered for generation.");
  }

  console.log(
    `[getModels] Fetching schemas for ${selectedModels.length} models`,
  );
  const modelSchemas = [];
  const failures = [];

  for (const modelRef of selectedModels) {
    try {
      const payload = await postGraphQL(
        endpoint,
        MODEL_SCHEMA_QUERY,
        { app: modelRef.app, model: modelRef.model },
        token,
      );
      if (!payload.modelSchema) {
        failures.push(
          `${modelRef.app}.${modelRef.model}: empty modelSchema response`,
        );
        continue;
      }
      modelSchemas.push(payload.modelSchema);
    } catch (error) {
      failures.push(
        `${modelRef.app}.${modelRef.model}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (modelSchemas.length === 0) {
    throw new Error(
      `[getModels] Failed to fetch any model schemas.\n${failures.join("\n")}`,
    );
  }

  const fileContent = buildOutput(modelSchemas);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, fileContent, "utf-8");

  console.log(
    `[getModels] Wrote ${modelSchemas.length} model interfaces to ${OUTPUT_PATH}`,
  );

  if (failures.length > 0) {
    console.warn(
      `[getModels] Completed with ${failures.length} model fetch failures:\n${failures.join("\n")}`,
    );
  }
}

run().catch((error) => {
  console.error(
    `[getModels] Generation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
