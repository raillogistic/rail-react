#!/usr/bin/env node
/**
 * Purpose: Fetch Django `users` app model metadata from GraphQL and emit TypeScript interfaces.
 * Usage: yarn get_models
 * Requirements:
 *   - `VITE_API_ENDPOINT` in frontend/.env (default: http://localhost:8000/graphql/)
 *   - Optional: `GRAPHQL_AUTH_TOKEN` (Bearer token) for authenticated metadata access.
 *   - Optional: `MODELS_METADATA_PATH` to reuse a cached JSON payload instead of hitting HTTP.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_APP_LIST = (process.env.MODELS_APPS ||
  process.env.MODELS_APP_NAME ||
  'assets,inventory,workorders,planning,quality,documents,core,users'
)
  .split(',')
  .map((item) => item.trim())
  .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
const OUTPUT_PATH = path.resolve(__dirname, '../src/models.ts');
const ENV_PATH = path.resolve(__dirname, '../.env');

const DJANGO_TYPE_MAP = {
  AutoField: 'number',
  BigAutoField: 'number',
  IntegerField: 'number',
  PositiveIntegerField: 'number',
  PositiveSmallIntegerField: 'number',
  SmallIntegerField: 'number',
  BigIntegerField: 'number',
  DecimalField: 'number',
  FloatField: 'number',
  DurationField: 'number',
  DateField: 'string',
  DateTimeField: 'string',
  TimeField: 'string',
  CharField: 'string',
  TextField: 'string',
  EmailField: 'string',
  URLField: 'string',
  SlugField: 'string',
  UUIDField: 'string',
  BooleanField: 'boolean',
  NullBooleanField: 'boolean',
  JSONField: 'Record<string, unknown>',
  ArrayField: 'unknown[]',
  BinaryField: 'string',
  FileField: 'string',
  ImageField: 'string',
  ForeignKey: 'string | number',
  OneToOneField: 'string | number',
};

const APP_MODELS_QUERY = `
  query AppModels($appName: String!) {
    app_models(app_name: $appName) {
      app_name
      model_name
      verbose_name
      verbose_name_plural
      fields {
        name
        field_type
        is_required
        is_nullable
        null
        blank
        is_foreign_key
        is_primary_key
        verbose_name
      }
      relationships {
        name
        relationship_type
        related_app
        is_reverse
        is_required
        many_to_many
        one_to_one
        foreign_key
        verbose_name
        related_model {
          app_name
          model_name
        }
      }
    }
  }
`;

function readEnvValue(key) {
  if (!fs.existsSync(ENV_PATH)) {
    return undefined;
  }
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const match = content.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function parseJsonFile(filePath) {
  const absolute = path.resolve(filePath);
  const raw = fs.readFileSync(absolute, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`Expected metadata JSON array in ${absolute}`);
  }
  return data;
}

async function fetchAppModels(endpoint, token, appName) {
  const headers = {
    'content-type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: APP_MODELS_QUERY,
      variables: { appName },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  const payload = await res.json();
  if (payload.errors) {
    throw new Error(`GraphQL returned errors: ${JSON.stringify(payload.errors)}`);
  }
  const models = payload.data?.app_models ?? [];
  return models;
}

function toPascalCase(value) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function isValidIdentifier(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

function formatPropertyName(name) {
  if (isValidIdentifier(name)) {
    return name;
  }
  return `["${name.replace(/"/g, '\\"')}"]`;
}

function mapField(field) {
  if (field.is_foreign_key) return null;
  const baseType = DJANGO_TYPE_MAP[field.field_type] ?? 'unknown';
  const allowsNull = Boolean(field.null || field.is_nullable || field.blank);
  const tsType = allowsNull ? `${baseType} | null` : baseType;
  const optional = allowsNull || !field.is_required;
  return {
    name: field.name,
    description: field.verbose_name || field.name,
    type: tsType,
    optional,
  };
}

function mapRelationship(relation, typeMap) {
  const relationApp = relation.related_app || relation.related_model?.app_name;
  const relationModel = relation.related_model?.model_name;
  const key = relationApp && relationModel ? `${relationApp}.${relationModel}` : null;
  const relatedType = (key && typeMap.get(key)) || 'Record<string, unknown>';
  const isArray = Boolean(relation.many_to_many);
  let tsType = isArray ? `${relatedType}[]` : relatedType;
  if (!relation.is_required || relation.is_reverse) {
    tsType = `${tsType} | null`;
  }
  const optional = !relation.is_required || relation.is_reverse;
  return {
    name: relation.name,
    description: relation.verbose_name || relation.name,
    type: tsType,
    optional,
  };
}

function interfaceNameFor(appName, modelName) {
  return `${toPascalCase(appName)}${modelName}`;
}

function buildInterface(metadata, typeMap, interfaceName) {
  const properties = [];
  const fieldProps = (metadata.fields || [])
    .map(mapField)
    .filter(Boolean);
  const relationProps = (metadata.relationships || [])
    .map((rel) => mapRelationship(rel, typeMap))
    .filter(Boolean);

  for (const prop of [...fieldProps, ...relationProps]) {
    const name = formatPropertyName(prop.name);
    const optionalFlag = prop.optional ? '?' : '';
    const doc = prop.description ? `  /** ${prop.description} */\n` : '';
    properties.push(`${doc}  ${name}${optionalFlag}: ${prop.type};`);
  }

  if (!properties.length) {
    properties.push('  [key: string]: unknown;');
  }

  return `export interface ${interfaceName} {\n${properties.join('\n')}\n}`;
}

function composeFile(models) {
  const header = `// AUTO-GENERATED FILE. DO NOT EDIT.\n// Source: scripts/generate-user-models.mjs\n// Command: yarn get_models\n\n`;
  const typeMap = new Map();
  models.forEach((model) => {
    const key = `${model.app_name}.${model.model_name}`;
    typeMap.set(key, interfaceNameFor(model.app_name, model.model_name));
  });
  const sorted = [...models].sort((a, b) => {
    const appCompare = a.app_name.localeCompare(b.app_name);
    if (appCompare !== 0) {
      return appCompare;
    }
    return a.model_name.localeCompare(b.model_name);
  });
  const interfaces = sorted.map((model) => {
    const ifaceName = interfaceNameFor(model.app_name, model.model_name);
    return buildInterface(model, typeMap, ifaceName);
  });
  const registryEntries = sorted
    .map(
      (model) =>
        `  "${model.app_name}.${model.model_name}": ${typeMap.get(
          `${model.app_name}.${model.model_name}`,
        )};`,
    )
    .join('\n');
  const registry = `export type DjangoModelMap = {\n${registryEntries}\n};\n\nexport type DjangoModelName = keyof DjangoModelMap;\n`;
  return `${header}${interfaces.join('\n\n')}\n\n${registry}`;
}

