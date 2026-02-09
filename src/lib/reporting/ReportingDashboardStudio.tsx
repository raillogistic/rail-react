import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/lib/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/components/ui/select";
import {
  build_create_mutation,
  build_delete_mutation,
  build_update_mutation,
  type CreateMutationResponse,
  type DeleteMutationResponse,
  type UpdateMutationResponse,
} from "@/lib/form/backend/types/mutations";
import { useGraphQLModelTable } from "@/lib/table/compat/hooks";
import { useReportingReportBuildPayload } from "@/lib/reporting/graphql";
import type { ReportingChartSpec, ReportingQueryResult, ReportingVisualizationConfig } from "@/lib/reporting/types";
import { ReportingWidgetCard } from "@/lib/reporting/components/ReportingWidgetCard";

/**
 * Dashboard block layout stored in `ReportingReportBlock.layout`.
 * @property cols - Number of columns (CSS grid) to span.
 */
export type ReportingDashboardBlockLayout = {
  cols: number;
};

/**
 * Local dashboard block state used by the studio.
 * @property id - Block ID.
 * @property visualizationId - Visualization ID.
 * @property title - Visualization title.
 * @property description - Visualization description.
 * @property chart - Chart spec resolved from visualization config.
 * @property result - Query result payload.
 * @property layout - Layout hints.
 * @property position - Position used for ordering.
 */
export type ReportingDashboardBlockState = {
  id: string;
  visualizationId: string;
  title: string;
  description?: string | null;
  chart: ReportingChartSpec;
  result: ReportingQueryResult;
  layout: ReportingDashboardBlockLayout;
  position: number;
};

type ReportingReportMutationObject = { id: string; code: string; title: string };
type ReportingReportCreateResponse = { response: CreateMutationResponse<ReportingReportMutationObject> };
type ReportingReportUpdateResponse = { response: UpdateMutationResponse<ReportingReportMutationObject> };

type ReportingReportBlockMutationObject = { id: string };
type ReportingReportBlockCreateResponse = { response: CreateMutationResponse<ReportingReportBlockMutationObject> };
type ReportingReportBlockUpdateResponse = { response: UpdateMutationResponse<ReportingReportBlockMutationObject> };
type ReportingReportBlockDeleteResponse = { response: DeleteMutationResponse<ReportingReportBlockMutationObject> };

const CREATE_REPORT_MUTATION = gql(build_create_mutation("ReportingReport", "id code title"));
const UPDATE_REPORT_MUTATION = gql(build_update_mutation("ReportingReport", "id code title"));

const CREATE_REPORT_BLOCK_MUTATION = gql(build_create_mutation("ReportingReportBlock", "id"));
const UPDATE_REPORT_BLOCK_MUTATION = gql(build_update_mutation("ReportingReportBlock", "id"));
const DELETE_REPORT_BLOCK_MUTATION = gql(build_delete_mutation("ReportingReportBlock", "id"));

/**
 * Props for a sortable block row.
 * @property block - Block state.
 * @property onRemove - Remove block handler.
 * @property onResize - Resize handler.
 */
type SortableBlockRowProps = {
  block: ReportingDashboardBlockState;
  onRemove: (blockId: string) => void;
  onResize: (blockId: string, cols: number) => void;
};

/**
 * Sortable row wrapper for dashboard blocks.
 */
