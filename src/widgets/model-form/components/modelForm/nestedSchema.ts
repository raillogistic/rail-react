import type {
 ModelFormNestedConfig,
 ModelFormNestedDeleteMutationConfig,
 ModelFormNestedDefinition,
 ModelFormNestedFieldsOrderMode,
 ModelFormNestedRemoveOperation,
 ModelFormNestedScalarListOperation,
} from "../../types.model";

export type RelationNestedFormConfig = {
 enabled?: boolean;
 title?: string;
 description?: string;
 fields?: string[];
 excludeFields?: string[];
 fieldsOrder?: ModelFormNestedFieldsOrderMode;
 customOrder?: string[];
 columns?: number;
 collapsible?: boolean;
 sectionOverrides?: Record<string, unknown>;
 itemLabel?: string;
 addButton?: {
 enabled?: boolean;
 label?: string;
 };
 sortable?: {
 enabled?: boolean;
 orderField?: string;
 mode?: "drag&drop" | "buttons";
 };
 minItems?: number;
 maxItems?: number;
 scalarListOperation?: ModelFormNestedScalarListOperation;
 removeOperation?: ModelFormNestedRemoveOperation;
 deleteMutation?: ModelFormNestedDeleteMutationConfig;
 metadata?: Record<string, unknown> | null;
};

function toOptionalNumber(value: unknown): number | undefined {
 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value === "string" && value.trim() !== "") {
 const parsed = Number(value);
 if (Number.isFinite(parsed)) return parsed;
 }
 return undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
 if (typeof value !== "boolean") return undefined;
 return value;
}

function toOptionalString(value: unknown): string | undefined {
 if (typeof value !== "string") return undefined;
 const normalized = value.trim();
 return normalized ? normalized : undefined;
}

function toOptionalStringArray(value: unknown): string[] | undefined {
 if (!Array.isArray(value)) return undefined;
 const normalized = value
 .filter((entry) => typeof entry === "string")
 .map((entry) => entry.trim())
 .filter(Boolean);
 return normalized.length > 0 ? normalized : undefined;
}

function toOptionalRecord(value: unknown): Record<string, unknown> | null {
 if (value && typeof value === "object" && !Array.isArray(value)) {
 return value as Record<string, unknown>;
 }
 if (typeof value !== "string") return null;
 try {
 const parsed = JSON.parse(value);
 if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
 return parsed as Record<string, unknown>;
 }
 } catch {
 return null;
 }
 return null;
}

function parseFieldsOrderMode(
 value: unknown,
): ModelFormNestedFieldsOrderMode | undefined {
 if (typeof value !== "string") return undefined;
 const normalized = String(value ?? "").trim();
 if (!normalized) return undefined;
 if (normalized === "contract" || normalized === "default") return "contract";
 if (
 normalized === "fields" ||
 normalized === "field" ||
 normalized === "follow-fields" ||
 normalized === "follow_fields" ||
 normalized === "followfields"
 ) {
 return "fields";
 }
 if (
 normalized === "custom" ||
 normalized === "custom-order" ||
 normalized === "custom_order" ||
 normalized === "customorder"
 ) {
 return "custom";
 }
 return undefined;
}

function parseScalarListOperation(
 value: unknown,
): ModelFormNestedScalarListOperation | undefined {
 if (typeof value !== "string") return undefined;
 const normalized = value.trim().toLowerCase();
 if (normalized === "connect") return "connect";
 if (normalized === "set") return "set";
 return undefined;
}

function parseRemoveOperation(
 value: unknown,
): ModelFormNestedRemoveOperation | undefined {
 if (typeof value !== "string") return undefined;
 const normalized = value.trim().toLowerCase();
 if (normalized === "disconnect") return "disconnect";
 if (normalized === "delete") return "delete";
 return undefined;
}

