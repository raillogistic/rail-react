import { Skeleton } from "@/lib/components/ui/skeleton";

export type SectionSkeletonProps = {
  lines?: number;
  className?: string;
};

export default function SectionSkeleton({
  lines = 3,
  className,
}: SectionSkeletonProps) {
  const normalized = Math.max(1, Math.min(lines, 8));
  return (
    <div className={className} aria-hidden="true">
      <div className="space-y-2">
        {Array.from({ length: normalized }).map((_, index) => (
          <Skeleton
            key={`section-skeleton-${index}`}
            className={index === 0 ? "h-5 w-1/3" : "h-4 w-full"}
          />
        ))}
      </div>
    </div>
  );
}
