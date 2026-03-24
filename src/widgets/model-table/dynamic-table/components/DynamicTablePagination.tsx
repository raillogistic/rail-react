import { useEffect, useMemo, useState } from "react";
import {
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
 ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
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
import type { UseDynamicTableStateResult } from "../state/useDynamicTableState";

/**
 * Props for`DynamicTablePagination`.
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
 * Renders premium table pagination controls for both client and server modes.
 * Features a refined visual treatment with containers, subtle backgrounds,
 * and inline quick-jump capability.
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
 const [pageInput, setPageInput] = useState(
 String(state.pagination.pageIndex + 1),
 );
 const [isJumpMode, setIsJumpMode] = useState(false);

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
 setIsJumpMode(false);
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

 const currentPage = state.pagination.pageIndex + 1;

 return (
 <TooltipProvider delayDuration={300}>
 <div
 className={cn(
 "mt-3 flex flex-col items-center justify-between gap-3 border border-border/30 bg-background/60 px-4 py-3 backdrop-blur-xl shadow-sm sm:flex-row",
 "",
 )}
 >
 {/* Left: Selection & Total Summary */}
 <div className="flex items-center gap-3 text-xs text-muted-foreground">
 {enableSelection && selectedCount > 0 ? (
 <span className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
 {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
 </span>
 ) : null}
 {typeof totalRows === "number" ? (
 <span className="font-semibold tabular-nums text-muted-foreground/70">
 {totalRows} au total
 </span>
 ) : null}
 </div>

 {/* Right: Controls */}
 <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
 {/* Page Size Selector */}
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
 <SelectTrigger className="h-8 w-[90px] border-border/30 bg-muted/30 text-[11px] font-semibold hover:bg-muted/50">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="border-border/30 bg-background/95 shadow-xl backdrop-blur-xl">
 {pageSizeOptions.map((option) => (
 <SelectItem
 key={option}
 value={String(option)}
 className="text-xs font-medium "
 >
 {option} lignes
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 {/* Navigation Cluster */}
 <div className="flex items-center gap-1 bg-muted/30 p-1 border border-border/20">
 {/* First */}
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="hidden h-7 w-7 lg:flex hover:bg-background hover:text-primary disabled:opacity-20"
 disabled={!canGoPrevious}
 onClick={() => goToPage(0)}
 aria-label="Première page"
 >
 <ChevronsLeft className="size-3.5" />
 </Button>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-[10px] font-bold">
 Première page
 </TooltipContent>
 </Tooltip>

 {/* Previous */}
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-7 w-7 hover:bg-background hover:text-primary disabled:opacity-20"
 disabled={!canGoPrevious}
 onClick={() => goToPage(state.pagination.pageIndex - 1)}
 aria-label="Page précédente"
 >
 <ChevronLeft className="size-3.5" />
 </Button>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-[10px] font-bold">
 Précédent
 </TooltipContent>
 </Tooltip>

 {/* Page Indicator / Quick Jump */}
 <div className="flex items-center justify-center min-w-[80px] px-2">
 {isJumpMode ? (
 <div className="flex items-center gap-1">
 <input
 autoFocus
 className="h-7 w-12 border border-primary/30 bg-background/80 px-1.5 text-center text-xs font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/20"
 aria-label="Numéro de page"
 value={pageInput}
 onChange={(event) => setPageInput(event.target.value)}
 onBlur={commitPageInput}
 onKeyDown={(event) => {
 if (event.key === "Enter") {
 commitPageInput();
 }
 if (event.key === "Escape") {
 setPageInput(String(currentPage));
 setIsJumpMode(false);
 }
 }}
 />
 <Button
 type="button"
 size="icon"
 variant="ghost"
 className="h-7 w-7 text-primary bg-primary/5"
 onClick={commitPageInput}
 >
 <ArrowRight className="size-3" />
 </Button>
 </div>
 ) : (
 <button
 type="button"
 className="flex flex-col items-center gap-0 cursor-pointer"
 onClick={() => totalPages !== null && setIsJumpMode(true)}
 >
 <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest leading-none">
 Page
 </span>
 <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">
 {totalPages !== null
 ?`${currentPage} / ${totalPages}`
 : String(currentPage)}
 </span>
 </button>
 )}
 </div>

 {/* Next */}
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-7 w-7 hover:bg-background hover:text-primary disabled:opacity-20"
 disabled={!canGoNext}
 onClick={() => goToPage(state.pagination.pageIndex + 1)}
 aria-label="Page suivante"
 >
 <ChevronRight className="size-3.5" />
 </Button>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-[10px] font-bold">
 Suivant
 </TooltipContent>
 </Tooltip>

 {/* Last */}
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="hidden h-7 w-7 lg:flex hover:bg-background hover:text-primary disabled:opacity-20"
 disabled={!canGoNext || totalPages === null}
 onClick={() => {
 if (totalPages !== null) {
 goToPage(totalPages - 1);
 }
 }}
 aria-label="Dernière page"
 >
 <ChevronsRight className="size-3.5" />
 </Button>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-[10px] font-bold">
 Dernier
 </TooltipContent>
 </Tooltip>
 </div>
 </div>
 </div>
 </TooltipProvider>
 );
}
