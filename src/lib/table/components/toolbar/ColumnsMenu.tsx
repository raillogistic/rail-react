import { Columns3Icon } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Input } from "@/lib/components/ui/input";
import { Switch } from "@/lib/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { resolveColumnVisibility } from "../../utils";
import type { FieldSchema } from "../../types";

type ColumnsMenuProps = {
  columnSearch: string;
  onColumnSearchChange: (value: string) => void;
  visibleColumns: FieldSchema[];
  columnVisibility: Record<string, boolean>;
  allColumnsVisible: boolean;
  onToggleColumn: (column: FieldSchema, checked: boolean) => void;
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
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Columns3Icon className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline-block text-xs">Colonnes</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Gérer les colonnes</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <Input
            placeholder="Filtrer les colonnes..."
            value={columnSearch}
            onChange={(e) => onColumnSearchChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="px-2 py-1.5 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onApplyDefaultColumnsVisibility}
          >
            Par défaut
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tout sélectionner</span>
            <Switch checked={allColumnsVisible} onCheckedChange={onSetAllColumnsVisibility} />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-auto">
          {visibleColumns.map((col) => {
            const id = col.fieldName || col.name;
            return (
              <DropdownMenuCheckboxItem
                key={id}
                checked={resolveColumnVisibility(columnVisibility, [
                  col.name,
                  col.fieldName,
                ])}
                onCheckedChange={(v) => onToggleColumn(col, !!v)}
              >
                {col.verboseName || col.name}
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
