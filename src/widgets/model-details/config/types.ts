import type React from "react";
import type { QueryHookOptions } from "@apollo/client";
import type { ModelQuerySelectionTree } from "@/shared/api/graphql/graphql/queries/types";
import type {
  ModelMetadata,
  MutationMetadata,
  TemplateInfo,
} from "@/shared/api/graphql/graphql/metadata/types";
import type {
  FormFieldPath,
  FormObjectValue,
} from "@/widgets/model-form/types";
import type {
  ModelFormProps,
  ModelFormValueShape,
} from "@/widgets/model-form/types.model";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import type {
  NoAccessBehavior,
  PermissionBag,
  SectionLoadingStrategy,
  SectionDefinition,
  SectionPermissionChecker,
  SectionRuntimeCtx,
} from "../sectionTypes";

type ResolvedModelDynamicDetailFormValues<
  TRecord extends object,
> = ModelFormValueShape<TRecord> extends Record<string, unknown>
  ? ModelFormValueShape<TRecord>
  : Record<string, unknown>;

type ModelDynamicDetailNoInfer<T> = [T][T extends any ? 0 : never];

type ModelDynamicDetailRelatedRecord<T> =
  NonNullable<T> extends ReadonlyArray<infer TValue>
    ? Extract<FormObjectValue<NonNullable<TValue>>, Record<string, unknown>>
    : NonNullable<T> extends Array<infer TValue>
      ? Extract<FormObjectValue<NonNullable<TValue>>, Record<string, unknown>>
      : Extract<FormObjectValue<NonNullable<T>>, Record<string, unknown>>;

export type ModelDynamicDetailFieldPath<
  TRecord extends object,
> = string extends keyof TRecord ? string : FormFieldPath<TRecord>;

export type ModelDynamicDetailRelationKey<
  TRecord extends object,
> = string extends keyof TRecord
  ? string
  : {
      [K in Extract<keyof TRecord, string>]:
        [ModelDynamicDetailRelatedRecord<TRecord[K]>] extends [never]
          ? never
          : K;
    }[Extract<keyof TRecord, string>];

export type ModelDynamicDetailNestedRecord<
  TRecord extends object,
  TRelationKey extends ModelDynamicDetailRelationKey<TRecord> = ModelDynamicDetailRelationKey<TRecord>,
> = string extends keyof TRecord
  ? Record<string, unknown>
  : TRelationKey extends keyof TRecord
    ? ModelDynamicDetailRelatedRecord<TRecord[TRelationKey]>
    : Record<string, unknown>;

export type ModelDynamicDetailNestedFieldPath<
  TRecord extends object,
  TRelationKey extends ModelDynamicDetailRelationKey<TRecord> = ModelDynamicDetailRelationKey<TRecord>,
> = string extends keyof TRecord
  ? string
  : TRelationKey extends keyof TRecord
    ? FormFieldPath<ModelDynamicDetailNestedRecord<TRecord, TRelationKey>>
    : string;

export type ModelDynamicDetailProps<
  TRecord extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  id: string | number;
  baseDetail?: ModelDynamicDetailConfig<ModelDynamicDetailNoInfer<TRecord>>;
};

export type ModelDynamicDetailHandle<
  TRecord extends object = Record<string, unknown>,
> = {
  refetch: () => Promise<unknown>;
  getSnapshot: () => ModelDynamicDetailSnapshot<TRecord>;
};

export type ModelDynamicDetailSnapshot<
  TRecord extends object = Record<string, unknown>,
> = {
  data: TRecord | null;
  metadata: ModelMetadata | null;
  loading: boolean;
  error: Error | null;
  deleted: boolean;
};

export type ModelDynamicDetailHeaderTitleResolver<
  TRecord extends object = Record<string, unknown>,
> = (
  data: TRecord | null,
) => React.ReactElement | string;
export type ModelDynamicDetailHeaderDescriptionResolver<
  TRecord extends object = Record<string, unknown>,
> = (
  data: TRecord | null,
) => React.ReactElement | string;

/** Props provided to each custom header action renderer. */
export type ModelDynamicDetailHeaderActionRenderProps<
  TRecord extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  id: string;
  data: TRecord | null;
  metadata: ModelMetadata | null;
  refetch: () => Promise<unknown>;
};

/** A single custom header action descriptor. */
export type ModelDynamicDetailHeaderActionConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  position?: number;
  render: (
    props: ModelDynamicDetailHeaderActionRenderProps<TRecord>,
  ) => React.ReactElement;
};

/** Resolves custom header actions for the current detail state. */
export type ModelDynamicDetailHeaderActionResolver<
  TRecord extends object = Record<string, unknown>,
