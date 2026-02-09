import { Check, Layers } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
              className={cn("h-8 w-8 p-0", hasGroupedRows && "text-primary")}
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Regrouper
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Regrouper par
        </div>
        <DropdownMenuItem
          onClick={() => {
            onSetGroupingField(null);
            onResetCollapsed();
          }}
          className="gap-2"
        >
          {groupingField === null ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
          <span>Aucun regroupement</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {groupableFields.map((field) => (
          <DropdownMenuItem
            key={field.value}
            onClick={() => onSetGroupingField(field.value)}
            className="gap-2"
          >
            {groupingField === field.value ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <span className="h-3.5 w-3.5" />
            )}
            <span>{field.label}</span>
          </DropdownMenuItem>
        ))}
        {hasGroupedRows && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={onExpandAll}>
                Tout ouvrir
              </Button>
              <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={onCollapseAll}>
                Tout fermer
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
