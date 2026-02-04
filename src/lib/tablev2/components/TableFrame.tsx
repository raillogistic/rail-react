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
        "rounded-md border w-full max-w-full min-w-0 overflow-x-auto",
        className,
      )}
    >
      <Table className="min-w-max">
        {children}
      </Table>
    </div>
  );
}

// Re-export sub-components for easier composition within the V2 library
// Note: We don't export TableHeader here to avoid conflict with our high-level TableHeader component
export { TableBody, TableRow, TableHead, TableCell, TableHeader as ShadcnTableHeader };
