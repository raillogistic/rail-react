import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Hash,
  Layers,
  ArrowRight,
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
import { Badge } from "@/lib/components/ui/badge";
import { Separator } from "@/lib/components/ui/separator";

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-background/95 backdrop-blur-md border-t shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.1)]">
        {/* Left Section: Selection & Summary */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {enableSelection && selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Badge
                variant="default"
                className="h-6 px-2 bg-primary/90 hover:bg-primary font-bold shadow-sm transition-all active:scale-95"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </Badge>
              <Separator
                orientation="vertical"
                className="h-4 mx-1 opacity-50"
              />
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-xs font-semibold text-foreground/70 tracking-tight">
              {totalKnown ? (
                total === 0 ? (
                  "Aucun enregistrement"
                ) : (
                  <>
                    <span className="text-foreground font-bold">
                      {rangeStart}-{rangeEnd}
                    </span>
                    <span className="mx-1 text-muted-foreground/60 font-medium">
                      sur
                    </span>
                    <span className="text-foreground font-extrabold">
                      {total}
                    </span>
                  </>
                )
              ) : (
                <Badge
                  variant="secondary"
                  className="font-bold text-[10px] uppercase tracking-wider h-5 bg-muted/50 border-none"
                >
                  {data.length} chargé{data.length > 1 ? "s" : ""}
                </Badge>
              )}
            </span>
          </div>

          <div className="ml-auto sm:ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all active:scale-90",
                    loading && "animate-spin text-primary",
                  )}
                  onClick={() => refresh()}
                  disabled={loading}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Actualiser les données</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Controls Group */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-6 w-full sm:w-auto">
          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2 group">
            <Layers className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:text-primary transition-colors" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:inline">
              {labels?.rowsPerPage ?? "Lignes"}
            </span>
            <Select
              value={`${perPage}`}
              onValueChange={(value) => setPerPage(Number(value))}
            >
              <SelectTrigger
                className={cn(
                  "h-8 w-[75px] border-border/40 bg-muted/20 text-xs font-bold rounded-lg",
                  "focus:ring-2 focus:ring-primary/10 transition-all hover:bg-muted/40",
                )}
              >
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent
                side="top"
                align="center"
                className="rounded-xl border-border/40 shadow-xl"
              >
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs font-semibold focus:bg-primary/5 focus:text-primary rounded-md m-1"
                                    >
                                      {pageSize} lignes
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                  
                            <Separator orientation="vertical" className="h-6 hidden md:block opacity-30" />
                  
                            {/* Pagination Cluster */}
                            <div className="flex items-center gap-1.5 p-1 bg-muted/20 rounded-xl border border-border/30">
                              {/* First Page */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden h-8 w-8 rounded-lg lg:flex hover:bg-background hover:text-primary hover:shadow-sm disabled:opacity-20"
                                    onClick={() => setPage(1)}
                                    disabled={!canGoFirst || loading}
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="font-bold text-[10px]">{labels?.firstPageAria ?? "Début"}</TooltipContent>
                              </Tooltip>
                  
                              {/* Previous Page */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary hover:shadow-sm disabled:opacity-20"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!canGoPrevious || loading}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="font-bold text-[10px]">{labels?.previousPageAria ?? "Précédent"}</TooltipContent>
                              </Tooltip>
                  
                              {/* Middle Indicator with Quick Jump */}
                              <div className="flex items-center px-3 gap-2 min-w-[100px] justify-center">
                                 {!isJumping ? (
                                   <div 
                                     className="flex items-center gap-1 cursor-pointer hover:bg-background/50 px-2 py-0.5 rounded-md transition-colors"
                                     onClick={() => totalKnown && setIsQuickJumpOpen(true)}
                                   >
                                      <span className="text-xs font-extrabold text-foreground tracking-tighter">
                                        {totalKnown 
                                          ? (labels?.pageStatus?.(page, totalPages) ?? `${page} / ${totalPages}`)
                                          : `Page ${page}`}
                                      </span>
                                   </div>
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
                                        className="h-7 w-12 text-xs font-bold text-center p-0 border-primary/30 focus-visible:ring-primary/20"
                                      />
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-primary"
                                        onClick={() => {
                                          commitPageInput();
                                          setIsQuickJumpOpen(false);
                                        }}
                                      >
                                        <ArrowRight className="h-3 w-3" />
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
                                    className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary hover:shadow-sm disabled:opacity-20"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!canGoNext || loading}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="font-bold text-[10px]">{labels?.nextPageAria ?? "Suivant"}</TooltipContent>
                              </Tooltip>
                  
                              {/* Last Page */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden h-8 w-8 rounded-lg lg:flex hover:bg-background hover:text-primary hover:shadow-sm disabled:opacity-20"
                                    onClick={() => setPage(numPages || 1)}
                                    disabled={!canGoLast || loading}
                                  >
                                    <ChevronsRight className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="font-bold text-[10px]">{labels?.lastPageAria ?? "Fin"}</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Quick Jump Info - Desktop Only */}
                            <div className="hidden xl:flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest pointer-events-none">
                               <Hash className="h-3 w-3" />
                               <span>Aller à la page</span>
                            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
