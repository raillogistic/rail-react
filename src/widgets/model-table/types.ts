import type { ReactElement, ReactNode } from "react";
import { FilterFormState } from "@/widgets/model-table/filtering/types";
import type {
 FormFieldPath,
 FormObjectValue,
} from "@/widgets/model-form/types/props";

// ============================================================================
// GraphQL Metadata Types (Mirrors rail-django/extensions/metadata/types.py)
// ============================================================================

export interface Choice {
 value: string;
 label: string;
 group?: string;
 disabled?: boolean;
}

export interface ValidatorInfo {
 type: string;
 params?: string; // JSON string
 message?: string;
}

export interface FSMTransition {
 name: string;
 source: string[];
 target: string;
 label?: string;
 description?: string;
 permission?: string;
 allowed: boolean;
}

export interface FieldSchema {
 // Identity
 name: string;
 fieldName: string;
 verboseName: string;
 helpText?: string;

 // Type info
 fieldType: string; // e.g. "String", "Date", "Boolean"
 graphqlType: string;
 pythonType?: string;

 // Constraints
 required: boolean;
 nullable: boolean;
 blank: boolean;
 editable: boolean;
 unique: boolean;

 // Value constraints
 maxLength?: number;
 minLength?: number;
 maxValue?: number;
 minValue?: number;
 decimalPlaces?: number;
 maxDigits?: number;

 // Choices
 choices?: Choice[];

 // Default
 defaultValue?: string; // JSON string
 hasDefault: boolean;
 autoNow: boolean;
 autoNowAdd: boolean;

 // Validators
 validators?: ValidatorInfo[];
 regexPattern?: string;

 // Permissions
 readable: boolean;
 writable: boolean;
 visibility: string;

 // Classification flags
 isPrimaryKey: boolean;
 isIndexed: boolean;
 isRelation: boolean;
 isComputed: boolean;
 isFile: boolean;
 isImage: boolean;
 isJson: boolean;
 isDate: boolean;
 isDatetime: boolean;
 isNumeric: boolean;
 isBoolean: boolean;
 isText: boolean;
 isRichText: boolean;
 isFsmField: boolean;

 // Relation hints (for relationship fields synthesized in the client)
 relationLookupField?: string;

 // FSM
 fsmTransitions?: FSMTransition[];

 // Custom metadata
 customMetadata?: string; // JSON string
}

export interface RelationshipSchema {
 name: string;
 fieldName: string;
 verboseName: string;
 helpText?: string;

 // Related model
 relatedApp: string;
 relatedModel: string;
 relatedModelVerbose: string;

 // Relationship type
 relationType: string;
 isReverse: boolean;
 isToOne: boolean;
 isToMany: boolean;

 // Config
 onDelete?: string;
 relatedName?: string;
 throughModel?: string;

 // Constraints
 required: boolean;
 nullable: boolean;
 editable: boolean;

 // Lookup
 lookupField: string;
 searchFields?: string[];

 // Permissions
 readable: boolean;
 writable: boolean;
 canCreateInline: boolean;

 // Nested operations metadata (JSON string)
 relationOperations?: string;

 // Custom
 customMetadata?: string; // JSON string
}

export interface FilterOptionSchema {
 name: string;
 lookup: string;
 label: string;
 helpText?: string;
 choices?: Choice[];
 graphqlType?: string;
 isList?: boolean;
}

export interface FilterSchema {
 name: string;
 fieldName: string;
 fieldLabel: string;
 baseType?: string;
 isNested: boolean;
 relatedModel?: string;
 options: FilterOptionSchema[];

 // Nested filter style
 filterInputType?: string;
 availableOperators?: string[];
}

export interface FilterConfig {
 style: "flat" | "nested";
 argumentName: string;
 inputTypeName: string;
 supportsAnd: boolean;
 supportsOr: boolean;
 supportsNot: boolean;
 supportsQuick?: boolean;
 dualModeEnabled: boolean;
 supportsFts: boolean;
 supportsAggregation: boolean;
 presets?: unknown[]; // Defined more specifically if needed
 computedFilters?: unknown[];
}

export interface MutationInputFieldSchema {
 name: string;
 fieldName?: string;
 fieldType?: string;
 graphqlType?: string;
 required?: boolean;
 defaultValue?: unknown;
 description?: string;
 choices?: Choice[];
 relatedModel?: string;
}

