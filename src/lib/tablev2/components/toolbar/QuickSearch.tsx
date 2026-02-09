import { Search, X } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";

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
        "relative flex-1 sm:max-w-[320px] transition-all duration-300",
        expanded && "sm:max-w-[400px]",
      )}
    >
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      <Input
        className="h-8 w-full pl-9 bg-muted/40 hover:bg-muted/60 focus:bg-background border-none shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