function SortableBlockRow({ block, onRemove, onResize }: SortableBlockRowProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2 rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab rounded border px-2 py-1 text-xs text-muted-foreground"
            {...attributes}
            {...listeners}
            aria-label="DÃ©placer"
          >
            Drag
          </button>
          <span className="text-xs font-semibold">{block.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(block.layout.cols)}
            onValueChange={(val) => onResize(block.id, Number(val))}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Largeur" />
            </SelectTrigger>
            <SelectContent>
              {[3, 4, 6, 8, 12].map((cols) => (
                <SelectItem key={cols} value={String(cols)}>
                  {cols}/12
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => onRemove(block.id)} title="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div style={{ gridColumn: `span ${Math.max(1, Math.min(12, block.layout.cols))} / span ${Math.max(1, Math.min(12, block.layout.cols))}` }}>
          <ReportingWidgetCard
            title={block.title}
            description={block.description}
            chart={block.chart}
            result={block.result}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Resolve a chart spec from a visualization config payload.
 *
 * @param config - Visualization config (may include chart/query).
 * @param fallbackKind - Backend visualization kind (used when config is legacy).
 * @returns Chart spec.
 */
function resolveChartSpec(config: ReportingVisualizationConfig | Record<string, unknown> | null, fallbackKind: string): ReportingChartSpec {
  const cfg = (config ?? {}) as any;
  if (cfg.chart && typeof cfg.chart === "object") {
    return cfg.chart as ReportingChartSpec;
  }
  return { kind: (fallbackKind as any) ?? "table", showLegend: true, showGrid: true };
}

/**
 * Dashboard Studio: build and persist dashboards (`ReportingReport` + blocks).
 */
export function ReportingDashboardStudio(): JSX.Element {
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [reportDraft, setReportDraft] = useState<{ id?: string; code: string; title: string }>({
    code: "dashboard-custom",
    title: "Nouveau dashboard",
  });
  const [blocks, setBlocks] = useState<ReportingDashboardBlockState[]>([]);
  const [selectedVisualizationToAdd, setSelectedVisualizationToAdd] = useState<string>("");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const {
    items: reports,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingReport",
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
    initVariables: { per_page: 500 },
    queryOptions: { includeQuickArgument: false },
  });

  const { buildReportPayload, loading: building } = useReportingReportBuildPayload();

  const [createReport, { loading: creatingReport }] = useMutation<ReportingReportCreateResponse>(CREATE_REPORT_MUTATION);
  const [updateReport, { loading: updatingReport }] = useMutation<ReportingReportUpdateResponse>(UPDATE_REPORT_MUTATION);
  const [createBlock, { loading: creatingBlock }] = useMutation<ReportingReportBlockCreateResponse>(CREATE_REPORT_BLOCK_MUTATION);
  const [updateBlock, { loading: updatingBlock }] = useMutation<ReportingReportBlockUpdateResponse>(UPDATE_REPORT_BLOCK_MUTATION);
  const [deleteBlock, { loading: deletingBlock }] = useMutation<ReportingReportBlockDeleteResponse>(DELETE_REPORT_BLOCK_MUTATION);

  const reportOptions = useMemo(() => {
    return (reports ?? []).map((item: any) => ({
      id: String(item.id),
      label: `${item.title ?? item.code}`,
      code: String(item.code ?? ""),
      title: String(item.title ?? ""),
    }));
  }, [reports]);

  const visualizationOptions = useMemo(() => {
    return (visualizations ?? []).map((item: any) => ({
      id: String(item.id),
      label: `${item.title ?? item.code} (${item.kind ?? ""})`,
    }));
  }, [visualizations]);

  const loadReport = useCallback(
    async (reportId: string) => {
      if (!reportId) return;
      const payload = await buildReportPayload(reportId, { limit: 200 });
      if (!payload) {
        toast.error("Impossible de charger le dashboard (droits / configuration).");
        return;
      }

      const nextBlocks: ReportingDashboardBlockState[] = payload.visualizations.map((block, idx) => {
        const viz = block.visualization as any;
        const visualizationId = String(viz.id ?? "");
        const config = (viz.config ?? {}) as any;
        return {
          id: String(block.block_id),
          visualizationId,
          title: String(viz.title ?? viz.code ?? `Widget ${idx + 1}`),
          description: null,
          chart: resolveChartSpec(config, String(viz.kind ?? "table")),
          result: block.dataset,
          layout: {
            cols: Number((block.layout as any)?.cols ?? 6),
          },
          position: idx + 1,
        };
      });
      setBlocks(nextBlocks);
    },
    [buildReportPayload],
  );

  useEffect(() => {
    if (!selectedReportId) return;
    void loadReport(selectedReportId);
  }, [loadReport, selectedReportId]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        return next.map((block, idx) => ({ ...block, position: idx + 1 }));
      });
    },
    [],
  );

  const createOrUpdateReport = useCallback(async () => {
    if (!reportDraft.code.trim() || !reportDraft.title.trim()) {
      toast.error("Code et titre requis.");
      return;
    }
    if (reportDraft.id) {
      const { data } = await updateReport({
        variables: {
          id: reportDraft.id,
          input: {
            code: reportDraft.code,
            title: reportDraft.title,
          },
        },
      });
      if (data?.response?.ok) {
        toast.success("Dashboard mis Ã  jour.");
        await refetchReports?.();
      } else {
        toast.error(data?.response?.errors?.map((e) => e?.message).join(", ") || "Mise Ã  jour impossible.");
      }
      return;
    }
    const { data } = await createReport({ variables: { input: { code: reportDraft.code, title: reportDraft.title, description: "", layout: [], filters: [] } } });
    if (data?.response?.ok && data.response.object?.id) {
      toast.success("Dashboard crÃ©Ã©.");
      const createdId = String(data.response.object.id);
      setSelectedReportId(createdId);
      setReportDraft((prev) => ({ ...prev, id: createdId }));
      await refetchReports?.();
    } else {
      toast.error(data?.response?.errors?.map((e) => e?.message).join(", ") || "CrÃ©ation impossible.");
    }
  }, [createReport, refetchReports, reportDraft, updateReport]);

  const saveLayout = useCallback(async () => {
    if (!selectedReportId) return;
    for (const block of blocks) {
      await updateBlock({
        variables: {
          id: block.id,
          input: {
            position: block.position,
            layout: block.layout,
          },
        },
      });
    }
    toast.success("Layout sauvegardÃ©.");
    await loadReport(selectedReportId);
  }, [blocks, loadReport, selectedReportId, updateBlock]);

  const addVisualization = useCallback(async () => {
    if (!selectedReportId || !selectedVisualizationToAdd) return;
    const position = blocks.length + 1;
    const { data } = await createBlock({
      variables: {
        input: {
          report: selectedReportId,
          visualization: selectedVisualizationToAdd,
          position,
          layout: { cols: 6 },
        },
      },
    });
    if (data?.response?.ok) {
      toast.success("Widget ajoutÃ© au dashboard.");
      setSelectedVisualizationToAdd("");
      await loadReport(selectedReportId);
    } else {
      toast.error(data?.response?.errors?.map((e) => e?.message).join(", ") || "Ajout impossible.");
    }
  }, [blocks.length, createBlock, loadReport, selectedReportId, selectedVisualizationToAdd]);

  const removeBlockById = useCallback(async (blockId: string) => {
    const { data } = await deleteBlock({ variables: { id: blockId } });
    if (data?.response?.ok) {
      toast.success("Bloc supprimÃ©.");
      setBlocks((prev) => prev.filter((b) => b.id !== blockId).map((b, idx) => ({ ...b, position: idx + 1 })));
    } else {
      toast.error(data?.response?.errors?.map((e) => e?.message).join(", ") || "Suppression impossible.");
    }
  }, [deleteBlock]);

  const resizeBlock = useCallback((blockId: string, cols: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, layout: { ...b.layout, cols } } : b)));
  }, []);

  const busy = reportsLoading || visualizationsLoading || building || creatingReport || updatingReport || creatingBlock || updatingBlock || deletingBlock;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Dashboard Studio</CardTitle>
              <CardDescription>Assemblez vos widgets BI en dashboards partageables.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetchReports?.();
                  void refetchVisualizations?.();
                  if (selectedReportId) void loadReport(selectedReportId);
                }}
                disabled={busy}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                RafraÃ®chir
              </Button>
              <Button variant="default" size="sm" onClick={() => void saveLayout()} disabled={!selectedReportId || busy}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder layout
              </Button>
            </div>
          </div>
          {reportsError ? <p className="text-xs text-destructive">{reportsError.message}</p> : null}
          {visualizationsError ? <p className="text-xs text-destructive">{visualizationsError.message}</p> : null}
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Dashboard</label>
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={selectedReportId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedReportId(id);
                const option = reportOptions.find((r) => r.id === id);
                if (option) setReportDraft({ id, code: option.code, title: option.title });
                else setReportDraft({ code: "dashboard-custom", title: "Nouveau dashboard" });
                setBlocks([]);
              }}
            >
              <option value="">SÃ©lectionner...</option>
              {reportOptions.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">Ou crÃ©ez-en un ci-dessous.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Code</label>
            <Input value={reportDraft.code} onChange={(e) => setReportDraft((p) => ({ ...p, code: e.target.value }))} />
            <label className="text-xs font-semibold text-muted-foreground">Titre</label>
            <Input value={reportDraft.title} onChange={(e) => setReportDraft((p) => ({ ...p, title: e.target.value }))} />
            <Button variant="outline" size="sm" onClick={() => void createOrUpdateReport()} disabled={busy}>
              {reportDraft.id ? "Mettre Ã  jour" : "CrÃ©er dashboard"}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Ajouter un widget</label>
            <Select value={selectedVisualizationToAdd} onValueChange={setSelectedVisualizationToAdd}>
              <SelectTrigger>
                <SelectValue placeholder="Visualisation..." />
              </SelectTrigger>
              <SelectContent>
                {visualizationOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="default" size="sm" onClick={() => void addVisualization()} disabled={!selectedReportId || !selectedVisualizationToAdd || busy}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedReportId ? (
        <p className="text-xs text-muted-foreground">SÃ©lectionnez un dashboard pour charger ses widgets.</p>
      ) : blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun widget pour ce dashboard. Ajoutez-en un.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blocks.map((block) => (
                <SortableBlockRow
                  key={block.id}
                  block={block}
                  onRemove={(id) => void removeBlockById(id)}
                  onResize={resizeBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