export interface MutationSchema {
 name: string;
 operation: string;
 description?: string;
 methodName?: string | null;
 inputFields?: MutationInputFieldSchema[];
 inputType?: string | null;
 returnType?: string | null;
 allowed: boolean;
 requiredPermissions?: string[];
 reason?: string | null;
 mutationType?: string | null;
 modelName?: string | null;
 formConfig?: string | Record<string, unknown> | null;
 successMessage?: string | null;
 errorMessages?: string | Record<string, unknown> | null;
 action?: string | Record<string, unknown> | null;
 requiresAuthentication?: boolean | null;
}

export interface RowMutationPermissions {
 canUpdate?: boolean | null;
 canDelete?: boolean | null;
 updateReason?: string | null;
 deleteReason?: string | null;
}

export interface ModelPermissions {
 canList: boolean;
 canRetrieve: boolean;
 canCreate: boolean;
 canUpdate: boolean;
 canDelete: boolean;
 canBulkCreate: boolean;
 canBulkUpdate: boolean;
 canBulkDelete: boolean;
 canExport: boolean;
 denialReasons?: string; // JSON string
}

export interface TemplateClientField {
 name: string;
 type?: string | null;
}

export interface TemplateInfo {
 key: string;
 templateType?: string;
 title: string;
 endpoint: string;
 urlPath?: string;
 guard?: string | null;
 requireAuthentication?: boolean;
 roles?: string[];
 permissions?: string[];
 allowed?: boolean;
 denialReason?: string | null;
 allowClientData?: boolean;
 clientDataFields?: string[];
 clientDataSchema?: string | TemplateClientField[] | null;
}

export interface ModelSchema {
 // Identity
 app: string;
 model: string;
 verboseName: string;
 verboseNamePlural: string;

 // Structure
 primaryKey: string;
 ordering?: string[];
 uniqueTogether?: string[][];

 // Fields
 fields: FieldSchema[];
 relationships: RelationshipSchema[];

 // Filters
 filters: FilterSchema[];
 filterConfig?: FilterConfig;
 relationFilters?: unknown[]; // Define recursively if needed

 // Mutations
 mutations: MutationSchema[];

 // Permissions
 permissions: ModelPermissions;

 // Hints
 fieldGroups?: unknown[];
 templates?: TemplateInfo[];

 // Cache
 metadataVersion: string;
 customMetadata?: string; // JSON string
}

// ============================================================================
// Component State Types
// ============================================================================

export interface PaginationState {
 page: number;
 perPage: number;
 total: number;
 numPages: number;
 totalKnown: boolean;
 hasNextPage: boolean;
 hasPreviousPage: boolean;
}

export interface QueryPageInfo {
 totalCount?: number | null;
 pageCount?: number | null;
 hasNextPage?: boolean | null;
 hasPreviousPage?: boolean | null;
}

export interface QueryPageData {
 pageInfo?: QueryPageInfo | null;
 items?: Record<string, unknown>[] | null;
 [key: string]: unknown;
}

export type TableDensity = "compact" | "comfortable" | "spacious";

export type ColumnOrderingMode = "persisted" | "config";
export type ColumnOrderingAppend = "start" | "end";

export interface BaseModelTableColumnOrderingConfig<
 TAccessor extends string = string,
> {
 order?: TAccessor[]; // preferred column order (by column id)
 mode?: ColumnOrderingMode; // persisted (default) or config-first
 append?: ColumnOrderingAppend; // where to place unspecified columns
 draggable?: boolean; // allow drag-and-drop reordering
 locked?: TAccessor[]; // columns that cannot be dragged
}

export interface ColumnVisibilityState {
 [columnId: string]: boolean;
}

export interface ColumnWidthState {
 [columnId: string]: number;
}

export interface TableContextState {
 // Data
 data: Record<string, unknown>[];
 queryPage?: QueryPageData | null;
 loading: boolean;
 error?: Error | null;

 // Metadata
 metadata?: ModelSchema | null;
 metadataLoading: boolean;
 metadataError?: Error | null;

 // State
 pagination: PaginationState;
 columnVisibility: ColumnVisibilityState;
 columnWidths: ColumnWidthState;
 columnOrder: string[];
 rowSelection: Record<string, boolean>;
 groupingField: string | null;
 groupCollapsed: Record<string, boolean>;
 activeColumnFilter: string | null;
 dragModeEnabled: boolean;
 density: TableDensity;
 wrapCells: boolean;
 refreshKey: number;

 // Filters
 quickSearch: string;
 advancedFilters: FilterFormState;
 filterVariables?: Record<string, unknown>; // FilterQueryVariables

