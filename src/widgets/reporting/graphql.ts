import { gql, useMutation } from "@apollo/client";

import {
  build_method_mutation,
  type MethodMutationResponse,
  type MethodMutationVariables,
} from "@/widgets/model-form/mutations";
import type {
  ReportingDatasetDescription,
  ReportingQueryResult,
  ReportingQuerySpec,
  ReportingVisualizationConfig,
} from "@/widgets/reporting/types";

/**
 * GraphQL response shape for the dataset `describe` method mutation.
 * @property response - Standard method mutation response wrapper.
 */
export type ReportingDatasetDescribeResponse = {
  response: MethodMutationResponse<ReportingDatasetDescription>;
};

/**
 * GraphQL input shape for the dataset `describe` method mutation.
 * @property include_model_fields - Whether to include source model fields.
 */
export type ReportingDatasetDescribeInput = {
  include_model_fields: boolean;
};

/**
 * GraphQL response shape for the dataset `run_query` method mutation.
 * @property response - Standard method mutation response wrapper.
 */
export type ReportingDatasetRunQueryResponse = {
  response: MethodMutationResponse<ReportingQueryResult>;
};

/**
 * GraphQL input shape for the dataset `run_query` method mutation.
 * @property spec - Query spec sent to the backend reporting engine.
 */
export type ReportingDatasetRunQueryInput = {
  spec: ReportingQuerySpec;
};

const REPORTING_DATASET_DESCRIBE_MUTATION = gql(
  build_method_mutation("ReportingDataset", "describe", { include_input: true }),
);

const REPORTING_DATASET_RUN_QUERY_MUTATION = gql(
  build_method_mutation("ReportingDataset", "run_query", { include_input: true }),
);

/**
 * Hook wrapper around `ReportingDataset.describe`.
 *
 * @returns Mutation state + a `describeDataset` helper that returns the parsed payload.
 */
export function useReportingDatasetDescribe() {
  const [mutate, state] = useMutation<
    ReportingDatasetDescribeResponse,
    MethodMutationVariables<ReportingDatasetDescribeInput>
  >(REPORTING_DATASET_DESCRIBE_MUTATION);

  /**
   * Fetch dataset semantic layer and optional model fields.
   *
   * @param datasetId - Dataset ID.
   * @param includeModelFields - Whether to include underlying model fields.
   * @returns Response payload when ok, otherwise null.
   */
  const describeDataset = async (
    datasetId: string,
    includeModelFields: boolean,
  ): Promise<ReportingDatasetDescription | null> => {
    const { data } = await mutate({
      variables: { id: datasetId, input: { include_model_fields: includeModelFields } },
    });
    return data?.response?.ok ? (data.response.result as ReportingDatasetDescription) : null;
  };

  return { describeDataset, ...state };
}

/**
 * Hook wrapper around `ReportingDataset.run_query`.
 *
 * @returns Mutation state + a `runDatasetQuery` helper that returns the parsed payload.
 */
export function useReportingDatasetRunQuery() {
  const [mutate, state] = useMutation<
    ReportingDatasetRunQueryResponse,
    MethodMutationVariables<ReportingDatasetRunQueryInput>
  >(REPORTING_DATASET_RUN_QUERY_MUTATION);

  /**
   * Execute a dataset query spec against the backend engine.
   *
   * @param datasetId - Dataset ID.
   * @param spec - Query spec object.
   * @returns Query result when ok, otherwise null.
   */
  const runDatasetQuery = async (
    datasetId: string,
    spec: ReportingQuerySpec,
  ): Promise<ReportingQueryResult | null> => {
    const { data } = await mutate({ variables: { id: datasetId, input: { spec } } });
    return data?.response?.ok ? (data.response.result as ReportingQueryResult) : null;
  };

  return { runDatasetQuery, ...state };
}

/**
 * Visualization header returned by `ReportingVisualization.render`.
 * @property code - Visualization code.
 * @property title - Visualization title.
 * @property kind - Visualization kind as stored in the backend.
 * @property config - Visualization config payload.
 * @property options - Optional rendering options.
 */
export type ReportingVisualizationHeader = {
  id?: string;
  code: string;
  title: string;
  kind: string;
  config: ReportingVisualizationConfig | Record<string, unknown>;
  options?: Record<string, unknown>;
  dataset_id?: string;
};

/**
 * Render payload returned by `ReportingVisualization.render`.
 * @property visualization - Visualization metadata.
 * @property dataset - Dataset query result payload.
 */
export type ReportingVisualizationRenderPayload = {
  visualization: ReportingVisualizationHeader;
  dataset: ReportingQueryResult;
};

/**
 * GraphQL response shape for the visualization `render` method mutation.
 * @property response - Standard method mutation response wrapper.
 */
