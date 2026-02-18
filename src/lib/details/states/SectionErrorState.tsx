import * as React from "react";
import { Button } from "@/lib/components/ui/button";
import { Unplug, RefreshCw, ServerCrash, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
};

export default function SectionErrorState({
  title = "Connection Interrupted",
  description = "A communication error occurred between the server and this section. Your data is safe, but we couldn't load it right now.",
  retryLabel = "Restore Connection",
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
        "flex flex-col items-center justify-center p-16 text-center rounded-[2rem] border border-destructive/10 bg-destructive/5 transition-all duration-500 backdrop-blur-xl",
        "animate-in fade-in slide-in-from-top-4 duration-700",
        className
      )} 
      aria-live="polite"
    >
      <div className="relative mb-10 group">
        <div className="absolute inset-0 rounded-full bg-destructive/10 blur-3xl group-hover:bg-destructive/20 transition-colors duration-500 animate-pulse" />
        <div className="relative size-24 rounded-[2rem] bg-background border border-destructive/20 flex items-center justify-center shadow-2xl shadow-destructive/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          <ServerCrash className="size-10 text-destructive/60" />
        </div>
        <div className="absolute -top-3 -right-3 size-12 rounded-2xl bg-destructive shadow-xl shadow-destructive/20 flex items-center justify-center border-4 border-background transition-transform duration-500 hover:-translate-y-1">
          <Unplug className="size-5 text-white" />
        </div>
      </div>

      <div className="max-w-[360px] space-y-5 mb-10">
        <div className="space-y-2">
          <h4 className="text-base font-black tracking-widest text-destructive uppercase leading-none">
            {title}
          </h4>
          <p className="text-[11px] font-bold text-muted-foreground/60 leading-relaxed px-6 tracking-tight">
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
          className="h-12 px-10 rounded-2xl bg-destructive text-white font-black uppercase tracking-[0.15em] text-[10px] hover:bg-destructive/90 transition-all shadow-2xl shadow-destructive/20 active:scale-95 gap-3"
        >
          <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Restoring..." : retryLabel}
        </Button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/10">
           <ShieldX className="size-3.5" />
           <span className="text-[9px] font-black uppercase tracking-widest">Protocol error reported</span>
        </div>
      )}
    </div>
  );
}
