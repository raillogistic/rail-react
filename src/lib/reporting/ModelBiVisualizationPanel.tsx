import type { JSX } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { BarChart3, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { useGraphQLModelTable } from "@/lib/tables/hooks";
import {
  build_method_mutation,
  type MethodMutationResponse,
} from "@/lib/form/backend/types/mutations";

import {
  ReportingDatasetView,
  type ReportingDatasetPayload,
} from "./components/ReportingDatasetView";
import type { ReportingVisualization } from "./components/ReportingVisualizationCard";

/**
 * Lightweight dataset header shape consumed by the visualization panel.
 * @property id - Dataset identifier used for GraphQL mutations and filters.
 * @property code - Stable code displayed when the title is missing.
 * @property title - Human-friendly dataset label.
 * @property description - Optional dataset description.
 */
type DatasetHeader = {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
};

/**
 * Props used to render the BI visualization tab for a business model.
 * @property appName - Django app label of the source model.
 * @property modelName - Model name used to scope BI datasets.
 * @property enabled - Whether the panel should run queries (only when tab is active).
 * @property datasets - Existing datasets already linked to the model.
 * @property loading - Whether datasets are currently loading.
 * @property error - Optional error raised while loading datasets.
 * @property onEnable - Callback to activate BI queries in the parent container.
 * @property onRefresh - Callback used to refetch dataset definitions.
 */
export type ModelBiVisualizationPanelProps = {
  appName: string;
  modelName: string;
  enabled: boolean;
  datasets: unknown[];
  loading: boolean;
  error?: Error | null;
  onEnable: () => void;
  onRefresh: () => void;
};

const PREVIEW_DATASET_MUTATION = gql(
  build_method_mutation("ReportingDataset", "preview", { include_input: true })
);

type DatasetPreviewInput = {
  quick: string;
  limit: number;
  ordering: string;
  filters: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

type DatasetPreviewPayload = {
  rows: Array<Record<string, unknown>>;
  columns: Array<{ name: string; label: string; kind?: string }>;
};

/**
 * Parses an unknown value as a JSON object (supports raw objects or JSON strings).
 * @param value - Unknown input coming from GraphQL scalars.
 * @returns Parsed object when possible, otherwise undefined.
 */
const parseMaybeJsonObject = (
  value: unknown
): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/**
 * Generates a minimal set of visualizations when no stored definitions exist.
 * @param dataset - Dataset payload returned by the preview mutation.
 * @returns Auto-generated visualizations supported by `ReportingVisualizationCard`.
 */
const buildAutoVisualizations = (
  dataset: ReportingDatasetPayload
): ReportingVisualization[] => {
  const dimension = dataset.columns.find((c) => c.kind === "dimension")?.name;
  const metric = dataset.columns.find(
    (c) => c.kind === "metric" || c.kind === "computed"
  )?.name;

  const base: ReportingVisualization[] = [
    {
      code: "auto-table",
      title: "Aperçu (table)",
      kind: "table",
      description: "Visualisation générée automatiquement.",
    },
  ];

  if (dimension && metric) {
    base.push(
      {
        code: "auto-bar",
        title: "Histogramme",
        kind: "bar",
        description: "Visualisation générée automatiquement.",
        config: { x: dimension, series: [metric] },
      },
      {
        code: "auto-line",
        title: "Courbe",
        kind: "line",
        description: "Visualisation générée automatiquement.",
        config: { x: dimension, series: [metric] },
      },
      {
        code: "auto-pie",
        title: "Répartition",
        kind: "pie",
        description: "Visualisation générée automatiquement.",
        config: { label_field: dimension, value_field: metric },
      },
      {
        code: "auto-kpi",
        title: "Indicateur",
        kind: "kpi",
        description: "Visualisation générée automatiquement.",
        config: { y: metric },
      }
    );
  }

  return base;
};

/**
 * BI visualization tab: selects a dataset attached to the current model, runs a
 * dataset preview, then renders stored (or auto-generated) visualizations.
 */
export function ModelBiVisualizationPanel({
  appName,
  modelName,
  enabled,
  datasets,
  loading,
  error,
  onEnable,
  onRefresh,
}: ModelBiVisualizationPanelProps): JSX.Element {
  const datasetHeaders = useMemo<DatasetHeader[]>(
    () =>
      (Array.isArray(datasets) ? datasets : [])
        .filter(Boolean)
        .map((entry) => {
          const record = entry as Partial<
            Record<"id" | "code" | "title" | "description", unknown>
          >;
          return {
            id: String(record.id ?? ""),
            code: String(record.code ?? ""),
            title: (record.title as string | null | undefined) ?? null,
            description:
              (record.description as string | null | undefined) ?? null,
          };
        })
        .filter((entry) => entry.id),
    [datasets]
  );

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [quick, setQuick] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [previewPayload, setPreviewPayload] = useState<DatasetPreviewPayload | null>(
    null
  );
  const quickRef = useRef<string>(quick);
  const limitRef = useRef<number>(limit);

  useEffect(() => {
    quickRef.current = quick;
  }, [quick]);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  useEffect(() => {
    if (!enabled) return;
    if (selectedDatasetId) return;
    if (datasetHeaders.length === 0) return;
    setSelectedDatasetId(datasetHeaders[0].id);
  }, [datasetHeaders, enabled, selectedDatasetId]);

  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return null;
    return datasetHeaders.find((d) => d.id === selectedDatasetId) ?? null;
  }, [datasetHeaders, selectedDatasetId]);

  const selectedDatasetNumericId = useMemo(() => {
    const parsed = Number(selectedDatasetId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [selectedDatasetId]);

  const {
    items: visualizationsRaw,
    loading: visualizationsLoading,
    error: visualizationsError,
    refetch: refetchVisualizations,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingVisualization",
    initVariables: {
      filters: { dataset: selectedDatasetNumericId },
      per_page: 200,
    },
    additionalSelectionFields: [
      "code",
      "title",
      "description",
      "kind",
      "config",
      "options",
      "default_filters",
      "is_default",
    ],
    queryOptions: { includeQuickArgument: false },
    skip: !enabled || !selectedDatasetNumericId,
  });

  const [previewDataset, { loading: previewLoading }] = useMutation<{
    response: MethodMutationResponse<unknown>;
  }>(PREVIEW_DATASET_MUTATION);

  const runPreview = useCallback(
    async (params: { datasetId: string; quick: string; limit: number }) => {
      const { datasetId, quick: quickValue, limit: limitValue } = params;
      if (!datasetId) return;
      onEnable();
      const input: DatasetPreviewInput = {
        quick: quickValue,
        limit: limitValue,
        ordering: "",
        filters: null,
      };
      try {
        const { data } = await previewDataset({
          variables: { id: datasetId, input },
        });
        const response = data?.response;
        if (!response?.ok) {
          const message =
            response?.errors?.map((e) => e.message).join(", ") ||
            "Impossible d'exécuter l'aperçu.";
          toast.error(message);
          setPreviewPayload(null);
          return;
        }
        const rawResult = response.result as unknown;
        const result =
          typeof rawResult === "string"
            ? (JSON.parse(rawResult) as DatasetPreviewPayload)
            : (rawResult as DatasetPreviewPayload | null);
        if (!result || !Array.isArray(result.rows) || !Array.isArray(result.columns)) {
          toast.error("Aperçu invalide: format inattendu.");
          setPreviewPayload(null);
          return;
        }
        setPreviewPayload(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur d'aperçu BI.");
        setPreviewPayload(null);
      }
    },
    [onEnable, previewDataset]
  );

  useEffect(() => {
    if (!enabled) return;
    if (!selectedDatasetId) return;
    void runPreview({
      datasetId: selectedDatasetId,
      quick: quickRef.current,
      limit: limitRef.current,
    });
  }, [enabled, runPreview, selectedDatasetId]);

  const storedVisualizations = useMemo<ReportingVisualization[]>(() => {
    const supported = new Set(["table", "bar", "line", "pie", "kpi"]);
    return (Array.isArray(visualizationsRaw) ? visualizationsRaw : [])
      .map((entry) => {
        const record = entry as Partial<
          Record<"id" | "code" | "title" | "kind" | "description" | "config", unknown>
        >;
        const kind = String(record.kind ?? "table");
        const safeKind = supported.has(kind) ? kind : "table";
        return {
          code: String(record.code ?? `viz-${record.id ?? ""}`),
          title: String(record.title ?? record.code ?? "Visualisation"),
          description: record.description ? String(record.description) : undefined,
          kind: safeKind as ReportingVisualization["kind"],
          config: parseMaybeJsonObject(record.config),
        };
      })
      .filter((viz) => viz.code);
  }, [visualizationsRaw]);

  const datasetViewPayload = useMemo<ReportingDatasetPayload | null>(() => {
    if (!selectedDataset || !previewPayload) return null;
    const title = selectedDataset.title || selectedDataset.code || `${appName}.${modelName}`;
    return {
      title,
      description: selectedDataset.description ?? undefined,
      columns: (previewPayload.columns as unknown as ReportingDatasetPayload["columns"]) ?? [],
      rows: (previewPayload.rows as unknown as ReportingDatasetPayload["rows"]) ?? [],
    };
  }, [appName, modelName, previewPayload, selectedDataset]);

  const visualizations = useMemo(() => {
    if (!datasetViewPayload) return [];
    return storedVisualizations.length > 0
      ? storedVisualizations
      : buildAutoVisualizations(datasetViewPayload);
  }, [datasetViewPayload, storedVisualizations]);

  const hasDatasets = datasetHeaders.length > 0;
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Visualisations BI
        </p>
        <p className="text-xs text-muted-foreground">
          Sélectionnez un dataset BI pour rendre ses visualisations (tableaux,
          graphiques, KPI).
        </p>
        {error ? (
          <p className="text-xs text-destructive">
            {error.message || "Impossible de charger les datasets BI."}
          </p>
        ) : null}
        {visualizationsError ? (
          <p className="text-xs text-destructive">
            {visualizationsError.message ||
              "Impossible de charger les visualisations."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
          onEnable();
          onRefresh();
          if (selectedDatasetId) {
            void refetchVisualizations?.();
            void runPreview({ datasetId: selectedDatasetId, quick, limit });
          }
        }}
          title="Rafraîchir"
          disabled={loading || visualizationsLoading || previewLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            if (!selectedDatasetId) return;
            void runPreview({ datasetId: selectedDatasetId, quick, limit });
          }}
          disabled={!selectedDatasetId || previewLoading}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Exécuter
        </Button>
      </div>
    </div>
  );

  if (!enabled) {
    return <div className="space-y-3">{header}</div>;
  }

  return (
    <div className="space-y-3">
      {header}

      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Dataset BI
          </label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={selectedDatasetId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedDatasetId(next);
              if (next) {
                void runPreview({ datasetId: next, quick, limit });
                void refetchVisualizations?.();
              } else {
                setPreviewPayload(null);
              }
            }}
            disabled={loading || !hasDatasets}
          >
            {!hasDatasets ? <option value="">Aucun dataset</option> : null}
            {datasetHeaders.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.title || ds.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Recherche rapide
          </label>
          <Input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Filtrer l'aperçu..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Limite
          </label>
          <Input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value || 0))}
            min={1}
            max={1000}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : !hasDatasets ? (
        <p className="text-xs text-muted-foreground">
          Aucun dataset BI pour {appName}.{modelName}. Créez-en un dans l'onglet
          “Datasets”.
        </p>
      ) : previewLoading ? (
        <p className="text-xs text-muted-foreground">Exécution en cours...</p>
      ) : datasetViewPayload ? (
        <ReportingDatasetView dataset={datasetViewPayload} visualizations={visualizations} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Sélectionnez un dataset puis exécutez un aperçu.
        </p>
      )}
    </div>
  );
}
