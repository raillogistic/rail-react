/**
 * Dynamic Filters - Metadata Merger
 * 
 * Combines modelSchema, filterSchema, and savedFilters into a unified schema.
 */

import type { 
 UnifiedFilterSchema, 
 FilterableField, 
 FilterPreset, 
 DistinctField,
 RelationFilter,
 FieldGroup,
 FilterBaseType,
 DatePreset,
 FilterUIHints,
 FilterOperator,
} from "./types";

interface ModelSchemaResponse {
 modelSchema: {
 app: string;
 model: string;
 verboseName: string;
 verboseNamePlural: string;
 fields: any[];
 relationships: any[];
 filterConfig: any;
 relationFilters: any[];
 fieldGroups: any[];
 };
}

interface FilterSchemaResponse {
 filterSchema: Array<{
 name: string;
 fieldName: string;
 fieldLabel: string;
 baseType?: string;
 isNested: boolean;
 relatedModel?: string;
 filterInputType: string;
 availableOperators: string[];
 defaultOperator?: string;
 preferredOperators?: string[];
 datePresets?: Array<{
 key: string;
 label: string;
 days?: number;
 startOfPeriod?: string;
 }>;
 showInQuickFilter?: boolean;
 priority?: number;
 options: any[];
 }>;
}

interface SavedFiltersResponse {
 savedFilters: Array<{
 id: string;
 name: string;
 description?: string;
 filterJson: string;
 isShared: boolean;
 createdBy?: { id: string; username: string };
 useCount: number;
 lastUsedAt?: string;
 }>;
}

/**
 * Merge metadata from modelSchema, filterSchema, and savedFilters
 * into a unified schema for the unified filter UI.
 */
