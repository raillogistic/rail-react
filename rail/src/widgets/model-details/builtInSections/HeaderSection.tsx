/**
 * @module HeaderSection
 * @description Section d'en-tête pour les pages de détail.
 * Affiche le titre principal, sous-titre, avatar/icône et les badges.
 */
import * as React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { cn } from "@/shared/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/kit/avatar";

export type HeaderSectionBadge = {
  id: string;
  label: string;
  tone?: "default" | "muted" | "success" | "warning" | "danger" | "info";
};

export type HeaderSectionData = {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  icon?: React.ReactNode;
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
  actions?: SectionDefinition<HeaderSectionData>["actions"];
  skeleton?: SectionDefinition<HeaderSectionData>["skeleton"];
  empty?: SectionDefinition<HeaderSectionData>["empty"];
  error?: SectionDefinition<HeaderSectionData>["error"];
  testId?: string;
};

/** Résout la classe de couleur du badge selon le ton. */
function badgeToneClass(tone?: HeaderSectionBadge["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "warning":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "danger":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    case "info":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "muted":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

export function createHeaderSection(
  config: HeaderSectionConfig,
): SectionDefinition<HeaderSectionData> {
  return {
    ...config,
    kind: "header",
    dataSource: "entity",
    loadingStrategy: config.loadingStrategy ?? "eager",
    render: ({ data }) => {
      const header = data;
      if (!header) return null;

      return (
        <div className="flex flex-col md:flex-row md:items-center gap-5 py-1">
          {(header.avatarUrl || header.icon) && (
            <div className="relative shrink-0">
              <Avatar className="size-16 rounded-xl border-2 border-background shadow-md ring-1 ring-border/30">
                {header.avatarUrl && (
                  <AvatarImage src={header.avatarUrl} alt={header.title} />
                )}
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-xl font-semibold">
                  {header.icon || header.title.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-tight">
                {header.title}
              </h1>
              {header.subtitle && (
                <p className="text-sm font-medium text-muted-foreground/70">
                  {header.subtitle}
                </p>
              )}
            </div>

            {header.badges && header.badges.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {header.badges.map((badge) => (
                  <Badge
                    key={badge.id}
                    variant="outline"
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide",
                      badgeToneClass(badge.tone),
                    )}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    },
  };
}

export default createHeaderSection;
