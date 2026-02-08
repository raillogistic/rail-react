import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
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
  } = useTable();

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = numPages || 1;

  const selectionText = totalKnown
    ? labels?.selectionStatus?.(selectedCount, total) ??
      `${selectedCount} sur ${total} ligne(s) selectionnee(s).`
    : `${selectedCount} ligne(s) selectionnee(s).`;
  const leftText = enableSelection
    ? selectionText
    : totalKnown
      ? `${total} ligne(s)`
      : "";
  const pageText = totalKnown
    ? labels?.pageStatus?.(page, totalPages) ?? `Page ${page} sur ${totalPages}`
    : `Page ${page}`;

  return (
    <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-muted-foreground">
      <div className="flex-1">
        {leftText}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <p className="text-xs">
            {labels?.rowsPerPage ?? "Lignes par page"}
          </p>
          <Select
            value={`${perPage}`}
            onValueChange={(value) => {
              setPerPage(Number(value));
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-xs">
          {pageText}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            <span className="sr-only">
              {labels?.firstPageAria ?? "Aller a la premiere page"}
            </span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(page - 1)}
            disabled={totalKnown ? page <= 1 : !hasPreviousPage}
          >
            <span className="sr-only">
              {labels?.previousPageAria ?? "Aller a la page precedente"}
            </span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(page + 1)}
            disabled={totalKnown ? page >= (numPages || 1) : !hasNextPage}
          >
            <span className="sr-only">
              {labels?.nextPageAria ?? "Aller a la page suivante"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(numPages || 1)}
            disabled={!totalKnown || page >= (numPages || 1)}
          >
            <span className="sr-only">
              {labels?.lastPageAria ?? "Aller a la derniere page"}
            </span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
