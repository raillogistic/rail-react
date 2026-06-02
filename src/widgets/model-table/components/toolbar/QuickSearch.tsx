/**
 * @file QuickSearch.tsx
 * @description Composant de recherche rapide de la barre d'outils redessiné pour le style Localira.
 * Utilise un design solide, épuré, sans bordure et avec une icône de recherche positionnée.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.value - La valeur actuelle de la recherche.
 * @param {function} props.onChange - Callback appelé lors du changement de valeur.
 * @param {string} [props.placeholder] - Texte d'invite à afficher dans le champ.
 * @param {boolean} [props.expanded] - Indique si le champ est étendu.
 * @param {function} [props.onFocusChange] - Callback appelé lors du changement de focus.
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
  placeholder = "Chercher...",
  expanded,
  onFocusChange,
}: QuickSearchProps) {
  return (
    <div
      className={cn(
        "relative flex items-center w-full sm:w-[250px] transition-all",
        expanded && "sm:w-[300px]",
      )}
    >
      <div className="absolute left-4 z-10 flex items-center pointer-events-none text-muted-foreground/60">
        <Search className="h-4 w-4" />
      </div>
      <Input
        className={cn(
          "h-9.5 w-full pl-11 pr-9 bg-neutral-100 dark:bg-zinc-800 border-none rounded-lg text-xs font-medium text-foreground",
          "placeholder:text-muted-foreground/50 placeholder:font-medium",
          "hover:bg-neutral-200/60 dark:hover:bg-zinc-700/60",
          "focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-neutral-200/80 dark:focus:bg-zinc-700/80",
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
          className="absolute right-3 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

