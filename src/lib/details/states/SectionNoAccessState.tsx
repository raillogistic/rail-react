import { ShieldAlert, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionNoAccessStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function SectionNoAccessState({
  title = "Restricted Access",
  description = "You do not have the required permissions to view this section's data. Please contact your system administrator to request access.",
  className,
}: SectionNoAccessStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-amber-500/20 bg-amber-500/5 transition-all duration-300 backdrop-blur-sm",
        className
      )} 
      aria-live="polite"
    >
      <div className="relative mb-6">
        <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center shadow-inner border border-amber-500/10 transition-transform hover:scale-110">
          <Lock className="size-8 text-amber-600" />
        </div>
        <div className="absolute -top-1 -right-1 size-6 rounded-full bg-background border border-amber-500/20 flex items-center justify-center shadow-sm">
          <ShieldAlert className="size-3.5 text-amber-500" />
        </div>
      </div>
      <div className="max-w-[300px] space-y-2">
        <div className="text-sm font-black tracking-tight text-amber-700 uppercase tracking-widest leading-none">
          {title}
        </div>
        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
