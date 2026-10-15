import * as React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { X } from "lucide-react";
import { AdvancedFilteringController } from "./types";

type AdvancedFilterChipsProps = {
 controller: AdvancedFilteringController;
 clearLabel?: string;
};

/**
 * Displays the currently active filters as removable chips.
 * Keeping this separate from the table makes reuse trivial.
 */
export const AdvancedFilterChips: React.FC<AdvancedFilterChipsProps> = ({
 controller,
 clearLabel = "Effacer les filtres",
}) => {
 if (!controller.chips.length) return null;

 return (
 <div className="mb-2 flex flex-wrap items-center gap-2">
 {controller.chips.map((chip) => (
 // Indent badge slightly when coming from nested AND/OR groups
 <Badge
 key={chip.path.join(":")}
 variant="secondary"
 className="px-2 py-1 text-[11px]"
 style={{ marginLeft: chip.depth * 4 }}
 >
 <span className="font-medium">{chip.label}:</span>
 <span className="ml-1">
 {Array.isArray(chip.value)
 ? chip.value.length === 2
 ?`${chip.value[0]} - ${chip.value[1]}`
 : chip.value.join(", ")
 : String(chip.value)}
 </span>
 <button
 type="button"
 className="ml-2 inline-flex items-center"
 onClick={() => controller.removeChip(chip)}
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </Badge>
 ))}
 <Button variant="ghost" size="sm" onClick={controller.clearFilters}>
 {clearLabel}
 </Button>
 </div>
 );
};

