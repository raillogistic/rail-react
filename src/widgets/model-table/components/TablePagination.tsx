/**
 * @file TablePagination.tsx
 * @description Modern, premium, and feature-rich Table Pagination component.
 * Redessiné pour correspondre au style Localira (boutons de navigation à gauche, résumé et sélection à droite).
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 * Ajout du bouton de rafraîchissement unique à droite de la pagination.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.labels] - Libellés et traductions personnalisés pour la pagination.
 * @param {boolean} [props.enableSelection] - Active l'affichage du nombre de lignes sélectionnées.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
  RefreshCw,
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
    refresh,
  } = useTable();

  const [pageInput, setPageInput] = useState(String(page));
  const [isJumping, setIsQuickJumpOpen] = useState(false);

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = numPages || 1;
  const maxPage = totalKnown ? totalPages : undefined;

  const pageSizeOptions = useMemo(
    () =>
      Array.from(new Set([5, 10, 20, 30, 40, 50, 100, 200, perPage])).sort(
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4  py-4 bg-background ">
        {/* Left Section: Pagination Buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100/50 dark:bg-zinc-800/40 border border-border/60 rounded-lg">
          {/* First Page */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 lg:flex hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded-md"
                onClick={() => setPage(1)}
                disabled={!canGoFirst || loading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-sm"
            >
              Premier
            </TooltipContent>
          </Tooltip>

          {/* Previous Page */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded-md"
                onClick={() => setPage(page - 1)}
                disabled={!canGoPrevious || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-sm"
            >
              Précédent
            </TooltipContent>
          </Tooltip>

          {/* Middle Indicator with Quick Jump */}
          <div className="flex items-center px-3 gap-2 min-w-[125px] justify-center">
            {!isJumping ? (
              <button
                className="group/jump flex items-center gap-1.5 cursor-pointer hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-md px-2.5 py-1"
                onClick={() => totalKnown && setIsQuickJumpOpen(true)}
              >
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none group-hover/jump:text-primary/70">
                  Page
                </span>
                <span className="text-xs font-extrabold text-foreground tracking-tight group-hover/jump:text-primary bg-background border border-border/60 px-1.5 py-0.5 rounded tabular-nums">
                  {totalKnown
                    ? (labels?.pageStatus?.(page, totalPages) ??
                      `${page} sur ${totalPages}`)
                    : page}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
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
                  className="h-7 w-7 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground rounded-md"
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
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded-md"
                onClick={() => setPage(page + 1)}
                disabled={!canGoNext || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-sm"
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
                className="hidden h-8 w-8 lg:flex hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none rounded-md"
                onClick={() => setPage(numPages || 1)}
                disabled={!canGoLast || loading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-sm"
            >
              Dernier
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section: Showing summary & Page Size Select */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 w-full sm:w-auto text-xs text-muted-foreground font-medium">
          {enableSelection && selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="h-6 px-2.5 bg-primary text-[11px] font-bold border-none text-primary-foreground rounded"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </Badge>
              <div className="h-4 w-px bg-border/40 mx-1" />
            </div>
          )}

          <div className="select-none text-neutral-500 dark:text-neutral-400">
            {totalKnown ? (
              <span>
                Affichage de{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {(page - 1) * perPage + 1}
                </span>{" "}
                à{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {Math.min(page * perPage, total)}
                </span>{" "}
                sur{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {total}
                </span>{" "}
                entrées
              </span>
            ) : (
              <span>Page {page}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={`${perPage}`}
              onValueChange={(value) => setPerPage(Number(value))}
            >
              <SelectTrigger
                className={cn(
                  "h-8.5 w-16 border-border bg-background text-xs font-semibold hover:border-primary/30 hover:bg-primary/[0.02] rounded-md shadow-none",
                )}
              >
                <SelectValue placeholder={`${perPage}`} />
              </SelectTrigger>
              <SelectContent
                side="top"
                align="end"
                className="border-border bg-popover rounded-md p-1 z-50 shadow-lg"
              >
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs font-medium focus:bg-primary focus:text-primary-foreground rounded-sm m-0.5 cursor-pointer"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-px bg-border/40 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg shadow-none"
                onClick={() => refresh()}
                disabled={loading}
                aria-label="Rafraîchir les données"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-sm"
            >
              Rafraîchir
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
