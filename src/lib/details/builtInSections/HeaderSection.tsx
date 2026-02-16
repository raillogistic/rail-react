import * as React from "react";
import { Badge } from "@/lib/components/ui/badge";
import type { SectionAction, SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type HeaderSectionBadge = {
  id: string;
  label: string;
  tone?: "default" | "muted" | "success" | "warning" | "danger" | "info";
};

export type HeaderSectionData = {
  title: string;
  subtitle?: string;
  badges?: HeaderSectionBadge[];
};

export type HeaderSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<HeaderSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => HeaderSectionData | undefined;
  load?: SectionDefinition<HeaderSectionData>["load"];
  actions?: (ctx: SectionRuntimeCtx) => SectionAction<HeaderSectionData>[];
  skeleton?: SectionDefinition<HeaderSectionData>["skeleton"];
  empty?: SectionDefinition<HeaderSectionData>["empty"];
  error?: SectionDefinition<HeaderSectionData>["error"];
  testId?: string;
};

function badgeVariant(
  tone?: HeaderSectionBadge["tone"],
): "default" | "secondary" | "outline" | "destructive" {
  if (tone === "danger") return "destructive";
  if (tone === "default") return "default";
  return "secondary";
}

export function createHeaderSection(config: HeaderSectionConfig): SectionDefinition<HeaderSectionData> {
  return {
    ...config,
    kind: "header",
    dataSource: "entity",
    loadingStrategy: config.loadingStrategy ?? "eager",
    render: ({ data }) => {
      const header = data;
      if (!header) return null;
      return (
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold">{header.title}</h2>
            {header.subtitle ? (
              <p className="text-sm text-muted-foreground">{header.subtitle}</p>
            ) : null}
          </div>
          {header.badges && header.badges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {header.badges.map((badge) => (
                <Badge key={badge.id} variant={badgeVariant(badge.tone)}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      );
    },
  };
}

export default createHeaderSection;
