import { Skeleton } from "@/shared/ui/kit/skeleton";
import { cn } from "@/shared/utils";

export type SectionSkeletonProps = {
  lines?: number;
  className?: string;
};

export default function SectionSkeleton({
  lines = 4,
  className,
}: SectionSkeletonProps) {
  const normalized = Math.max(1, Math.min(lines, 10));
  
  return (
    <div className={cn("space-y-6 animate-pulse p-2", className)} aria-hidden="true">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl bg-muted/60" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4 bg-muted" />
          <Skeleton className="h-3 w-1/3 bg-muted/40" />
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: normalized }).map((_, index) => (
          <div key={`section-skeleton-${index}`} className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton 
                className={cn(
                  "h-3 bg-muted/50",
                  index % 3 === 0 ? "w-1/4" : index % 3 === 1 ? "w-1/6" : "w-1/5"
                )} 
              />
              <Skeleton className="h-4 w-1/3 bg-muted/30 rounded-lg" />
            </div>
            {index < normalized - 1 && <div className="h-px w-full bg-border/5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
