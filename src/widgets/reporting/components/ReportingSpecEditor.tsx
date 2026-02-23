import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { Textarea } from "@/shared/ui/kit/textarea";
import type {
  ReportingDatasetDescription,
  ReportingQueryMode,
  ReportingQuerySpec,
} from "@/widgets/reporting/types";
import { ReportingFilterTreeEditor } from "@/widgets/reporting/components/ReportingFilterTreeEditor";

/**
 * Props for the reporting spec editor.
 * @property description - Dataset description payload used for suggestions.
 * @property value - Current query spec.
 * @property onChange - Called when the spec changes.
 */
export type ReportingSpecEditorProps = {
  description: ReportingDatasetDescription;
  value: ReportingQuerySpec;
  onChange: (next: ReportingQuerySpec) => void;
};

/**
 * Safely parse a JSON string into a value.
 *
 * @param value - JSON string.
 * @returns Parsed value or undefined.
 */
function parseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Pretty-print JSON for an editor.
 *
 * @param value - JSON-compatible value.
 * @returns Stringified JSON.
 */
function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

/**
 * Reporting spec editor with a builder mode and a raw JSON mode.
 */
export function ReportingSpecEditor({ description, value, onChange }: ReportingSpecEditorProps): JSX.Element {
  const [jsonDraft, setJsonDraft] = useState<string>(() => stringifyJson(value));

  const allowAdHoc = description.semantic_layer.allow_ad_hoc;
  const allowedLookups = description.semantic_layer.allowed_lookups ?? [];

  const availableDimensionNames = useMemo(
    () => description.semantic_layer.dimensions.map((dim) => dim.name ?? dim.field),
    [description.semantic_layer.dimensions],
  );

  const availableMetricNames = useMemo(
    () => description.semantic_layer.metrics.map((metric) => metric.name ?? metric.field ?? "metric"),
    [description.semantic_layer.metrics],
  );

  const availableFields = useMemo(() => {
    const base = new Set<string>();
    for (const dim of description.semantic_layer.dimensions) base.add(dim.field);
    for (const metric of description.semantic_layer.metrics) if (metric.field) base.add(metric.field);
    for (const field of description.semantic_layer.allowed_fields ?? []) base.add(field);
    for (const field of description.model_fields ?? []) if (field.name) base.add(field.name);
    return Array.from(base).sort();
  }, [description.model_fields, description.semantic_layer.allowed_fields, description.semantic_layer.dimensions, description.semantic_layer.metrics]);

  const setPartial = useCallback(
    (partial: Partial<ReportingQuerySpec>) => onChange({ ...value, ...partial }),
    [onChange, value],
  );

  const mode = (value.mode ?? "aggregate") as ReportingQueryMode;

  const dimensions = useMemo(() => (value.dimensions ?? []).map((dim) => (typeof dim === "string" ? dim : dim.name ?? dim.field)), [value.dimensions]);
  const metrics = useMemo(() => (value.metrics ?? []).map((metric) => (typeof metric === "string" ? metric : metric.name ?? metric.field ?? "metric")), [value.metrics]);

  const addDimension = useCallback(
    (name: string) => {
      if (!name) return;
      const next = Array.from(new Set([...dimensions, name]));
      setPartial({ dimensions: next });
    },
    [dimensions, setPartial],
  );

  const addMetric = useCallback(
    (name: string) => {
      if (!name) return;
      const next = Array.from(new Set([...metrics, name]));
      setPartial({ metrics: next });
    },
    [metrics, setPartial],
  );

  const removeDimension = useCallback(
    (name: string) => setPartial({ dimensions: dimensions.filter((item) => item !== name) }),
    [dimensions, setPartial],
  );

  const removeMetric = useCallback(
    (name: string) => setPartial({ metrics: metrics.filter((item) => item !== name) }),
    [metrics, setPartial],
  );

  const builder = (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Mode</label>
          <Select value={mode} onValueChange={(val) => setPartial({ mode: val as ReportingQueryMode })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aggregate">Agrégations</SelectItem>
              <SelectItem value="records">Enregistrements</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Quick</label>
          <Input value={value.quick ?? ""} onChange={(e) => setPartial({ quick: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Limit</label>
          <Input
            type="number"
            min={1}
            value={value.limit ?? 200}
            onChange={(e) => setPartial({ limit: Number(e.target.value || 0) })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Offset</label>
          <Input
            type="number"
            min={0}
            value={value.offset ?? 0}
            onChange={(e) => setPartial({ offset: Number(e.target.value || 0) })}
          />
        </div>
      </div>

      {mode === "aggregate" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 rounded-md border bg-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Dimensions</p>
              <span className="text-[11px] text-muted-foreground">
                {allowAdHoc ? "ad-hoc autorisé" : "semantic layer"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={addDimension}>
                <SelectTrigger className="h-8 w-[220px]">
                  <SelectValue placeholder="Ajouter une dimension" />
                </SelectTrigger>
                <SelectContent>
                  {availableDimensionNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                  {allowAdHoc ? (
                    <>
                      <div className="px-2 py-1 text-[11px] text-muted-foreground">Champs modèle</div>
                      {availableFields.slice(0, 120).map((field) => (
                        <SelectItem key={`field-${field}`} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </>
                  ) : null}
                </SelectContent>
              </Select>
              {dimensions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune dimension.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              {dimensions.map((dim) => (
                <div key={dim} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-xs">{dim}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeDimension(dim)} title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-md border bg-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Mesures</p>
              <span className="text-[11px] text-muted-foreground">count/sum/avg…</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={addMetric}>
                <SelectTrigger className="h-8 w-[220px]">
                  <SelectValue placeholder="Ajouter une mesure" />
                </SelectTrigger>
                <SelectContent>
                  {availableMetricNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {metrics.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune mesure.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div key={metric} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-xs">{metric}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeMetric(metric)} title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">Champs (mode records)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mode records retourne une liste d'enregistrements (sans agrégation). Configurez `fields` en JSON si besoin.
          </p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border bg-card p-3">
          <ReportingFilterTreeEditor
            title="WHERE"
            value={value.filters ?? null}
            onChange={(next) => setPartial({ filters: next })}
            availableFields={availableFields}
            allowedLookups={allowedLookups}
          />
        </div>
        <div className="rounded-md border bg-card p-3">
          <ReportingFilterTreeEditor
            title="HAVING"
            value={value.having ?? null}
            onChange={(next) => setPartial({ having: next })}
            availableFields={metrics}
            allowedLookups={allowedLookups}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Ordering</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const firstMetric = metrics[0];
              const firstDimension = dimensions[0];
              const orderField = firstMetric || firstDimension;
              if (!orderField) return;
              const next = Array.from(new Set([...(Array.isArray(value.ordering) ? value.ordering : value.ordering ? [value.ordering] : []), `-${orderField}`]));
              setPartial({ ordering: next });
            }}
          >
            <Wand2 className="mr-1 h-4 w-4" /> Auto
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {(Array.isArray(value.ordering) ? value.ordering : value.ordering ? [value.ordering] : []).map((token, idx) => (
            <div key={`${token}-${idx}`} className="flex items-center gap-2">
              <Input
                value={token}
                onChange={(e) => {
                  const current = Array.isArray(value.ordering) ? [...value.ordering] : value.ordering ? [value.ordering] : [];
                  current[idx] = e.target.value;
                  setPartial({ ordering: current });
                }}
                placeholder="-total_cost"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const current = Array.isArray(value.ordering) ? [...value.ordering] : value.ordering ? [value.ordering] : [];
                  current.splice(idx, 1);
                  setPartial({ ordering: current });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const current = Array.isArray(value.ordering) ? [...value.ordering] : value.ordering ? [value.ordering] : [];
              setPartial({ ordering: [...current, ""] });
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Ajouter un tri
          </Button>
        </div>
      </div>
    </div>
  );

  const rawJson = (
    <div className="space-y-3">
      <Textarea
        className="min-h-[360px] font-mono text-xs"
        value={jsonDraft}
        onChange={(e) => setJsonDraft(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          onClick={() => {
            const parsed = parseJson(jsonDraft);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
            onChange(parsed as ReportingQuerySpec);
          }}
        >
          Appliquer JSON
        </Button>
        <Button
          variant="outline"
          onClick={() => setJsonDraft(stringifyJson(value))}
        >
          Réinitialiser
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Astuce: utilisez le mode JSON pour les cas avancés (computed_fields, pivot, metric.filter, dimensions ad-hoc).
      </p>
    </div>
  );

  return (
    <Tabs
      defaultValue="builder"
      onValueChange={(val) => {
        if (val === "json") setJsonDraft(stringifyJson(value));
      }}
    >
      <TabsList>
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="builder">{builder}</TabsContent>
      <TabsContent value="json">{rawJson}</TabsContent>
    </Tabs>
  );
}
