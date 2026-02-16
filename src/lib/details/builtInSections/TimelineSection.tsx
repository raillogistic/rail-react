import { Badge } from "@/lib/components/ui/badge";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";

export type TimelineEntry = {
  id: string;
  actor?: string;
  type?: string;
  timestamp: string | number | Date;
  title?: string;
  description?: string;
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
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
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
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, events]) => (
            <section key={day} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </h4>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {event.type ? <Badge variant="outline">{event.type}</Badge> : null}
                      {event.actor ? <span>{event.actor}</span> : null}
                      <span>{formatTime(event.timestamp, locale, timezone)}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      {event.title || event.description || "Activity"}
                    </div>
                    {event.description && event.title ? (
                      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );
    },
  };
}

export default createTimelineSection;
