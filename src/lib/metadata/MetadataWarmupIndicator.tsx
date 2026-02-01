import React from "react";
import { Loader2 } from "lucide-react";

export function MetadataWarmupIndicator({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span>Warming metadata...</span>
    </div>
  );
}
