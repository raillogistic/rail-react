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
  Table as TableIcon
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

export default function TableDetail({
  columns,
  rows = [],
  enable_quick_search,
  enable_sorting = true,
  initial_page_size = 10,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<{ key: string; desc: boolean } | null>(null);

  const filteredRows = React.useMemo(() => {
    if (!enable_quick_search || !search.trim()) return rows;
      const term = search.trim().toLowerCase();
      return rows.filter((row) => {
        const data = row as Record<string, unknown>;
        return columns.some((column) => {
          const key = String(column.id ?? (column as any).accessorKey ?? "");
          if (!key) return false;
          return String(data[key] ?? "").toLowerCase().includes(term);
        });
      });
  }, [columns, enable_quick_search, rows, search]);

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

  const renderSortIcon = (key: string) => {
    if (sort?.key !== key) return <ArrowUpDown className="ml-2 size-3 opacity-30 group-hover:opacity-60 transition-opacity" />;
    return sort.desc ? (
      <ArrowDown className="ml-2 size-3 text-primary animate-in fade-in zoom-in duration-300" />
    ) : (
      <ArrowUp className="ml-2 size-3 text-primary animate-in fade-in zoom-in duration-300" />
    );
  };

  return (
    <div className="space-y-4">
      {enable_quick_search && (
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items..."
              className="pl-10 h-10 rounded-xl border-border/50 bg-muted/20 focus:bg-background transition-all shadow-inner"
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                {columns.map((column) => {
                  const key = String(column.id ?? (column as any).accessorKey ?? "");
                  return (
                    <th
                      key={key || `column-${String(columns.indexOf(column))}`}
                      className="group px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70"
                    >
                      <button
                        type="button"
                        className={cn(
                          "flex items-center transition-colors hover:text-primary disabled:cursor-default",
                          enable_sorting && "cursor-pointer"
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
            <tbody className="divide-y divide-border/30">
              {pageRows.length === 0 ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={Math.max(columns.length, 1)}>
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-muted/50 text-muted-foreground/40">
                        <TableIcon className="size-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold tracking-tight">No results found</div>
                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                          We couldn't find any data matching your criteria.
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
                      className="group transition-colors hover:bg-primary/5"
                    >
                      {columns.map((column, colIndex) => {
                        const key = String(column.id ?? (column as any).accessorKey ?? "");
                        return (
                          <td key={`${key}-${colIndex}`} className="px-4 py-3 transition-transform group-hover:translate-x-0.5">
                            <span className="text-sm font-medium tracking-tight">
                              {String(data[key] ?? "")}
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2 border-t border-border/20 pt-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
          <span className="bg-muted px-2 py-0.5 rounded shadow-inner">Page {currentPage} / {pageCount}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{total} total element{total > 1 ? "s" : ""}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="h-8 rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-sm gap-1 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft className="size-3" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
            className="h-8 rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-sm gap-1 hover:bg-primary/10 hover:text-primary transition-all"
          >
            Next
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
