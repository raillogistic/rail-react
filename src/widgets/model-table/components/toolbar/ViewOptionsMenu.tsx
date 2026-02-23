import { Check, Settings2 } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Switch } from "@/shared/ui/kit/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import type { TableDensity } from "../../types";

type ViewOptionsMenuProps = {
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
  wrapCells: boolean;
  onWrapChange: (value: boolean) => void;
};

export function ViewOptionsMenu({
  density,
  onDensityChange,
  wrapCells,
  onWrapChange,
}: ViewOptionsMenuProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Affichage</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Densité</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onDensityChange("compact")}>
          {density === "compact" && <Check className="mr-2 h-4 w-4" />}
          <span className={density !== "compact" ? "ml-6" : ""}>Compact</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDensityChange("comfortable")}>
          {density === "comfortable" && <Check className="mr-2 h-4 w-4" />}
          <span className={density !== "comfortable" ? "ml-6" : ""}>Confortable</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDensityChange("spacious")}>
          {density === "spacious" && <Check className="mr-2 h-4 w-4" />}
          <span className={density !== "spacious" ? "ml-6" : ""}>Spacieux</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-2 flex items-center justify-between">
          <span className="text-sm">Retour à la ligne</span>
          <Switch checked={wrapCells} onCheckedChange={onWrapChange} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
