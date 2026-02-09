import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { TableCell, TableRow as ShadcnTableRow } from "../TableFrame";

type GroupedRowProps = {
  group: { key: string; label: string; rows: Record<string, unknown>[] };
  collapsed: boolean;
  colSpan: number;
  onToggle: (groupKey: string) => void;
};

export function GroupedRow({ group, collapsed, colSpan, onToggle }: GroupedRowProps) {
  return (
    <ShadcnTableRow
      className="bg-muted/40 border-b border-border hover:bg-muted/50 transition-colors"
      onClick={() => onToggle(group.key)}
    >
      <TableCell colSpan={colSpan} className="px-2 py-1.5 cursor-pointer">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-sm hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(group.key);
            }}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <span className="text-sm font-semibold text-foreground/80">{group.label}</span>
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {group.rows.length}
          </span>
        </div>
      </TableCell>
    </ShadcnTableRow>
  );
}
