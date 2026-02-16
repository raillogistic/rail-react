import { Button } from "@/lib/components/ui/button";

export type SectionErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
};

export default function SectionErrorState({
  title = "Unable to load section",
  description = "An unexpected error occurred. Try again.",
  retryLabel = "Retry",
  onRetry,
  className,
}: SectionErrorStateProps) {
  return (
    <div className={className} aria-live="polite">
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <div className="font-medium text-destructive">{title}</div>
        <p className="mt-1 text-muted-foreground">{description}</p>
        {onRetry ? (
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void onRetry();
              }}
            >
              {retryLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
