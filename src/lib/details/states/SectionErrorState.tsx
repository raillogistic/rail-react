import * as React from "react";
import { Button } from "@/lib/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
};

export default function SectionErrorState({
  title = "System synchronization failed",
  description = "An unexpected error occurred while fetching section data. Our team has been notified. Please try refreshing or contact support if the issue persists.",
  retryLabel = "Attempt Reconnect",
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
        "flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 transition-all duration-300 backdrop-blur-sm",
        className
      )} 
      aria-live="polite"
    >
      <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 shadow-sm border border-rose-500/10">
        <AlertCircle className="size-8 text-rose-500" />
      </div>
      <div className="max-w-[320px] space-y-3 mb-8">
        <div className="text-sm font-black tracking-tight text-rose-600 uppercase tracking-widest">{title}</div>
        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void handleRetry();
          }}
          disabled={isRetrying}
          className="h-10 px-6 rounded-xl border-rose-500/30 text-rose-500 font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10 gap-2"
        >
          <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
