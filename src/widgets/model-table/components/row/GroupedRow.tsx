import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { TableCell, TableRow as ShadcnTableRow } from "../TableFrame";

type GroupedRowProps = {
 group: { groupKey: string; label: string; rows: Record<string, unknown>[] };
 collapsed: boolean;
 colSpan: number;
 onToggle: (groupKey: string) => void;
};

export function GroupedRow({
 group,
 collapsed,
 colSpan,
 onToggle,
}: GroupedRowProps) {
 return (
 <ShadcnTableRow
 className="bg-muted/25 border-b border-border/20 hover:bg-muted/40 transition-colors cursor-pointer"
 onClick={() => onToggle(group.groupKey)}
 >
 <TableCell colSpan={colSpan} className="px-2 py-1.5">
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="icon"
 className="size-6 hover:bg-background/80 transition-all"
 onClick={(e) => {
 e.stopPropagation();
 onToggle(group.groupKey);
 }}
 >
 {collapsed ? (
 <ChevronRight className="size-3.5 text-muted-foreground" />
 ) : (
 <ChevronDown className="size-3.5 text-muted-foreground" />
 )}
 </Button>
 <span className="text-xs font-semibold text-foreground/80">
 {group.label}
 </span>
 <span className="ml-1 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
 {group.rows.length}
 </span>
 </div>
 </TableCell>
 </ShadcnTableRow>
 );
}
