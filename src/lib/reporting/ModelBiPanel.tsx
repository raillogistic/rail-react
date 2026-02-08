import type { JSX } from "react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { gql, useMutation } from "@apollo/client";
import { PanelTop, PlusCircle, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Textarea } from "@/lib/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { FormOverlay } from "../tables/components/ModelTableOverlays";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import { useModelTableMetadata } from "@/lib/tables/hooks";
import { useAdvancedFiltering } from "@/lib/tables/components/filtering";
import { FilterGroupEditor } from "@/lib/tables/components/filtering/FilterGroupEditor";
import type { FilterSeedSpec } from "@/lib/tables/components/filtering/types";
import {
  build_create_mutation,
  build_update_mutation,
  build_delete_mutation,
} from "../form/backend/types/mutations";
import type { TableFieldMetadataType } from "@/lib/tables/types";

/**
 * Props used to render the reusable BI panel linked to a business model.
 * @property appName - Django app label of the source model.
 * @property modelName - Model name used to scope BI datasets.
 * @property datasets - Existing datasets already linked to the model.
 * @property loading - Whether datasets are currently loading.
 * @property error - Optional error raised while loading datasets.
 * @property onRefresh - Callback triggered after creation to refetch datasets.
 * @property onEnable - Callback to activate the BI query (enables the tab).
 * @property title - Optional heading displayed above the cards.
 * @property description - Optional helper text below the heading.
 */
export type ModelBiPanelProps = {
  appName: string;
  modelName: string;
  datasets: any[];
  loading: boolean;
  error?: Error | null;
  onRefresh: () => void;
  onEnable: () => void;
  title?: string;
  description?: string;
};

/**
 * Public methods exposed by the BI panel for parent components.
 * @property openBuilder - Opens the creation drawer for a new BI dataset.
 */
export type ModelBiPanelHandle = {
  openBuilder: () => void;
};

const CREATE_DATASET_MUTATION = gql(
  build_create_mutation("ReportingDataset", "id code title description")
);

const UPDATE_DATASET_MUTATION = gql(
  build_update_mutation("ReportingDataset", "id code title description")
);

// Request no object payload on delete to avoid null id errors when the backend omits it.
const DELETE_DATASET_MUTATION = gql(
  build_delete_mutation("ReportingDataset", "")
);

const CREATE_VISUALIZATION_MUTATION = gql(
  build_create_mutation(
    "ReportingVisualization",
    "id code title kind dataset { id code title }"
  )
);

type BiDraftState = {
  code: string;
  title: string;
  description: string;
  filters: string;
};

type VisualizationDraft = {
  code: string;
  title: string;
  kind: string;
  description: string;
};

type DimensionRow = {
  name: string;
  field: string;
  label: string;
  transform?: string;
};

type MetricRow = {
  name: string;
  field: string;
  label: string;
  aggregation: string;
  format?: string;
};

type ComputedRow = {
  name: string;
  formula: string;
  label?: string;
};

type OrderingRow = {
  value: string;
};

const normalizeDatasetCard = (entry: any) => {
  const parseMaybeJsonArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        // ignore parse error, fallback to empty
      }
    }
    return [];
  };
  const dimensions = parseMaybeJsonArray(entry?.dimensions);
  const metrics = parseMaybeJsonArray(entry?.metrics);
  const computed_fields = parseMaybeJsonArray(entry?.computed_fields);
  const default_filters = parseMaybeJsonArray(entry?.default_filters);

  const ordering = parseMaybeJsonArray(entry?.ordering);
  return {
    ...entry,
    dimensions,
    metrics,
    computed_fields,
    default_filters,
    ordering,
  };
};

/**
 * Renders BI datasets linked to a model with drag-and-drop ordering and a drawer
 * to create new datasets powered by the reporting backend.
 */
