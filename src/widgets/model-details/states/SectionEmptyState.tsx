import { FileStack, Plus, LayoutPanelTop } from "lucide-react";
import { cn } from "@/shared/utils";
import { Button } from "@/shared/ui/kit/button";

export type SectionEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function SectionEmptyState({
  title = "No information available",
  description = "This section is currently waiting for data. Once synchronized, your records will appear here automatically.",
  icon,
  actionLabel,
  onAction,
  className,
}: SectionEmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-16 text-center rounded-[2rem] border border-dashed border-border/40 bg-muted/5 transition-all duration-500",
        "animate-in fade-in zoom-in-95 duration-700",
        className
      )} 
      aria-live="polite"
    >
      <div className="relative mb-8 group">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
        <div className="relative size-24 rounded-3xl bg-background border border-border/50 flex items-center justify-center shadow-2xl shadow-primary/5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
          {icon || <LayoutPanelTop className="size-10 text-primary/40" />}
        </div>
        <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center border-4 border-background animate-bounce-subtle">
          <FileStack className="size-4 text-primary-foreground" />
        </div>
      </div>
      
      <div className="max-w-sm space-y-4">
        <div className="space-y-1.5">
          <h4 className="text-base font-black tracking-tight text-foreground/90 uppercase leading-none">
            {title}
          </h4>
          <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed px-4 tracking-tight">
            {description}
          </p>
        </div>

        {onAction && actionLabel && (
          <div className="pt-2">
            <Button
              onClick={onAction}
              variant="outline"
              size="sm"
              className="h-9 px-6 rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-white transition-all gap-2"
            >
              <Plus className="size-3.5" />
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
