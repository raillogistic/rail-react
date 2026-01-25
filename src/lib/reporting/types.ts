/**
 * Reporting library types.
 *
 * This module defines the frontend contracts used to wire UI builders to the
 * backend reporting engine (`ReportingDataset.run_query` / `describe`).
 */

/**
 * Supported reporting mode values.
 * @property Aggregate - Aggregated (GROUP BY) result mode.
 * @property Records - Raw records list mode.
 */
export type ReportingQueryMode = "aggregate" | "records";

/**
 * Allowed chart types supported by the Recharts renderer.
 * @property Table - Tabular preview of result rows.
 * @property Bar - Bar chart (grouped/stacked).
 * @property Line - Line chart (time-series / trends).
 * @property Area - Area chart (stacked or single series).
 * @property Pie - Pie chart (distribution).
 * @property KPI - Big number card (first row / aggregated metric).
 * @property Heatmap - Heatmap-like grid (simulated using a ScatterChart).
 */
export type ReportingChartKind =
  | "table"
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "kpi"
  | "heatmap";

/**
 * Reporting dataset column exposed by the backend.
 * @property name - Unique identifier used in result rows.
 * @property label - Human-readable label for rendering.
 * @property kind - Semantic kind (dimension/metric/computed).
 * @property field - Backing Django field path, when available.
 * @property transform - Optional transform applied to a dimension.
 * @property aggregation - Optional aggregation used by a metric.
 * @property format - Optional formatting hint (frontend-defined).
 * @property stage - Computed field execution stage ("query" or "post").
 */
export type ReportingColumn = {
  name: string;
  label: string;
  kind?: "dimension" | "metric" | "computed";
  field?: string;
  transform?: string | null;
  aggregation?: string | null;
  format?: string | null;
  stage?: "query" | "post" | string;
};

/**
 * Filter leaf accepted by the reporting engine.
 * @property field - ORM field path or alias (depending on context).
 * @property lookup - Django lookup (exact, icontains, gte, ...).
 * @property value - Filter value payload.
 * @property connector - Optional connector when used in flat lists.
 * @property negate - Whether to negate the condition (NOT).
 */
export type ReportingFilterLeaf = {
  field: string;
  lookup?: string;
  value?: unknown;
  connector?: "and" | "or";
  negate?: boolean;
};

/**
 * Filter group accepted by the reporting engine.
 * @property op - Group operator ("and" / "or").
 * @property items - Child filters.
 * @property negate - Whether to negate the whole group.
 */
export type ReportingFilterGroup = {
  op: "and" | "or";
  items: ReportingFilterNode[];
  negate?: boolean;
};

/**
 * Union of filter nodes supported by the reporting engine.
 */
export type ReportingFilterNode = ReportingFilterLeaf | ReportingFilterGroup;

/**
 * Runtime dimension definition.
 * @property name - Alias used in result rows (may differ from field).
 * @property field - ORM field path (e.g. "created_at", "site__name").
 * @property label - Optional UI label.
 * @property transform - Optional transform (trunc:month, year, lower, ...).
 * @property help_text - Optional hint displayed in UI.
 */
export type ReportingDimensionSpec = {
  name?: string;
  field: string;
  label?: string;
  transform?: string | null;
  help_text?: string;
};

/**
 * Runtime metric definition.
 * @property name - Alias used in result rows.
 * @property field - ORM field path (or "pk" for counts).
 * @property aggregation - Aggregation name (sum, count, avg, ...).
 * @property filter - Optional filter tree applied inside the aggregate.
 * @property label - Optional UI label.
 * @property format - Optional formatting hint.
 * @property help_text - Optional hint displayed in UI.
 */
export type ReportingMetricSpec = {
  name?: string;
  field?: string;
  aggregation?: string;
  filter?: ReportingFilterNode | ReportingFilterNode[] | null;
  label?: string;
  format?: string | null;
  help_text?: string;
};

/**
 * Runtime computed field definition.
 * @property name - Alias used in result rows.
 * @property formula - Arithmetic expression referencing other aliases.
 * @property stage - "query" (DB) or "post" (frontend-safe Python on backend rows).
 * @property label - Optional UI label.
 * @property help_text - Optional hint displayed in UI.
 */
export type ReportingComputedFieldSpec = {
  name: string;
  formula: string;
  stage?: "query" | "post" | string;
  label?: string;
  help_text?: string;
};

/**
 * Optional pivot definition executed server-side.
 * @property index - Row key field name (dimension alias).
 * @property columns - Column key field name (dimension alias).
 * @property values - List of metric aliases to pivot.
 */
export type ReportingPivotSpec = {
  index: string;
  columns: string;
  values: string[] | string;
};

/**
 * Query spec accepted by `ReportingDataset.run_query`.
 * @property mode - Result mode.
 * @property quick - Optional quick search text.
 * @property limit - Row limit.
 * @property offset - Row offset.
 * @property ordering - Sorting tokens (e.g. ["-total_cost"]).
 * @property dimensions - Dimension names or runtime dimension definitions.
 * @property metrics - Metric names or runtime metric definitions.
 * @property computed_fields - Computed field names or runtime definitions.
 * @property filters - WHERE filters.
 * @property having - HAVING filters.
 * @property pivot - Pivot definition.
 * @property cache - Enable/disable cache (if backend TTL configured).
 * @property fields - Records mode selected fields.
 */
