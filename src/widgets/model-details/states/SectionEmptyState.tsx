/**
 * @module SectionEmptyState
 * @description Composant d'état vide pour les sections.
 * Affiché lorsqu'une section n'a pas de données à présenter,
 * avec une icône, un message et un bouton d'action optionnel.
 */
import { Inbox, Plus } from "lucide-react";
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

/**
 * Affiche un état vide élégant pour les sections sans données.
 * Inclut une icône centrale, un titre, une description et un CTA optionnel.
 */
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
        "flex flex-col items-center justify-center py-14 px-8 text-center rounded-xl border border-dashed border-border/30 bg-muted/5 transition-all duration-300",
        "animate-in fade-in duration-500",
        className,
      )}
      aria-live="polite"
    >
      <div className="relative mb-6">
        <div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center transition-transform duration-300 hover:scale-105">
          {icon || <Inbox className="size-7 text-muted-foreground/40" />}
        </div>
      </div>

      <div className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold tracking-tight text-foreground/80">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {onAction && actionLabel && (
          <div className="pt-1">
            <Button
              onClick={onAction}
              variant="outline"
              size="sm"
              className="h-8 px-4 rounded-lg text-xs font-medium gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
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