function parseAddButtonConfig(value: unknown):
 | {
 enabled?: boolean;
 label?: string;
 }
 | undefined {
 if (typeof value === "boolean") {
 return { enabled: value };
 }
 if (typeof value === "string") {
 const label = toOptionalString(value);
 return label ? { enabled: true, label } : { enabled: true };
 }
 if (!value || typeof value !== "object" || Array.isArray(value)) {
 return undefined;
 }
 const record = value as Record<string, unknown>;
 const enabled = toOptionalBoolean(record.enabled ?? record.show);
 const label = toOptionalString(record.label);
 if (enabled === undefined && !label) return undefined;
 return {
 ...(enabled !== undefined ? { enabled } : {}),
 ...(label ? { label } : {}),
 };
}

function parseSortableConfig(value: unknown):
 | {
 enabled?: boolean;
 orderField?: string;
 mode?: "drag&drop" | "buttons";
 }
 | undefined {
 if (typeof value === "boolean") {
 return { enabled: value };
 }
 if (!value || typeof value !== "object" || Array.isArray(value)) {
 return undefined;
 }
 const record = value as Record<string, unknown>;
 const enabled = toOptionalBoolean(record.enabled ?? record.activate);
 const orderField = toOptionalString(
 record.orderField ??
 record.order_field ??
 record.toField ??
 record.to_field ??
 record.field ??
 record.orderBy,
 );
 const rawMode = toOptionalString(
 record.mode ?? record.sortMode ?? record.sort_mode,
 );
 let mode: "drag&drop" | "buttons" | undefined;
 if (rawMode) {
 const normalizedMode = rawMode.toLowerCase();
 if (
 normalizedMode === "drag&drop" ||
 normalizedMode === "drag-and-drop" ||
 normalizedMode === "drag_drop" ||
 normalizedMode === "dragdrop" ||
 normalizedMode === "dnd"
 ) {
 mode = "drag&drop";
 } else if (normalizedMode === "buttons" || normalizedMode === "button") {
 mode = "buttons";
 }
 }
 if (enabled === undefined && !orderField && !mode) return undefined;
 return {
 ...(enabled !== undefined ? { enabled } : {}),
 ...(orderField ? { orderField } : {}),
 ...(mode ? { mode } : {}),
 };
}

function parseDeleteMutationConfig(
 value: unknown,
): ModelFormNestedDeleteMutationConfig | undefined {
 if (typeof value === "boolean") {
 return { enabled: value };
 }
 if (!value || typeof value !== "object" || Array.isArray(value)) {
 return undefined;
 }
 const record = value as Record<string, unknown>;
 const enabled = toOptionalBoolean(record.enabled ?? record.activate);
 const operationName = toOptionalString(
 record.operationName ?? record.operation_name,
 );
 const modelName = toOptionalString(record.modelName ?? record.model_name);
 const idPath = toOptionalString(record.idPath ?? record.id_path);
 const selection = toOptionalString(record.selection);

 if (
 enabled === undefined &&
 !operationName &&
 !modelName &&
 !idPath &&
 !selection
 ) {
 return undefined;
 }

 return {
 ...(enabled !== undefined ? { enabled } : {}),
 ...(operationName ? { operationName } : {}),
 ...(modelName ? { modelName } : {}),
 ...(idPath ? { idPath } : {}),
 ...(selection ? { selection } : {}),
 };
}

function mergeAddButtonConfig(
 left:
 | {
 enabled?: boolean;
 label?: string;
 }
 | undefined,
 right:
 | {
 enabled?: boolean;
 label?: string;
 }
 | undefined,
) {
 if (!left && !right) return undefined;
 return {
 ...(left ?? {}),
 ...(right ?? {}),
 };
}

function mergeSortableConfig(
 left:
 | {
 enabled?: boolean;
 orderField?: string;
 mode?: "drag&drop" | "buttons";
 }
 | undefined,
 right:
 | {
 enabled?: boolean;
 orderField?: string;
 mode?: "drag&drop" | "buttons";
 }
 | undefined,
) {
 if (!left && !right) return undefined;
 return {
 ...(left ?? {}),
 ...(right ?? {}),
 };
}

