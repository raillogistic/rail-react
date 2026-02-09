import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { RefreshCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/lib/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import { useGraphQLModelTable } from "@/lib/table/compat/hooks";
import {
  build_create_mutation,
  build_update_mutation,
  type CreateMutationResponse,
  type UpdateMutationResponse,
} from "@/lib/form/backend/types/mutations";
import {
  useReportingDatasetDescribe,
  useReportingDatasetRunQuery,
} from "@/lib/reporting/graphql";
import type { ReportingChartSpec, ReportingDatasetDescription, ReportingQueryResult, ReportingQuerySpec } from "@/lib/reporting/types";
import { ReportingChartSpecEditor } from "@/lib/reporting/components/ReportingChartSpecEditor";
import { ReportingSpecEditor } from "@/lib/reporting/components/ReportingSpecEditor";
import { ReportingWidgetCard } from "@/lib/reporting/components/ReportingWidgetCard";

/**
 * Minimal visualization object selection returned by create/update mutations.
 * @property id - Visualization ID.
 * @property code - Visualization code.
 * @property title - Visualization title.
 * @property kind - Visualization kind.
 */
type ReportingVisualizationMutationObject = {
  id: string;
  code: string;
  title: string;
  kind: string;
};

/**
 * GraphQL response for the visualization create mutation.
 * @property response - Standard create mutation wrapper.
 */
type ReportingVisualizationCreateResponse = {
  response: CreateMutationResponse<ReportingVisualizationMutationObject>;
};

/**
 * GraphQL response for the visualization update mutation.
 * @property response - Standard update mutation wrapper.
 */
type ReportingVisualizationUpdateResponse = {
  response: UpdateMutationResponse<ReportingVisualizationMutationObject>;
};

const CREATE_VISUALIZATION_MUTATION = gql(
  build_create_mutation("ReportingVisualization", "id code title kind"),
);

const UPDATE_VISUALIZATION_MUTATION = gql(
  build_update_mutation("ReportingVisualization", "id code title kind"),
);

/**
 * Draft used to save a widget into `ReportingVisualization`.
 * @property id - Optional ID when updating.
 * @property datasetId - Target dataset ID.
 * @property code - Visualization code.
 * @property title - Visualization title.
 * @property description - Optional description.
 */
export type ReportingStudioSaveDraft = {
  id?: string;
  datasetId: string;
  code: string;
  title: string;
  description?: string;
};

/**
 * Reporting Studio: build + preview + save reporting widgets.
 *
 * This component is the â€œwiring layerâ€ between UI builders and the backend
 * reporting engine. Users can:
 * - select a dataset
 * - build a query spec (builder or raw JSON)
 * - choose a chart spec
 * - preview results
 * - save as a `ReportingVisualization` (reusable widget)
 */
export function ReportingStudio(): JSX.Element {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [datasetDescription, setDatasetDescription] = useState<ReportingDatasetDescription | null>(null);
  const [spec, setSpec] = useState<ReportingQuerySpec>(() => ({ mode: "aggregate", limit: 200, cache: true }));
  const [chart, setChart] = useState<ReportingChartSpec>(() => ({ kind: "bar", stacked: false, showLegend: true, showGrid: true }));
  const [result, setResult] = useState<ReportingQueryResult | null>(null);
  const [saveDraft, setSaveDraft] = useState<ReportingStudioSaveDraft>(() => ({
    datasetId: "",
    code: "viz-custom",
    title: "Nouveau widget",
    description: "",
  }));

  const { describeDataset, loading: describing } = useReportingDatasetDescribe();
  const { runDatasetQuery, loading: running } = useReportingDatasetRunQuery();

  const {
    items: datasets,
    loading: datasetsLoading,
    error: datasetsError,
    refetch: refetchDatasets,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingDataset",
    initVariables: { per_page: 200 },
    queryOptions: { includeQuickArgument: false },
  });

  const {
    items: visualizations,
    loading: visualizationsLoading,
    error: visualizationsError,
    refetch: refetchVisualizations,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingVisualization",
    initVariables: { per_page: 200 },
    queryOptions: { includeQuickArgument: false },
    skip: false,
  });

  const [createVisualization, { loading: creating }] = useMutation<ReportingVisualizationCreateResponse>(
    CREATE_VISUALIZATION_MUTATION,
  );
  const [updateVisualization, { loading: updating }] = useMutation<ReportingVisualizationUpdateResponse>(
    UPDATE_VISUALIZATION_MUTATION,
  );

  const datasetOptions = useMemo(() => {
    return (datasets ?? []).map((item: any) => ({
      id: String(item.id),
      label: `${item.title ?? item.code} (${item.source_app_label ?? ""}.${item.source_model ?? ""})`,
    }));
  }, [datasets]);

  const dimensionCandidates = useMemo(() => {
    const dims = spec.dimensions ?? [];
    return dims.map((d) => (typeof d === "string" ? d : d.name ?? d.field));
  }, [spec.dimensions]);

  const metricCandidates = useMemo(() => {
    const mets = spec.metrics ?? [];
    return mets.map((m) => (typeof m === "string" ? m : m.name ?? m.field ?? "metric"));
  }, [spec.metrics]);

  const loadDescription = useCallback(
    async (datasetId: string) => {
      if (!datasetId) return;
      const payload = await describeDataset(datasetId, true);
      if (!payload) {
        toast.error("Impossible de dÃ©crire le dataset (droits ou configuration).");
        return;
      }
      setDatasetDescription(payload);
      setSaveDraft((prev) => ({ ...prev, datasetId }));
    },
    [describeDataset],
  );

  const runPreview = useCallback(async () => {
    if (!selectedDatasetId) return;
    const payload = await runDatasetQuery(selectedDatasetId, {
      ...spec,
      limit: spec.limit ?? 200,
    });
    if (!payload) {
      toast.error("ExÃ©cution impossible (voir permissions / warnings).");
      return;
    }
    setResult(payload);
  }, [runDatasetQuery, selectedDatasetId, spec]);

  const saveWidget = useCallback(async () => {
    if (!saveDraft.datasetId) {
      toast.error("SÃ©lectionnez un dataset.");
      return;
    }
    if (!saveDraft.code.trim()) {
      toast.error("Code requis.");
      return;
    }
    if (!saveDraft.title.trim()) {
      toast.error("Titre requis.");
      return;
    }

    const input: Record<string, unknown> = {
      dataset: saveDraft.datasetId,
      code: saveDraft.code.trim(),
      title: saveDraft.title.trim(),
      description: saveDraft.description ?? "",
      kind: chart.kind,
      config: { query: spec, chart, version: 1 },
      default_filters: [],
      options: { studio: true },
      is_default: false,
    };

    if (saveDraft.id) {
      const { data } = await updateVisualization({
        variables: {
          id: saveDraft.id,
          input,
        },
      });
      const payload = data?.response;
      if (payload?.ok) {
        toast.success("Widget mis Ã  jour.");
        await refetchVisualizations?.();
      } else {
        toast.error(payload?.errors?.map((e: any) => e?.message).join(", ") || "Mise Ã  jour impossible.");
      }
      return;
    }

    const { data } = await createVisualization({ variables: { input } });
    const payload = data?.response;
    if (payload?.ok) {
      toast.success("Widget enregistrÃ© (ReportingVisualization).");
      await refetchVisualizations?.();
    } else {
      toast.error(payload?.errors?.map((e: any) => e?.message).join(", ") || "CrÃ©ation impossible.");
    }
  }, [chart, createVisualization, refetchVisualizations, saveDraft, spec, updateVisualization]);

  const savedWidgetsForDataset = useMemo(() => {
    const dsId = selectedDatasetId;
    if (!dsId) return [];
    return (visualizations ?? [])
      .filter((item: any) => String(item?.dataset?.id ?? item?.dataset_id) === dsId)
      .map((item: any) => ({
        id: String(item.id),
        code: String(item.code),
        title: String(item.title ?? item.code),
        kind: String(item.kind),
        description: String(item.description ?? ""),
        config: item.config as any,
      }));
  }, [selectedDatasetId, visualizations]);

  const studioHeader = (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Reporting Studio</CardTitle>
            <CardDescription>
              Construisez, prÃ©visualisez et sauvegardez vos widgets BI (Recharts + exports).
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchDatasets?.();
                void refetchVisualizations?.();
              }}
              disabled={datasetsLoading || visualizationsLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              RafraÃ®chir
            </Button>
            <Button variant="default" size="sm" onClick={() => void runPreview()} disabled={!selectedDatasetId || running}>
              <Sparkles className="mr-2 h-4 w-4" />
              PrÃ©visualiser
            </Button>
          </div>
        </div>
        {datasetsError ? <p className="text-xs text-destructive">{datasetsError.message}</p> : null}
        {visualizationsError ? <p className="text-xs text-destructive">{visualizationsError.message}</p> : null}
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Dataset</label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={selectedDatasetId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedDatasetId(next);
              setResult(null);
              setDatasetDescription(null);
              setSaveDraft((prev) => ({ ...prev, datasetId: next }));
              if (next) void loadDescription(next);
            }}
            disabled={datasetsLoading}
          >
            <option value="">SÃ©lectionner...</option>
            {datasetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {describing ? <p className="text-xs text-muted-foreground">Chargement du semantic layer...</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Code widget</label>
          <Input value={saveDraft.code} onChange={(e) => setSaveDraft((p) => ({ ...p, code: e.target.value }))} />
          <label className="text-xs font-semibold text-muted-foreground">Titre widget</label>
          <Input value={saveDraft.title} onChange={(e) => setSaveDraft((p) => ({ ...p, title: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Widgets existants (dataset)</label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={saveDraft.id ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                setSaveDraft((prev) => ({ ...prev, id: undefined }));
                return;
              }
              const found = savedWidgetsForDataset.find((w) => w.id === id);
              if (!found) return;
              setSaveDraft((prev) => ({ ...prev, id: found.id, code: found.code, title: found.title, description: found.description }));
              const cfg = found.config as any;
              if (cfg?.query) setSpec(cfg.query);
              if (cfg?.chart) setChart(cfg.chart);
              toast.message("Widget chargÃ© pour Ã©dition.");
            }}
            disabled={!selectedDatasetId}
          >
            <option value="">Nouveau widget</option>
            {savedWidgetsForDataset.map((widget) => (
              <option key={widget.id} value={widget.id}>
                {widget.title} ({widget.kind})
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void saveWidget()}
            disabled={creating || updating || !selectedDatasetId}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveDraft.id ? (updating ? "Mise Ã  jour..." : "Mettre Ã  jour") : creating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {studioHeader}

      {!datasetDescription ? (
        <p className="text-xs text-muted-foreground">
          SÃ©lectionnez un dataset pour charger son semantic layer et construire une requÃªte.
        </p>
      ) : (
        <Tabs defaultValue="query">
          <TabsList>
            <TabsTrigger value="query">RequÃªte</TabsTrigger>
            <TabsTrigger value="chart">Graphique</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="query">
            <ReportingSpecEditor description={datasetDescription} value={spec} onChange={setSpec} />
          </TabsContent>
          <TabsContent value="chart">
            <ReportingChartSpecEditor
              value={chart}
              onChange={setChart}
              availableDimensions={dimensionCandidates.length ? dimensionCandidates : datasetDescription.semantic_layer.dimensions.map((d) => d.name ?? d.field)}
              availableMetrics={metricCandidates.length ? metricCandidates : datasetDescription.semantic_layer.metrics.map((m) => m.name ?? m.field ?? "metric")}
            />
          </TabsContent>
          <TabsContent value="preview">
            {!result ? (
              <p className="text-xs text-muted-foreground">
                Cliquez sur â€œPrÃ©visualiserâ€ pour exÃ©cuter la requÃªte.
              </p>
            ) : (
              <ReportingWidgetCard
                title={chart.title || saveDraft.title}
                description={saveDraft.description}
                chart={chart}
                result={result}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

