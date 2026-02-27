import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useApolloClient } from "@apollo/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { TABLE_MODEL_METADATA_QUERY as GET_MODEL_SCHEMA } from "@/shared/api/graphql/graphql/metadata/queries";
import type { BaseModelTableRelationStatsOverride } from "../../types";
import { toGraphqlFieldName } from "../../utils";
import {
  buildStatsQueryDocument,
  formatStatValue,
  parseStatEntry,
  toLabel,
  type ParsedStatEntry,
} from "./utils/statsHelpers";
import { buildModelQueryField } from "../../utils";

export type StatsRelationMeta = {
  relationName: string;
  relationLabel: string;
  relatedApp: string;
  relatedModel: string;
};

type RelationStatsHoverProps = {
  row: Record<string, unknown>;
  primaryKey: string;
  model: string;
  whereType: string;
  relation: StatsRelationMeta;
  queryManager?: string;
  overrideRenderer?: BaseModelTableRelationStatsOverride;
  children: React.ReactNode;
};

export function RelationStatsHover({
  row,
  primaryKey,
  model,
  whereType,
  relation,
  queryManager,
  overrideRenderer,
  children,
}: RelationStatsHoverProps) {
  const client = useApolloClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statFieldLabels, setStatFieldLabels] = useState<
    Record<string, string>
  >({});

  const rowIdentifierRaw = row[primaryKey] ?? row.id;
  const rowIdentifier =
    rowIdentifierRaw === null || rowIdentifierRaw === undefined
      ? null
      : String(rowIdentifierRaw);

  const fetchStats = React.useCallback(async () => {
    if (!rowIdentifier) return;
    if (loading || stats) return;

    setLoading(true);
    setError(null);

    try {
      const relatedSchemaResult = await client.query({
        query: GET_MODEL_SCHEMA,
        variables: {
          app: relation.relatedApp,
          model: relation.relatedModel,
        },
        fetchPolicy: "cache-first",
      });

      const relatedFields =
        (relatedSchemaResult.data?.modelSchema?.fields as Array<{
          name?: string;
          fieldName?: string;
          verboseName?: string;
          isNumeric?: boolean;
          isRelation?: boolean;
          isPrimaryKey?: boolean;
        }>) ?? [];

      const numericFields = relatedFields
        .filter(
          (field) => field.isNumeric && !field.isRelation && !field.isPrimaryKey,
        )
        .map((field) => {
          const raw = field.name || field.fieldName || "";
          const key = toGraphqlFieldName(raw);
          const label = field.verboseName || toLabel(raw);
          return { key, label };
        })
        .filter(
          (field): field is { key: string; label: string } =>
            !!field.key && !!field.label,
        );

      const fieldLabelLookup: Record<string, string> = {};
      numericFields.forEach((field) => {
        fieldLabelLookup[field.key] = field.label;
      });
      setStatFieldLabels(fieldLabelLookup);

      const numericFieldBases = Object.keys(fieldLabelLookup);

      let statFieldNames: string[] = [
        ...numericFieldBases.flatMap((base) => [
          `${base}Sum`,
          `${base}Avg`,
          `${base}Min`,
          `${base}Max`,
          `${base}Count`,
          `${base}DistinctCount`,
        ]),
      ];

      if (!statFieldNames.includes("totalCount")) {
        statFieldNames = ["totalCount", ...statFieldNames];
      }

      const queryDocument = buildStatsQueryDocument(
        model,
        relation.relationName,
        whereType,
        statFieldNames,
        queryManager,
      );

      const whereField = primaryKey;
      const queryResult = await client.query({
        query: queryDocument,
        variables: {
          where: {
            [whereField]: {
              eq: rowIdentifierRaw,
            },
          },
          skipCount: true,
        },
        fetchPolicy: "cache-first",
      });

      const listKey = buildModelQueryField(model, "page", queryManager);
      const statsKey = `${relation.relationName}Stats`;
      const rawStatsObject =
        queryResult.data?.[listKey]?.items?.[0]?.[statsKey] ?? null;
      const statsObject =
        rawStatsObject && typeof rawStatsObject === "object"
          ? Object.fromEntries(
              Object.entries(rawStatsObject).filter(
                ([key]) => !key.startsWith("__"),
              ),
            )
          : rawStatsObject;

      setStats(statsObject);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Statistiques indisponibles.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    client,
    loading,
    model,
    primaryKey,
    relation.relatedApp,
    relation.relatedModel,
    relation.relationName,
    rowIdentifier,
    rowIdentifierRaw,
    stats,
    queryManager,
    whereType,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        void fetchStats();
      }
    },
    [fetchStats],
  );

  const statEntries = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats).map(([key, value]) =>
      parseStatEntry(key, value, statFieldLabels),
    );
  }, [statFieldLabels, stats]);

  const summaryEntry = useMemo(
    () => statEntries.find((entry) => entry.isSummary),
    [statEntries],
  );

  const groupedEntries = useMemo(() => {
    const grouped = new Map<
      string,
      { fieldLabel: string; values: ParsedStatEntry[] }
    >();
    statEntries
      .filter((entry) => entry.value !== null && entry.value !== undefined)
      .forEach((entry) => {
        if (entry.isSummary) return;
        if (entry.value === null || entry.value === undefined) return;
        const current = grouped.get(entry.fieldKey);
        if (current) {
          current.values.push(entry);
          return;
        }
        grouped.set(entry.fieldKey, {
          fieldLabel: entry.fieldLabel,
          values: [entry],
        });
      });
    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        values: group.values.sort((left, right) => {
          if (left.order !== right.order) return left.order - right.order;
          return left.key.localeCompare(right.key);
        }),
      }))
      .sort((left, right) => left.fieldLabel.localeCompare(right.fieldLabel));
  }, [statEntries]);

  const overrideContent = overrideRenderer
    ? overrideRenderer({
        row,
        relationName: relation.relationName,
        loading,
        error,
        stats,
      })
    : null;

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={120}>
      <TooltipTrigger asChild>
        <span className="inline-flex w-full cursor-help items-center justify-start">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[360px] rounded-xl border border-border/70 bg-popover/95 p-0 text-xs text-popover-foreground shadow-xl backdrop-blur"
      >
        <div className="overflow-hidden rounded-xl">
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {relation.relationLabel}
            </p>
            <p className="text-sm font-semibold text-foreground">Statistiques de relation</p>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto p-3">
            {overrideContent ? (
              overrideContent
            ) : loading ? (
              <p className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </p>
            ) : error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-destructive">
                {error}
              </p>
            ) : statEntries.length ? (
              <>
                {summaryEntry ? (
                  <div className="rounded-lg border border-border/70 bg-card/90 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {summaryEntry.fieldLabel}
                    </p>
                    <p className="text-lg font-semibold leading-tight text-foreground">
                      {formatStatValue(summaryEntry.value)}
                    </p>
                  </div>
                ) : null}
                {groupedEntries.map((group) => (
                  <div
                    key={group.fieldLabel}
                    className="rounded-lg border border-border/60 bg-background/80 p-2"
                  >
                    <p className="mb-1.5 text-[11px] font-semibold text-foreground">
                      {group.fieldLabel}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.values.map((entry) => (
                        <div
                          key={entry.key}
                          className="rounded-md border border-border/40 bg-muted/30 px-2 py-1"
                        >
                          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                            {entry.metricLabel}
                          </p>
                          <p className="text-xs font-semibold text-foreground">
                            {formatStatValue(entry.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="rounded-md border border-dashed border-border/60 px-2 py-1.5 text-muted-foreground">
                Aucune statistique.
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
