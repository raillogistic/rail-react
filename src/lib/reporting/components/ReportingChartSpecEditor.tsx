import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/components/ui/select";
import type { ReportingChartKind, ReportingChartSpec } from "@/lib/reporting/types";

/**
 * Props for the chart spec editor.
 * @property value - Current chart spec.
 * @property onChange - Called when the chart spec changes.
 * @property availableDimensions - Available dimension field/alias names.
 * @property availableMetrics - Available metric field/alias names.
 */
export type ReportingChartSpecEditorProps = {
  value: ReportingChartSpec;
  onChange: (next: ReportingChartSpec) => void;
  availableDimensions: string[];
  availableMetrics: string[];
};

const CHART_KINDS: Array<{ value: ReportingChartKind; label: string }> = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "kpi", label: "KPI" },
  { value: "heatmap", label: "Heatmap" },
];

/**
 * Chart spec editor used by the reporting studio.
 */
export function ReportingChartSpecEditor({
  value,
  onChange,
  availableDimensions,
  availableMetrics,
}: ReportingChartSpecEditorProps): JSX.Element {
  const setPartial = useCallback(
    (partial: Partial<ReportingChartSpec>) => onChange({ ...value, ...partial }),
    [onChange, value],
  );

  const series = useMemo(() => value.series ?? [], [value.series]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Type</label>
          <Select
            value={value.kind}
            onValueChange={(val) => setPartial({ kind: val as ReportingChartKind })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Titre (optionnel)</label>
          <Input value={value.title ?? ""} onChange={(e) => setPartial({ title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Axe X / Label</label>
          <Select value={value.x ?? ""} onValueChange={(val) => setPartial({ x: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Dimension..." />
            </SelectTrigger>
            <SelectContent>
              {availableDimensions.map((dim) => (
                <SelectItem key={dim} value={dim}>
                  {dim}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">KPI (Y)</label>
          <Select value={value.y ?? ""} onValueChange={(val) => setPartial({ y: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Mesure..." />
            </SelectTrigger>
            <SelectContent>
              {availableMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.kind === "pie" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Label field</label>
            <Select value={value.labelField ?? ""} onValueChange={(val) => setPartial({ labelField: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Dimension..." />
              </SelectTrigger>
              <SelectContent>
                {availableDimensions.map((dim) => (
                  <SelectItem key={dim} value={dim}>
                    {dim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Value field</label>
            <Select value={value.valueField ?? ""} onValueChange={(val) => setPartial({ valueField: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Mesure..." />
              </SelectTrigger>
              <SelectContent>
                {availableMetrics.map((metric) => (
                  <SelectItem key={metric} value={metric}>
                    {metric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : value.kind === "bar" || value.kind === "line" || value.kind === "area" ? (
        <div className="rounded-md border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Séries</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPartial({ series: series.length ? series : [availableMetrics[0] ?? ""] })}
            >
              <Plus className="mr-1 h-4 w-4" /> Pré-remplir
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {series.map((field, idx) => (
              <div key={`${field}-${idx}`} className="flex items-center gap-2">
                <Select
                  value={field}
                  onValueChange={(val) => {
                    const next = [...series];
                    next[idx] = val;
                    setPartial({ series: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mesure..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric} value={metric}>
                        {metric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = [...series];
                    next.splice(idx, 1);
                    setPartial({ series: next });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPartial({ series: [...series, availableMetrics[0] ?? ""] })}
            >
              <Plus className="mr-1 h-4 w-4" /> Ajouter une série
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
