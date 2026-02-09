import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";

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

  return (
    <div className="space-y-3">
      {enable_quick_search ? (
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Recherche..."
            className="w-64"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              {columns.map((column) => {
                const key = String(column.id ?? (column as any).accessorKey ?? "");
                const isSorted = sort?.key === key;
                return (
                  <th
                    key={key || `column-${String(columns.indexOf(column))}`}
                    className="px-3 py-2 text-left font-medium text-muted-foreground"
                  >
                    <button
                      type="button"
                      className={enable_sorting ? "inline-flex items-center gap-1" : ""}
                      onClick={() => toggleSort(key)}
                      disabled={!enable_sorting || !key}
                    >
                      {String((column as { header?: unknown }).header ?? key)}
                      {isSorted ? (sort?.desc ? " ↓" : " ↑") : ""}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={Math.max(columns.length, 1)}>
                  Aucun résultat.
                </td>
              </tr>
            ) : (
              pageRows.map((row, rowIndex) => {
                const data = row as Record<string, unknown>;
                return (
                  <tr key={String(data.id ?? rowIndex)} className="border-t">
                    {columns.map((column, colIndex) => {
                      const key = String(column.id ?? (column as any).accessorKey ?? "");
                      return (
                        <td key={`${key}-${colIndex}`} className="px-3 py-2">
                          {String(data[key] ?? "")}
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {currentPage} / {pageCount} · {total} élément{total > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
          >
            Précédent
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
