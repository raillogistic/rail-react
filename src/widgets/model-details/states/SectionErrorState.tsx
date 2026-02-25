/**
 * @module SectionErrorState
 * @description Composant d'état d'erreur pour les sections.
 * Affiché lors d'un échec de chargement avec option de réessai,
 * incluant une icône d'erreur et des messages descriptifs.
 */
import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils";

export type SectionErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
};

/**
 * Affiche un état d'erreur avec option de tentative de rechargement.
 * Design sobre mais visible avec ton destructif.
 */
export default function SectionErrorState({
  title = "Connection Interrupted",
  description = "A communication error occurred between the server and this section. Your data is safe, but we couldn't load it right now.",
  retryLabel = "Retry",
  onRetry,
  className,
}: SectionErrorStateProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 px-8 text-center rounded-xl border border-destructive/15 bg-destructive/[0.03] transition-all duration-300",
        "animate-in fade-in duration-500",
        className,
      )}
      aria-live="polite"
    >
      <div className="relative mb-6">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="size-7 text-destructive/60" />
        </div>
      </div>

      <div className="max-w-sm space-y-3 mb-6">
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold tracking-tight text-destructive">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>
      </div>

      {onRetry ? (
        <Button
          type="button"
          onClick={() => {
            void handleRetry();
          }}
          disabled={isRetrying}
          variant="outline"
          size="sm"
          className="h-9 px-5 rounded-lg text-xs font-medium gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 transition-all active:scale-[0.97]"
        >
          <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : retryLabel}
        </Button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/5 text-destructive/70 border border-destructive/10 text-xs font-medium">
          <AlertCircle className="size-3.5" />
          <span>Error reported</span>
        </div>
      )}
    </div>
  );
}
