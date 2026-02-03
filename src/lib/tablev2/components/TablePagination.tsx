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
}) {
  const {
    pagination: { page, perPage, total, numPages },
    setPage,
    setPerPage,
    rowSelection,
  } = useTable();

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = numPages || 1;

  const selectionText =
    labels?.selectionStatus?.(selectedCount, total) ??
    `${selectedCount} sur ${total} ligne(s) selectionnee(s).`;
  const pageText =
    labels?.pageStatus?.(page, totalPages) ?? `Page ${page} sur ${totalPages}`;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {selectionText}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            {labels?.rowsPerPage ?? "Lignes par page"}
          </p>
          <Select
            value={`${perPage}`}
            onValueChange={(value) => {
              setPerPage(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
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
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
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
            disabled={page <= 1}
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
            disabled={page >= (numPages || 1)}
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
            disabled={page >= (numPages || 1)}
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
