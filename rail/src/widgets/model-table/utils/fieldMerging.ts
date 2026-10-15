import type {
 BaseModelTableField,
 BaseModelTableFieldAdd,
 BaseModelTableFieldRenderMap,
 BaseModelTableFieldsInput,
} from "../types";

export type ResolvedBaseModelTableFieldsConfig = {
 include?: BaseModelTableField[];
 add: BaseModelTableFieldAdd[];
 exclude: string[];
 render: BaseModelTableFieldRenderMap;
};

export function normalizeBaseModelTableFieldsInput(
 input?: BaseModelTableFieldsInput,
): ResolvedBaseModelTableFieldsConfig {
 if (!input) {
 return {
 include: undefined,
 add: [],
 exclude: [],
 render: {},
 };
 }

 if (Array.isArray(input)) {
 return {
 include: input,
 add: [],
 exclude: [],
 render: {},
 };
 }

 const add = (input.add ?? [])
 .map((entry) => ({
 ...entry,
 accessor: entry.accessor.trim(),
 }))
 .filter((entry) => Boolean(entry.accessor));

 return {
 include: input.include,
 add,
 exclude: (input.exclude ?? []).map((entry) => entry.trim()).filter(Boolean),
 render: input.render ?? {},
 };
}

function getFieldAccessor(field: BaseModelTableField): string {
 return typeof field === "string" ? field : field.accessor;
}

function withFieldTitle(
 field: BaseModelTableField,
 title: string,
): BaseModelTableField {
 if (typeof field === "string") {
 return {
 accessor: field,
 title,
 };
 }
 return {
 ...field,
 title,
 };
}

function findFieldIndexByAccessor(
 fields: BaseModelTableField[],
 accessor: string,
): number {
 return fields.findIndex((field) => getFieldAccessor(field) === accessor);
}

function resolveInsertIndex(
 fields: BaseModelTableField[],
 order: BaseModelTableFieldAdd["order"],
): number {
 if (typeof order === "number") {
 return Math.min(Math.max(order, 0), fields.length);
 }
 if (!order) return fields.length;

 if (order.before) {
 const beforeIndex = findFieldIndexByAccessor(fields, order.before);
 if (beforeIndex >= 0) return beforeIndex;
 }
 if (order.after) {
 const afterIndex = findFieldIndexByAccessor(fields, order.after);
 if (afterIndex >= 0) return afterIndex + 1;
 }

 return fields.length;
}

export function mergeBaseModelTableFields(
 options: {
 include?: BaseModelTableField[];
 defaults: BaseModelTableField[];
 add?: BaseModelTableFieldAdd[];
 excludedAccessors?: Set<string>;
 },
): BaseModelTableField[] {
 const baseFields = options.include ?? options.defaults;
 const excludedAccessors = options.excludedAccessors;
 const merged: BaseModelTableField[] = [];
 const existingAccessors = new Set<string>();

 const appendBaseField = (field: BaseModelTableField) => {
 const accessor = getFieldAccessor(field);
 if (!accessor) return;
 if (excludedAccessors && isAccessorExcluded(accessor, excludedAccessors)) {
 return;
 }
 if (existingAccessors.has(accessor)) return;
 merged.push(field);
 existingAccessors.add(accessor);
 };

 baseFields.forEach(appendBaseField);

 (options.add ?? []).forEach((fieldToAdd) => {
 const accessor = fieldToAdd.accessor;
 if (!accessor) return;
 if (excludedAccessors && isAccessorExcluded(accessor, excludedAccessors)) {
 return;
 }

 const existingIndex = findFieldIndexByAccessor(merged, accessor);
 const title = fieldToAdd.title?.trim();

 if (existingIndex >= 0) {
 let nextField = merged[existingIndex];
 if (title) {
 nextField = withFieldTitle(nextField, title);
 }

 const shouldMove = fieldToAdd.order !== undefined;
 if (!shouldMove) {
 merged[existingIndex] = nextField;
 return;
 }

 merged.splice(existingIndex, 1);
 const insertIndex = resolveInsertIndex(merged, fieldToAdd.order);
 merged.splice(insertIndex, 0, nextField);
 return;
 }

 const newField: BaseModelTableField = title
 ? { accessor, title }
 : accessor;
 const insertIndex = resolveInsertIndex(merged, fieldToAdd.order);
 merged.splice(insertIndex, 0, newField);
 existingAccessors.add(accessor);
 });

 return merged;
}

export function isAccessorExcluded(
 accessor: string,
 excludedAccessors: Set<string>,
): boolean {
 if (!accessor) return false;
 if (excludedAccessors.has(accessor)) return true;

 const dotRoot = accessor.split(".")[0];
 const dunderRoot = accessor.split("__")[0];

 return excludedAccessors.has(dotRoot) || excludedAccessors.has(dunderRoot);
}
