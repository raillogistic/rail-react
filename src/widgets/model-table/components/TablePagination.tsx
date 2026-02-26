import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
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
    loading,
    refresh,
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

  const rangeStart = Math.min((page - 1) * perPage + 1, total);
  const rangeEnd = Math.min(page * perPage, total);

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
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-background/60 backdrop-blur-xl border border-border/30 rounded-2xl shadow-sm mt-3 animate-in slide-in-from-bottom-1 duration-300">
        {/* Left Section: Selection & Summary */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {enableSelection && selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-in zoom-in-95 duration-300">
              <Badge
                variant="default"
                className="h-6 px-2.5 bg-primary text-[11px] font-bold shadow-md shadow-primary/15 transition-all hover:scale-105 active:scale-95 border-none"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </Badge>
              <div className="h-4 w-px bg-border/40 mx-1" />
            </div>
          ) : null}

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
              Statistiques
            </span>
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {totalKnown ? (
                total === 0 ? (
                  "Aucun enregistrement"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-primary font-extrabold">
                      {rangeStart}-{rangeEnd}
                    </span>
                    <span className="text-muted-foreground/40 font-medium lowercase">
                      sur
                    </span>
                    <span className="text-foreground font-extrabold">
                      {total}
                    </span>
                  </span>
                )
              ) : (
                <Badge
                  variant="secondary"
                  className="font-bold text-[10px] uppercase tracking-wider h-5 bg-primary/5 text-primary border-none"
                >
                  {data.length} élément{data.length > 1 ? "s" : ""} chargé
                  {data.length > 1 ? "s" : ""}
                </Badge>
              )}
            </span>
          </div>

          <div className="ml-2 group">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all active:scale-90 hover:bg-primary/5 hover:text-primary",
                    loading && "animate-spin text-primary bg-primary/5",
                  )}
                  onClick={() => refresh()}
                  disabled={loading}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-bold text-[10px]">
                Actualiser
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Controls Group */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-8 w-full sm:w-auto">
          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2.5 group">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-none hidden lg:inline">
                Affichage
              </span>
              <span className="text-[11px] font-bold text-muted-foreground hidden lg:inline">
                {labels?.rowsPerPage ?? "Lignes"}
              </span>
            </div>
            <Select
              value={`${perPage}`}
              onValueChange={(value) => setPerPage(Number(value))}
            >
              <SelectTrigger
                className={cn(
                  "h-8 w-[85px] border-border/30 bg-muted/30 text-xs font-bold rounded-xl transition-all hover:bg-muted/50 hover:border-border/40",
                )}
              >
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent
                side="top"
                align="end"
                className="rounded-xl border-border/30 shadow-xl backdrop-blur-xl bg-background/95"
              >
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs font-semibold focus:bg-primary focus:text-primary-foreground rounded-lg m-1 transition-colors"
                  >
                    {pageSize} lignes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-px bg-border/20 hidden md:block" />

          {/* Pagination Cluster */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/20">
            {/* First Page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-8 w-8 rounded-lg lg:flex hover:bg-background hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                  onClick={() => setPage(1)}
                  disabled={!canGoFirst || loading}
                >
                  <ChevronsLeft className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest"
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
                  className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                  onClick={() => setPage(page - 1)}
                  disabled={!canGoPrevious || loading}
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest"
              >
                Précédent
              </TooltipContent>
            </Tooltip>

            {/* Middle Indicator with Quick Jump */}
            <div className="flex items-center px-4 gap-2 min-w-[120px] justify-center">
              {!isJumping ? (
                <button
                  className="group/jump flex flex-col items-center gap-0 cursor-pointer hover:scale-105 transition-all active:scale-95"
                  onClick={() => totalKnown && setIsQuickJumpOpen(true)}
                >
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-none group-hover/jump:text-primary/60 transition-colors">
                    Page
                  </span>
                  <span className="text-sm font-black text-foreground tracking-tighter group-hover/jump:text-primary transition-colors">
                    {totalKnown
                      ? (labels?.pageStatus?.(page, totalPages) ??
                        `${page} / ${totalPages}`)
                      : page}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
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
                    className="h-8 w-14 text-xs font-black text-center p-0 border-primary/30 bg-background/50 focus-visible:ring-primary/20 rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary bg-primary/5 rounded-lg"
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
                  className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                  onClick={() => setPage(page + 1)}
                  disabled={!canGoNext || loading}
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest"
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
                  className="hidden h-8 w-8 rounded-lg lg:flex hover:bg-background hover:text-primary disabled:opacity-20 transition-all active:scale-90"
                  onClick={() => setPage(numPages || 1)}
                  disabled={!canGoLast || loading}
                >
                  <ChevronsRight className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="font-bold text-[10px] uppercase tracking-widest"
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
