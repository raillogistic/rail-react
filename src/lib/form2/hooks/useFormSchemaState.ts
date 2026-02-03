import * as React from "react";
import type { FormSchema } from "../../form/inputs/types";
import type {
  FormMetadata,
  InlineCreateOverrides,
  ModelFormOrderingOptions,
  ModelFormSectionsControl,
} from "../types";
import {
  applyFieldOrderHints,
  applyInlineCreateControl,
  applyOrderingToSchema,
  buildCustomFieldOrderFactory,
} from "../utils/schema-ordering";
import {
  applySchemaOverrides,
  applySectionsControl,
} from "../utils/schema-sections";
import {
  buildFieldLabelMap,
  filterSchemaByEditability,
  filterSchemaByVisibility,
  filterSchemaToRequired,
  getFieldLabelFromMap,
} from "../utils/schema-filters";

export function useFormSchemaState<
  TValues extends Record<string, any> = Record<string, any>
>(
  schema: FormSchema<TValues> | null,
  metadata: FormMetadata | null,
  resolvedOrdering: ModelFormOrderingOptions | undefined,
  resolvedSectionsControl: ModelFormSectionsControl<TValues> | undefined,
  inlineCreateOverrides: InlineCreateOverrides | undefined,
  onlyRequired: boolean,
  metadataCustomOrder?: ModelFormOrderingOptions["customFieldOrder"]
) {
  const {
    customFieldOrder: orderingOverride,
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields = "metadata",
  } = resolvedOrdering ?? {};

  const resolvedCustomFieldOrder = React.useMemo(() => {
    if (orderingOverride) {
      return orderingOverride;
    }
    const hasPreset =
      Boolean(fieldOrder?.length) ||
      Boolean(pinnedFields?.length) ||
      Boolean(trailingFields?.length) ||
      sortRemainingFields !== "metadata";
    if (!hasPreset) {
      return undefined;
    }
    return buildCustomFieldOrderFactory({
      fieldOrder,
      pinnedFields,
      trailingFields,
      sortRemaining: sortRemainingFields,
    });
  }, [
    orderingOverride,
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields,
  ]);

  const orderedSchema = React.useMemo(() => {
    if (!schema || !metadata) {
      return schema;
    }
    if (metadataCustomOrder) {
      const order =
        typeof metadataCustomOrder === "function"
          ? metadataCustomOrder({ metadata })
          : metadataCustomOrder;
      if (Array.isArray(order) && order.length > 0) {
        return applyOrderingToSchema(schema, order);
      }
    }
    if (!resolvedCustomFieldOrder) {
      return schema;
    }
    const order =
      typeof resolvedCustomFieldOrder === "function"
        ? resolvedCustomFieldOrder({ metadata })
        : resolvedCustomFieldOrder;
    if (!Array.isArray(order) || order.length === 0) {
      return schema;
    }
    return applyOrderingToSchema(schema, order);
  }, [schema, metadata, resolvedCustomFieldOrder, metadataCustomOrder]);

  const schemaForRender = orderedSchema ?? schema;

  const { schema: schemaWithSections, sectionChangeHandlers } =
    React.useMemo(
      () => applySectionsControl(schemaForRender, resolvedSectionsControl, metadata),
      [schemaForRender, resolvedSectionsControl, metadata]
    );

  const schemaWithOverrides = React.useMemo(() => {
    if (!schemaWithSections) {
      return schemaWithSections;
    }
    return applySchemaOverrides(
      schemaWithSections,
      resolvedSectionsControl?.sectionOverrides
    );
  }, [schemaWithSections, resolvedSectionsControl?.sectionOverrides]);

  const schemaWithInlineCreate = React.useMemo(() => {
    if (!schemaWithOverrides) {
      return schemaWithOverrides;
    }
    return applyInlineCreateControl(schemaWithOverrides, inlineCreateOverrides);
  }, [inlineCreateOverrides, schemaWithOverrides]);

  const schemaWithOrderHints = React.useMemo(() => {
    if (!schemaWithInlineCreate) {
      return schemaWithInlineCreate;
    }
    return applyFieldOrderHints(schemaWithInlineCreate);
  }, [schemaWithInlineCreate]);

  const schemaEditableOnly = React.useMemo(() => {
    if (!schemaWithOrderHints) {
      return schemaWithOrderHints;
    }
    return filterSchemaByEditability(schemaWithOrderHints);
  }, [schemaWithOrderHints]);

  const schemaWithoutHidden = React.useMemo(() => {
    if (!schemaEditableOnly) {
      return schemaEditableOnly;
    }
    return filterSchemaByVisibility(schemaEditableOnly);
  }, [schemaEditableOnly]);

  const requiredSchema = React.useMemo(() => {
    if (!schemaWithoutHidden) {
      return schemaWithoutHidden;
    }
    if (!onlyRequired) {
      return schemaWithoutHidden;
    }
    return filterSchemaToRequired(schemaWithoutHidden);
  }, [onlyRequired, schemaWithoutHidden]);

  const fieldLabelMap = React.useMemo(() => {
    if (!requiredSchema) return {};
    return buildFieldLabelMap(requiredSchema);
  }, [requiredSchema]);

  const resolveFieldLabel = React.useCallback(
    (fieldName: string) => getFieldLabelFromMap(fieldLabelMap, fieldName),
    [fieldLabelMap]
  );

  const visibleSchema = requiredSchema ?? schemaWithOrderHints ?? null;

  return {
    requiredSchema,
    visibleSchema,
    sectionChangeHandlers,
    resolveFieldLabel,
  };
}
