/**
 * @file TablePagination.tsx
 * @description Modern, premium, and feature-rich Table Pagination component.
 * Provides advanced tactile navigation, exact selection and showing summary,
 * tabular-nums digit alignment, and high-contrast primary color cues.
 * Fully responsive and visually cohesive with the modernized table workspace.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import { useTable } from "../context/TableContext";
import { Badge } from "@/shared/ui/kit/badge";

/**
 * Modern, beautiful and feature-rich Table Pagination.
 * Provides advanced navigation, selection summary, and view controls.
 */
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
      numPages,
      totalKnown,
      hasNextPage,
      hasPreviousPage,
      total,
    },
    setPage,
    setPerPage,
    rowSelection,
    loading,
  } = useTable();

  const [pageInput, setPageInput] = useState(String(page));
  const [isJumping, setIsQuickJumpOpen] = useState(false);

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = numPages || 1;
  const maxPage = totalKnown ? totalPages : undefined;

  const pageSizeOptions = useMemo(
    () =>
      Array.from(new Set([10, 20, 30, 40, 50, 100, 200, perPage])).sort(
        (a, b) => a - b,
      ),
    [perPage],
  );

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setPageInput(String(page));
      return;
    }
    if (maxPage) {
      const nextPage = Math.max(1, Math.min(maxPage, Math.trunc(parsed)));
      setPage(nextPage);
      setPageInput(String(nextPage));
      return;
    }
    setPage(Math.max(1, Math.trunc(parsed)));
  };

  const canGoPrevious = totalKnown ? page > 1 : hasPreviousPage;
  const canGoNext = totalKnown ? page < totalPages : hasNextPage;
  const canGoFirst = page > 1;
  const canGoLast = totalKnown && page < totalPages;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4.5 bg-background border-t border-border/60">
        {/* Left Section: Selection & Summary */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs text-muted-foreground font-medium">
          {enableSelection && selectedCount > 0 && (
            <div className="flex items-center gap-2 animate-in zoom-in-95 duration-250">
              <Badge
                variant="default"
                className="h-6 px-2.5 bg-primary text-[11px] font-bold shadow-xs transition-colors border-none text-primary-foreground"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </Badge>
              <div className="h-4 w-px bg-border/40 mx-1" />
            </div>
          )}

          <div className="flex flex-col gap-0.5 select-none">
            {totalKnown ? (
              <span>
                Affichage de <span className="font-semibold text-foreground tabular-nums">{(page - 1) * perPage + 1}</span> à{" "}
                <span className="font-semibold text-foreground tabular-nums">{Math.min(page * perPage, total)}</span> sur{" "}
                <span className="font-semibold text-foreground tabular-nums">{total}</span> éléments
              </span>
            ) : (
              <span>Page {page}</span>
            )}
          </div>
        </div>

        {/* Right Section: Controls Group */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-3 group">
            <div className="flex flex-col items-end gap-0.5 select-none">
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em] leading-none hidden lg:inline">
                Affichage
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground hidden lg:inline">
                {labels?.rowsPerPage ?? "Lignes par page"}
              </span>
            </div>
            <Select
              value={`${perPage}`}
              onValueChange={(value) => setPerPage(Number(value))}
            >
              <SelectTrigger
                className={cn(
                  "h-8.5 w-[105px] border-border bg-background text-xs font-semibold transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.02] rounded-md shadow-xs active:scale-98",
                )}
              >
                <SelectValue placeholder={`${perPage} lignes`} />
              </SelectTrigger>
              <SelectContent
                side="top"
                align="end"
                className="border-border bg-popover shadow-md rounded-md p-1"
              >
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs font-medium focus:bg-primary focus:text-primary-foreground rounded-sm m-0.5 transition-colors cursor-pointer"
                  >
                    {pageSize} lignes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border/40 hidden md:block" />

          {/* Pagination Cluster */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border/80 rounded-lg shadow-2xs">
            {/* First Page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-8 w-8 lg:flex hover:bg-primary/10 hover:text-primary active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 rounded-md"
                  onClick={() => setPage(1)}
                  disabled={!canGoFirst || loading}
                >
                  <ChevronsLeft className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-sm rounded-sm"
              >
                Premier
              </TooltipContent>
            </Tooltip>

            {/* Previous Page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 rounded-md"
                  onClick={() => setPage(page - 1)}
                  disabled={!canGoPrevious || loading}
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-sm rounded-sm"
              >
                Précédent
              </TooltipContent>
            </Tooltip>

            {/* Middle Indicator with Quick Jump */}
            <div className="flex items-center px-3 gap-2 min-w-[125px] justify-center">
              {!isJumping ? (
                <button
                  className="group/jump flex items-center gap-1.5 cursor-pointer hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-md px-2.5 py-1 transition-all duration-200"
                  onClick={() => totalKnown && setIsQuickJumpOpen(true)}
                >
                  <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none group-hover/jump:text-primary/70 transition-colors">
                    Page
                  </span>
                  <span className="text-xs font-extrabold text-foreground tracking-tight group-hover/jump:text-primary transition-colors bg-background border border-border/60 px-1.5 py-0.5 rounded shadow-3xs tabular-nums">
                    {totalKnown
                      ? (labels?.pageStatus?.(page, totalPages) ??
                        `${page} sur ${totalPages}`)
                      : page}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                  <Input
                    autoFocus
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      commitPageInput();
                      setIsQuickJumpOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commitPageInput();
                        setIsQuickJumpOpen(false);
                      }
                      if (e.key === "Escape") {
                        setPageInput(String(page));
                        setIsQuickJumpOpen(false);
                      }
                    }}
                    className="h-7 w-12 text-xs font-bold text-center p-0 border-primary/30 bg-background focus-visible:ring-primary/20 rounded-md"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all duration-150 rounded-md shadow-3xs"
                    onClick={() => {
                      commitPageInput();
                      setIsQuickJumpOpen(false);
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Next Page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 rounded-md"
                  onClick={() => setPage(page + 1)}
                  disabled={!canGoNext || loading}
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-sm rounded-sm"
              >
                Suivant
              </TooltipContent>
            </Tooltip>

            {/* Last Page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-8 w-8 lg:flex hover:bg-primary/10 hover:text-primary active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 rounded-md"
                  onClick={() => setPage(numPages || 1)}
                  disabled={!canGoLast || loading}
                >
                  <ChevronsRight className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-sm rounded-sm"
              >
                Dernier
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
