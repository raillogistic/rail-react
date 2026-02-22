import type { ApolloClient } from "@apollo/client";
import apolloClient from "@/shared/api/apollo/client";
import {
  CREATE_MODEL_IMPORT_BATCH_MUTATION,
  DELETE_MODEL_IMPORT_BATCH_MUTATION,
  MODEL_IMPORT_BATCH_PAGES_QUERY,
  MODEL_IMPORT_BATCH_QUERY,
  MODEL_IMPORT_ERROR_REPORT_QUERY,
  MODEL_IMPORT_TEMPLATE_QUERY,
  UPDATE_MODEL_IMPORT_BATCH_MUTATION,
} from "@/graphql/importing";
import { resolveModelImportDownloadUrl } from "./download-url";
import { localizeImportIssues } from "./error-messages";
import type {
  CreateModelImportBatchInput,
  CreateModelImportBatchPayload,
  DeleteModelImportBatchInput,
  DeleteModelImportBatchPayload,
  ImportFileDownload,
  ModelImportBatch,
  ModelImportBatchPage,
  ModelImportTemplate,
  UpdateModelImportBatchInput,
  UpdateModelImportBatchPayload,
} from "./types";

type ImportApolloClient = ApolloClient<unknown>;

const getClient = (client?: ImportApolloClient): ImportApolloClient =>
  client ?? (apolloClient as ImportApolloClient);

const parseImportObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeImportRow = (row: NonNullable<ModelImportBatch["rows"]>[number]) => ({
  ...row,
  editedValues: parseImportObject(row.editedValues),
  normalizedValues:
    row.normalizedValues == null
      ? row.normalizedValues
      : parseImportObject(row.normalizedValues),
});

const normalizeImportBatch = (batch: ModelImportBatch | null): ModelImportBatch | null => {
  if (!batch) {
    return null;
  }
  return {
    ...batch,
    rows: batch.rows?.map(normalizeImportRow) ?? [],
    issues: localizeImportIssues(batch.issues ?? []),
  };
};

export async function fetchModelImportTemplate(
  appLabel: string,
  modelName: string,
  client?: ImportApolloClient,
): Promise<ModelImportTemplate | null> {
  const response = await getClient(client).query<{
    modelImportTemplate: ModelImportTemplate | null;
  }>({
    query: MODEL_IMPORT_TEMPLATE_QUERY,
    variables: { appLabel, modelName },
    fetchPolicy: "network-only",
  });
  const template = response.data?.modelImportTemplate ?? null;
  if (!template) {
    return null;
  }
  return {
    ...template,
    downloadUrl: resolveModelImportDownloadUrl(template.downloadUrl),
  };
}

export async function fetchModelImportBatch(
  batchId: string,
  options?: { rowsPage?: number; rowsPerPage?: number },
  client?: ImportApolloClient,
): Promise<ModelImportBatch | null> {
  const response = await getClient(client).query<{
    modelImportBatch: ModelImportBatch | null;
  }>({
    query: MODEL_IMPORT_BATCH_QUERY,
    variables: {
      batchId,
      rowsPage: options?.rowsPage ?? 1,
      rowsPerPage: options?.rowsPerPage ?? 200,
    },
    fetchPolicy: "network-only",
  });
  return normalizeImportBatch(response.data?.modelImportBatch ?? null);
}

export async function fetchModelImportBatchPages(
  variables: {
    page?: number;
    perPage?: number;
    appLabel?: string;
    modelName?: string;
    status?: string;
  },
  client?: ImportApolloClient,
): Promise<ModelImportBatchPage | null> {
  const response = await getClient(client).query<{
    modelImportBatchPages: ModelImportBatchPage | null;
  }>({
    query: MODEL_IMPORT_BATCH_PAGES_QUERY,
    variables,
    fetchPolicy: "network-only",
  });
  return response.data?.modelImportBatchPages ?? null;
}

export async function createModelImportBatch(
  input: CreateModelImportBatchInput,
  client?: ImportApolloClient,
): Promise<CreateModelImportBatchPayload> {
  const response = await getClient(client).mutate<{
    createModelImportBatch: CreateModelImportBatchPayload;
  }>({
    mutation: CREATE_MODEL_IMPORT_BATCH_MUTATION,
    variables: { input },
  });
  const payload =
    response.data?.createModelImportBatch ?? {
      ok: false,
      issues: [],
    };
  return {
    ...payload,
    batch: normalizeImportBatch(payload.batch ?? null),
    issues: localizeImportIssues(payload.issues ?? []),
  };
}

export async function updateModelImportBatch(
  input: UpdateModelImportBatchInput,
  client?: ImportApolloClient,
): Promise<UpdateModelImportBatchPayload> {
  const response = await getClient(client).mutate<{
    updateModelImportBatch: UpdateModelImportBatchPayload;
  }>({
    mutation: UPDATE_MODEL_IMPORT_BATCH_MUTATION,
    variables: { input },
  });
  const payload =
    response.data?.updateModelImportBatch ?? {
      ok: false,
      rows: [],
      issues: [],
    };
  return {
    ...payload,
    batch: normalizeImportBatch(payload.batch ?? null),
    rows: (payload.rows ?? []).map(normalizeImportRow),
    issues: localizeImportIssues(payload.issues ?? []),
  };
}

export async function deleteModelImportBatch(
  input: DeleteModelImportBatchInput,
  client?: ImportApolloClient,
): Promise<DeleteModelImportBatchPayload> {
  const response = await getClient(client).mutate<{
    deleteModelImportBatch: DeleteModelImportBatchPayload;
  }>({
    mutation: DELETE_MODEL_IMPORT_BATCH_MUTATION,
    variables: { input },
  });
  return (
    response.data?.deleteModelImportBatch ?? {
      ok: false,
      deletedBatchId: null,
    }
  );
}

export async function fetchModelImportErrorReport(
  batchId: string,
  format: "CSV" = "CSV",
  client?: ImportApolloClient,
): Promise<ImportFileDownload | null> {
  const response = await getClient(client).query<{
    modelImportErrorReport: ImportFileDownload | null;
  }>({
    query: MODEL_IMPORT_ERROR_REPORT_QUERY,
    variables: { batchId, format },
    fetchPolicy: "network-only",
  });
  const report = response.data?.modelImportErrorReport ?? null;
  if (!report) {
    return null;
  }
  return {
    ...report,
    downloadUrl: resolveModelImportDownloadUrl(report.downloadUrl),
  };
}

