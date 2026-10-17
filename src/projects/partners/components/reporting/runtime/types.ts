/** Shared contracts for the Achat reporting GraphQL facade and renderers. */

export type ReportingLayoutItem = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type ReportingColumn = {
  name: string;
  label?: string;
  kind?: string;
  format?: string;
  field?: string;
};

export type ReportingDatasetPayload = {
  mode: "aggregate" | "records";
  rows: Array<Record<string, unknown>>;
  columns?: ReportingColumn[];
  fields?: string[];
  warnings?: string[];
  limit?: number;
  offset?: number;
  returned_count?: number;
  has_more?: boolean;
};

export type ReportingVisualizationColumn = {
  field: string;
  label: string;
  format?: "currency" | "date" | "datetime" | "number" | string;
};

export type ReportingVisualization = {
  id: string;
  code: string;
  title: string;
  description?: string;
  kind: "table" | "records" | "bar" | "line" | "area" | "pie" | "donut" | "metric" | "kpi" | "gauge" | "funnel" | "pivot" | "combo" | "scatter" | "treemap" | "radar" | string;
  config: {
    x_axis?: string;
    y_axis?: string | string[];
    category?: string;
    value?: string;
    metric?: string;
    format?: string;
    colors?: string[];
    columns?: ReportingVisualizationColumn[];
    [key: string]: unknown;
  };
};

export type ReportingReportBlock = {
  block_id: string;
  visualization: ReportingVisualization;
  dataset: ReportingDatasetPayload;
  layout: ReportingLayoutItem;
};

export type ReportingFilterOption = {
  value: string;
  label: string;
};

export type ReportingFilterQueryConfig = {
  listFieldName?: string;
  labelField?: string;
  extraFields?: string[];
};

export type ReportingFilterDefinition = {
  name: string;
  field: string;
  lookup: string;
  label: string;
  type: "date" | "select" | "text" | "number" | "query";
  options?: ReportingFilterOption[];
  relatedModel?: string;
  graphql?: ReportingFilterQueryConfig;
};

export type ReportingFilterValue = string | number;

export type ReportingFilterValues = Record<string, ReportingFilterValue>;

export type ReportingReport = {
  code: string;
  title: string;
  description: string;
  theme: string;
  layout: ReportingLayoutItem[] | string;
};

export type ReportingBuildPayloadResponse = {
  report: ReportingReport;
  visualizations: ReportingReportBlock[];
  filters: ReportingFilterDefinition[];
  export_formats: ReportingExportFormat[];
};

export type ReportingExportFormat = "pdf" | "csv" | "json" | "xlsx";
