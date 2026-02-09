import React from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/components/ui/table";
import { cn } from "@/lib/utils";

interface TableFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function TableFrame({ children, className }: TableFrameProps) {
  return (
    <div
      className={cn(
        "group/table relative w-full max-w-full min-w-0 overflow-hidden rounded-lg",
        "bg-card",
        "border border-border/60",
        "shadow-sm",
        className,
      )}
    >
      {/* Inner scroll container */}
      <div className="w-full overflow-x-auto">
        <Table className="h-full min-w-max text-[13px]">
          {children}
        </Table>
      </div>
    </div>
  );
}

// Re-export sub-components for easier composition within the V2 library
// Note: We don't export TableHeader here to avoid conflict with our high-level TableHeader component
export { TableBody, TableRow, TableHead, TableCell, TableHeader as ShadcnTableHeader };
