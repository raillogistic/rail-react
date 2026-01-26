import React from "react";
import type { Table as RTTable } from "@tanstack/react-table";
import { Columns3Icon } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Input } from "@/lib/components/ui/input";
import { Switch } from "@/lib/components/ui/switch";

/**
 * Props for {@link ColumnVisibilityMenu}.
 * @template TData Table row data type.
 * @property table - TanStack table instance used to toggle column visibility.
 * @property columnSearch - Current search query to filter column names.
 * @property onColumnSearchChange - Handler fired when the search query updates.
 */
export type ColumnVisibilityMenuProps<TData> = {
  table: RTTable<TData>;
  columnSearch: string;
  onColumnSearchChange: (value: string) => void;
};

/**
 * Dropdown component that lets users toggle visible columns and search by header label.
 */
export function ColumnVisibilityMenu<TData>({
  table,
  columnSearch,
  onColumnSearchChange,
}: ColumnVisibilityMenuProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Sélectionner les colonnes"
          aria-label="Sélectionner les colonnes"
        >
          <Columns3Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2">
        <div className="mb-2">
          <Input
            placeholder="Rechercher une colonne..."
            value={columnSearch}
            onChange={(e) => onColumnSearchChange(e.target.value)}
          />
        </div>
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-2 font-medium">
            <span>Afficher toutes les colonnes</span>
            <Switch
              checked={table.getAllLeafColumns().every((col) => col.getIsVisible())}
              onCheckedChange={(checked) => {
                table
                  .getAllLeafColumns()
                  .forEach((col) => col.toggleVisibility(Boolean(checked)));
              }}
            />
          </label>
        </div>
        <div className="max-h-64 overflow-auto pr-1">
          {table
            .getAllLeafColumns()
            .filter((col) => {
              const header =
                typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : col.id || "";
              return header.toLowerCase().includes(columnSearch.toLowerCase());
            })
            .map((col) => {
              const header =
                typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : col.id || "";
              const isChecked = col.getIsVisible();
              return (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                >
                  {header}
                </DropdownMenuCheckboxItem>
              );
            })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
