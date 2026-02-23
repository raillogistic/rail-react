import React from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/kit/table";
import { cn } from "@/shared/utils";

interface TableFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function TableFrame({ children, className }: TableFrameProps) {
  return (
    <Table className={cn("min-w-full text-[13px] border-separate border-spacing-0", className)}>
      {children}
    </Table>
  );
}

// Re-export sub-components for easier composition within the V2 library
// Note: We don't export TableHeader here to avoid conflict with our high-level TableHeader component
export { TableBody, TableRow, TableHead, TableCell, TableHeader as ShadcnTableHeader };
