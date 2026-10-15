import type {
  ModelFormContract,
  ModelFormContractField,
  ModelFormContractRelation,
  ModelFormInitialData,
} from "@/widgets/model-form/types/generatedContract";
import type { SectionRuntimeCtx } from "../sectionTypes";
import type { UnitFieldInput } from "../units/unitFieldTypes";

export type ModelSectionManifestField = {
  path: string;
  label?: string;
  kind?: UnitFieldInput["kind"];
  hidden?: boolean;
  hint?: UnitFieldInput["hint"];
  emptyText?: UnitFieldInput["emptyText"];
  format?: UnitFieldInput["format"];
  copyable?: boolean;
  copyValue?: string;
  sectionId?: string;
  order?: number;
};

export type ModelSectionManifestSection = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  visible?: boolean;
  columns?: number;
  fields: Array<string | ModelSectionManifestField>;
};

export type ModelSectionManifest = {
  version?: string;
  include?: string[];
  exclude?: string[];
  fields?: Record<string, Omit<ModelSectionManifestField, "path">>;
  sections?: ModelSectionManifestSection[];
  includeUnassignedFields?: boolean;
  useContractSections?: boolean;
  relationLabelPriority?: string[];
};

export type ModelSectionFieldSource = "contractField" | "relation";

export type ModelSectionFieldCandidate = {
  source: ModelSectionFieldSource;
  path: string;
  label: string;
  value: unknown;
  hidden: boolean;
  kindHint: UnitFieldInput["kind"];
  field?: ModelFormContractField;
  relation?: ModelFormContractRelation;
  manifest?: Omit<ModelSectionManifestField, "path">;
};

export type ModelSectionResolvedGroup = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  columns?: number;
  fields: UnitFieldInput[];
};

export type ModelSectionEngineResult = {
  groups: ModelSectionResolvedGroup[];
  allFields: UnitFieldInput[];
};

export type ModelSectionEngineContext = {
  appLabel: string;
  modelName: string;
  objectId?: string;
  runtime: SectionRuntimeCtx;
  manifest?: ModelSectionManifest;
};

export type ModelSectionEnginePlugin = {
  name: string;
  preMapCandidate?: (
    candidate: ModelSectionFieldCandidate,
    ctx: ModelSectionEngineContext,
  ) => ModelSectionFieldCandidate | null | undefined;
  mapCandidate?: (
    candidate: ModelSectionFieldCandidate,
    ctx: ModelSectionEngineContext,
  ) => UnitFieldInput | null | undefined;
  postMapField?: (
    field: UnitFieldInput,
    candidate: ModelSectionFieldCandidate,
    ctx: ModelSectionEngineContext,
  ) => UnitFieldInput | null | undefined;
  transformResult?: (
    result: ModelSectionEngineResult,
    ctx: ModelSectionEngineContext,
  ) => ModelSectionEngineResult | undefined;
};

export type ModelSectionEngineInput = {
  contract: ModelFormContract;
  initialData?: ModelFormInitialData | null;
  manifest?: ModelSectionManifest;
  plugins?: ModelSectionEnginePlugin[];
  ctx: ModelSectionEngineContext;
};
