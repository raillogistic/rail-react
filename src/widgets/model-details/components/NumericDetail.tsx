import * as React from "react";

export default function NumericDetail({ label, value, maximumFractionDigits = 2, locale = "fr-FR" }: { label?: string; value: number | string | null | undefined; maximumFractionDigits?: number; locale?: string }) {
  const num = typeof value === "number" ? value : Number(value);
  const formatted = Number.isNaN(num) ? String(value ?? "") : new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits: 0 }).format(num);
  return (
    <div className="space-y-1">
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}
      <div className="text-sm">{formatted}</div>
    </div>
  );
}

