/**
 * @file TablePagination.tsx
 * @description Modern, premium, and feature-rich Table Pagination component.
 * Redessiné pour correspondre au style Localira (boutons de navigation à gauche, résumé et sélection à droite).
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 * Ajout du bouton de rafraîchissement unique à droite de la pagination.
 * Modifié pour intégrer le bouton de rafraîchissement déroulant (simple et complet).
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.labels] - Libellés et traductions personnalisés pour la pagination.
 * @param {boolean} [props.enableSelection] - Active l'affichage du nombre de lignes sélectionnées.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
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
import { useMetadata } from "../context/MetadataContext";
import { Badge } from "@/shared/ui/kit/badge";
import { useMutation } from "@apollo/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED,
  type UpsertUserTableConfigResponse,
  type UpsertUserTableConfigVariables,
} from "@/shared/api/graphql/legacy/mutations";
import {
  clearPersistedMetadataStore,
  getActiveMetadataUserKey,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import {
  clearPendingTablePersistenceReset,
  getNormalizedTablePersistenceKeys,
  markPendingTablePersistenceReset,
} from "../hooks/useTablePersistence";

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

  const { app, model } = useMetadata();
  const [hardRefreshing, setHardRefreshing] = useState(false);
  const [resetUserTableConfig] = useMutation<
    UpsertUserTableConfigResponse,
    UpsertUserTableConfigVariables
  >(UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED, {
    ignoreResults: true,
  });

  const resolvePersistenceKey = useCallback(() => {
    const defaultPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const fallbackKey = `${app}-${model}-${defaultPath}`;
    if (typeof document !== "undefined") {
      const element = document.querySelector("[data-model-table-persistence-key]");
      if (element) {
        return element.getAttribute("data-model-table-persistence-key") || fallbackKey;
      }
    }
    return fallbackKey;
  }, [app, model]);

  const handleHardRefresh = useCallback(async () => {
    if (hardRefreshing) {
      return;
    }
    setHardRefreshing(true);

    const persistenceKey = resolvePersistenceKey();
    const persistenceKeys = getNormalizedTablePersistenceKeys(persistenceKey);
    const metadataUserKey = getActiveMetadataUserKey();

    markPendingTablePersistenceReset(persistenceKey);

    if (typeof window !== "undefined") {
      persistenceKeys.forEach((candidateKey) => {
        try {
          window.localStorage.removeItem(`rail-table-v2:${candidateKey}`);
        } catch {
          // Ignore storage errors.
        }
      });
    }

    if (metadataUserKey) {
      clearPersistedMetadataStore(metadataUserKey);
    }

    try {
      await Promise.all(
        persistenceKeys.map((candidateKey) =>
          resetUserTableConfig({
            variables: {
              key: candidateKey,
              tableConfig: {},
            },
          }),
        ),
      );
    } catch {
      // Ignore mutation errors.
    }

    if (typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    clearPendingTablePersistenceReset(persistenceKey);
  }, [hardRefreshing, resetUserTableConfig, resolvePersistenceKey]);

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 bg-background select-none">
        
        {/* Section gauche : Résumé des sélections et entrées */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          {enableSelection && selectedCount > 0 && (
            <>
              <Badge
                variant="default"
                className="h-6 px-2.5 bg-primary text-[11px] font-bold border-none text-primary-foreground rounded shadow-none"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </Badge>
              <div className="h-4 w-px bg-border/40" />
            </>
          )}

          <div className="text-neutral-500 dark:text-neutral-400 font-medium">
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
        </div>

        {/* Section droite : Lignes par page, Boutons de navigation et Rafraîchissement */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 text-xs font-medium">
          
          {/* Lignes par page */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Lignes par page :</span>
            <Select
              value={`${perPage}`}
              onValueChange={(value) => setPerPage(Number(value))}
            >
              <SelectTrigger
                className={cn(
                  "h-8 w-16 border-border bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-xs font-semibold hover:border-primary/30 rounded-md shadow-none",
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

          <div className="h-4 w-px bg-border/40" />

          {/* Boutons de navigation */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-zinc-800/40 border border-border/60 rounded-lg">
            {/* Premier */}
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

            {/* Précédent */}
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

            {/* Indicateur de page & Jump */}
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
                    className="h-7 w-7 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground rounded-md shadow-none"
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

            {/* Suivant */}
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

            {/* Dernier */}
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

          <div className="h-4 w-px bg-border/40" />

          {/* Rafraîchissement */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg shadow-none"
                disabled={loading || hardRefreshing}
                aria-label="Rafraîchir les données"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (loading || hardRefreshing) && "animate-spin",
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-none p-2 bg-background/95 shadow-lg z-50"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Rafraîchissement
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2 bg-border/40" />
              <DropdownMenuItem
                onClick={() => refresh()}
                disabled={loading || hardRefreshing}
                className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <RefreshCw className="size-4 text-muted-foreground/60" />
                <span>Rafraîchissement simple</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void handleHardRefresh();
                }}
                disabled={hardRefreshing}
                className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <RefreshCw className="size-4 text-muted-foreground/60" />
                <span>Rafraîchissement complet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
