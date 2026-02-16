export type SectionNoAccessStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function SectionNoAccessState({
  title = "No access",
  description = "You do not have permission to view this section.",
  className,
}: SectionNoAccessStateProps) {
  return (
    <div className={className} aria-live="polite">
      <div className="rounded-md border border-muted p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{title}</div>
        <p className="mt-1">{description}</p>
      </div>
    </div>
  );
}
