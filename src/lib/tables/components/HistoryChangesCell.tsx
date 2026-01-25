import { Button } from "@/lib/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Sparkles } from "lucide-react";
import React from "react";

/**
 * Describes the diff payload returned by the GraphQL history query.
 *
 * @property field - Technical field name exposed by Django.
 * @property label - Human friendly label (verbose_name).
 * @property old_value - Raw previous value serialised by the backend.
 * @property new_value - Raw current value serialised by the backend.
 * @property old_display - Optional display label (choices, FK repr…) for the previous value.
 * @property new_display - Optional display label for the current value.
 */
export type SerializedHistoryChange = {
  field: string;
  label: string;
  old_value: unknown;
  new_value: unknown;
  old_display?: string | null;
  new_display?: string | null;
};

/**
 * Props used by {@link HistoryChangesCell}.
 *
 * @property changes - List (or JSON string) of serialised changes for a single history entry.
 * @property className - Optional className forwarded to the trigger button.
 */
export type HistoryChangesCellProps = {
  changes?: SerializedHistoryChange[] | string | null;
  className?: string;
};

const EMPTY_PLACEHOLDER = "—";

const isReferenceValue = (
  value: unknown
): value is { id?: string | number; label?: string } => {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("id" in value || "label" in value)
  );
};

const renderDisplayValue = (
  rawValue: unknown,
  displayValue?: string | null
): string => {
  if (displayValue) {
    return displayValue;
  }
  if (rawValue === null || rawValue === undefined) {
    return EMPTY_PLACEHOLDER;
  }
  if (typeof rawValue === "string") {
    return rawValue || EMPTY_PLACEHOLDER;
  }
  if (typeof rawValue === "number" || typeof rawValue === "boolean") {
    return String(rawValue);
  }
  if (isReferenceValue(rawValue)) {
    return rawValue.label ?? String(rawValue.id ?? EMPTY_PLACEHOLDER);
  }
  try {
    return JSON.stringify(rawValue);
  } catch {
    return String(rawValue);
  }
};

export const parseHistoryChangesPayload = (
  changes?: SerializedHistoryChange[] | string | null
): SerializedHistoryChange[] => {
  if (!changes) {
    return [];
  }
  if (Array.isArray(changes)) {
    return changes;
  }
  if (typeof changes === "string") {
    try {
      const parsed = JSON.parse(changes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Renders a compact summary of history diffs with a popover to inspect
 * the detailed field-by-field changes.
 */
export const HistoryChangesCell: React.FC<HistoryChangesCellProps> = ({
  changes,
  className,
}) => {
  const normalized = React.useMemo(
    () => parseHistoryChangesPayload(changes),
    [changes]
  );
  const highlightCount = Math.min(2, normalized.length);
  const extraCount = normalized.length - highlightCount;
  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-xs text-foreground",
        className,
        normalized.length === 0 && "text-muted-foreground"
      )}
    >
      {normalized.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-muted p-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span>Aucun changement détecté</span>
        </div>
      ) : (
        <>
          {normalized.slice(0, highlightCount).map((change) => {
            const oldValue = renderDisplayValue(
              change.old_value,
              change.old_display
            );
            const newValue = renderDisplayValue(
              change.new_value,
              change.new_display
            );
            return (
              <div
                key={`${change.field}-${oldValue}-${newValue}`}
                className="rounded-lg border border-border bg-muted/30 p-2"
              >
                <p className="font-semibold">{change.label}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="line-clamp-1">{oldValue}</span>
                  <ArrowRightLeft className="h-3 w-3 shrink-0 text-primary" />
                  <span className="line-clamp-1 font-medium text-foreground">
                    {newValue}
                  </span>
                </div>
              </div>
            );
          })}
          {extraCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-between text-xs"
                >
                  +{extraCount} modification(s) supplémentaires
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] space-y-2 p-4">
                <p className="text-sm font-medium">
                  Toutes les modifications ({normalized.length})
                </p>
                <ul className="space-y-2 text-sm">
                  {normalized.map((change) => {
                    const oldValue = renderDisplayValue(
                      change.old_value,
                      change.old_display
                    );
                    const newValue = renderDisplayValue(
                      change.new_value,
                      change.new_display
                    );
                    return (
                      <li
                        key={`popover-${change.field}-${oldValue}-${newValue}`}
                        className="rounded-md border border-border bg-muted/20 p-2"
                      >
                        <p className="font-semibold">{change.label}</p>
                        <p className="text-muted-foreground">
                          {oldValue} → {newValue}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
    </div>
  );
};
