import type { JSX } from "react";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Separator } from "@/shared/ui/kit/separator";
import {
  ReportingDatasetView,
  type ReportingDatasetPayload,
} from "./ReportingDatasetView";
import type { ReportingVisualization } from "./ReportingVisualizationCard";

/**
 * Dataset payload mirroring what `ReportingDataset.preview` would return
 * for a BI definition tied to `assets.Equipment`. Columns map to dimensions,
 * metrics, and computed fields declared in
 * `backend/rail-django-graphql/rail_django_graphql/extensions/reporting.py`.
 */
const equipmentDataset: ReportingDatasetPayload = {
  title: "Equipment availability dashboard",
  description:
    "Static preview of a ReportingDataset bound to assets.Equipment (dimensions: site; metrics: fleet size, open work orders; computed: availability).",
  columns: [
    { name: "site", label: "Site", kind: "dimension" },
    { name: "fleet_size", label: "Fleet size", kind: "metric" },
    { name: "in_service", label: "In service", kind: "metric" },
    { name: "maintenance_orders", label: "Open work orders", kind: "metric" },
    { name: "downtime_hours", label: "Downtime (last 30d)", kind: "metric" },
    { name: "availability_rate", label: "Availability %", kind: "computed" },
  ],
  rows: [
    {
      site: "Network",
      fleet_size: 148,
      in_service: 134,
      maintenance_orders: 22,
      downtime_hours: 68.5,
      availability_rate: 90.5,
    },
    {
      site: "Saint-Quentin",
      fleet_size: 34,
      in_service: 31,
      maintenance_orders: 5,
      downtime_hours: 14.0,
      availability_rate: 91.2,
    },
    {
      site: "Lyon",
      fleet_size: 42,
      in_service: 37,
      maintenance_orders: 7,
      downtime_hours: 18.5,
      availability_rate: 88.1,
    },
    {
      site: "Dunkerque",
      fleet_size: 28,
      in_service: 24,
      maintenance_orders: 4,
      downtime_hours: 16.25,
      availability_rate: 85.7,
    },
    {
      site: "Bordeaux",
      fleet_size: 44,
      in_service: 42,
      maintenance_orders: 6,
      downtime_hours: 19.75,
      availability_rate: 92.3,
    },
  ],
};

/**
 * Visual configurations that reuse the dataset payload exactly as
 * `ReportingVisualization.render` would: each entry references dataset columns
 * and metrics without extra client-side transforms.
 */
const equipmentVisualizations: ReportingVisualization[] = [
  {
    code: "equipment-table",
    title: "Dataset preview",
    description: "Result of ReportingDataset.preview grouped by site.",
    kind: "table",
  },
  {
    code: "equipment-availability-rate",
    title: "Availability by site",
    description: "Computed availability_rate surfaced as a KPI trend.",
    kind: "line",
    config: {
      x: "site",
      series: ["availability_rate"],
    },
  },
  {
    code: "equipment-maintenance-load",
    title: "Fleet vs open work orders",
    description: "Compare total fleet against maintenance load per site.",
    kind: "bar",
    config: {
      x: "site",
      series: ["fleet_size", "maintenance_orders"],
    },
  },
  {
    code: "equipment-downtime-share",
    title: "Downtime share (30 days)",
    description: "Distribution of downtime hours per site over the last month.",
    kind: "pie",
    config: {
      value_field: "downtime_hours",
      label_field: "site",
    },
  },
  {
    code: "equipment-availability-kpi",
    title: "Network availability KPI",
    description:
      "Uses the aggregated Network row (first entry) returned by the dataset.",
    kind: "kpi",
    config: {
      y: "availability_rate",
    },
  },
];

/**
 * Full example dashboard for Equipment that consumes the reporting extension:
 * it injects a dataset payload and renders multiple visualizations (table,
 * line, bar, pie, KPI) without any custom queries.
 */
export function EquipmentReportingExample(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>BI dashboard example</CardTitle>
        <CardDescription>
          Illustrates how the reporting extension feeds the frontend with a
          dataset (dimensions/metrics/computed fields) and companion
          visualizations for the assets.Equipment model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <ReportingDatasetView
          dataset={equipmentDataset}
          visualizations={equipmentVisualizations}
        />
      </CardContent>
    </Card>
  );
}
