/** Selects the renderer for one reporting block. */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/kit/card";
import type { ReportingReportBlock } from "./types";
import { ReportingChartFactory } from "./ReportingChartFactory";
import { ReportingRecordsTable } from "./ReportingRecordsTable";
import { ReportingKpi } from "./ReportingKpi";
import { ReportingPivotTable } from "./ReportingPivotTable";

export type ReportingWidgetProps = {
  block: ReportingReportBlock;
  theme?: string;
};

export const ReportingWidget = ({ block, theme }: ReportingWidgetProps) => {
  const { visualization } = block;
  const { kind, title, description } = visualization;

  const renderContent = () => {
    switch (kind) {
      case "kpi":
      case "metric":
        return <ReportingKpi block={block} />;
      case "table":
      case "records":
        return <ReportingRecordsTable block={block} />;
      case "pivot":
        return <ReportingPivotTable block={block} />;
      case "bar":
      case "line":
      case "pie":
      case "area":
      case "donut":
      case "funnel":
      case "gauge":
      case "combo":
      case "scatter":
      case "treemap":
      case "radar":
        return <ReportingChartFactory block={block} theme={theme} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Type de visualisation non supporté: {kind}
          </div>
        );
    }
  };

  // KPIs usually don't need the full Card styling, or they use their own.
  if (kind === "kpi" || kind === "metric") {
    return <ReportingKpi block={block} />;
  }

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden min-h-[250px]">
        {block.dataset.warnings?.length ? (
          <p className="mb-2 text-xs text-amber-700">
            {block.dataset.warnings.join(" ")}
          </p>
        ) : null}
        {block.dataset.has_more ? (
          <p className="mb-2 text-xs text-amber-700" role="status">
            Affichage limité aux {block.dataset.returned_count ?? block.dataset.rows.length} premiers résultats.
          </p>
        ) : null}
        {renderContent()}
      </CardContent>
    </Card>
  );
};
