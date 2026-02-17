import * as React from "react";
import { Badge } from "@/lib/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import { Clock, User, Activity, CheckCircle2, AlertCircle, MessageSquare, FileText, Settings } from "lucide-react";

export type TimelineEntry = {
  id: string;
  actor?: string;
  actorAvatar?: string;
  type?: "activity" | "create" | "update" | "delete" | "comment" | "attachment" | "status" | string;
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
  skeleton?: SectionDefinition<TimelineSectionData>["skeleton"];
  empty?: SectionDefinition<TimelineSectionData>["empty"];
  error?: SectionDefinition<TimelineSectionData>["error"];
  testId?: string;
};

function resolveEntries(data: TimelineSectionData | undefined): TimelineEntry[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

function formatDay(timestamp: TimelineEntry["timestamp"], locale: string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

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

function ActivityIcon({ type, icon, tone }: { type?: TimelineEntry["type"]; icon?: React.ReactNode; tone?: TimelineEntry["tone"] }) {
  if (icon) return icon;
  
  let LucideIcon = Activity;
  let toneClass = "bg-primary/10 text-primary border-primary/20";

  switch (type) {
    case "create":
      LucideIcon = CheckCircle2;
      toneClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      break;
    case "update":
      LucideIcon = Settings;
      toneClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
      break;
    case "delete":
      LucideIcon = AlertCircle;
      toneClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
      break;
    case "comment":
      LucideIcon = MessageSquare;
      toneClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
      break;
    case "attachment":
      LucideIcon = FileText;
      toneClass = "bg-violet-500/10 text-violet-500 border-violet-500/20";
      break;
    case "status":
      LucideIcon = Activity;
      toneClass = "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      break;
  }

  if (tone === "success") toneClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (tone === "danger") toneClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
  if (tone === "warning") toneClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (tone === "info") toneClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";

  return (
    <div className={cn("size-8 rounded-full border flex items-center justify-center shadow-sm transition-transform hover:scale-110", toneClass)}>
      <LucideIcon className="size-4" />
    </div>
  );
}

export function createTimelineSection(config: TimelineSectionConfig): SectionDefinition<TimelineSectionData> {
  return {
    ...config,
    kind: "timeline",
    dataSource: "activity",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data, runtime }) => {
      const locale = runtime.locale ?? "en-US";
      const timezone = runtime.timezone;
      const entries = resolveEntries(data);
      const grouped = entries.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
        const day = formatDay(entry.timestamp, locale);
        if (!acc[day]) acc[day] = [];
        acc[day].push(entry);
        return acc;
      }, {});

      return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/0 before:via-border before:to-border/0">
          {Object.entries(grouped).map(([day, events]) => (
            <div key={day} className="relative space-y-6">
              <div className="md:flex items-center justify-between md:before:absolute md:before:inset-0 md:before:ml-[50%] md:before:-translate-x-px md:before:h-px md:before:w-full md:before:bg-border/50">
                <div className="relative z-10 flex items-center justify-center md:mx-auto">
                  <Badge variant="outline" className="bg-background text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm border-border/60">
                    {day}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-4 md:justify-center md:items-center">
                    {/* Left content (for desktop) */}
                    <div className="hidden md:block md:w-1/2 md:pr-8 md:text-right">
                      <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center justify-end gap-1.5 uppercase tracking-tighter">
                        <Clock className="size-3" />
                        {formatTime(event.timestamp, locale, timezone)}
                      </div>
                    </div>

                    {/* Timeline Dot/Icon */}
                    <div className="relative z-10 flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 bg-background p-1 rounded-full border border-border/30 shadow-sm">
                      <ActivityIcon type={event.type} icon={event.icon} tone={event.tone} />
                    </div>

                    {/* Right content */}
                    <div className="flex-1 md:w-1/2 md:pl-8">
                      <div className="p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
                        <div className="md:hidden mb-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                          <Clock className="size-3" />
                          {formatTime(event.timestamp, locale, timezone)}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h5 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {event.title || "Activity"}
                          </h5>
                          {event.type && (
                            <Badge variant="secondary" className="text-[9px] uppercase font-black px-1.5 h-4 tracking-tighter leading-none opacity-60">
                              {event.type}
                            </Badge>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        {event.actor && (
                          <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-border/30">
                            <div className="size-5 rounded-full bg-muted flex items-center justify-center">
                              <User className="size-3 text-muted-foreground" />
                            </div>
                            <span className="text-[10px] font-bold text-foreground/70">{event.actor}</span>
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
