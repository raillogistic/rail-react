import { useQuery } from "@apollo/client";
import { MODEL_IMPORT_TEMPLATE_QUERY } from "@/graphql/importing";
import { resolveModelImportDownloadUrl } from "../download-url";
import type { ModelImportTemplate } from "../types";

interface ModelImportTemplateQueryData {
  modelImportTemplate: ModelImportTemplate | null;
}

interface ModelImportTemplateQueryVariables {
  appLabel: string;
  modelName: string;
}

export function useModelImportTemplate(appLabel: string, modelName: string) {
  const query = useQuery<
    ModelImportTemplateQueryData,
    ModelImportTemplateQueryVariables
  >(MODEL_IMPORT_TEMPLATE_QUERY, {
    variables: { appLabel, modelName },
    fetchPolicy: "cache-and-network",
    skip: !appLabel || !modelName,
  });

  const template = query.data?.modelImportTemplate ?? null;

  return {
    template: template
      ? {
          ...template,
          downloadUrl: resolveModelImportDownloadUrl(template.downloadUrl),
        }
      : null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
