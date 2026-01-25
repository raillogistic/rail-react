import type { JSX } from "react";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Separator } from "@/lib/components/ui/separator";
import type { ReportingVisualization, ReportingColumn } from "./ReportingVisualizationCard";
import { ReportingVisualizationCard } from "./ReportingVisualizationCard";

/**
 * Serializable dataset payload produced by the reporting extension.
 * @property title Human-readable dataset title.
 * @property description Optional helper text from the dataset definition.
 * @property columns Column definitions mapping to dimensions/metrics/computed fields.
 * @property rows Data rows returned by the execution engine.
 */
export type ReportingDatasetPayload = {
  title: string;
  description?: string;
  columns: ReportingColumn[];
  rows: Array<Record<string, any>>;
};

/**
 * Props for the dataset view.
 * @property dataset Result of `ReportingDataset.preview` or `ReportingVisualization.render`.
 * @property visualizations Visual widgets bound to the dataset columns.
 */
type Props = {
  dataset: ReportingDatasetPayload;
  visualizations: ReportingVisualization[];
};

/**
 * Renders a dataset summary with its attached visualizations using shared
 * reporting components.
 */
export function ReportingDatasetView({
  dataset,
  visualizations,
}: Props): JSX.Element {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>{dataset.title}</CardTitle>
          {dataset.description ? (
            <CardDescription>{dataset.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {dataset.columns.length} colonnes, {dataset.rows.length} lignes
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visualizations.map((viz) => (
          <ReportingVisualizationCard
            key={viz.code}
            visualization={viz}
            columns={dataset.columns}
            rows={dataset.rows}
          />
        ))}
      </div>
    </div>
  );
}
