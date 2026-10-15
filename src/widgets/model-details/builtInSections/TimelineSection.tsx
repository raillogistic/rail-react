/**
 * @module TimelineSection
 * @description Section chronologique pour afficher l'historique d'activité.
 * Supporte le regroupement par jour, les icônes de type d'activité et les acteurs.
 */
import * as React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { cn } from "@/shared/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import {
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";

export type TimelineEntry = {
  id: string;
  actor?: string;
  actorAvatar?: string;
  type?:
    | "activity"
    | "create"
    | "update"
    | "delete"
    | "comment"
    | "attachment"
    | "status"
    | string;
  timestamp: string | number | Date;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type TimelineSectionData =
  | TimelineEntry[]
  | {
      items: TimelineEntry[];
    };

export type TimelineSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<TimelineSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => TimelineSectionData | undefined;
  load?: SectionDefinition<TimelineSectionData>["load"];
  actions?: SectionDefinition<TimelineSectionData>["actions"];
  skeleton?: SectionDefinition<TimelineSectionData>["skeleton"];
  empty?: SectionDefinition<TimelineSectionData>["empty"];
  error?: SectionDefinition<TimelineSectionData>["error"];
  testId?: string;
};

/** Extrait les entrées depuis les données de la section. */
function resolveEntries(
  data: TimelineSectionData | undefined,
): TimelineEntry[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

/** Formate un timestamp en libellé de jour. */
function formatDay(
  timestamp: TimelineEntry["timestamp"],
  locale: string,
): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

/** Formate un timestamp en heure. */
function formatTime(
  timestamp: TimelineEntry["timestamp"],
  locale: string,
  timezone?: string,
): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

/** Icône d'activité contextuelle selon le type d'événement. */
function ActivityIcon({
  type,
  icon,
  tone,
}: {
  type?: TimelineEntry["type"];
  icon?: React.ReactNode;
  tone?: TimelineEntry["tone"];
}) {
  if (icon) return icon;

  let LucideIcon = Activity;
  let toneClass = "bg-primary/10 text-primary border-primary/15";

  switch (type) {
    case "create":
      LucideIcon = CheckCircle2;
      toneClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/15";
      break;
    case "update":
      LucideIcon = Settings;
      toneClass = "bg-blue-500/10 text-blue-500 border-blue-500/15";
      break;
    case "delete":
      LucideIcon = AlertCircle;
      toneClass = "bg-rose-500/10 text-rose-500 border-rose-500/15";
      break;
    case "comment":
      LucideIcon = MessageSquare;
      toneClass = "bg-amber-500/10 text-amber-500 border-amber-500/15";
      break;
    case "attachment":
      LucideIcon = FileText;
      toneClass = "bg-violet-500/10 text-violet-500 border-violet-500/15";
      break;
    case "status":
      LucideIcon = Activity;
      toneClass = "bg-indigo-500/10 text-indigo-500 border-indigo-500/15";
      break;
  }

  if (tone === "success")
    toneClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/15";
  if (tone === "danger")
    toneClass = "bg-rose-500/10 text-rose-500 border-rose-500/15";
  if (tone === "warning")
    toneClass = "bg-amber-500/10 text-amber-500 border-amber-500/15";
  if (tone === "info")
    toneClass = "bg-blue-500/10 text-blue-500 border-blue-500/15";

  return (
    <div
      className={cn(
        "size-7 rounded-full border flex items-center justify-center",
        toneClass,
      )}
    >
      <LucideIcon className="size-3.5" />
    </div>
  );
}

export function createTimelineSection(
  config: TimelineSectionConfig,
): SectionDefinition<TimelineSectionData> {
  return {
    ...config,
    kind: "timeline",
    dataSource: "activity",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data, runtime }) => {
      const locale = runtime.locale ?? "en-US";
      const timezone = runtime.timezone;
      const entries = resolveEntries(data);
      const grouped = entries.reduce<Record<string, TimelineEntry[]>>(
        (acc, entry) => {
          const day = formatDay(entry.timestamp, locale);
          if (!acc[day]) acc[day] = [];
          acc[day].push(entry);
          return acc;
        },
        {},
      );

      return (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/0 before:via-border/40 before:to-border/0">
          {Object.entries(grouped).map(([day, events]) => (
            <div key={day} className="relative space-y-4">
              <div className="md:flex items-center justify-between">
                <div className="relative z-10 flex items-center justify-center md:mx-auto">
                  <Badge
                    variant="outline"
                    className="bg-background text-[11px] font-medium px-3 py-1 border-border/40"
                  >
                    {day}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="relative flex items-start gap-3 md:justify-center md:items-center"
                  >
                    {/* Contenu gauche (desktop) */}
                    <div className="hidden md:block md:w-1/2 md:pr-6 md:text-right">
                      <div className="text-xs font-medium text-muted-foreground/50 flex items-center justify-end gap-1.5">
                        <Clock className="size-3" />
                        {formatTime(event.timestamp, locale, timezone)}
                      </div>
                    </div>

                    {/* Point de la timeline */}
                    <div className="relative z-10 flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 bg-background p-0.5 rounded-full">
                      <ActivityIcon
                        type={event.type}
                        icon={event.icon}
                        tone={event.tone}
                      />
                    </div>

                    {/* Contenu droite */}
                    <div className="flex-1 md:w-1/2 md:pl-6">
                      <div className="px-3.5 py-3 rounded-lg border border-border/30 bg-card/20 transition-all hover:border-border/50 hover:bg-card/40 group">
                        <div className="md:hidden mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/50">
                          <Clock className="size-3" />
                          {formatTime(event.timestamp, locale, timezone)}
                        </div>

                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h5 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {event.title || "Activity"}
                          </h5>
                          {event.type && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium px-1.5 h-4 leading-none opacity-50 capitalize"
                            >
                              {event.type}
                            </Badge>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-xs text-muted-foreground/60 leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        {event.actor && (
                          <div className="mt-2.5 flex items-center gap-1.5 pt-2.5 border-t border-border/20">
                            <div className="size-4 rounded-full bg-muted/50 flex items-center justify-center">
                              <User className="size-2.5 text-muted-foreground" />
                            </div>
                            <span className="text-[11px] font-medium text-foreground/60">
                              {event.actor}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    },
  };
}

export default createTimelineSection;
