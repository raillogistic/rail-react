/**
 * @module TableDetail
 * @description Composant de tableau imbriqué pour les détails.
 * Fournit un tableau de données avec recherche rapide,
 * tri par colonne et pagination côté client.
 */
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react";
import { cn } from "@/shared/utils";

type Props = {
  columns: ColumnDef<unknown>[];
  rows?: unknown[];
  enable_quick_search?: boolean;
  enable_sorting?: boolean;
  available_filters?: never;
  selection?: never;
  row_actions?: never;
  top_actions?: never;
  initial_page_size?: number;
};

/**
 * Tableau de détail avec tri, recherche et pagination.
 * Utilisé pour afficher les relations imbriquées (to-many)
 * dans les pages de détail de modèle.
 */
export default function TableDetail({
  columns,
  rows = [],
  enable_quick_search,
  enable_sorting = true,
  initial_page_size = 10,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<{ key: string; desc: boolean } | null>(
    null,
  );

  /** Filtre les lignes par terme de recherche global. */
  const filteredRows = React.useMemo(() => {
    if (!enable_quick_search || !search.trim()) return rows;
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const data = row as Record<string, unknown>;
      return columns.some((column) => {
        const key = String(
          column.id ??
            (column as unknown as Record<string, unknown>).accessorKey ??
            "",
        );
        if (!key) return false;
        return String(data[key] ?? "")
          .toLowerCase()
          .includes(term);
      });
    });
  }, [columns, enable_quick_search, rows, search]);

  /** Tri les lignes selon la colonne active. */
  const sortedRows = React.useMemo(() => {
    if (!enable_sorting || !sort?.key) return filteredRows;
    const key = sort.key;
    const direction = sort.desc ? -1 : 1;
    return [...filteredRows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      return String(av ?? "").localeCompare(String(bv ?? "")) * direction;
    });
  }, [enable_sorting, filteredRows, sort]);

  const total = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(total / initial_page_size));
  const currentPage = Math.min(page, pageCount);
  const pageRows = React.useMemo(() => {
    const start = (currentPage - 1) * initial_page_size;
    return sortedRows.slice(start, start + initial_page_size);
  }, [currentPage, initial_page_size, sortedRows]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  /** Bascule le tri sur une colonne donnée (asc → desc → off). */
  const toggleSort = (key: string) => {
    if (!enable_sorting) return;
    setSort((current) => {
      if (!current || current.key !== key) {
        return { key, desc: false };
      }
      if (!current.desc) {
        return { key, desc: true };
      }
      return null;
    });
  };

  /** Rendu de l'icône de tri pour une colonne. */
  const renderSortIcon = (key: string) => {
    if (sort?.key !== key)
      return (
        <ArrowUpDown className="ml-1.5 size-3 opacity-30 group-hover:opacity-60 transition-opacity" />
      );
    return sort.desc ? (
      <ArrowDown className="ml-1.5 size-3 text-primary animate-in fade-in duration-200" />
    ) : (
      <ArrowUp className="ml-1.5 size-3 text-primary animate-in fade-in duration-200" />
    );
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      {enable_quick_search && (
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="pl-9 h-9 rounded-lg border-border/30 bg-muted/10 text-sm focus:bg-background transition-all"
            />
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-hidden rounded-lg border border-border/30 bg-card transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/20 border-b border-border/30">
                {columns.map((column) => {
                  const key = String(
                    column.id ??
                      (column as unknown as Record<string, unknown>)
                        .accessorKey ??
                      "",
                  );
                  return (
                    <th
                      key={key || `column-${String(columns.indexOf(column))}`}
                      className="group px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
                    >
                      <button
                        type="button"
                        className={cn(
                          "flex items-center transition-colors hover:text-foreground disabled:cursor-default",
                          enable_sorting && "cursor-pointer",
                        )}
                        onClick={() => toggleSort(key)}
                        disabled={!enable_sorting || !key}
                      >
                        {String((column as { header?: unknown }).header ?? key)}
                        {enable_sorting && key && renderSortIcon(key)}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-16 text-center"
                    colSpan={Math.max(columns.length, 1)}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                        <Inbox className="size-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-foreground/60">
                          No results found
                        </div>
                        <p className="text-xs text-muted-foreground/50">
                          No data matches your criteria.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((row, rowIndex) => {
                  const data = row as Record<string, unknown>;
                  return (
                    <tr
                      key={String(data.id ?? rowIndex)}
                      className="group transition-colors hover:bg-muted/20"
                    >
                      {columns.map((column, colIndex) => {
                        const key = String(
                          column.id ??
                            (column as unknown as Record<string, unknown>)
                              .accessorKey ??
                            "",
                        );
                        return (
                          <td
                            key={`${key}-${colIndex}`}
                            className="px-4 py-2.5"
                          >
                            <span className="text-sm font-medium text-foreground/80">
                              {typeof data[key] === "boolean" ? (data[key] ? "Oui" : "Non") : String(data[key] ?? "")}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
        <div className="text-xs text-muted-foreground/60 font-medium flex items-center gap-2">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <span className="text-border">·</span>
          <span>
            {total} item{total !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="h-8 rounded-md text-xs font-medium gap-1 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
            className="h-8 rounded-md text-xs font-medium gap-1 hover:bg-accent transition-colors"
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
