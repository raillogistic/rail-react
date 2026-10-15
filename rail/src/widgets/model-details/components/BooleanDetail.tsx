import * as React from "react";

export default function BooleanDetail({ label, value }: { label?: string; value: boolean | null | undefined }) {
  return (
    <div className="space-y-1">
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}
      <div className="text-sm">{value ? "✅" : "❌"}</div>
    </div>
  );
}