async function loadMetadata(endpoint, token, appList) {
  const metadataPath = process.env.MODELS_METADATA_PATH;
  if (metadataPath) {
    console.log(`[generate-user-models] Using cached metadata from ${metadataPath}`);
    return parseJsonFile(metadataPath);
  }
  const acc = [];
  for (const appName of appList) {
    console.log(`[generate-user-models] Fetching metadata for app "${appName}" from ${endpoint}`);
    const models = await fetchAppModels(endpoint, token, appName);
    models.forEach((model) => {
      acc.push(model);
    });
  }
  return acc;
}

async function run() {
  const endpoint =
    process.env.VITE_API_ENDPOINT ||
    readEnvValue('VITE_API_ENDPOINT') ||
    'http://localhost:8000/graphql/';
  if (!endpoint) {
    throw new Error('VITE_API_ENDPOINT is not defined in frontend/.env or environment.');
  }
  const token =
    process.env.GRAPHQL_AUTH_TOKEN ||
    process.env.MODELS_TOKEN ||
    process.env.API_TOKEN ||
    undefined;

  if (!DEFAULT_APP_LIST.length) {
    throw new Error('No apps provided in MODELS_APPS.');
  }
  const metadata = await loadMetadata(endpoint, token, DEFAULT_APP_LIST);
  const fileContent = composeFile(metadata);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
  console.log(
    `[generate-user-models] Wrote ${metadata.length} model interfaces across ${DEFAULT_APP_LIST.length} apps to ${OUTPUT_PATH}`,
  );
}

run().catch((err) => {
  console.error('[generate-user-models] Failed to generate models:', err);
  process.exitCode = 1;
});