function mergeDeleteMutationConfig(
 left: ModelFormNestedDeleteMutationConfig | undefined,
 right: ModelFormNestedDeleteMutationConfig | undefined,
) {
 if (!left && !right) return undefined;
 return {
 ...(left ?? {}),
 ...(right ?? {}),
 };
}

export function parseRelationNestedFormConfig(
 value: unknown,
): RelationNestedFormConfig {
 const record = toOptionalRecord(value);
 if (!record) return {};

 const layout = toOptionalRecord(record.layout);
 const rawColumns = layout?.columns ?? record.columns;

 return {
 ...(toOptionalBoolean(record.enabled) !== undefined
 ? { enabled: toOptionalBoolean(record.enabled) }
 : {}),
 ...(toOptionalString(record.title) ? { title: toOptionalString(record.title) } : {}),
 ...(toOptionalString(record.description)
 ? { description: toOptionalString(record.description) }
 : {}),
 ...(toOptionalStringArray(record.fields)
 ? { fields: toOptionalStringArray(record.fields) }
 : {}),
 ...(toOptionalStringArray(record.excludeFields)
 ? { excludeFields: toOptionalStringArray(record.excludeFields) }
 : {}),
 ...(toOptionalStringArray(record.exclude_fields)
 ? { excludeFields: toOptionalStringArray(record.exclude_fields) }
 : {}),
 ...(parseFieldsOrderMode(record.fieldsOrder)
 ? { fieldsOrder: parseFieldsOrderMode(record.fieldsOrder) }
 : {}),
 ...(parseFieldsOrderMode(record.fields_order)
 ? { fieldsOrder: parseFieldsOrderMode(record.fields_order) }
 : {}),
 ...(parseFieldsOrderMode(record.orderMode)
 ? { fieldsOrder: parseFieldsOrderMode(record.orderMode) }
 : {}),
 ...(parseFieldsOrderMode(record.order_mode)
 ? { fieldsOrder: parseFieldsOrderMode(record.order_mode) }
 : {}),
 ...(toOptionalStringArray(record.customOrder)
 ? { customOrder: toOptionalStringArray(record.customOrder) }
 : {}),
 ...(toOptionalStringArray(record.custom_order)
 ? { customOrder: toOptionalStringArray(record.custom_order) }
 : {}),
 ...(toOptionalStringArray(record.customOrders)
 ? { customOrder: toOptionalStringArray(record.customOrders) }
 : {}),
 ...(toOptionalStringArray(record.custom_orders)
 ? { customOrder: toOptionalStringArray(record.custom_orders) }
 : {}),
 ...(toOptionalNumber(rawColumns) !== undefined
 ? {
 columns: toOptionalNumber(rawColumns),
 }
 : {}),
 ...(toOptionalBoolean(record.collapsible) !== undefined
 ? { collapsible: toOptionalBoolean(record.collapsible) }
 : {}),
 ...(toOptionalRecord(record.sectionOverrides)
 ? { sectionOverrides: toOptionalRecord(record.sectionOverrides) ?? undefined }
 : {}),
 ...(toOptionalRecord(record.section_overrides)
 ? { sectionOverrides: toOptionalRecord(record.section_overrides) ?? undefined }
 : {}),
 ...(toOptionalString(record.itemLabel)
 ? { itemLabel: toOptionalString(record.itemLabel) }
 : {}),
 ...(toOptionalString(record.item_label)
 ? { itemLabel: toOptionalString(record.item_label) }
 : {}),
 ...(parseAddButtonConfig(record.addButton)
 ? { addButton: parseAddButtonConfig(record.addButton) }
 : {}),
 ...(parseAddButtonConfig(record.add_button)
 ? { addButton: parseAddButtonConfig(record.add_button) }
 : {}),
 ...(parseSortableConfig(record.sortable)
 ? { sortable: parseSortableConfig(record.sortable) }
 : {}),
 ...(parseSortableConfig(record.ordering)
 ? { sortable: parseSortableConfig(record.ordering) }
 : {}),
 ...(toOptionalNumber(record.minItems) !== undefined
 ? { minItems: toOptionalNumber(record.minItems) }
 : {}),
 ...(toOptionalNumber(record.min_items) !== undefined
 ? { minItems: toOptionalNumber(record.min_items) }
 : {}),
 ...(toOptionalNumber(record.maxItems) !== undefined
 ? { maxItems: toOptionalNumber(record.maxItems) }
 : {}),
 ...(toOptionalNumber(record.max_items) !== undefined
 ? { maxItems: toOptionalNumber(record.max_items) }
 : {}),
 ...(parseScalarListOperation(record.scalarListOperation)
 ? {
 scalarListOperation: parseScalarListOperation(
 record.scalarListOperation,
 ),
 }
 : {}),
 ...(parseScalarListOperation(record.scalar_list_operation)
 ? {
 scalarListOperation: parseScalarListOperation(
 record.scalar_list_operation,
 ),
 }
 : {}),
 ...(parseRemoveOperation(record.removeOperation)
 ? { removeOperation: parseRemoveOperation(record.removeOperation) }
 : {}),
 ...(parseRemoveOperation(record.remove_operation)
 ? { removeOperation: parseRemoveOperation(record.remove_operation) }
 : {}),
 ...(parseDeleteMutationConfig(record.deleteMutation)
 ? { deleteMutation: parseDeleteMutationConfig(record.deleteMutation) }
 : {}),
 ...(parseDeleteMutationConfig(record.delete_mutation)
 ? { deleteMutation: parseDeleteMutationConfig(record.delete_mutation) }
 : {}),
 ...(toOptionalRecord(record.metadata)
 ? { metadata: toOptionalRecord(record.metadata) }
 : {}),
 };
}