export function mergeFilterMetadata(
 modelSchemaData: ModelSchemaResponse,
 filterSchemaData: FilterSchemaResponse,
 savedFiltersData: SavedFiltersResponse | null,
 options: { maxDepth?: number } = {}
): UnifiedFilterSchema {
 const { modelSchema } = modelSchemaData;
 const { filterSchema } = filterSchemaData;
 const savedFilters = savedFiltersData?.savedFilters ?? [];

 // Build field lookup from modelSchema for enrichment
 // modelSchema.fields.name is now camelCase
 const fieldLookup = new Map(
 modelSchema.fields.map((f) => [f.name, f])
 );
 const relationLookup = new Map(
 modelSchema.relationships.map((r) => [r.name, r])
 );

 // Merge filter fields with model field details
 const fields: FilterableField[] = filterSchema.map((filter) => {
 // filter.name is camelCase
 const modelField = fieldLookup.get(filter.name);
 const relation = relationLookup.get(filter.name);

 let baseType = resolveFieldBaseType(filter, modelField);

 // Upgrade baseType to Relationship if we found a matching relationship definition
 // This handles cases where the filter schema reports "ID" or "String" for a foreign key
 if (relation && (baseType === "String" || baseType === "Number")) {
 baseType = "Relationship";
 }

 return {
 name: filter.name,
 fieldName: filter.fieldName,
 fieldLabel: filter.fieldLabel,
 helpText: modelField?.helpText,
 baseType,
 graphqlType: modelField?.graphqlType ?? filter.baseType,
 filterInputType: filter.filterInputType,
 operators: filter.options.map((opt) => ({
 name: opt.name,
 label: translateOperatorLabel(opt.name, opt.label),
 helpText: opt.helpText,
 graphqlType: opt.graphqlType,
 isList: opt.isList ?? false,
 choices: opt.choices,
 })),
 defaultOperator: filter.defaultOperator ?? getDefaultOperator(baseType),
 preferredOperators:
 filter.preferredOperators ?? getPreferredOperators(baseType),
 choices: modelField?.choices,
 isRelation: filter.isNested,
 relationConfig: relation ? {
 relatedApp: relation.relatedApp,
 relatedModel: relation.relatedModel,
 lookupField: relation.lookupField,
 searchFields: relation.searchFields ?? [],
 } : undefined,
 uiHints: buildUIHints(filter, modelField, baseType),
 group: findFieldGroup(filter.name, modelSchema.fieldGroups),
 };
 });

 // Build relation filters with nested schema support
 const relationFilters: RelationFilter[] = modelSchema.relationFilters.map((rf: any) => {
 const relation = relationLookup.get(rf.name);
 return {
 name: rf.name,
 fieldName: rf.fieldName,
 fieldLabel: relation?.verboseName ?? rf.name,
 relationType: rf.relationType,
 relatedApp: relation?.relatedApp ?? "",
 relatedModel: relation?.relatedModel ?? "",
 nestedFilterType: rf.nestedFilterType,
 supportsDirectFilter: rf.relationType === "FOREIGN_KEY" || rf.relationType === "ONE_TO_ONE",
 supportsSome: rf.supportsSome,
 supportsEvery: rf.supportsEvery,
 supportsNone: rf.supportsNone,
 supportsCount: rf.supportsCount,
 supportsIsNull: rf.relationType === "FOREIGN_KEY",
 nestedSchema: undefined, // Populated by recursive fetch if needed
 };
 });

 // Combine all presets
 const presets: FilterPreset[] = [
 // Static presets from model definition
 ...(modelSchema.filterConfig?.presets ?? []).map((p: any) => ({
 id:`static_${p.presetName}`, // Use original snake_case name for ID if preferred, or name
 name: p.name, // camelCase name
 description: p.description,
 filterJson: typeof p.filterJson === "string" ? JSON.parse(p.filterJson) : p.filterJson,
 source: "static" as const,
 })),
 // User's saved filters
 ...savedFilters.map((sf) => ({
 id: sf.id,
 name: sf.name,
 description: sf.description,
 filterJson: typeof sf.filterJson === "string" ? JSON.parse(sf.filterJson) : sf.filterJson,
 source: sf.isShared ? "shared" as const : "saved" as const,
 createdBy: sf.createdBy,
 isShared: sf.isShared,
 useCount: sf.useCount,
 lastUsedAt: sf.lastUsedAt,
 })),
 ];

 // Build distinct fields (orderable fields are typically distinct-able)
 const distinctFields: DistinctField[] = modelSchema.fields
 .filter((f: any) => !f.isRelation && !f.isJson && (f.isIndexed || f.name === "id"))
 .map((f: any) => ({
 name: f.name,
 fieldName: f.fieldName,
 fieldLabel: f.verboseName,
 fieldType: f.graphqlType,
 requiresOrderBy: true, // PostgreSQL DISTINCT ON requires matching ORDER BY prefix
 }));

 return {
 app: modelSchema.app,
 model: modelSchema.model,
 verboseName: modelSchema.verboseName,
 verboseNamePlural: modelSchema.verboseNamePlural,
 config: {
 inputTypeName: modelSchema.filterConfig?.inputTypeName ??`${modelSchema.model}WhereInput`,
 supportsAnd: modelSchema.filterConfig?.supportsAnd ?? true,
 supportsOr: modelSchema.filterConfig?.supportsOr ?? true,
 supportsNot: modelSchema.filterConfig?.supportsNot ?? true,
 supportsFts: modelSchema.filterConfig?.supportsFts ?? false,
 supportsAggregation: modelSchema.filterConfig?.supportsAggregation ?? false,
 supportsDistinct: distinctFields.length > 0,
 },
 fields,
 relationFilters,
 presets,
 distinctFields,
 fieldGroups: modelSchema.fieldGroups ?? [],
 };
}

/**
 * Traduit les libellés des opérateurs en français si nécessaire.
 */