> = (
  ctx: ModelDynamicDetailHeaderActionRenderProps<TRecord>,
) => ModelDynamicDetailHeaderActionConfig<TRecord>[];

export type ModelDynamicDetailConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  className?: string;
  header?: {
    /**
     * Resolve the rendered header title content shown inside the detail header block.
     */
    title?: ModelDynamicDetailHeaderTitleResolver<TRecord>;
    /**
     * Resolve custom rendered toolbar actions shown in the detail header block.
     */
    actions?: ModelDynamicDetailHeaderActionResolver<TRecord>;
    /**
     * Optional pass-through for DynamicDetail header section props.
     * This enables visibility, permissions, loading, and frame-level behavior control.
     */
    frame?: {
      title?: SectionDefinition["title"];
      description?:
        | string
        | ModelDynamicDetailHeaderDescriptionResolver<TRecord>;
      icon?: SectionDefinition["icon"];
      order?: SectionDefinition["order"];
      dataSource?: SectionDefinition["dataSource"];
      loadingStrategy?: SectionDefinition["loadingStrategy"];
      cacheKey?: SectionDefinition["cacheKey"];
      permissions?: SectionDefinition["permissions"];
      visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
      disabledIf?: SectionDefinition["disabledIf"];
      noAccessBehavior?: NoAccessBehavior;
      load?: SectionDefinition<{ ready: true }>["load"];
      select?: (ctx: SectionRuntimeCtx) => { ready: true } | undefined;
      skeleton?: SectionDefinition["skeleton"];
      empty?: SectionDefinition<{ ready: true }>["empty"];
      error?: SectionDefinition["error"];
      actions?: SectionDefinition<{ ready: true }>["actions"];
      testId?: SectionDefinition["testId"];
    };
  };
  runtime?: {
    locale?: string;
    timezone?: string;
    user?: unknown;
    permissions?: PermissionBag;
    can?: SectionPermissionChecker;
  };
  /**
   * Optional pass-through controls for the underlying DynamicDetail view.
   */
  view?: {
    initialTabId?: string;
    activeTabId?: string;
    onActiveTabChange?: (tabId: string) => void;
    sectionColumns?: number;
    resolveSectionContainer?: (
      section: SectionDefinition,
      tabId?: string,
    ) => { className?: string; style?: React.CSSProperties } | undefined;
  };
  layout?: ModelDynamicDetailLayoutConfig<TRecord>;
  nestedFields?: Partial<{
    [TRelationKey in ModelDynamicDetailRelationKey<TRecord>]: ModelDynamicDetailNestedConfig<
      TRecord,
      TRelationKey
    >;
  }>;
  actions?: ModelDynamicDetailActionsConfig<TRecord>;
  queryOptions?: {
    fetchPolicy?: QueryHookOptions<Record<string, unknown>, Record<string, unknown>>["fetchPolicy"];
    errorPolicy?: QueryHookOptions<Record<string, unknown>, Record<string, unknown>>["errorPolicy"];
  };
};

export type ModelDynamicDetailRenderContext<
  TRecord extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  id: string;
  data: TRecord | null;
  metadata: ModelMetadata | null;
};

export type ModelDynamicDetailFieldRenderContext<
  TRecord extends object = Record<string, unknown>,
> = {
  value: unknown;
  record: TRecord;
  path: ModelDynamicDetailFieldPath<TRecord>;
  field: ModelDynamicDetailFieldConfig<TRecord>;
  sectionId: string;
};

export type ModelDynamicDetailFieldConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  path: ModelDynamicDetailFieldPath<TRecord>;
  /** Sort order inside the current section. Lower values render first. */
  order?: number;
  /** Parent section identifier resolved at runtime. */
  sectionId?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  kind?: UnitFieldInput["kind"];
  colSpan?: number;
  rowSpan?: number;
  hidden?: boolean;
  emptyText?: string;
  format?: UnitFieldInput["format"];
  copyable?: boolean;
  copyValue?: string;
  render?: (ctx: ModelDynamicDetailFieldRenderContext<TRecord>) => React.ReactNode;
};

export type ModelDynamicDetailRowConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  id?: string;
  columns?: number;
  fields: Array<
    ModelDynamicDetailFieldPath<TRecord> | ModelDynamicDetailFieldConfig<TRecord>
  >;
};

/**
 * Responsive section container span values for the surrounding section grid.
 */
export type ModelDynamicDetailSectionContainerSpan = {
  base?: 1 | 2 | 3 | 4 | 5 | 6;
  sm?: 1 | 2 | 3 | 4 | 5 | 6;
  md?: 1 | 2 | 3 | 4 | 5 | 6;
  lg?: 1 | 2 | 3 | 4 | 5 | 6;
  xl?: 1 | 2 | 3 | 4 | 5 | 6;
  xxl?: 1 | 2 | 3 | 4 | 5 | 6;
};

export type ModelDynamicDetailSectionConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  id: string;
  /** Optional tab target. If absent, section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  /** Responsive span for the section container in the outer section grid. */
  containerSpan?: ModelDynamicDetailSectionContainerSpan;
  columns?: number;
  rows?: ModelDynamicDetailRowConfig<TRecord>[];
  fields?: Array<
    ModelDynamicDetailFieldPath<TRecord> | ModelDynamicDetailFieldConfig<TRecord>
  >;
  visible?: (ctx: ModelDynamicDetailRenderContext<TRecord>) => boolean;
};

export type ModelDynamicDetailCustomSectionConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  id: string;
  /** Optional tab target. If absent, section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  visible?: (ctx: ModelDynamicDetailRenderContext<TRecord>) => boolean;
  render: (ctx: ModelDynamicDetailRenderContext<TRecord>) => React.ReactNode;
};

/**
 * Tab descriptor used to route sections into DynamicDetail tabs.
 */
export type ModelDynamicDetailTabConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  order?: number;
  loadingStrategy?: SectionLoadingStrategy;
  permissions?: string[];
  visible?: (ctx: ModelDynamicDetailRenderContext<TRecord>) => boolean;
};

export type ModelDynamicDetailLayoutConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  tabs?: ModelDynamicDetailTabConfig<TRecord>[];
  includeFields?: ModelDynamicDetailFieldPath<TRecord>[];
  excludeFields?: ModelDynamicDetailFieldPath<TRecord>[];
  fieldOverrides?: Partial<{
    [TPath in ModelDynamicDetailFieldPath<TRecord>]: Omit<
      ModelDynamicDetailFieldConfig<TRecord>,
      "path"
    >;
  }>;
  sections?: ModelDynamicDetailSectionConfig<TRecord>[];
  customSections?: ModelDynamicDetailCustomSectionConfig<TRecord>[];
  includeUnassignedFields?: boolean;
  defaultColumns?: number;
};

export type ModelDynamicDetailNestedConfig<
  TRecord extends object = Record<string, unknown>,
  TRelationKey extends ModelDynamicDetailRelationKey<TRecord> = ModelDynamicDetailRelationKey<TRecord>,
> = {
  /** Optional host section id override used for nested section context. */
  sectionId?: string;
  /** Optional tab target. If absent, nested section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  mode?: "auto" | "table" | "object";
  fields?: Array<
    ModelDynamicDetailNestedFieldPath<TRecord, TRelationKey> | ModelDynamicDetailFieldConfig<ModelDynamicDetailNestedRecord<TRecord, TRelationKey>>
  >;
  selection?: string | ModelQuerySelectionTree;
  columns?: number;
  table?: {
    initialPageSize?: number;
    enableQuickSearch?: boolean;
    enableSorting?: boolean;
  };
};

export type ModelDynamicDetailActionContext<
  TRecord extends object = Record<string, unknown>,
> = {
  app: string;
  model: string;
  id: string;
  data: TRecord | null;
  metadata: ModelMetadata | null;
};

export type ModelDynamicDetailActionsConfig<
  TRecord extends object = Record<string, unknown>,
> = {
  showUpdate?: boolean;
  showDelete?: boolean;
  showTemplates?: boolean;
  showCustomMutations?: boolean;
  onUpdate?: (
    ctx: ModelDynamicDetailActionContext<TRecord>,
  ) => void | Promise<void>;
  onDeleted?: (
    ctx: ModelDynamicDetailActionContext<TRecord>,
  ) => void | Promise<void | boolean>;
  navigateBack?: () => void;
  permissions?: {
    canUpdate?:
      | boolean
      | ((ctx: ModelDynamicDetailActionContext<TRecord>) => boolean);
    canDelete?:
      | boolean
      | ((ctx: ModelDynamicDetailActionContext<TRecord>) => boolean);
    canRunTemplate?: (
      template: TemplateInfo,
      ctx: ModelDynamicDetailActionContext<TRecord>,
    ) => boolean;
    canRunMutation?: (
      mutation: MutationMetadata,
      ctx: ModelDynamicDetailActionContext<TRecord>,
    ) => boolean;
  };
  updateForm?: {
    enabled?: boolean;
    modalTitle?: string;
    width?: string;
    height?: string;
    /**
     * Refetches detail + metadata after a successful update form submit.
     * Defaults to `true`.
     */
    refetchOnSubmitSuccess?: boolean;
    modelFormProps?: Partial<
      Omit<
        ModelFormProps<ResolvedModelDynamicDetailFormValues<TRecord>, TRecord>,
        "app" | "model"
      >
    >;
  };
};