 // Actions
 setPage: (page: number) => void;
 setPerPage: (perPage: number) => void;
 setColumnVisibility: (visibility: ColumnVisibilityState) => void;
 setColumnWidths: (widths: ColumnWidthState) => void;
 setColumnOrder: (order: string[]) => void;
 setRowSelection: (selection: Record<string, boolean>) => void;
 setGroupingField: (field: string | null) => void;
 setGroupCollapsed: (collapsed: Record<string, boolean>) => void;
 setActiveColumnFilter: (columnId: string | null) => void;
 setDragModeEnabled: (enabled: boolean) => void;
 setDensity: (density: TableDensity) => void;
 setWrapCells: (wrap: boolean) => void;
 setQuickSearch: (term: string) => void;
 setAdvancedFilters: (filters: FilterFormState, variables?: Record<string, unknown>) => void;
 refresh: () => void;

 // Internal Data Fetching Hooks
 _setPageInfo: (info: {
 totalCount?: number | null;
 pageCount?: number | null;
 hasNextPage?: boolean | null;
 hasPreviousPage?: boolean | null;
 }) => void;
 _setQueryPage: (queryPage: QueryPageData | null) => void;
 _setData: (data: Record<string, unknown>[], loading: boolean, error?: Error) => void;
}

// ============================================================================
// BaseModelTable Configuration Types
// ============================================================================

export type BaseModelTableRefetch = (
 variables?: Record<string, unknown>,
) => Promise<unknown>;

type ModelTableRelatedObject<T> =
 NonNullable<T> extends ReadonlyArray<infer TValue>
 ? FormObjectValue<NonNullable<TValue>>
 : NonNullable<T> extends Array<infer TValue>
   ? FormObjectValue<NonNullable<TValue>>
   : FormObjectValue<NonNullable<T>>;

export type ModelTableRelationKey<TSource extends object> =
 string extends keyof TSource
 ? string
 : {
     [K in Extract<keyof TSource, string>]:
       ModelTableRelatedObject<TSource[K]> extends never
         ? never
         : K;
   }[Extract<keyof TSource, string>];

export type ModelTableRelationFieldPath<
 TSource extends object,
 TRelationKey extends ModelTableRelationKey<TSource> = ModelTableRelationKey<TSource>,
> = string extends keyof TSource
 ? string
 : TRelationKey extends keyof TSource
   ? FormFieldPath<ModelTableRelatedObject<TSource[TRelationKey]>>
   : never;

export type ModelTableRelationCountAccessor<TSource extends object> =
 string extends keyof TSource
 ? string
 : {
     [K in Extract<keyof TSource, string>]:
       NonNullable<TSource[K]> extends ReadonlyArray<any> | Array<any>
         ? `${K}Count`
         : never;
   }[Extract<keyof TSource, string>];

export type ModelTableAccessorPath<TSource extends object> =
 | FormFieldPath<TSource>
 | ModelTableRelationCountAccessor<TSource>;

export type DynamicModelTableRow<TSource extends object = Record<string, unknown>> =
 TSource & {
   rowPermissions?: RowMutationPermissions | null;
 } & Record<string, unknown>;

export type BaseModelTableColumnActionContext<
 TRow extends Record<string, unknown> = Record<string, unknown>,
> = {
 row: TRow;
 data: TRow[];
 refetch?: BaseModelTableRefetch;
};

type BaseModelTableColumnActionBase = {
 key?: string;
 icon?: ReactNode;
 variant?: "default" | "destructive";
 className?: string;
 disabled?: boolean;
};

export type BaseModelTableColumnActionRender<
 TRow extends Record<string, unknown> = Record<string, unknown>,
> =
 BaseModelTableColumnActionBase & {
 render: (
 context: BaseModelTableColumnActionContext<TRow>,
 ) => ReactNode;
 };

export type BaseModelTableColumnActionClick<
 TRow extends Record<string, unknown> = Record<string, unknown>,
> =
 BaseModelTableColumnActionBase & {
 label: string;
 onClick: (
 context: BaseModelTableColumnActionContext<TRow>,
 ) => void | Promise<void>;
 };

export type BaseModelTableColumnAction<
 TRow extends Record<string, unknown> = Record<string, unknown>,
> =
 | BaseModelTableColumnActionRender<TRow>
 | BaseModelTableColumnActionClick<TRow>;

export type BaseModelTableColumnActionsInput<
 TRow extends Record<string, unknown> = Record<string, unknown>,
