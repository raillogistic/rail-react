import { useMemo, useState, useEffect } from "react";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  createColumnHelper,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { 
  Save, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Eraser,
  Table as TableIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { Badge } from "@/lib/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/lib/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ImportRowPatchInput, ModelImportRow } from "../types";

interface ImportReviewGridProps {
  rows: ModelImportRow[];
  templateColumns?: string[];
  loading?: boolean;
  onPatchRows: (patches: ImportRowPatchInput[]) => Promise<void> | void;
}

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
};

const columnHelper = createColumnHelper<ModelImportRow & { _draft: Record<string, unknown> }>();

export function ImportReviewGrid({
  rows,
  templateColumns,
  loading,
  onPatchRows,
}: ImportReviewGridProps) {
  const [drafts, setDrafts] = useState<Record<number, Record<string, unknown>>>({});
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const [globalFilter, setGlobalFilter] = useState("");

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        editedValues: toRecord(row.editedValues),
        _draft: drafts[row.rowNumber] ?? {},
      })),
    [rows, drafts],
  );

  const dynamicColumns = useMemo(() => {
    const names = new Set<string>();
    const ordered: string[] = [];
    
    for (const columnName of templateColumns ?? []) {
      const safeName = String(columnName).trim();
      if (!safeName || names.has(safeName)) continue;
      names.add(safeName);
      ordered.push(safeName);
    }
    
    for (const row of normalizedRows) {
      Object.keys(row.editedValues ?? {}).forEach((name) => {
        if (!names.has(name)) {
          names.add(name);
          ordered.push(name);
        }
      });
    }
    return ordered;
  }, [normalizedRows, templateColumns]);

  const updateDraftValue = (rowNumber: number, key: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [rowNumber]: {
        ...(prev[rowNumber] ?? {}),
        [key]: value,
      },
    }));
  };

  const saveRow = async (row: ModelImportRow) => {
    const editedValues = { ...(row.editedValues ?? {}), ...(drafts[row.rowNumber] ?? {}) };
    setSavingRows(prev => new Set(prev).add(row.rowNumber));
    try {
      await onPatchRows([{ rowNumber: row.rowNumber, editedValues }]);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.rowNumber];
        return next;
      });
    } finally {
      setSavingRows(prev => {
        const next = new Set(prev);
        next.delete(row.rowNumber);
        return next;
      });
    }
  };

  const tableColumns = useMemo(() => [
    columnHelper.display({
      id: "rowNumber",
      header: "#",
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">{info.row.original.rowNumber}</span>
      ),
      size: 50,
    }),
    columnHelper.accessor("status", {
      header: "Statut",
      cell: (info) => {
        const status = info.getValue();
        const hasIssues = info.row.original.issueCount > 0;
        return (
          <div className="flex items-center gap-2">
            {status === "VALID" || status === "READY" ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 px-1.5">
                <CheckCircle2 className="h-3 w-3" /> {status}
              </Badge>
            ) : status === "INVALID" ? (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-1.5">
                <AlertCircle className="h-3 w-3" /> {status}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 px-1.5">
                <Clock className="h-3 w-3" /> {status}
              </Badge>
            )}
            {hasIssues && (
              <span className="text-[10px] font-bold text-destructive">({info.row.original.issueCount})</span>
            )}
          </div>
        );
      },
      size: 120,
    }),
    ...dynamicColumns.map(col => columnHelper.display({
      id: col,
      header: col,
      cell: (info) => {
        const row = info.row.original;
        const draftValue = row._draft[col];
        const originalValue = row.editedValues[col] ?? "";
        const value = draftValue !== undefined ? draftValue : originalValue;
        const isModified = draftValue !== undefined;

        return (
          <div className="relative">
            <input
              className={cn(
                "w-full bg-transparent px-2 py-1 text-sm outline-none transition-colors border-b border-transparent focus:border-primary",
                isModified ? "text-primary font-medium italic" : ""
              )}
              value={String(value ?? "")}
              onChange={(e) => updateDraftValue(row.rowNumber, col, e.target.value)}
            />
            {isModified && (
              <div className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
        );
      },
      size: 180,
    })),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const row = info.row.original;
        const isModified = Object.keys(row._draft).length > 0;
        const isSaving = savingRows.has(row.rowNumber);

        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={isModified ? "default" : "ghost"}
              className={cn("h-8 px-2", isModified ? "shadow-sm" : "")}
              disabled={!isModified || isSaving || loading}
              onClick={() => void saveRow(row)}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isModified && <span className="ml-1.5 hidden sm:inline">Enregistrer</span>}
            </Button>
          </div>
        );
      },
      size: 100,
    }),
  ], [dynamicColumns, drafts, savingRows, loading]);

  const table = useReactTable({
    data: normalizedRows,
    columns: tableColumns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card className="shadow-lg border-primary/5 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-primary" />
              Révision des données
            </CardTitle>
            <CardDescription>
              Vérifiez et corrigez les données avant l'importation finale.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les lignes..."
                className="pl-9 h-9"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Tout afficher</DropdownMenuItem>
                <DropdownMenuItem>Valides uniquement</DropdownMenuItem>
                <DropdownMenuItem>Invalides uniquement</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {normalizedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5">
            <TableIcon className="h-12 w-12 opacity-20 mb-4" />
            <p>Aucune donnée à afficher pour le moment.</p>
          </div>
        ) : (
          <div className="relative overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={cn(
                      "group hover:bg-muted/50 transition-colors",
                      row.original.status === "INVALID" ? "bg-destructive/5 hover:bg-destructive/10" : ""
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {normalizedRows.length > 0 && (
        <CardFooter className="bg-muted/30 border-t py-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Affichage de <strong>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</strong> à <strong>{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</strong> sur <strong>{table.getFilteredRowModel().rows.length}</strong> lignes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <div className="flex items-center gap-1 font-mono text-xs">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 gap-1"
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
