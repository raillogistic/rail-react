export type SectionEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function SectionEmptyState({
  title = "No data",
  description = "There is nothing to display for this section.",
  className,
}: SectionEmptyStateProps) {
  return (
    <div className={className} aria-live="polite">
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{title}</div>
        <p className="mt-1">{description}</p>
      </div>
    </div>
  );
}
