import type {
 FieldSchema,
 ModelSchema,
 RelationshipSchema,
 MutationSchema,
} from "../types";
import { toCamelCase, toGraphqlFieldName, toSnakeCase } from "./caseConversion";

type SyntheticRelationCountMetadata = {
 synthetic?: string;
 relation?: string;
};

function parseJsonObject(value?: string): Record<string, unknown> | null {
 if (!value) return null;
 try {
 const parsed = JSON.parse(value);
 if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
 return null;
 }
 return parsed as Record<string, unknown>;
 } catch {
 return null;
 }
}

export function getSyntheticRelationCountSource(
 field: Pick<FieldSchema, "customMetadata">,
): string | undefined {
 const metadata = parseJsonObject(
 field.customMetadata,
 ) as SyntheticRelationCountMetadata | null;
 if (!metadata) return undefined;
 if (metadata.synthetic !== "relation_count") return undefined;
 return metadata.relation;
}

function resolveRelationCountSource(
 accessor: string,
 field: FieldSchema,
 relationLookup: Map<string, RelationshipSchema>,
): string | null {
 const syntheticSource = getSyntheticRelationCountSource(field);
 if (syntheticSource) return syntheticSource;
 const stripped = accessor.replace(/count$/i, "");
 if (!stripped || stripped === accessor) return null;
 const candidates = new Set<string>([
 stripped,
 toCamelCase(stripped),
 toSnakeCase(stripped),
 ]);
 for (const candidate of candidates) {
 if (relationLookup.has(candidate)) return candidate;
 }
 return null;
}

export function getDefaultHiddenColumnIds(
 metadata?: ModelSchema | null,
): Set<string> {
 const hidden = new Set<string>();
 if (!metadata?.fields) return hidden;

 const relationLookup = new Map<string, RelationshipSchema>();
 metadata.relationships?.forEach((relation) => {
 if (relation.name) relationLookup.set(relation.name, relation);
 if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
 });

 const normalizeKey = (value: string) => value.replace(/[_-]/g, "").toLowerCase();

 metadata.fields.forEach((field) => {
 const accessor = field.name || field.fieldName;
 const normalized = normalizeKey(accessor);
 const relation =
 relationLookup.get(field.name) ??
 relationLookup.get(field.fieldName || "");
 const relationType = relation?.relationType?.toLowerCase() || "";
 const isRelationCount = !!resolveRelationCountSource(
 accessor,
 field,
 relationLookup,
 );
 const isTimestamp =
 normalized === "createdat" ||
 normalized === "updatedat" ||
 normalized === "updateat";
 const hideByDefault =
 field.isPrimaryKey ||
 normalized === "id" ||
 field.isJson ||
 field.fieldType === "TextField" ||
 isTimestamp ||
 isRelationCount ||
 (!!relation &&
 (relation.isToMany ||
 relation.isReverse ||
 relationType.includes("many_to_many") ||
 relationType.includes("manytomany") ||
 relationType.includes("reverse_fk")));

 if (!hideByDefault) return;
 hidden.add(accessor);
 hidden.add(field.name);
 if (field.fieldName) hidden.add(field.fieldName);
 hidden.add(toGraphqlFieldName(accessor));
 hidden.add(toGraphqlFieldName(field.name));
 if (field.fieldName) hidden.add(toGraphqlFieldName(field.fieldName));
 });

 return hidden;
}

function buildRelationshipField(relation: RelationshipSchema): FieldSchema {
 const name = relation.name || relation.fieldName;
 const fieldName = relation.name || relation.fieldName;
 const lookupField =
 relation.lookupField && relation.lookupField !== "__str__"
 ? relation.lookupField
 : undefined;
 return {
 name,
 fieldName,
 verboseName: relation.verboseName || name,
 helpText: relation.helpText,
 fieldType: "Relationship",
 graphqlType: "Relationship",
 required: relation.required,
 nullable: relation.nullable,
 blank: !relation.required,
 editable: relation.editable,
 unique: false,
 hasDefault: false,
 autoNow: false,
 autoNowAdd: false,
 readable: relation.readable,
 writable: relation.writable,
 visibility: relation.readable ? "list" : "hidden",
 isPrimaryKey: false,
 isIndexed: false,
 isRelation: true,
 isComputed: false,
 isFile: false,
 isImage: false,
 isJson: false,
 isDate: false,
 isDatetime: false,
 isNumeric: false,
 isBoolean: false,
 isText: false,
 isRichText: false,
 isFsmField: false,
 relationLookupField: lookupField,
 };
}

