/** Responsive grid for report blocks. */

import type { ReportingReportBlock } from "./types";
import { ReportingWidget } from "./ReportingWidget";

export type ReportingGridProps = {
  blocks: ReportingReportBlock[];
  theme?: string;
};

const widthClass = (width = 12): string => {
  if (width <= 3) return "lg:col-span-3";
  if (width <= 4) return "lg:col-span-4";
  if (width <= 6) return "lg:col-span-6";
  if (width <= 8) return "lg:col-span-8";
  return "lg:col-span-12";
};

export const ReportingGrid = ({ blocks, theme }: ReportingGridProps) => {
  if (!blocks.length) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
        Aucune visualisation n'est configuree pour ce rapport.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {blocks.map((block) => {
        const isKpi = ["kpi", "metric"].includes(block.visualization.kind);
        return (
          <div
            key={block.block_id}
            className={`${widthClass(block.layout?.w)} flex flex-col ${
              isKpi ? "min-h-[140px]" : "min-h-[320px]"
            }`}
          >
            <ReportingWidget block={block} theme={theme} />
          </div>
        );
      })}
    </div>
  );
};
