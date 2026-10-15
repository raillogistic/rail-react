/**
 * @file ModelTableDevtoolsPanel.tsx
 * @description Composant de panneau de devtools du ModelTable.
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 */
import {
  formatTimingMs,
  type ModelTableDevtoolsTimings,
} from "../../hooks/useModelTableDevtools";

export function ModelTableDevtoolsPanel({
  timings,
}: {
  timings: ModelTableDevtoolsTimings;
}) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 border border-amber-300/60 bg-amber-50/95 px-3 py-2 text-[11px] leading-5 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/70 dark:text-amber-100">
      <div className="font-semibold uppercase tracking-wide">Devtools</div>
      <div>Metadata fetch: {formatTimingMs(timings.metadataFetchMs)}</div>
      <div>Data fetch: {formatTimingMs(timings.dataFetchMs)}</div>
      <div>Table build: {formatTimingMs(timings.tableBuildMs)}</div>
    </div>
  );
}
