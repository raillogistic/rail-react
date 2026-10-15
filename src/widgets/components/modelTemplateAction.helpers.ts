"use client";

import type { ReactNode } from "react";
import type { FormFieldConfig, FormSchema } from "@/widgets/model-form/inputs/types";
import type {
  TemplateInfo,
} from "@/shared/api/graphql/graphql/metadata/types";
import type { TemplateInfo as ModelTableTemplateInfo } from "@/widgets/model-table/types";
import {
  buildTemplateClientSchema,
  executeTemplateForRows,
  normalizeTemplateType,
  parseTemplateClientFields,
  type TemplatePdfPreviewPayload,
} from "@/widgets/model-table/utils/templateExecution";
import {
  applyFieldOverrides,
  getErrorMessage,
  humanizeLabel,
} from "./customMutationAction.helpers";

export type TemplateExecutionResult = {
  templateType: "pdf" | "excel";
  count: number;
};

export function resolveTemplateLabel(
  template: TemplateInfo | null,
  overrideLabel: ReactNode | undefined,
): ReactNode {
  if (overrideLabel !== undefined && overrideLabel !== null) {
    return overrideLabel;
  }
  if (!template) {
    return "Template";
  }

  const title = String(template.title ?? "").trim();
  if (title) {
    return title;
  }

  const key = String(template.key ?? "").trim();
  if (key) {
    return humanizeLabel(key);
  }

  return "Template";
}

export function resolveTemplateKeys(template: TemplateInfo): string[] {
  const urlPath = String(template.urlPath ?? "").trim();
  const key = String(template.key ?? "").trim();
  const title = String(template.title ?? "").trim();
  const tail = urlPath ? urlPath.split("/").filter(Boolean).at(-1) ?? "" : "";

  return [key, urlPath, tail, title].filter(Boolean);
}

export function matchesTemplateToken(
  token: string,
  template: TemplateInfo,
): boolean {
  const wanted = token.trim().toLowerCase();
  if (!wanted) return false;

  return resolveTemplateKeys(template).some(
    (candidate) => candidate.trim().toLowerCase() === wanted,
  );
}

export function buildTemplateSchema(
  template: TemplateInfo,
  overrides?: Record<string, Partial<FormFieldConfig>>,
): FormSchema | null {
  const clientFields = parseTemplateClientFields(
    template as unknown as ModelTableTemplateInfo,
  );
  if (clientFields.length === 0) {
    return null;
  }

  return applyFieldOverrides(buildTemplateClientSchema(clientFields), overrides);
}

export function hasTemplateClientFields(template: TemplateInfo): boolean {
  return (
    parseTemplateClientFields(template as unknown as ModelTableTemplateInfo)
      .length > 0
  );
}

export function buildTemplateSuccessMessage(
  template: TemplateInfo,
  result: TemplateExecutionResult,
  overrideMessage?: string,
): string {
  if (overrideMessage) {
    return overrideMessage;
  }

  const label = String(template.title ?? template.key ?? "Template").trim() || "Template";
  return result.templateType === "pdf"
    ? `Template "${label}" generated.`
    : `Template "${label}" downloaded.`;
}

export async function executeModelTemplateAction(options: {
  template: TemplateInfo;
  objectId: string;
  clientData?: Record<string, unknown>;
  onPdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
}): Promise<TemplateExecutionResult> {
  const payload = options.clientData ?? {};

  return executeTemplateForRows(
    options.template as unknown as ModelTableTemplateInfo,
    [options.objectId],
    payload,
    {
      onPdfPreview: options.onPdfPreview
        ? (previewPayload) =>
            options.onPdfPreview?.({
              ...previewPayload,
              onRefresh: () =>
                executeModelTemplateAction({
                  template: options.template,
                  objectId: options.objectId,
                  clientData: payload,
                  onPdfPreview: options.onPdfPreview,
                }),
            })
        : undefined,
    },
  );
}

export function resolveTemplateErrorMessage(
  error: unknown,
  fallback = "Template execution failed.",
): string {
  return getErrorMessage(error, fallback);
}

export function resolveTemplateTypeLabel(template: TemplateInfo): "pdf" | "excel" {
  return normalizeTemplateType(template as unknown as ModelTableTemplateInfo);
}