function normalizeNestedDefinition<TValues extends Record<string, unknown>>(
 value: ModelFormNestedDefinition<TValues> | undefined,
): ModelFormNestedDefinition<TValues> {
 if (!value || typeof value !== "object") {
 return { enabled: true };
 }

 const normalized: ModelFormNestedDefinition<TValues> = {
 ...value,
 };

 if (normalized.enabled === undefined) {
 normalized.enabled = true;
 }

 normalized.onlyFields = mergePathLists(normalized.onlyFields);
 normalized.excludeFields = mergePathLists(normalized.excludeFields);

 return normalized;
}

export function normalizeNestedControls<TValues extends Record<string, unknown>>(
 nested: ModelFormNestedConfig<TValues> | undefined,
): Record<string, ModelFormNestedDefinition<TValues>> | undefined {
 if (!nested) return undefined;

 if (Array.isArray(nested)) {
 const normalizedEntries = nested
 .map((path) => String(path ?? "").trim())
 .filter(Boolean);
 if (!normalizedEntries.length) return undefined;
 return normalizedEntries.reduce<Record<string, ModelFormNestedDefinition<TValues>>>(
 (acc, path) => {
 acc[path] = { enabled: true };
 return acc;
 },
 {},
 );
 }

 if (typeof nested !== "object") return undefined;

 const entries = Object.entries(nested as Record<string, unknown>)
 .map(([path, value]) => [String(path ?? "").trim(), value] as const)
 .filter(([path]) => Boolean(path));
 if (!entries.length) return undefined;

 const result: Record<string, ModelFormNestedDefinition<TValues>> = {};
 entries.forEach(([path, value]) => {
 result[path] = normalizeNestedDefinition(
 value as ModelFormNestedDefinition<TValues>,
 );
 });
 return result;
}

export function mergePathLists(...lists: Array<string[] | undefined>): string[] {
 const merged = new Set<string>();
 lists.forEach((list) => {
 list?.forEach((value) => {
 const normalized = String(value).trim();
 if (normalized) {
 merged.add(normalized);
 }
 });
 });
 return Array.from(merged);
}

export { mergeAddButtonConfig, mergeSortableConfig };
export { mergeDeleteMutationConfig };
