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
  PermissionBag,
  SectionPermissionChecker,
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

export type ModelDynamicDetailConfig = {
  className?: string;
  runtime?: {
    locale?: string;
    timezone?: string;
    user?: unknown;
    permissions?: PermissionBag;
    can?: SectionPermissionChecker;
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

export type ModelDynamicDetailSectionConfig = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  columns?: number;
  rows?: ModelDynamicDetailRowConfig[];
  fields?: Array<string | ModelDynamicDetailFieldConfig>;
  visible?: (ctx: ModelDynamicDetailRenderContext) => boolean;
};

export type ModelDynamicDetailCustomSectionConfig = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  order?: number;
  visible?: (ctx: ModelDynamicDetailRenderContext) => boolean;
  render: (ctx: ModelDynamicDetailRenderContext) => React.ReactNode;
};

export type ModelDynamicDetailLayoutConfig = {
  includeFields?: string[];
  excludeFields?: string[];
  fieldOverrides?: Record<string, Omit<ModelDynamicDetailFieldConfig, "path">>;
  sections?: ModelDynamicDetailSectionConfig[];
  customSections?: ModelDynamicDetailCustomSectionConfig[];
  includeUnassignedFields?: boolean;
  defaultColumns?: number;
};

export type ModelDynamicDetailNestedConfig = {
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
    modelFormProps?: Partial<
      Omit<ModelFormProps<Record<string, unknown>>, "app" | "model">
    >;
  };
};
