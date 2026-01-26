import React from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";

/**
 * Props for {@link TablePagination}.
 * @property pageSize - Current page size.
 * @property pageSizeOptions - Available page size options.
 * @property pageIndex - Zero-based page index.
 * @property pageCount - Total number of pages.
 * @property canPrevious - Whether navigating to the previous page is allowed.
 * @property canNext - Whether navigating to the next page is allowed.
 * @property onPageSizeChange - Handler to change the page size.
 * @property onFirst - Navigate to the first page.
 * @property onPrevious - Navigate to the previous page.
 * @property onNext - Navigate to the next page.
 * @property onLast - Navigate to the last page.
 */
export type TablePaginationProps = {
  pageSize: number;
  pageSizeOptions: number[];
  pageIndex: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPageSizeChange: (size: number) => void;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
};

/**
 * Pagination footer shared by BaseTable and other table consumers.
 */
export function TablePagination({
  pageSize,
  pageSizeOptions,
  pageIndex,
  pageCount,
  canPrevious,
  canNext,
  onPageSizeChange,
  onFirst,
  onPrevious,
  onNext,
  onLast,
}: TablePaginationProps) {
  const sizeOptions = React.useMemo(
    () =>
      Array.from(new Set([pageSize, ...pageSizeOptions]))
        .filter((size) => size >= pageSize)
        .sort((a, b) => a - b),
    [pageSize, pageSizeOptions]
  );

  return (
    <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span>
          Page {pageIndex + 1} of {Math.max(pageCount, 1)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canPrevious}
            onClick={onFirst}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canPrevious}
            onClick={onPrevious}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={onNext}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canNext}
            onClick={onLast}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
