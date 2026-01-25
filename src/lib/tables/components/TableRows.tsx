import React from "react";
import type { ColumnDef, Row as RTRow } from "@tanstack/react-table";
import { flexRender, type Table as RTTable } from "@tanstack/react-table";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { TableBody, TableCell, TableRow } from "@/lib/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type {
  ExpandableConfig,
  GroupingConfig,
  RowActionsConfig,
  SelectionConfig,
} from "./baseTableTypes";

/**
 * Props for {@link TableRows}.
 * @template TData Table row data type.
 * @property table - TanStack table instance.
 * @property rows - Flat row model to render when no grouping is provided.
 * @property grouping - Optional grouping configuration with grouped rows.
 * @property row_actions - Row action configuration.
 * @property selection - Selection configuration.
 * @property expandable - Expandable row configuration.
 * @property column_overrides - Optional per-column overrides.
 * @property cellPadding - Padding class applied to cells.
 * @property onRowClick - Callback fired when a row is clicked.
 * @property renderActionsCell - Renderer for the actions cell.
 * @property loading - Whether the table body is loading.
 * @property emptyMessage - Message displayed when there is no data.
 */
export type TableRowsProps<TData> = {
  table: RTTable<TData>;
  rows: RTRow<TData>[];
  grouping?: GroupingConfig<TData>;
  row_actions?: RowActionsConfig<TData>;
  selection?: SelectionConfig<TData>;
  expandable?: ExpandableConfig<TData>;
  column_overrides?: Record<string, Partial<ColumnDef<TData>>>;
  cellPadding: string;
  onRowClick?: (row: TData) => void;
  renderActionsCell?: (row: TData) => React.ReactNode;
  loading?: boolean;
  emptyMessage: string;
};

/**
 * Renders the table body, handling grouping, selection, expanders, and empty/loading states.
 */
export function TableRows<TData>({
  table,
  rows,
  grouping,
  row_actions,
  selection,
  expandable,
  column_overrides,
  cellPadding,
  onRowClick,
  renderActionsCell,
  loading = false,
  emptyMessage,
}: TableRowsProps<TData>) {
  const selection_enabled = selection?.enabled ?? false;
  const selection_position = selection?.position ?? "start";
  const expandable_enabled = Boolean(expandable?.render);
  const expandable_position = expandable?.position ?? "start";

  const baseColSpan =
    table.getVisibleLeafColumns().length +
    (selection_enabled ? 1 : 0) +
    (row_actions ? 1 : 0) +
    (expandable_enabled ? 1 : 0);

  const renderRow = (row: RTRow<TData>, idx: number) => {
    const isSelected = row.getIsSelected();
    const rowStripe = idx % 2 === 0 ? "even" : "odd";
    return (
      <React.Fragment key={row.id}>
        <TableRow
          data-state={isSelected ? "selected" : undefined}
          data-row-stripe={rowStripe}
          className={cn(
            "border-b border-muted/40 transition-colors group",
            isSelected && "ring-1 ring-primary/40",
            onRowClick && "cursor-pointer"
          )}
          onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          style={
            {
              backgroundColor: "var(--row-bg)",
            } as React.CSSProperties
          }
        >
          {selection_enabled && selection_position === "start" && (
            <TableCell
              className={cn(
                cellPadding,
                "text-left transition-colors px-2 table-first-column"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                aria-label="Select row"
              />
            </TableCell>
          )}
          {expandable_enabled && expandable_position === "start" && (
            <TableCell
              className={cn(cellPadding, "w-px shrink-0")}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => row.toggleExpanded()}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          )}
          {row_actions && (row_actions.position ?? "end") === "start" && (
            <TableCell
              className={cn(
                cellPadding,
                "text-right transition-colors px-2 table-first-column",
                "w-px shrink-0"
              )}
            >
              {renderActionsCell?.(row.original)}
            </TableCell>
          )}

          {row.getVisibleCells().map((cell) => {
            const override = column_overrides?.[cell.column.id];
            const columnDef = override
              ? { ...cell.column.columnDef, ...override }
              : cell.column.columnDef;
            return (
              <TableCell key={cell.id} className={cellPadding}>
                {flexRender(columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}

          {row_actions && (row_actions.position ?? "end") === "end" && (
            <TableCell
              className={cn(
                cellPadding,
                "text-right sticky right-0 z-10 transition-colors px-2 table-last-column table-sticky-cell",
                "w-px shrink-0"
              )}
            >
              {renderActionsCell?.(row.original)}
            </TableCell>
          )}

          {expandable_enabled && expandable_position === "end" && (
            <TableCell
              className={cn(cellPadding, "w-px shrink-0")}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => row.toggleExpanded()}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          )}

          {selection_enabled && selection_position === "end" && (
            <TableCell
              className={cn(
                cellPadding,
                "text-left transition-colors px-2 table-last-column"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                aria-label="Select row"
              />
            </TableCell>
          )}
        </TableRow>

        {expandable_enabled && row.getIsExpanded() && (
          <TableRow
            key={`${row.id}-expanded`}
            data-state={isSelected ? "selected" : undefined}
            data-row-stripe={rowStripe}
            className={cn(
              "border-b border-muted/40",
              isSelected && "ring-1 ring-primary/40"
            )}
            style={
              {
                backgroundColor: "var(--row-bg)",
              } as React.CSSProperties
            }
          >
            <TableCell colSpan={baseColSpan}>
              {expandable?.render(row.original)}
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  const renderGroupedRows = () => {
    const groupedSections = grouping?.groups ?? [];
    const collapsible = grouping?.collapsible ?? true;
    let renderedIndex = 0;
    return groupedSections.map((group) => {
      const collapsed = collapsible ? group.collapsed ?? false : false;
      return (
        <React.Fragment key={`group-${group.key}`}>
          <TableRow className="bg-muted/40">
            <TableCell colSpan={baseColSpan} className="px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {collapsible ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7"
                      onClick={() => grouping?.onToggle?.(group.key)}
                    >
                      {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                  <div className="flex items-center gap-2 font-medium">
                    {group.label}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.rows.length} element(s)
                </span>
              </div>
            </TableCell>
          </TableRow>
          {!collapsed
            ? group.rows.map((row) => renderRow(row, renderedIndex++))
            : null}
        </React.Fragment>
      );
    });
  };

  const hasData = rows.length > 0;
  const hasGrouping = Boolean(grouping?.groups?.length);

  return (
    <TableBody className="h-full ">
      {loading ? (
        <TableRow>
          <TableCell colSpan={baseColSpan}>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          </TableCell>
        </TableRow>
      ) : null}

      {!loading && !hasData ? (
        <TableRow>
          <TableCell colSpan={baseColSpan}>
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          </TableCell>
        </TableRow>
      ) : null}

      {!loading && hasData
        ? hasGrouping
          ? renderGroupedRows()
          : rows.map((row, idx) => renderRow(row, idx))
        : null}
    </TableBody>
  );
}
