import type { JSX } from "react";
import React, { useCallback, useMemo, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Layers, RefreshCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Textarea } from "@/shared/ui/kit/textarea";
import { useGraphQLModelTable } from "../table/compat/hooks";
import { build_create_mutation } from "../form/mutations";

/**
 * Props to render the visualization creation panel.
 * @property onCreated - Callback invoked after a successful creation (e.g., to refresh a table).
 * @property title - Optional heading shown above the form.
 * @property description - Optional helper text below the heading.
 */
export type ReportingVisualizationPanelProps = {
  onCreated?: () => void;
  title?: string;
  description?: string;
};

const CREATE_VISUALIZATION_MUTATION = gql(
  build_create_mutation(
    "ReportingVisualization",
    "id code title kind dataset { id code title }"
  )
);

type VisualizationDraft = {
  datasetId: string;
  code: string;
  title: string;
  description: string;
  kind: string;
  config: string;
  defaultFilters: string;
  options: string;
  isDefault: boolean;
};

const VISUALIZATION_KINDS: Array<{ value: string; label: string }> = [
  { value: "table", label: "Tableau" },
  { value: "bar", label: "Histogramme" },
  { value: "line", label: "Courbe" },
  { value: "area", label: "Aire" },
  { value: "pie", label: "Camembert" },
  { value: "heatmap", label: "Heatmap" },
  { value: "pivot", label: "Pivot" },
  { value: "kpi", label: "Indicateur" },
  { value: "pdf", label: "Export PDF" },
];

/**
 * Rich panel to create `ReportingVisualization` entries quickly without leaving the listing.
 */
export function ReportingVisualizationPanel({
  onCreated,
  title = "CrÃ©er une visualisation",
  description = "Associez cette visualisation Ã  un dataset BI existant puis dÃ©finissez son type et sa configuration.",
}: ReportingVisualizationPanelProps): JSX.Element {
  const [draft, setDraft] = useState<VisualizationDraft>(() => ({
    datasetId: "",
    code: "viz-custom",
    title: "Nouvelle visualisation",
    description: "",
    kind: "table",
    config: '{\n  "columns": [],\n  "x": "id",\n  "y": "count",\n  "color": null\n}',
    defaultFilters: "[]",
    options: '{\n  "theme": "auto",\n  "legend": true\n}',
    isDefault: false,
  }));

  const [createVisualization, { loading: creating }] = useMutation(
    CREATE_VISUALIZATION_MUTATION
  );

  const {
    items: datasets,
    loading: datasetsLoading,
    error: datasetsError,
    refetch: refetchDatasets,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingDataset",
    initVariables: { per_page: 50 },
    queryOptions: { includeQuickArgument: false },
  });

  const datasetOptions = useMemo(
    () =>
      (datasets ?? []).map((item: any) => ({
        value: item.id,
        label: `${item.title ?? item.code} (${item.source_app_label ?? ""}.${
          item.source_model ?? ""
        })`,
      })),
    [datasets]
  );

  const parseJsonField = useCallback((value: string, fallback: any) => {
    try {
      return JSON.parse(value || "null") ?? fallback;
    } catch (err) {
      toast.error("JSON invalide, merci de corriger avant de crÃ©er.");
      return fallback;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!draft.datasetId) {
      toast.error("SÃ©lectionnez un dataset BI pour lier la visualisation.");
      return;
    }
    const input = {
      dataset: draft.datasetId,
      code: draft.code,
      title: draft.title,
      description: draft.description,
      kind: draft.kind,
      config: parseJsonField(draft.config, {}),
      default_filters: parseJsonField(draft.defaultFilters, []),
      options: parseJsonField(draft.options, {}),
      is_default: draft.isDefault,
    };
    const { data } = await createVisualization({ variables: { input } });
    const payload = data?.response;
    if (payload?.ok) {
      toast.success("Visualisation crÃ©Ã©e et liÃ©e au dataset.");
      onCreated?.();
    } else {
      const message =
        payload?.errors?.map((e: any) => e?.message).join(", ") ||
        "CrÃ©ation impossible";
      toast.error(message);
    }
  }, [createVisualization, draft, onCreated, parseJsonField]);

  const selectedDatasetLabel = useMemo(() => {
    const option = datasetOptions.find((opt) => opt.value === draft.datasetId);
    return option?.label ?? "Aucun dataset sÃ©lectionnÃ©";
  }, [datasetOptions, draft.datasetId]);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {datasetsError ? (
            <p className="text-xs text-destructive">
              {datasetsError.message || "Impossible de charger les datasets BI."}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              refetchDatasets?.();
            }}
            title="RafraÃ®chir la liste des datasets"
            disabled={datasetsLoading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleSubmit}
            disabled={creating || !draft.datasetId || !draft.code}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            CrÃ©er la visualisation
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Dataset BI
          </label>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {selectedDatasetLabel}
            </span>
          </div>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={draft.datasetId}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, datasetId: e.target.value }))
            }
          >
            <option value="">SÃ©lectionner...</option>
            {datasetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Code
          </label>
          <Input
            value={draft.code}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="viz-unique-code"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Titre
          </label>
          <Input
            value={draft.title}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Performance hebdomadaire"
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Type de visualisation
          </label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={draft.kind}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, kind: e.target.value }))
            }
          >
            {VISUALIZATION_KINDS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Description
          </label>
          <Input
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Objectif / KPI visualisÃ©"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Par dÃ©faut ?
          </label>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, isDefault: e.target.checked }))
              }
            />
            <span className="text-xs text-muted-foreground">
              Marquer comme visualisation par dÃ©faut pour ce dataset
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Configuration (JSON)
          </label>
          <Textarea
            className="font-mono text-xs"
            rows={10}
            value={draft.config}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, config: e.target.value }))
            }
            placeholder='{"x":"date","y":"count","type":"bar"}'
          />
          <p className="text-[11px] text-muted-foreground">
            DÃ©finissez axes/colonnes, lÃ©gende, couleurs, seuils. Le backend
            renverra cette config telle quelle au frontend aprÃ¨s rendu.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Filtres par dÃ©faut (JSON array)
          </label>
          <Textarea
            className="font-mono text-xs"
            rows={4}
            value={draft.defaultFilters}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, defaultFilters: e.target.value }))
            }
            placeholder='[{"field":"status","lookup":"exact","value":"active"}]'
          />
          <label className="text-xs font-semibold text-muted-foreground">
            Options UI (JSON)
          </label>
          <Textarea
            className="font-mono text-xs"
            rows={4}
            value={draft.options}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, options: e.target.value }))
            }
            placeholder='{"theme":"auto","legend":true}'
          />
        </div>
      </div>
    </div>
  );
}

