import type React from "react";
import type { QueryHookOptions } from "@apollo/client";
import type { ModelQuerySelectionTree } from "@/shared/api/graphql/graphql/queries/types";
import type {
  ModelMetadata,
  MutationMetadata,
  TemplateInfo,
} from "@/shared/api/graphql/graphql/metadata/types";
import type { ModelFormProps } from "@/widgets/model-form/types.model";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import type {
  NoAccessBehavior,
  PermissionBag,
  SectionLoadingStrategy,
  SectionDefinition,
  SectionPermissionChecker,
  SectionRuntimeCtx,
} from "../sectionTypes";

export type ModelDynamicDetailProps = {
  app: string;
  model: string;
  id: string | number;
  baseDetail?: ModelDynamicDetailConfig;
};

export type ModelDynamicDetailHandle = {
  refetch: () => Promise<unknown>;
  getSnapshot: () => ModelDynamicDetailSnapshot;
};

export type ModelDynamicDetailSnapshot = {
  data: Record<string, unknown> | null;
  metadata: ModelMetadata | null;
  loading: boolean;
  error: Error | null;
  deleted: boolean;
};

export type ModelDynamicDetailHeaderTitleResolver = (
  data: Record<string, unknown> | null,
) => React.ReactElement | string;
export type ModelDynamicDetailHeaderDescriptionResolver = (
  data: Record<string, unknown> | null,
) => React.ReactElement | string;

/** Props provided to each custom header action renderer. */
export type ModelDynamicDetailHeaderActionRenderProps = {
  app: string;
  model: string;
  id: string;
  data: Record<string, unknown> | null;
  metadata: ModelMetadata | null;
  refetch: () => Promise<unknown>;
};

/** A single custom header action descriptor. */
export type ModelDynamicDetailHeaderActionConfig = {
  position?: number;
  render: (
    props: ModelDynamicDetailHeaderActionRenderProps,
  ) => React.ReactElement;
};

/** Resolves custom header actions for the current detail state. */
export type ModelDynamicDetailHeaderActionResolver = (
  ctx: ModelDynamicDetailHeaderActionRenderProps,
) => ModelDynamicDetailHeaderActionConfig[];

export type ModelDynamicDetailConfig = {
  className?: string;
  header?: {
    /**
     * Resolve the rendered header title content shown inside the detail header block.
     */
    title?: ModelDynamicDetailHeaderTitleResolver;
    /**
     * Resolve custom rendered toolbar actions shown in the detail header block.
     */
    actions?: ModelDynamicDetailHeaderActionResolver;
    /**
     * Optional pass-through for DynamicDetail header section props.
     * This enables visibility, permissions, loading, and frame-level behavior control.
     */
    frame?: {
      title?: SectionDefinition["title"];
      description?:
        | string
        | ModelDynamicDetailHeaderDescriptionResolver;
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
  layout?: ModelDynamicDetailLayoutConfig;
  nestedFields?: Record<string, ModelDynamicDetailNestedConfig>;
  actions?: ModelDynamicDetailActionsConfig;
  queryOptions?: {
    fetchPolicy?: QueryHookOptions<Record<string, unknown>, Record<string, unknown>>["fetchPolicy"];
    errorPolicy?: QueryHookOptions<Record<string, unknown>, Record<string, unknown>>["errorPolicy"];
  };
};

export type ModelDynamicDetailRenderContext = {
  app: string;
  model: string;
  id: string;
  data: Record<string, unknown> | null;
  metadata: ModelMetadata | null;
};

export type ModelDynamicDetailFieldRenderContext = {
  value: unknown;
  record: Record<string, unknown>;
  path: string;
  field: ModelDynamicDetailFieldConfig;
  sectionId: string;
};

export type ModelDynamicDetailFieldConfig = {
  path: string;
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
  render?: (ctx: ModelDynamicDetailFieldRenderContext) => React.ReactNode;
};

export type ModelDynamicDetailRowConfig = {
  id?: string;
  columns?: number;
  fields: Array<string | ModelDynamicDetailFieldConfig>;
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

export type ModelDynamicDetailSectionConfig = {
  id: string;
  /** Optional tab target. If absent, section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  /** Responsive span for the section container in the outer section grid. */
  containerSpan?: ModelDynamicDetailSectionContainerSpan;
  columns?: number;
  rows?: ModelDynamicDetailRowConfig[];
  fields?: Array<string | ModelDynamicDetailFieldConfig>;
  visible?: (ctx: ModelDynamicDetailRenderContext) => boolean;
};

export type ModelDynamicDetailCustomSectionConfig = {
  id: string;
  /** Optional tab target. If absent, section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  visible?: (ctx: ModelDynamicDetailRenderContext) => boolean;
  render: (ctx: ModelDynamicDetailRenderContext) => React.ReactNode;
};

/**
 * Tab descriptor used to route sections into DynamicDetail tabs.
 */
export type ModelDynamicDetailTabConfig = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  order?: number;
  loadingStrategy?: SectionLoadingStrategy;
  permissions?: string[];
  visible?: (ctx: ModelDynamicDetailRenderContext) => boolean;
};

export type ModelDynamicDetailLayoutConfig = {
  tabs?: ModelDynamicDetailTabConfig[];
  includeFields?: string[];
  excludeFields?: string[];
  fieldOverrides?: Record<string, Omit<ModelDynamicDetailFieldConfig, "path">>;
  sections?: ModelDynamicDetailSectionConfig[];
  customSections?: ModelDynamicDetailCustomSectionConfig[];
  includeUnassignedFields?: boolean;
  defaultColumns?: number;
};

export type ModelDynamicDetailNestedConfig = {
  /** Optional host section id override used for nested section context. */
  sectionId?: string;
  /** Optional tab target. If absent, nested section is rendered in body. */
  tabId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  mode?: "auto" | "table" | "object";
  fields?: Array<string | ModelDynamicDetailFieldConfig>;
  selection?: string | ModelQuerySelectionTree;
  columns?: number;
  table?: {
    initialPageSize?: number;
    enableQuickSearch?: boolean;
    enableSorting?: boolean;
  };
};

export type ModelDynamicDetailActionContext = {
  app: string;
  model: string;
  id: string;
  data: Record<string, unknown> | null;
  metadata: ModelMetadata | null;
};

export type ModelDynamicDetailActionsConfig = {
  showUpdate?: boolean;
  showDelete?: boolean;
  showTemplates?: boolean;
  showCustomMutations?: boolean;
  onUpdate?: (ctx: ModelDynamicDetailActionContext) => void | Promise<void>;
  onDeleted?: (
    ctx: ModelDynamicDetailActionContext,
  ) => void | Promise<void | boolean>;
  navigateBack?: () => void;
  permissions?: {
    canUpdate?: boolean | ((ctx: ModelDynamicDetailActionContext) => boolean);
    canDelete?: boolean | ((ctx: ModelDynamicDetailActionContext) => boolean);
    canRunTemplate?: (
      template: TemplateInfo,
      ctx: ModelDynamicDetailActionContext,
    ) => boolean;
    canRunMutation?: (
      mutation: MutationMetadata,
      ctx: ModelDynamicDetailActionContext,
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
      Omit<ModelFormProps<Record<string, unknown>>, "app" | "model">
    >;
  };
};
