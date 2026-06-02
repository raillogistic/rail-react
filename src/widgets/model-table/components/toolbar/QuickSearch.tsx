/**
 * @file QuickSearch.tsx
 * @description Composant de recherche rapide de la barre d'outils.
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 */
import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui/kit/input";
import { cn } from "@/shared/utils";

type QuickSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  expanded?: boolean;
  onFocusChange?: (focused: boolean) => void;
};

export function QuickSearch({
  value,
  onChange,
  placeholder,
  expanded,
  onFocusChange,
}: QuickSearchProps) {
  return (
    <div
      className={cn(
        "relative group flex-1 sm:max-w-[280px]",
        expanded && "sm:max-w-[420px]",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
          expanded ? "text-primary" : "text-muted-foreground/40",
        )}
      >
        <Search className="h-4 w-4" />
      </div>
      <Input
        className={cn(
          "h-9 w-full pl-10 pr-9 bg-muted/30 border-none",
          "placeholder:text-muted-foreground/30 placeholder:font-medium",
          "hover:bg-muted/50",
          "focus-visible:ring-4 focus-visible:ring-primary/10 focus:bg-background/80 focus:backdrop-blur-md",
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-primary/10 hover:text-primary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary",
          expanded ? "w-[90%] opacity-100" : "w-0 opacity-0",
        )}
      />
    </div>
  );
}
