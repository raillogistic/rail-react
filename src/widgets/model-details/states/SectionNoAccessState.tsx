/**
 * @module SectionNoAccessState
 * @description Composant d'état d'accès refusé pour les sections.
 * Affiché lorsque l'utilisateur n'a pas les permissions requises,
 * avec une icône de verrouillage et un message d'avertissement.
 */
import { ShieldAlert, Lock } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";

export type SectionNoAccessStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Affiche un état d'accès refusé avec icône de verrouillage.
 * Informe l'utilisateur que ses permissions actuelles sont insuffisantes.
 */
export default function SectionNoAccessState({
  title = "Access Restricted",
  description = "This section requires elevated permissions. Contact your administrator if you believe you should have access.",
  className,
}: SectionNoAccessStateProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex flex-col items-center justify-center py-14 px-8 text-center rounded-xl border border-amber-500/10 bg-amber-500/[0.02] transition-all duration-300",
          "animate-in fade-in duration-500",
          className,
        )}
        aria-live="polite"
      >
        <div className="relative mb-6">
          <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Lock className="size-7 text-amber-600/50" />
          </div>
        </div>

        <div className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5">
              <h4 className="text-sm font-semibold tracking-tight text-amber-700 dark:text-amber-500">
                {title}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>

          <div className="pt-1 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400 cursor-help text-xs font-medium transition-colors hover:bg-amber-500/10">
                  <ShieldAlert className="size-3.5" />
                  <span>Insufficient permissions</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs font-medium">
                Your current role does not have access to this resource
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