export const ModelBiPanel = forwardRef<ModelBiPanelHandle, ModelBiPanelProps>(
  function ModelBiPanel(
    {
      appName,
      modelName,
      datasets,
      loading,
      error,
      onRefresh,
      onEnable,
      title = "Datasets BI liés au modèle",
      description,
    }: ModelBiPanelProps,
    ref
  ): JSX.Element {
    const biSignatureRef = useRef<string | null>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [draggingBiId, setDraggingBiId] = useState<string | number | null>(
      null
    );
    const [activeTab, setActiveTab] = useState<
      "dataset" | "filters" | "schema" | "visuals"
    >("dataset");
    const baseCode = `${appName}-${modelName}`.toLowerCase();
    const [builderOpen, setBuilderOpen] = useState(false);
    const [draft, setDraft] = useState<BiDraftState>({
      code: `${baseCode}-bi`,
      title: `BI ${modelName}`,
      description: "",
      filters: "[]",
    });

    const [dimensionRows, setDimensionRows] = useState<DimensionRow[]>([
      { name: "id", field: "id", label: "ID" },
    ]);
    const [metricRows, setMetricRows] = useState<MetricRow[]>([
      { name: "count", field: "id", label: "Total", aggregation: "count" },
    ]);
    const [computedRows, setComputedRows] = useState<ComputedRow[]>([]);
    const [orderingRows, setOrderingRows] = useState<OrderingRow[]>([
      { value: "-created_at" },
    ]);
    const [visualDrafts, setVisualDrafts] = useState<VisualizationDraft[]>([]);
    const [editingDataset, setEditingDataset] = useState<any | null>(null);

    const [createDataset, { loading: creating }] = useMutation(
      CREATE_DATASET_MUTATION
    );
    const [updateDataset, { loading: updating }] = useMutation(
      UPDATE_DATASET_MUTATION
    );
    const [deleteDataset, { loading: deleting }] = useMutation(
      DELETE_DATASET_MUTATION
    );
    const [createVisualization] = useMutation(CREATE_VISUALIZATION_MUTATION);
    const saving = creating || updating;

    const {
      metadata: sourceMeta,
      loading: metaLoading,
      error: metaError,
    } = useModelTableMetadata(appName, modelName);

    const filtersController = useAdvancedFiltering({
      filtersMeta: sourceMeta?.filters ?? [],
      displayMode: "dialog",
      title: "Filtres BI par défaut",
      onApply: () => undefined,
    });

    const resetBuilderState = useCallback(() => {
      setEditingDataset(null);
      setDraft({
        code: `${baseCode}-bi`,
        title: `BI ${modelName}`,
        description: "",
        filters: "[]",
      });
      setDimensionRows([{ name: "id", field: "id", label: "ID" }]);
      setMetricRows([
        { name: "count", field: "id", label: "Total", aggregation: "count" },
      ]);
      setComputedRows([]);
      setOrderingRows([{ value: "-created_at" }]);
      setVisualDrafts([]);
      filtersController.resetBuilder();
      setActiveTab("dataset");
    }, [baseCode, filtersController, modelName]);

    const fieldOptions = useMemo(() => {
      const fields =
        (sourceMeta?.fields as TableFieldMetadataType[] | undefined) ?? [];
      if (fields.length === 0) {
        return [{ value: "id", label: "ID" }];
      }
      return fields.map((field) => ({
        value: field.name,
        label: field.title || field.name,
      }));
    }, [sourceMeta?.fields]);

    const collectFilterSpecs = useCallback(() => {
      const flattenGroup = (
        group: typeof filtersController.rootGroup,
        connector: string = "and"
      ): Array<{
        field: string;
        lookup: string;
        value: unknown;
        connector: string;
      }> => {
        const specs: Array<{
          field: string;
          lookup: string;
          value: unknown;
          connector: string;
        }> = [];
        group.conditions.forEach((condition) => {
          const optionMeta = condition.option_name
            ? filtersController.getOptionMeta(condition.option_name)
            : undefined;
          if (!optionMeta) return;
          const lookupName =
            optionMeta.option.lookup || optionMeta.option.name || "exact";
          const parts = (optionMeta.option.name || "").split("__");
          const field =
            parts.length > 1 ? parts.slice(0, -1).join("__") : parts[0];
          const lookup =
            parts.length > 1 ? parts[parts.length - 1] : lookupName;
          const value =
            condition.value === undefined || condition.value === null
              ? ""
              : condition.value;
          specs.push({
            field,
            lookup,
            value,
            connector,
          });
        });
        group.groups.forEach((child) => {
          const childConnector =
            child.combinator && child.combinator === "OR" ? "or" : "and";
          specs.push(...flattenGroup(child, childConnector));
        });
        return specs;
      };

      return flattenGroup(filtersController.rootGroup);
    }, [filtersController]);

    const seedAdvancedFilters = useCallback(
      (entries: any[]) => {
        if (!entries || entries.length === 0) {
          filtersController.resetBuilder();
          return;
        }
        const specs: FilterSeedSpec[] = entries
          .map((entry: any) => {
            const fieldName = entry.field ?? entry.field_name;
            if (!fieldName) return null;
            const connector =
              typeof entry.connector === "string" &&
              entry.connector.toLowerCase() === "or"
                ? "or"
                : "and";
            return {
              field: fieldName,
              lookup: entry.lookup || "exact",
              value: entry.value,
              connector,
            } satisfies FilterSeedSpec;
          })
          .filter((spec): spec is FilterSeedSpec => Boolean(spec));
        filtersController.seedFromSpecs(specs);
      },
      [filtersController]
    );

    useEffect(() => {
      const signature = JSON.stringify(
        (Array.isArray(datasets) ? datasets : []).map((item) => ({
          id: item.id ?? item.code,
          updated_at: item.updated_at ?? item.updatedAt ?? null,
        }))
      );
      if (signature === biSignatureRef.current) return;
      biSignatureRef.current = signature;
      setCards(
        (Array.isArray(datasets) ? datasets : []).map(normalizeDatasetCard)
      );
    }, [datasets]);

    const seedBuilderFromDataset = useCallback(
      (entry: any) => {
        const normalized = normalizeDatasetCard(entry);
        setEditingDataset(normalized);
        setVisualDrafts([]);
        setDraft({
          code: normalized.code ?? "",
          title: normalized.title ?? "",
          description: normalized.description ?? "",
          filters: JSON.stringify(normalized.default_filters ?? []),
        });
        setDimensionRows(
          normalized.dimensions.length > 0
            ? (normalized.dimensions as DimensionRow[])
            : [{ name: "id", field: "id", label: "ID" }]
        );
        setMetricRows(
          normalized.metrics.length > 0
            ? (normalized.metrics as MetricRow[])
            : [
                {
                  name: "count",
                  field: "id",
                  label: "Total",
                  aggregation: "count",
                },
              ]
        );
        setComputedRows(
          normalized.computed_fields.length > 0
            ? (normalized.computed_fields as ComputedRow[])
            : []
        );
        setOrderingRows(
          normalized.ordering.length > 0
            ? (normalized.ordering as string[]).map((val) => ({ value: val }))
            : [{ value: "-created_at" }]
        );
        // Seed filters into the advanced builder
        if (normalized.default_filters.length > 0) {
          seedAdvancedFilters(normalized.default_filters);
        } else {
          filtersController.resetBuilder();
        }
        setBuilderOpen(true);
        setActiveTab("dataset");
      },
      [filtersController, seedAdvancedFilters]
    );

    const handleDragStart = useCallback((id: string | number) => {
      setDraggingBiId(id);
    }, []);

    const handleDrop = useCallback(
      (targetId: string | number) => {
        if (!draggingBiId || draggingBiId === targetId) return;
        setCards((prev) => {
          const next = [...prev];
          const fromIdx = next.findIndex(
            (item) => item.id === draggingBiId || item.code === draggingBiId
          );
          const toIdx = next.findIndex(
            (item) => item.id === targetId || item.code === targetId
          );
          if (fromIdx === -1 || toIdx === -1) return prev;
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          return next;
        });
        setDraggingBiId(null);
      },
      [draggingBiId]
    );

    const parseJsonField = useCallback((value: string, fallback: any) => {
      try {
        const parsed = JSON.parse(value || "[]");
        return parsed;
      } catch (err) {
        toast.error("Impossible de parser un champ JSON du builder BI");
        return fallback;
      }
    }, []);

    const handleCreate = useCallback(async () => {
      const builderFilters = collectFilterSpecs();
      const defaultFiltersPayload =
        builderFilters.length > 0
          ? builderFilters
          : parseJsonField(draft.filters, []);
      const dimensionsPayload =
        dimensionRows.length > 0
          ? dimensionRows
          : parseJsonField('[{"name":"id","field":"id","label":"ID"}]', []);
      const metricsPayload =
        metricRows.length > 0
          ? metricRows
          : parseJsonField(
              '[{"name":"count","field":"id","aggregation":"count","label":"Total"}]',
              []
            );
      const computedPayload =
        computedRows.length > 0 ? computedRows : parseJsonField("[]", []);
      const orderingPayload =
        orderingRows.length > 0
          ? orderingRows.map((row) => row.value)
          : parseJsonField('["-created_at"]', []);

      const input = {
        code: draft.code,
        title: draft.title,
        description: draft.description,
        source_app_label: appName,
        source_model: modelName,
        source_kind: "model",
        default_filters: defaultFiltersPayload,
        dimensions: dimensionsPayload,
        metrics: metricsPayload,
        computed_fields: computedPayload,
        ordering: orderingPayload,
      };
      const mutation = editingDataset ? updateDataset : createDataset;
      const variables = editingDataset
        ? {
            id: String(editingDataset.id ?? editingDataset.code),
            input,
          }
        : { input };

      const { data } = await mutation({ variables });
      const payload = data?.response;
      if (!payload?.ok || !payload.object?.id) {
        const message =
          payload?.errors?.map((e: any) => e?.message).join(", ") ||
          "Création/édition BI impossible";
        toast.error(message);
        return;
      }

      const datasetId = payload.object.id;
      const opLabel = editingDataset ? "mis a jour" : "cree";

      // Optionally create visualizations chained to the dataset
      if (visualDrafts.length > 0) {
        try {
          await Promise.all(
            visualDrafts.map((viz) =>
              createVisualization({
                variables: {
                  input: {
                    dataset: datasetId,
                    code: viz.code,
                    title: viz.title,
                    description: viz.description,
                    kind: viz.kind,
                    config: {},
                    default_filters: [],
                    options: {},
                    is_default: false,
                  },
                },
              })
            )
          );
          toast.success(
            `Visualisations liées (${visualDrafts.length}) créées avec le dataset.`
          );
        } catch (err) {
          toast.error(
            "Dataset créé, mais les visualisations n'ont pas été créées."
          );
        }
      } else {
        toast.success(`Element BI ${opLabel} et lie au modele.`);
      }
      setBuilderOpen(false);
      resetBuilderState();
      onRefresh();
    }, [
      appName,
      createDataset,
      createVisualization,
      editingDataset,
      updateDataset,
      draft,
      collectFilterSpecs,
      dimensionRows,
      metricRows,
      computedRows,
      orderingRows,
      modelName,
      onRefresh,
      parseJsonField,
      resetBuilderState,
      visualDrafts,
    ]);

    const emptyCard = useMemo(
      () => (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Aucun dataset BI associé. Utilisez le bouton “Nouvel élément BI” pour
          en créer un lié à {modelName}.
        </div>
      ),
      [modelName]
    );

    const openBuilder = useCallback(() => {
      onEnable();
      resetBuilderState();
      setBuilderOpen(true);
    }, [onEnable, resetBuilderState]);

    useImperativeHandle(
      ref,
      () => ({
        openBuilder,
      }),
      [openBuilder]
    );

    return (
      <div className="mt-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {title} ({appName}.{modelName})
            </p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
            {metaError ? (
              <p className="text-xs text-destructive">
                {metaError.message ||
                  "Impossible de charger les métadonnées du modèle"}
              </p>
            ) : null}
            {error ? (
              <p className="text-xs text-destructive">
                {error.message || "Erreur de chargement des éléments BI"}
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={openBuilder}
            disabled={saving}
          >
            <PanelTop className="mr-2 h-4 w-4" />
            Nouvel élément BI
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-lg border border-dashed border-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id ?? card.code}
                className="flex flex-col space-y-2 rounded-lg border p-3 shadow-sm transition hover:border-primary"
                draggable
                onDragStart={() => handleDragStart(card.id ?? card.code)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(card.id ?? card.code)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{card.title}</div>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                    {card.code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {card.description || "Aucune description"}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>Dims: {(card.dimensions?.length ?? 0) as number}</span>
                  <span>Metrics: {(card.metrics?.length ?? 0) as number}</span>
                  <span>
                    Filtres: {(card.default_filters?.length ?? 0) as number}
                  </span>
                  {card.source_app_label && card.source_model ? (
                    <span>
                      Source: {card.source_app_label}.{card.source_model}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      seedBuilderFromDataset(card);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      const id = card.id;
                      if (!id) {
                        toast.error(
                          "Identifiant manquant pour supprimer ce dataset."
                        );
                        return;
                      }
                      try {
                        await deleteDataset({ variables: { id } });
                        toast.success("Dataset supprimé");
                        onRefresh();
                      } catch (err) {
                        toast.error("Suppression impossible");
                      }
                    }}
                    disabled={deleting}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            {cards.length === 0 ? emptyCard : null}
          </div>
        )}

        <FormOverlay
          mode="drawer"
          open={builderOpen}
          onOpenChange={(open) => {
            setBuilderOpen(open);
            if (open) {
              onEnable();
            } else {
              resetBuilderState();
            }
          }}
          title={
            editingDataset
              ? "Mettre a jour un element BI"
              : "Creer un element BI"
          }
          width="720px"
        >
          <div className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="dataset">Dataset</TabsTrigger>
                <TabsTrigger value="filters">Filtres</TabsTrigger>
                <TabsTrigger value="schema">Dimensions & mesures</TabsTrigger>
                <TabsTrigger value="visuals">Visualisations</TabsTrigger>
              </TabsList>

              <TabsContent value="dataset" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Code
                    </label>
                    <Input
                      value={draft.code}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, code: e.target.value }))
                      }
                      placeholder="code-bicustom"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Titre
                    </label>
                    <Input
                      value={draft.title}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Dataset BI"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Description
                  </label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Objectif de ce jeu de données BI"
                  />
                </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-3">
                {metaLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Chargement des filtres disponibles...
                  </p>
                ) : sourceMeta?.filters?.length ? (
                  <div className="space-y-2">
                    <FilterGroupEditor
                      controller={filtersController}
                      group={filtersController.rootGroup}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => filtersController.applyFilters()}
                      >
                        Appliquer les filtres
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => filtersController.resetBuilder()}
                      >
                        Réinitialiser
                      </Button>
                      {filtersController.chips.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {filtersController.chips.length} filtre(s) appliqué(s)
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucun filtre déclaré pour ce modèle. Vous pouvez toujours
                    fournir un JSON de filtres par défaut dans l’onglet Schéma
                    si nécessaire.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="schema" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Dimensions
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDimensionRows((prev) => [
                          ...prev,
                          {
                            name: `dim_${prev.length + 1}`,
                            field: fieldOptions[0]?.value ?? "",
                            label: `Dimension ${prev.length + 1}`,
                            transform: "",
                          },
                        ])
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter une dimension
                    </Button>
                  </div>
                  {dimensionRows.map((row, idx) => (
                    <div
                      key={`${row.name}-${idx}`}
                      className="grid grid-cols-12 gap-2 rounded-md border p-2"
                    >
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Nom
                        </label>
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            setDimensionRows((prev) =>
                              prev.map((d, dIdx) =>
                                dIdx === idx
                                  ? { ...d, name: e.target.value }
                                  : d
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-4 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Champ source
                        </label>
                        <Select
                          value={row.field}
                          onValueChange={(val) =>
                            setDimensionRows((prev) =>
                              prev.map((d, dIdx) =>
                                dIdx === idx ? { ...d, field: val } : d
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Champ source" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Libellé
                        </label>
                        <Input
                          value={row.label}
                          onChange={(e) =>
                            setDimensionRows((prev) =>
                              prev.map((d, dIdx) =>
                                dIdx === idx
                                  ? { ...d, label: e.target.value }
                                  : d
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Transfo
                        </label>
                        <Input
                          value={row.transform ?? ""}
                          onChange={(e) =>
                            setDimensionRows((prev) =>
                              prev.map((d, dIdx) =>
                                dIdx === idx
                                  ? { ...d, transform: e.target.value }
                                  : d
                              )
                            )
                          }
                          placeholder="lower, date"
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDimensionRows((prev) =>
                              prev.filter((_, dIdx) => dIdx !== idx)
                            )
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Mesures
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setMetricRows((prev) => [
                          ...prev,
                          {
                            name: `metric_${prev.length + 1}`,
                            field: fieldOptions[0]?.value ?? "",
                            label: `Mesure ${prev.length + 1}`,
                            aggregation: "sum",
                          },
                        ])
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter une mesure
                    </Button>
                  </div>
                  {metricRows.map((row, idx) => (
                    <div
                      key={`${row.name}-${idx}`}
                      className="grid grid-cols-12 gap-2 rounded-md border p-2"
                    >
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Nom
                        </label>
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            setMetricRows((prev) =>
                              prev.map((m, mIdx) =>
                                mIdx === idx
                                  ? { ...m, name: e.target.value }
                                  : m
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Champ source
                        </label>
                        <Select
                          value={row.field}
                          onValueChange={(val) =>
                            setMetricRows((prev) =>
                              prev.map((m, mIdx) =>
                                mIdx === idx ? { ...m, field: val } : m
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Champ source" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Agrégation
                        </label>
                        <Select
                          value={row.aggregation}
                          onValueChange={(val) =>
                            setMetricRows((prev) =>
                              prev.map((m, mIdx) =>
                                mIdx === idx ? { ...m, aggregation: val } : m
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Agrégation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Somme</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="avg">Moyenne</SelectItem>
                            <SelectItem value="min">Min</SelectItem>
                            <SelectItem value="max">Max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Libellé
                        </label>
                        <Input
                          value={row.label}
                          onChange={(e) =>
                            setMetricRows((prev) =>
                              prev.map((m, mIdx) =>
                                mIdx === idx
                                  ? { ...m, label: e.target.value }
                                  : m
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setMetricRows((prev) =>
                              prev.filter((_, mIdx) => mIdx !== idx)
                            )
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Champs calculés
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setComputedRows((prev) => [
                          ...prev,
                          {
                            name: `calc_${prev.length + 1}`,
                            formula: "",
                            label: `Calcul ${prev.length + 1}`,
                          },
                        ])
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter un calcul
                    </Button>
                  </div>
                  {computedRows.map((row, idx) => (
                    <div
                      key={`${row.name}-${idx}`}
                      className="grid grid-cols-12 gap-2 rounded-md border p-2"
                    >
                      <div className="col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Nom
                        </label>
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            setComputedRows((prev) =>
                              prev.map((c, cIdx) =>
                                cIdx === idx
                                  ? { ...c, name: e.target.value }
                                  : c
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-6 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Formule
                        </label>
                        <Input
                          value={row.formula}
                          onChange={(e) =>
                            setComputedRows((prev) =>
                              prev.map((c, cIdx) =>
                                cIdx === idx
                                  ? { ...c, formula: e.target.value }
                                  : c
                              )
                            )
                          }
                          placeholder="count / 10"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Libellé
                        </label>
                        <Input
                          value={row.label ?? ""}
                          onChange={(e) =>
                            setComputedRows((prev) =>
                              prev.map((c, cIdx) =>
                                cIdx === idx
                                  ? { ...c, label: e.target.value }
                                  : c
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setComputedRows((prev) =>
                              prev.filter((_, cIdx) => cIdx !== idx)
                            )
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Tri par défaut
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setOrderingRows((prev) => [
                          ...prev,
                          { value: "-created_at" },
                        ])
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter un tri
                    </Button>
                  </div>
                  {orderingRows.map((row, idx) => (
                    <div
                      key={`${row.value}-${idx}`}
                      className="grid grid-cols-12 gap-2 rounded-md border p-2"
                    >
                      <div className="col-span-10 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Champ / ordre (ex: -created_at)
                        </label>
                        <Input
                          value={row.value}
                          onChange={(e) =>
                            setOrderingRows((prev) =>
                              prev.map((o, oIdx) =>
                                oIdx === idx
                                  ? { ...o, value: e.target.value }
                                  : o
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 flex items-end justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setOrderingRows((prev) =>
                              prev.filter((_, oIdx) => oIdx !== idx)
                            )
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="visuals" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Préparez des visualisations à créer automatiquement après le
                    dataset.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setVisualDrafts((prev) => [
                        ...prev,
                        {
                          code: `${draft.code}-viz-${prev.length + 1}`,
                          title: `Visualisation ${prev.length + 1}`,
                          kind: "table",
                          description: "",
                        },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une visualisation
                  </Button>
                </div>
                {visualDrafts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune visualisation préparée. Ajoutez-en pour les créer
                    après le dataset.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visualDrafts.map((viz, idx) => (
                      <div
                        key={viz.code}
                        className="grid grid-cols-12 gap-2 rounded-md border p-2"
                      >
                        <div className="col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Code
                          </label>
                          <Input
                            value={viz.code}
                            onChange={(e) =>
                              setVisualDrafts((prev) =>
                                prev.map((v, vIdx) =>
                                  vIdx === idx
                                    ? { ...v, code: e.target.value }
                                    : v
                                )
                              )
                            }
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Titre
                          </label>
                          <Input
                            value={viz.title}
                            onChange={(e) =>
                              setVisualDrafts((prev) =>
                                prev.map((v, vIdx) =>
                                  vIdx === idx
                                    ? { ...v, title: e.target.value }
                                    : v
                                )
                              )
                            }
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Type
                          </label>
                          <Select
                            value={viz.kind}
                            onValueChange={(val) =>
                              setVisualDrafts((prev) =>
                                prev.map((v, vIdx) =>
                                  vIdx === idx ? { ...v, kind: val } : v
                                )
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="table">Tableau</SelectItem>
                              <SelectItem value="bar">Histogramme</SelectItem>
                              <SelectItem value="line">Courbe</SelectItem>
                              <SelectItem value="area">Aire</SelectItem>
                              <SelectItem value="pie">Camembert</SelectItem>
                              <SelectItem value="heatmap">Heatmap</SelectItem>
                              <SelectItem value="pivot">Pivot</SelectItem>
                              <SelectItem value="kpi">Indicateur</SelectItem>
                              <SelectItem value="pdf">Export PDF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Description
                          </label>
                          <Input
                            value={viz.description}
                            onChange={(e) =>
                              setVisualDrafts((prev) =>
                                prev.map((v, vIdx) =>
                                  vIdx === idx
                                    ? { ...v, description: e.target.value }
                                    : v
                                )
                              )
                            }
                          />
                        </div>
                        <div className="col-span-1 flex items-end justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setVisualDrafts((prev) =>
                                prev.filter((_, vIdx) => vIdx !== idx)
                              )
                            }
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setBuilderOpen(false);
                  resetBuilderState();
                }}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleCreate}
                disabled={saving}
              >
                {editingDataset
                  ? updating
                    ? "Mise a jour..."
                    : "Mettre a jour le dataset"
                  : creating
                  ? "Creation..."
                  : "Creer et lier au modele"}
              </Button>
            </div>
          </div>
        </FormOverlay>
      </div>
    );
  }
);
