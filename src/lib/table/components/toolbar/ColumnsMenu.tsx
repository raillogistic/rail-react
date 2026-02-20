import { Columns3Icon, Search, Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/lib/components/ui/dropdown-menu";
import { Input } from "@/lib/components/ui/input";
import { Switch } from "@/lib/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { resolveColumnVisibility } from "../../utils";
import { cn } from "@/lib/utils";

/**
 * Canonical shape for the toolbar column selector entries.
 */
export type ColumnsMenuOption = {
  id: string;
  label: string;
  visibilityKeys: string[];
};

type ColumnsMenuProps = {
  columnSearch: string;
  onColumnSearchChange: (value: string) => void;
  visibleColumns: ColumnsMenuOption[];
  columnVisibility: Record<string, boolean>;
  allColumnsVisible: boolean;
  onToggleColumn: (column: ColumnsMenuOption, checked: boolean) => void;
  onSetAllColumnsVisibility: (checked: boolean) => void;
  onApplyDefaultColumnsVisibility: () => void;
};

export function ColumnsMenu({
  columnSearch,
  onColumnSearchChange,
  visibleColumns,
  columnVisibility,
  allColumnsVisible,
  onToggleColumn,
  onSetAllColumnsVisibility,
  onApplyDefaultColumnsVisibility,
}: ColumnsMenuProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2.5 rounded-xl transition-all hover:bg-background hover:text-primary"
            >
              <Columns3Icon className="h-4 w-4 text-muted-foreground" />
              <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider">
                Colonnes
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Visibilité des colonnes</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-2xl border-none p-2 shadow-2xl backdrop-blur-2xl bg-background/95"
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          <Settings2 className="h-3.5 w-3.5" />
          Configuration
        </DropdownMenuLabel>

        <div className="relative px-2 pb-2">
          <Search className="absolute left-4 top-2.5 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Rechercher une colonne..."
            value={columnSearch}
            onChange={(e) => onColumnSearchChange(e.target.value)}
            className="h-9 pl-9 pr-4 text-xs bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
            onClick={onApplyDefaultColumnsVisibility}
          >
            <RotateCcw className="h-3 w-3" />
            Défaut
          </Button>
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Toutes
            </span>
            <Switch
              checked={allColumnsVisible}
              onCheckedChange={onSetAllColumnsVisibility}
              className="scale-75 data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2 bg-border/40" />

        <div className="max-h-[320px] overflow-auto custom-scrollbar px-1 py-1">
          {visibleColumns.map((col) => {
            const id = col.id;
            const isVisible = resolveColumnVisibility(
              columnVisibility,
              col.visibilityKeys,
            );
            return (
              <DropdownMenuCheckboxItem
                key={id}
                checked={isVisible}
                onCheckedChange={(v) => onToggleColumn(col, !!v)}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors mb-0.5",
                  isVisible
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            );
          })}
          {visibleColumns.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground italic">
              Aucune colonne trouvée
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
