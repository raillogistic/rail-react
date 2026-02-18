import { ShieldAlert, Fingerprint, LockKeyhole, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";

export type SectionNoAccessStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function SectionNoAccessState({
  title = "Authentication Required",
  description = "This data is encrypted and restricted to specific security roles. Your current identity does not possess the required clearance level.",
  className,
}: SectionNoAccessStateProps) {
  return (
    <TooltipProvider delayDuration={400}>
      <div 
        className={cn(
          "flex flex-col items-center justify-center p-16 text-center rounded-[2rem] border border-amber-500/10 bg-amber-500/[0.03] transition-all duration-500 backdrop-blur-sm shadow-inner",
          "animate-in fade-in zoom-in-[0.98] duration-1000",
          className
        )} 
        aria-live="polite"
      >
        <div className="relative mb-10 group">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700" />
          <div className="relative size-24 rounded-[2rem] bg-background border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10 transition-all duration-700 group-hover:scale-110 group-hover:shadow-amber-500/20">
            <LockKeyhole className="size-10 text-amber-600/60" />
          </div>
          <div className="absolute -bottom-2 -right-2 size-12 rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/30 flex items-center justify-center border-4 border-background transition-transform duration-500 hover:rotate-12">
            <Fingerprint className="size-6 text-white" />
          </div>
        </div>

        <div className="max-w-[340px] space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
               <ShieldAlert className="size-4 text-amber-600 animate-pulse" />
               <h4 className="text-base font-black tracking-[0.1em] text-amber-700 uppercase leading-none">
                {title}
              </h4>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground/60 leading-relaxed px-4 tracking-tight">
              {description}
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/10 text-amber-700 cursor-help transition-all hover:bg-amber-500/20">
                  <Info className="size-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">Security Protocol 403-R</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-amber-700 text-white font-bold text-[9px] uppercase tracking-widest border-none shadow-xl">
                Insufficient permission level
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
