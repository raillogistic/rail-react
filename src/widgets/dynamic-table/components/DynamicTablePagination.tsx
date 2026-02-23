import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { cn } from "@/shared/utils";
import type { UseDynamicTableStateResult } from "../state/useDynamicTableState";

/**
 * Props for `DynamicTablePagination`.
 */
export interface DynamicTablePaginationProps {
  /** Resolved table state controls. */
  state: UseDynamicTableStateResult;
  /** Enables selection summary text when true. */
  enableSelection?: boolean;
  /** Optional known total row count from the source. */
  totalRows?: number;
  /** Optional known page count from the source. */
  pageCount?: number;
  /** Optional server-side next-page flag. */
  hasNextPage?: boolean;
  /** Optional server-side previous-page flag. */
  hasPreviousPage?: boolean;
  /** Pagination execution mode. */
  mode: "client" | "server";
}

/**
 * Renders table pagination controls for both client and server modes.
 */
export function DynamicTablePagination({
  state,
  enableSelection,
  totalRows,
  pageCount,
  hasNextPage,
  hasPreviousPage,
  mode,
}: DynamicTablePaginationProps) {
  const [pageInput, setPageInput] = useState(String(state.pagination.pageIndex + 1));

  useEffect(() => {
    setPageInput(String(state.pagination.pageIndex + 1));
  }, [state.pagination.pageIndex]);

  const pageSizeOptions = useMemo(
    () =>
      Array.from(
        new Set([10, 20, 30, 40, 50, 100, state.pagination.pageSize]),
      ).sort((left, right) => left - right),
    [state.pagination.pageSize],
  );

  const selectedCount = useMemo(
    () =>
      Object.values(state.rowSelection).reduce(
        (count, selected) => (selected ? count + 1 : count),
        0,
      ),
    [state.rowSelection],
  );

  const totalPages = useMemo(() => {
    if (typeof pageCount === "number" && pageCount > 0) {
      return pageCount;
    }
    if (mode === "client" && typeof totalRows === "number" && totalRows >= 0) {
      return Math.max(1, Math.ceil(totalRows / state.pagination.pageSize));
    }
    return null;
  }, [mode, pageCount, state.pagination.pageSize, totalRows]);

  /**
   * Moves pagination to the requested page index.
   */
  const goToPage = (pageIndex: number) => {
    const nextPageIndex =
      totalPages === null
        ? Math.max(0, pageIndex)
        : Math.max(0, Math.min(totalPages - 1, pageIndex));
    state.setPagination((previousValue) => ({
      ...previousValue,
      pageIndex: nextPageIndex,
    }));
  };

  /**
   * Commits numeric page input into pagination state.
   */
  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setPageInput(String(state.pagination.pageIndex + 1));
      return;
    }
    goToPage(parsed - 1);
  };

  const canGoPrevious =
    mode === "server"
      ? (hasPreviousPage ?? state.pagination.pageIndex > 0)
      : state.pagination.pageIndex > 0;
  const canGoNext =
    mode === "server"
      ? (hasNextPage ?? true)
      : totalPages === null
        ? true
        : state.pagination.pageIndex + 1 < totalPages;

  return (
    <div
      className={cn(
        "mt-2 flex flex-col items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-4 py-3 sm:flex-row",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {enableSelection ? (
          <span className="font-semibold">
            {selectedCount} selected
          </span>
        ) : null}
        {typeof totalRows === "number" ? (
          <span className="font-medium">
            {totalRows} total
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <Select
          value={String(state.pagination.pageSize)}
          onValueChange={(value) => {
            state.setPagination((previousValue) => ({
              ...previousValue,
              pageIndex: 0,
              pageSize: Number(value),
            }));
          }}
        >
          <SelectTrigger className="h-8 w-[92px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrevious}
          onClick={() => goToPage(0)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrevious}
          onClick={() => goToPage(state.pagination.pageIndex - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <input
          className="h-8 w-[64px] rounded-md border border-border bg-background px-2 text-center text-xs"
          aria-label="Page number"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          onBlur={commitPageInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitPageInput();
            }
          }}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext}
          onClick={() => goToPage(state.pagination.pageIndex + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext || totalPages === null}
          onClick={() => {
            if (totalPages !== null) {
              goToPage(totalPages - 1);
            }
          }}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

