/** Explicit Rail view configuration helpers shared with host administration pages. */
import type {
  ModelDynamicDetailConfig,
  ModelDynamicDetailCustomSectionConfig,
  ModelDynamicDetailFieldPath,
  ModelDynamicDetailNestedConfig,
  ModelDynamicDetailSectionConfig,
} from "@/widgets/model-details";
import type {
  ModelFormFieldPath,
  ModelFormFieldOverrides,
  ModelFormGeneratedSection,
  ModelFormNestedConfig,
} from "@/widgets/model-form";
import type { BaseModelTableFieldsInput } from "@/widgets/model-table";
export type AchatCrudViewConfig = {
  tableFields: BaseModelTableFieldsInput;
  formOnlyFields: string[];
  formSections: ModelFormGeneratedSection[];
  formFieldOverrides?: ModelFormFieldOverrides<Record<string, unknown>>;
  formNested?: ModelFormNestedConfig<Record<string, unknown>>;
  detailConfig: ModelDynamicDetailConfig;
};

export type AchatFormConfig = {
  onlyFields: string[];
  generatedSections: ModelFormGeneratedSection[];
};

function collectFormFields(
  sections: ModelFormGeneratedSection[],
): ModelFormFieldPath<Record<string, unknown>>[] {
  return sections.flatMap((section) =>
    section.fields.filter(
      (field): field is ModelFormFieldPath<Record<string, unknown>> =>
        typeof field === "string",
    ),
  );
}

function collectDetailFields(
  sections: ModelDynamicDetailSectionConfig[],
): ModelDynamicDetailFieldPath<Record<string, unknown>>[] {
  return sections.flatMap((section) =>
    (section.fields ?? []).filter(
      (field): field is ModelDynamicDetailFieldPath<Record<string, unknown>> =>
        typeof field === "string",
    ),
  );
}

export function defineCrudViewConfig(config: {
  tableFields: BaseModelTableFieldsInput;
  formSections: ModelFormGeneratedSection[];
  formFieldOverrides?: ModelFormFieldOverrides<Record<string, unknown>>;
  formNested?: ModelFormNestedConfig<Record<string, unknown>>;
  detailSections: ModelDynamicDetailSectionConfig[];
  detailCustomSections?: ModelDynamicDetailCustomSectionConfig[];
  detailNestedFields?: Record<string, ModelDynamicDetailNestedConfig>;
  detailFieldOverrides?: NonNullable<ModelDynamicDetailConfig["layout"]>["fieldOverrides"];
}): AchatCrudViewConfig {
  return {
    tableFields: config.tableFields as BaseModelTableFieldsInput,
    formOnlyFields: collectFormFields(config.formSections) as string[],
    formSections: config.formSections as ModelFormGeneratedSection[],
    formFieldOverrides: config.formFieldOverrides,
    formNested: config.formNested,
    detailConfig: {
      layout: {
        includeFields: collectDetailFields(config.detailSections) as string[],
        includeUnassignedFields: false,
        fieldOverrides: config.detailFieldOverrides,
        defaultColumns: 2,
        sections: config.detailSections as ModelDynamicDetailSectionConfig[],
        customSections:
          config.detailCustomSections as ModelDynamicDetailCustomSectionConfig[],
      },
      nestedFields: config.detailNestedFields,
    },
  };
}

export function defineFormConfig(
  generatedSections: ModelFormGeneratedSection[],
): AchatFormConfig {
  return {
    onlyFields: collectFormFields(generatedSections) as string[],
    generatedSections: generatedSections as ModelFormGeneratedSection[],
  };
}