> =
 | BaseModelTableColumnAction<TRow>[]
 | ((context: BaseModelTableColumnActionContext<TRow>) =>
 | BaseModelTableColumnAction<TRow>[]
 | undefined);

export type BaseModelTableRenderContext<
 TRow extends Record<string, unknown> = Record<string, unknown>,
 TAccessor extends string = string,
> = {
 accessor: TAccessor;
 columnId: string;
 data: TRow[];
 refetch?: BaseModelTableRefetch;
};

export type BaseModelTableFieldRender<
 TRow extends Record<string, unknown> = Record<string, unknown>,
 TAccessor extends string = string,
> = (
 value: unknown,
 row: TRow,
 context: BaseModelTableRenderContext<TRow, TAccessor>,
) => ReactNode;

export type BaseModelTableFieldRenderMap<
 TRow extends Record<string, unknown> = Record<string, unknown>,
 TAccessor extends string = string,
> = Partial<Record<
 TAccessor,
 (
 value: unknown,
 row: TRow,
 data: TRow[],
 refetch?: BaseModelTableRefetch,
 ) => ReactNode
>>;

export type BaseModelTableField<
 TAccessor extends string = string,
 TRow extends Record<string, unknown> = Record<string, unknown>,
> =
 | TAccessor
 | {
 accessor: TAccessor;
 title?: string;
 render?: BaseModelTableFieldRender<TRow, TAccessor>;
 };

export type BaseModelTableFieldAddOrder<TAccessor extends string = string> =
 | number
 | {
 after?: TAccessor;
 before?: TAccessor;
 };

export type BaseModelTableFieldAdd<TAccessor extends string = string> = {
 accessor: TAccessor;
 title?: string;
 order?: BaseModelTableFieldAddOrder<TAccessor>;
};

export type BaseModelTableFieldsConfig<
 TSource extends object = Record<string, unknown>,
 TRow extends Record<string, unknown> = DynamicModelTableRow<TSource>,
 TAccessor extends string = ModelTableAccessorPath<TSource>,
> = {
 include?: BaseModelTableField<TAccessor, TRow>[];
 add?: BaseModelTableFieldAdd<TAccessor>[];
 exclude?: TAccessor[];
 render?: BaseModelTableFieldRenderMap<TRow, TAccessor>;
};

export type BaseModelTableFieldsInput<
 TSource extends object = Record<string, unknown>,
 TRow extends Record<string, unknown> = DynamicModelTableRow<TSource>,
 TAccessor extends string = ModelTableAccessorPath<TSource>,
> =
 | BaseModelTableField<TAccessor, TRow>[]
 | BaseModelTableFieldsConfig<TSource, TRow, TAccessor>;

export type BaseModelTableRelationConfig<
 TSource extends object = Record<string, unknown>,
 TRelationKey extends ModelTableRelationKey<TSource> = ModelTableRelationKey<TSource>,
> = {
 fields?: ModelTableRelationFieldPath<TSource, TRelationKey>[];
 display?: ModelTableRelationFieldPath<TSource, TRelationKey>;
};

export type BaseModelTableRelationStatsOverrideData<
 TSource extends object = Record<string, unknown>,
 TRelationKey extends ModelTableRelationKey<TSource> = ModelTableRelationKey<TSource>,
> = {
 row: DynamicModelTableRow<TSource>;
 relationName: TRelationKey;
 loading: boolean;
 error: string | null;
 stats: Record<string, unknown> | null;
};

export type BaseModelTableRelationStatsOverride<
 TSource extends object = Record<string, unknown>,
 TRelationKey extends ModelTableRelationKey<TSource> = ModelTableRelationKey<TSource>,
> = (
 data: BaseModelTableRelationStatsOverrideData<TSource, TRelationKey>,
) => ReactElement;

export type BaseModelTableRelationStatsConfig<
 TSource extends object = Record<string, unknown>,
 TRelationKey extends ModelTableRelationKey<TSource> = ModelTableRelationKey<TSource>,
> = {
 enabled?: boolean;
 include?: TRelationKey[];
 exclude?: TRelationKey[];
 overrides?: Partial<
   Record<TRelationKey, BaseModelTableRelationStatsOverride<TSource, TRelationKey>>
 >;
};

export type BaseModelTableColumnDef<
 TRow extends Record<string, unknown> = Record<string, unknown>,
 TAccessor extends string = string,
> = {
 id: string;
 accessor: TAccessor;
 title: string;
 render?: BaseModelTableFieldRender<TRow, TAccessor>;
};
