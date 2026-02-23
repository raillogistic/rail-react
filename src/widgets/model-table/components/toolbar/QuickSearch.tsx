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
        "relative group flex-1 transition-all duration-500 ease-in-out sm:max-w-[280px]",
        expanded && "sm:max-w-[420px] shadow-lg shadow-primary/5",
      )}
    >
      <div className={cn(
        "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300",
        expanded ? "text-primary" : "text-muted-foreground/40"
      )}>
        <Search className={cn(
          "h-4 w-4 transition-transform duration-500",
          expanded && "scale-110"
        )} />
      </div>
      <Input
        className={cn(
          "h-9 w-full pl-10 pr-9 bg-muted/30 border-none transition-all duration-300 rounded-xl",
          "placeholder:text-muted-foreground/30 placeholder:font-medium",
          "hover:bg-muted/50",
          "focus-visible:ring-4 focus-visible:ring-primary/10 focus:bg-background/80 focus:backdrop-blur-md"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-all active:scale-90 animate-in fade-in zoom-in-75 duration-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className={cn(
        "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary transition-all duration-500 rounded-full",
        expanded ? "w-[90%] opacity-100" : "w-0 opacity-0"
      )} />
    </div>
  );
}