function translateOperatorLabel(name: string, originalLabel: string): string {
 const translations: Record<string, string> = {
 eq: "Égal à",
 neq: "Différent de",
 contains: "Contient",
 icontains: "Contient (insensible)",
 startsWith: "Commence par",
 istartsWith: "Commence par (insensible)",
 endsWith: "Se termine par",
 iendsWith: "Se termine par (insensible)",
 in: "Dans la liste",
 notIn: "Pas dans la liste",
 gt: "Supérieur à",
 gte: "Supérieur ou égal à",
 lt: "Inférieur à",
 lte: "Inférieur ou égal à",
 isNull: "Est vide",
 between: "Entre",
 regex: "Regex",
 iregex: "Regex (insensible)",
 exact: "Est exactement",
 iexact: "Est exactement (insensible)",
 year: "Année",
 month: "Mois",
 day: "Jour",
 weekDay: "Jour de la semaine",
 hour: "Heure",
 minute: "Minute",
 second: "Seconde",
 range: "Plage",
 hasKey: "Possède la clé",
 hasKeys: "Possède les clés",
 hasAnyKeys: "Possède l'une des clés",
 containedBy: "Contenu dans",
 overlaps: "Chevauche",
 today: "Aujourd'hui",
 yesterday: "Hier",
 thisWeek: "Cette semaine",
 lastWeek: "La semaine dernière",
 thisMonth: "Ce mois-ci",
 lastMonth: "Le mois dernier",
 thisQuarter: "Ce trimestre",
 thisYear: "Cette année",
 last30Days: "Les 30 derniers jours",
 last90Days: "Les 90 derniers jours",
 };

 return translations[name] ?? originalLabel;
}

function normalizeBaseType(baseType: string): FilterBaseType {
 const raw = String(baseType ?? "").trim();
 if (!raw) return "String";

 const exactMapping: Record<string, FilterBaseType> = {
 String: "String",
 Number: "Number",
 Int: "Number",
 Integer: "Number",
 Float: "Number",
 Decimal: "Number",
 Boolean: "Boolean",
 Bool: "Boolean",
 Date: "Date",
 DateTime: "DateTime",
 Datetime: "DateTime",
 Relationship: "Relationship",
 ID: "Number",
 Json: "JSON",
 JSON: "JSON",
 };
 if (exactMapping[raw]) return exactMapping[raw];

 const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
 if (["string", "char", "text", "id"].includes(normalized)) return "String";
 if (
 ["number", "int", "integer", "float", "decimal", "bigint", "smallint"].includes(
 normalized,
 )
 ) {
 return "Number";
 }
 if (["boolean", "bool"].includes(normalized)) return "Boolean";
 if (normalized === "date") return "Date";
 if (["datetime", "timestamp"].includes(normalized)) return "DateTime";
 if (
 ["relationship", "relation", "foreignkey", "fk", "manytomany", "onetoone"].includes(
 normalized,
 )
 ) {
 return "Relationship";
 }
 if (["json", "jsonfield"].includes(normalized)) return "JSON";

 // Fallbacks for descriptor-style type names (e.g. "BooleanFilterInput").
 if (normalized.includes("boolean") || normalized.includes("bool")) {
 return "Boolean";
 }
 if (normalized.includes("datetime") || normalized.includes("timestamp")) {
 return "DateTime";
 }
 if (normalized.includes("date")) return "Date";
 if (normalized.includes("json")) return "JSON";
 if (
 normalized.includes("relation") ||
 normalized.includes("foreignkey") ||
 normalized.includes("manytomany") ||
 normalized.includes("onetoone")
 ) {
 return "Relationship";
 }
 if (
 normalized.includes("number") ||
 normalized.includes("integer") ||
 normalized.includes("decimal") ||
 normalized.includes("float")
 ) {
 return "Number";
 }

 return "String";
}

function resolveFieldBaseType(filter: any, modelField: any): FilterBaseType {
 /**
 * Resolve using field-level metadata only.
 *
 * Operator GraphQL types are intentionally excluded because operators like
 *`isNull` use`Boolean`, which can incorrectly coerce string fields to
 * boolean widgets in the UI.
 */
 const candidates = [
 filter.baseType,
 modelField?.graphqlType,
 filter.filterInputType,
 ];

 for (const candidate of candidates) {
 const resolved = normalizeBaseType(String(candidate ?? ""));
 if (resolved !== "String") return resolved;
 }
 return "String";
}

