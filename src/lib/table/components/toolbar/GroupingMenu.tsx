import { Check, Layers, Eye, EyeOff, LayoutPanelTop } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/lib/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";

type GroupableField = { value: string; label: string };

type GroupingMenuProps = {
  groupingField: string | null;
  hasGroupedRows: boolean;
  groupableFields: GroupableField[];
  onSetGroupingField: (value: string | null) => void;
  onResetCollapsed: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function GroupingMenu({
  groupingField,
  hasGroupedRows,
  groupableFields,
  onSetGroupingField,
  onResetCollapsed,
  onExpandAll,
  onCollapseAll,
}: GroupingMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-xl transition-all",
                hasGroupedRows
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-background hover:text-primary",
              )}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Regrouper les données</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border-none p-2 shadow-2xl backdrop-blur-2xl bg-background/95"
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          <LayoutPanelTop className="h-3.5 w-3.5" />
          Regroupement
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => {
            onSetGroupingField(null);
            onResetCollapsed();
          }}
          className={cn(
            "gap-3 rounded-lg py-2 text-xs font-medium transition-colors mb-1",
            groupingField === null
              ? "bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border border-current transition-all",
              groupingField === null
                ? "bg-primary/20"
                : "border-muted-foreground/30",
            )}
          >
            {groupingField === null && <Check className="h-2.5 w-2.5" />}
          </div>
          <span>Aucun regroupement</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-2 bg-border/40" />

        <div className="max-h-[240px] overflow-auto custom-scrollbar px-1 py-1">
          {groupableFields.map((field) => {
            const isActive = groupingField === field.value;
            return (
              <DropdownMenuItem
                key={field.value}
                onClick={() => onSetGroupingField(field.value)}
                className={cn(
                  "gap-3 rounded-lg py-2 text-xs font-medium transition-colors mb-0.5",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border border-current transition-all",
                    isActive ? "bg-primary/20" : "border-muted-foreground/30",
                  )}
                >
                  {isActive && <Check className="h-2.5 w-2.5" />}
                </div>
                <span>{field.label}</span>
              </DropdownMenuItem>
            );
          })}
        </div>

        {hasGroupedRows && (
          <>
            <DropdownMenuSeparator className="mx-2 bg-border/40" />
            <div className="grid grid-cols-2 gap-2 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                onClick={onExpandAll}
              >
                <Eye className="h-3 w-3" />
                Ouvrir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                onClick={onCollapseAll}
              >
                <EyeOff className="h-3 w-3" />
                Fermer
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