export type ReportingQuerySpec = {
  mode?: ReportingQueryMode;
  quick?: string;
  limit?: number;
  offset?: number;
  ordering?: string[] | string;
  dimensions?: Array<string | ReportingDimensionSpec>;
  metrics?: Array<string | ReportingMetricSpec>;
  computed_fields?: Array<string | ReportingComputedFieldSpec>;
  filters?: ReportingFilterNode | ReportingFilterNode[] | null;
  having?: ReportingFilterNode | ReportingFilterNode[] | null;
  pivot?: ReportingPivotSpec | null;
  cache?: boolean;
  fields?: string[] | string;
};

/**
 * Optional cache information returned by the backend.
 * @property hit - Whether the cache was hit.
 * @property key - Cache key identifier (for debugging).
 * @property ttl_seconds - TTL applied to the entry.
 */
export type ReportingCacheInfo = {
  hit: boolean;
  key: string;
  ttl_seconds: number;
};

/**
 * Pivot result payload returned by the backend.
 * @property index - Index dimension name.
 * @property columns - Columns dimension name.
 * @property values - Metric aliases pivoted.
 * @property index_values - Distinct index values encountered.
 * @property column_values - Distinct column values encountered.
 * @property rows - Pivoted rows as a matrix-like list.
 */
export type ReportingPivotPayload = {
  index: string;
  columns: string;
  values: string[];
  index_values: unknown[];
  column_values: unknown[];
  rows: Array<Record<string, unknown>>;
};

/**
 * Runtime query execution result returned by the backend reporting engine.
 * @property mode - Execution mode.
 * @property rows - Result rows.
 * @property columns - Column metadata for rendering.
 * @property dimensions - Effective dimensions used by the query.
 * @property metrics - Effective metrics used by the query.
 * @property computed_fields - Effective computed fields.
 * @property applied_filters - Flattened filters applied in WHERE (debugging).
 * @property ordering - Effective ordering applied.
 * @property limit - Effective limit applied.
 * @property offset - Effective offset applied.
 * @property warnings - Backend warnings (ignored filters/fields/formulas).
 * @property source - Source model information.
 * @property query - Echoed query spec for replay/debugging.
 * @property pivot - Optional pivot output.
 * @property cache - Optional cache info.
 */
export type ReportingQueryResult = {
  mode: ReportingQueryMode;
  rows: Array<Record<string, unknown>>;
  columns?: ReportingColumn[];
  dimensions?: ReportingDimensionSpec[];
  metrics?: ReportingMetricSpec[];
  computed_fields?: ReportingComputedFieldSpec[];
  applied_filters?: ReportingFilterLeaf[];
  ordering?: string[];
  limit?: number;
  offset?: number;
  warnings?: string[];
  source?: { app_label: string; model: string };
  query?: ReportingQuerySpec;
  pivot?: ReportingPivotPayload;
  cache?: ReportingCacheInfo;
  dataset?: { id?: string | null; code?: string | null; title?: string | null };
};

/**
 * Backend dataset description payload used by the studio/builder UIs.
 * @property dataset - Dataset header and UI metadata.
 * @property semantic_layer - Allowed dimensions/metrics/computed fields + rules.
 * @property model_fields - Optional field list extracted from the Django model.
 */
export type ReportingDatasetDescription = {
  dataset: {
    id: string | null;
    code: string;
    title: string;
    description?: string | null;
    source_kind: string;
    source: { app_label: string; model: string };
    ui: Record<string, unknown>;
  };
  semantic_layer: {
    dimensions: ReportingDimensionSpec[];
    metrics: ReportingMetricSpec[];
    computed_fields: ReportingComputedFieldSpec[];
    allowed_lookups: string[];
    allow_ad_hoc: boolean;
    allowed_fields: string[];
    max_limit: number;
    cache_ttl_seconds: number;
  };
  model_fields?: Array<{
    name: string | null;
    verbose_name?: string | null;
    type?: string | null;
    internal_type?: string | null;
    is_relation?: boolean;
    related_model?: string | null;
    many_to_many?: boolean;
    many_to_one?: boolean;
    one_to_one?: boolean;
    null?: boolean;
    blank?: boolean;
    choices?: Array<{ value: unknown; label: string }>;
  }>;
};

/**
 * Chart specification stored in `ReportingVisualization.config.chart`.
 * @property kind - Chart type.
 * @property title - Optional title override.
 * @property x - X-axis / label field name (dimension alias).
 * @property series - Metric aliases to plot as series.
 * @property y - KPI metric alias (fallback).
 * @property valueField - Pie value field.
 * @property labelField - Pie label field.
 * @property stacked - Whether series should be stacked.
 * @property colors - Optional series color overrides keyed by alias.
 * @property showLegend - Whether legend should be displayed.
 * @property showGrid - Whether grid should be displayed.
 */
export type ReportingChartSpec = {
  kind: ReportingChartKind;
  title?: string;
  x?: string;
  series?: string[];
  y?: string;
  valueField?: string;
  labelField?: string;
  stacked?: boolean;
  colors?: Record<string, string>;
  showLegend?: boolean;
  showGrid?: boolean;
};

/**
 * Visualization config shape stored in `ReportingVisualization.config`.
 * @property query - Query spec executed by `ReportingVisualization.render`.
 * @property chart - Chart spec rendered by the frontend.
 * @property version - Optional config version for migrations.
 */
export type ReportingVisualizationConfig = {
  query?: ReportingQuerySpec;
  chart?: ReportingChartSpec;
  version?: number;
};

