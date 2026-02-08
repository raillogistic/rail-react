import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTable } from "../context/TableContext";

export function TablePagination({
  labels,
  enableSelection,
}: {
  labels?: {
    rowsPerPage?: string;
    pageStatus?: (page: number, totalPages: number) => string;
    selectionStatus?: (selected: number, total: number) => string;
    firstPageAria?: string;
    previousPageAria?: string;
    nextPageAria?: string;
    lastPageAria?: string;
  };
  enableSelection?: boolean;
}) {
  const {
    pagination: {
      page,
      perPage,
      total,
      numPages,
      totalKnown,
      hasNextPage,
      hasPreviousPage,
    },
    setPage,
    setPerPage,
    rowSelection,
    data,
  } = useTable();
  const [pageInput, setPageInput] = useState(String(page));

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = numPages || 1;
  const maxPage = totalKnown ? totalPages : undefined;
  const pageSizeOptions = useMemo(
    () => Array.from(new Set([10, 20, 30, 40, 50, 100, 200, perPage])).sort((a, b) => a - b),
    [perPage],
  );

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const selectionText = totalKnown
    ? labels?.selectionStatus?.(selectedCount, total) ??
      `${selectedCount} sur ${total} selectionnee${selectedCount > 1 ? "s" : ""}`
    : `${selectedCount} selectionnee${selectedCount > 1 ? "s" : ""}`;

  const rangeStart = Math.min((page - 1) * perPage + 1, total);
  const rangeEnd = Math.min(page * perPage, total);
  const rangeText = totalKnown
    ? total === 0
      ? "0 ligne"
      : `${rangeStart}-${rangeEnd} sur ${total}`
    : `${data.length} chargee${data.length > 1 ? "s" : ""}`;

  const leftText = enableSelection && selectedCount > 0 ? selectionText : rangeText;
  const pageText = totalKnown
    ? labels?.pageStatus?.(page, totalPages) ?? `${page} / ${totalPages}`
    : `Page ${page}`;

  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page));
      return;
    }
    if (maxPage) {
      const nextPage = Math.max(1, Math.min(maxPage, Math.trunc(parsed)));
      setPage(nextPage);
      return;
    }
    setPage(Math.max(1, Math.trunc(parsed)));
  };

  const canGoPrevious = totalKnown ? page > 1 : hasPreviousPage;
  const canGoNext = totalKnown ? page < totalPages : hasNextPage;
  const canGoFirst = page > 1;
  const canGoLast = totalKnown && page < totalPages;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-2">
        {/* Left side - summary text */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{leftText}</span>
        </div>

        {/* Right side - controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {labels?.rowsPerPage ?? "par page"}
            </span>
            <Select
              value={`${perPage}`}
              onValueChange={(value) => {
                setPerPage(Number(value));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-7 w-[70px] border-border/50 bg-muted/30 text-xs",
                  "focus:ring-1 focus:ring-primary/20",
                )}
              >
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent side="top" align="center">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/40" />

          {/* Page indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{pageText}</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/40" />

          {/* Navigation buttons */}
          <div className="flex items-center gap-0.5">
            {/* First page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden h-7 w-7 rounded-md lg:flex",
                    "hover:bg-muted/60",
                    "disabled:opacity-30",
                  )}
                  onClick={() => setPage(1)}
                  disabled={!canGoFirst}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {labels?.firstPageAria ?? "Premiere page"}
              </TooltipContent>
            </Tooltip>

            {/* Previous page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md",
                    "hover:bg-muted/60",
                    "disabled:opacity-30",
                  )}
                  onClick={() => setPage(page - 1)}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {labels?.previousPageAria ?? "Page precedente"}
              </TooltipContent>
            </Tooltip>

            {/* Page input */}
            <Input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitPageInput();
                }
              }}
              className={cn(
                "h-7 w-12 border-border/50 bg-muted/30 px-2 text-center text-xs",
                "focus:ring-1 focus:ring-primary/20",
              )}
              aria-label="Aller a la page"
            />

            {/* Next page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md",
                    "hover:bg-muted/60",
                    "disabled:opacity-30",
                  )}
                  onClick={() => setPage(page + 1)}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {labels?.nextPageAria ?? "Page suivante"}
              </TooltipContent>
            </Tooltip>

            {/* Last page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden h-7 w-7 rounded-md lg:flex",
                    "hover:bg-muted/60",
                    "disabled:opacity-30",
                  )}
                  onClick={() => setPage(numPages || 1)}
                  disabled={!canGoLast}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {labels?.lastPageAria ?? "Derniere page"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