export type ReportingVisualizationRenderResponse = {
  response: MethodMutationResponse<ReportingVisualizationRenderPayload>;
};

/**
 * GraphQL input shape for the visualization `render` method mutation.
 * @property quick - Optional quick search string.
 * @property limit - Row limit for the underlying dataset query.
 * @property filters - Runtime filters (merged with visualization defaults).
 * @property spec - Optional query spec override.
 */
export type ReportingVisualizationRenderInput = {
  quick?: string;
  limit?: number;
  filters?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  spec?: ReportingQuerySpec | null;
};

const REPORTING_VISUALIZATION_RENDER_MUTATION = gql(
  build_method_mutation("ReportingVisualization", "render", { include_input: true }),
);

/**
 * Hook wrapper around `ReportingVisualization.render`.
 *
 * @returns Mutation state + a `renderVisualization` helper that returns the payload.
 */
export function useReportingVisualizationRender() {
  const [mutate, state] = useMutation<
    ReportingVisualizationRenderResponse,
    MethodMutationVariables<ReportingVisualizationRenderInput>
  >(REPORTING_VISUALIZATION_RENDER_MUTATION);

  /**
   * Render a saved visualization using its stored configuration and an optional override.
   *
   * @param visualizationId - Visualization ID.
   * @param input - Render parameters.
   * @returns Render payload when ok, otherwise null.
   */
  const renderVisualization = async (
    visualizationId: string,
    input: ReportingVisualizationRenderInput,
  ): Promise<ReportingVisualizationRenderPayload | null> => {
    const { data } = await mutate({ variables: { id: visualizationId, input } });
    return data?.response?.ok ? (data.response.result as ReportingVisualizationRenderPayload) : null;
  };

  return { renderVisualization, ...state };
}

/**
 * Report header returned by `ReportingReport.build_payload`.
 * @property code - Report code.
 * @property title - Report title.
 * @property description - Report description.
 * @property layout - Layout payload (report-level).
 * @property theme - Theme token used by the dashboard renderer.
 */
export type ReportingReportHeader = {
  code: string;
  title: string;
  description?: string | null;
  layout?: unknown;
  theme?: string | null;
};

/**
 * Report block payload returned by `ReportingReport.build_payload`.
 * @property block_id - Block identifier.
 * @property visualization - Visualization metadata.
 * @property dataset - Dataset query output for the block.
 * @property layout - Block-level layout hints.
 */
export type ReportingReportBlockPayload = {
  block_id: string;
  visualization: ReportingVisualizationHeader;
  dataset: ReportingQueryResult;
  layout?: Record<string, unknown>;
};

/**
 * Build payload returned by `ReportingReport.build_payload`.
 * @property report - Report metadata.
 * @property visualizations - Rendered blocks.
 * @property filters - Global filters configured on the report.
 */
export type ReportingReportBuildPayload = {
  report: ReportingReportHeader;
  visualizations: ReportingReportBlockPayload[];
  filters?: unknown;
};

/**
 * GraphQL response shape for the report `build_payload` method mutation.
 * @property response - Standard method mutation response wrapper.
 */
export type ReportingReportBuildResponse = {
  response: MethodMutationResponse<ReportingReportBuildPayload>;
};

/**
 * GraphQL input shape for the report `build_payload` method mutation.
 * @property quick - Optional quick search string.
 * @property limit - Row limit per visualization.
 * @property filters - Global runtime filters applied to all blocks.
 */
export type ReportingReportBuildInput = {
  quick?: string;
  limit?: number;
  filters?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

const REPORTING_REPORT_BUILD_PAYLOAD_MUTATION = gql(
  build_method_mutation("ReportingReport", "build_payload", { include_input: true }),
);

/**
 * Hook wrapper around `ReportingReport.build_payload`.
 *
 * @returns Mutation state + a `buildReportPayload` helper that returns the payload.
 */
export function useReportingReportBuildPayload() {
  const [mutate, state] = useMutation<
    ReportingReportBuildResponse,
    MethodMutationVariables<ReportingReportBuildInput>
  >(REPORTING_REPORT_BUILD_PAYLOAD_MUTATION);

  /**
   * Build a full dashboard payload by rendering every block.
   *
   * @param reportId - Report ID.
   * @param input - Build parameters.
   * @returns Build payload when ok, otherwise null.
   */
  const buildReportPayload = async (
    reportId: string,
    input: ReportingReportBuildInput,
  ): Promise<ReportingReportBuildPayload | null> => {
    const { data } = await mutate({ variables: { id: reportId, input } });
    return data?.response?.ok ? (data.response.result as ReportingReportBuildPayload) : null;
  };

  return { buildReportPayload, ...state };
}
