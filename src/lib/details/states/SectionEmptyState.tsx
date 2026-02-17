import { FileStack } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function SectionEmptyState({
  title = "No data found",
  description = "There is currently nothing to display in this section. New items will appear here once they are available.",
  icon,
  className,
}: SectionEmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10 transition-all duration-300",
        className
      )} 
      aria-live="polite"
    >
      <div className="relative mb-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center shadow-inner">
          {icon || <FileStack className="size-8 text-muted-foreground/40" />}
        </div>
        <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
          <div className="size-2 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
      <div className="max-w-[280px] space-y-2">
        <div className="text-sm font-black tracking-tight text-foreground">{title}</div>
        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
