/**
 * @module SectionSkeleton
 * @description Composant squelette de chargement pour les sections.
 * Affiche un placeholder animé pendant le chargement des données
 * avec des blocs de taille variable simulant le contenu réel.
 */
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { cn } from "@/shared/utils";

export type SectionSkeletonProps = {
  lines?: number;
  className?: string;
};

/**
 * Affiche un squelette de chargement animé.
 * Le nombre de lignes est configurable (1 à 10).
 */
export default function SectionSkeleton({
  lines = 4,
  className,
}: SectionSkeletonProps) {
  const normalized = Math.max(1, Math.min(lines, 10));

  return (
    <div
      className={cn("space-y-5 animate-pulse p-1", className)}
      aria-hidden="true"
    >
      {/* En-tête simulé */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl bg-muted/50" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-1/4 bg-muted/60 rounded-md" />
          <Skeleton className="h-2.5 w-1/3 bg-muted/30 rounded-md" />
        </div>
      </div>

      {/* Lignes de contenu simulées */}
      <div className="space-y-3 pt-1">
        {Array.from({ length: normalized }).map((_, index) => (
          <div
            key={`section-skeleton-${index}`}
            className="flex justify-between items-center gap-4 py-1"
          >
            <Skeleton
              className={cn(
                "h-2.5 bg-muted/40 rounded-md",
                index % 3 === 0 ? "w-1/5" : index % 3 === 1 ? "w-1/6" : "w-1/4",
              )}
            />
            <Skeleton className="h-3 w-1/3 bg-muted/25 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