function buildRelationshipCountField(relation: RelationshipSchema): FieldSchema {
 const relationName = relation.name || relation.fieldName;
 const countAccessor =`${relationName}Count`;
 return {
 name: countAccessor,
 fieldName: countAccessor,
 verboseName:`${relation.verboseName || relationName} Count`,
 helpText:`Nombre d'elements lies pour ${relation.verboseName || relationName}`,
 fieldType: "Integer",
 graphqlType: "Int",
 required: false,
 nullable: true,
 blank: true,
 editable: false,
 unique: false,
 hasDefault: false,
 autoNow: false,
 autoNowAdd: false,
 readable: relation.readable,
 writable: false,
 visibility: relation.readable ? "list" : "hidden",
 isPrimaryKey: false,
 isIndexed: false,
 isRelation: false,
 isComputed: true,
 isFile: false,
 isImage: false,
 isJson: false,
 isDate: false,
 isDatetime: false,
 isNumeric: true,
 isBoolean: false,
 isText: false,
 isRichText: false,
 isFsmField: false,
 customMetadata: JSON.stringify({
 synthetic: "relation_count",
 relation: relationName,
 }),
 };
}

export function mergeModelSchemaWithRelationships(
 metadata?: ModelSchema | null,
): ModelSchema | undefined {
 if (!metadata) return undefined;
 const relationships = metadata.relationships ?? [];
 if (relationships.length === 0) {
 return metadata;
 }

 const relationLookup = new Map<string, RelationshipSchema>();
 relationships.forEach((relation) => {
 if (relation.name) relationLookup.set(relation.name, relation);
 if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
 });

 const mergedFields = metadata.fields.map((field) => {
 if (!field.isRelation) return field;
 const relation =
 relationLookup.get(field.name) ?? relationLookup.get(field.fieldName);
 if (!relation) return field;
 const lookupField =
 relation.lookupField && relation.lookupField !== "__str__"
 ? relation.lookupField
 : undefined;
 if (field.relationLookupField === lookupField) return field;
 return { ...field, relationLookupField: lookupField };
 });

 const existingKeys = new Set<string>();
 mergedFields.forEach((field) => {
 if (field.name) existingKeys.add(field.name);
 if (field.fieldName) existingKeys.add(field.fieldName);
 });

 const relationshipFields = relationships
 .filter((relation) => {
 const name = relation.name || relation.fieldName;
 const fieldName = relation.name || relation.fieldName;
 return !existingKeys.has(name) && !existingKeys.has(fieldName);
 })
 .map(buildRelationshipField);

 const countFields = relationships
 .filter((relation) => relation.isToMany && relation.readable)
 .map(buildRelationshipCountField)
 .filter((field) => {
 const name = field.name || field.fieldName;
 const fieldName = field.name || field.fieldName;
 return !existingKeys.has(name) && !existingKeys.has(fieldName);
 });

 if (relationshipFields.length === 0 && countFields.length === 0) {
 return { ...metadata, fields: mergedFields };
 }

 return {
 ...metadata,
 fields: [...mergedFields, ...relationshipFields, ...countFields],
 };
}

export function normalizeModelSchemaAccessors(
 metadata?: ModelSchema | null,
): ModelSchema | undefined {
 if (!metadata) return undefined;

 const normalizedFields = (metadata.fields ?? []).map((field) => {
 const rawFieldName = field.fieldName || field.name;
 const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
 return {
 ...field,
 name: canonicalName || field.name || rawFieldName,
 fieldName: rawFieldName,
 };
 });

 const normalizedRelationships = (metadata.relationships ?? []).map(
 (relation) => {
 const rawRelationFieldName = relation.fieldName || relation.name;
 const canonicalName = toGraphqlFieldName(
 relation.name || relation.fieldName,
 );
 return {
 ...relation,
 name: canonicalName || relation.name || rawRelationFieldName,
 fieldName: rawRelationFieldName,
 };
 },
 );

 return {
 ...metadata,
 fields: normalizedFields,
 relationships: normalizedRelationships,
 };
}

export function normalizeMutationType(mutation: MutationSchema): string {
 return String(mutation.mutationType || mutation.operation || "").toLowerCase();
}

export function findMutation(
 mutations: MutationSchema[] | undefined,
 type: string,
): MutationSchema | undefined {
 const normalized = type.toLowerCase();
 return mutations?.find(
 (mutation) => normalizeMutationType(mutation) === normalized,
 );
}