function buildUIHints(
 filter: any,
 modelField: any,
 resolvedBaseType?: FilterBaseType,
): FilterUIHints {
 const baseType = resolvedBaseType ?? normalizeBaseType(filter.baseType);
 const hints: FilterUIHints = {
 widget: "text",
 allowClear: true,
 };

 if (modelField?.choices?.length > 0) {
 hints.widget = "select";
 } else if (baseType === "Number") {
 hints.widget = "number";
 if (modelField?.minValue != null) hints.minValue = modelField.minValue;
 if (modelField?.maxValue != null) hints.maxValue = modelField.maxValue;
 } else if (baseType === "Boolean") {
 hints.widget = "checkbox";
 } else if (baseType === "Date") {
 hints.widget = "date";
 hints.dateFormat = "yyyy-MM-dd";
 } else if (baseType === "DateTime") {
 hints.widget = "datetime";
 hints.dateFormat = "yyyy-MM-dd HH:mm";
 } else if (baseType === "Relationship") {
 hints.widget = "combobox";
 } else if (baseType === "JSON") {
 hints.widget = "json";
 }

 hints.defaultOperator =
 filter.defaultOperator ?? getDefaultOperator(baseType);
 hints.preferredOperators =
 filter.preferredOperators ?? getPreferredOperators(baseType);
 hints.datePresets = filter.datePresets ?? getDatePresets(baseType);
 hints.showInQuickFilter = filter.showInQuickFilter ?? false;
 hints.priority = filter.priority ?? 999;

 return hints;
}

function findFieldGroup(fieldName: string, groups: any[]): string | undefined {
 for (const group of groups ?? []) {
 if (group.fields?.includes(fieldName)) {
 return group.key;
 }
 }
 return undefined;
}

function getDefaultOperator(baseType: string): string {
 const preferred = getPreferredOperators(baseType);
 return preferred[0] ?? "eq";
}

function getPreferredOperators(baseType: string): string[] {
 const normalized = normalizeBaseType(baseType);
 const preferred: Record<string, string[]> = {
 String: ["icontains", "eq", "startsWith", "endsWith", "in"],
 Number: ["eq", "gte", "lte", "between", "in"],
 Boolean: ["eq"],
 Date: ["eq", "gte", "lte", "between", "year", "month"],
 DateTime: ["gte", "lte", "between", "eq", "year", "month"],
 Relationship: ["eq", "in", "isNull"],
 JSON: ["hasKey", "contains", "eq"],
 };
 return preferred[normalized] ?? ["eq"];
}

function getDatePresets(baseType: string): FilterUIHints["datePresets"] {
 const normalized = normalizeBaseType(baseType);
 if (normalized !== "Date" && normalized !== "DateTime") {
 return undefined;
 }
 return DEFAULT_DATE_PRESETS;
}

const DEFAULT_DATE_PRESETS: DatePreset[] = [
 { key: "today", label: "Aujourd'hui", startOfPeriod: "day" },
 { key: "yesterday", label: "Hier" },
 { key: "thisWeek", label: "Cette semaine", startOfPeriod: "week" },
 { key: "lastWeek", label: "La semaine dernière", startOfPeriod: "week" },
 { key: "thisMonth", label: "Ce mois-ci", startOfPeriod: "month" },
 { key: "lastMonth", label: "Le mois dernier", startOfPeriod: "month" },
 { key: "thisQuarter", label: "Ce trimestre", startOfPeriod: "quarter" },
 { key: "thisYear", label: "Cette année", startOfPeriod: "year" },
 { key: "last30Days", label: "Les 30 derniers jours" },
 { key: "last90Days", label: "Les 90 derniers jours" },
];
