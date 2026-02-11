import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { TableCell, TableRow as ShadcnTableRow } from "../TableFrame";
import { formatCellValue, resolveFieldValue } from "../../utils";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableRefetch,
  FieldSchema,
  RowMutationPermissions,
} from "../../types";
import type { StatsRelationMeta } from "./RelationStatsHover";
import { RelationStatsHover } from "./RelationStatsHover";
import { RowActions } from "./RowActions";

type DataRowProps = {
  row: Record<string, unknown>;
  rowIndex: number;
  data: Record<string, unknown>[];
  visibleColumns: BaseModelTableColumnDef[];
  enableSelection?: boolean;
  rowSelection: Record<string, boolean>;
  handleRowSelect: (rowId: string, checked: boolean) => void;
  refetch?: BaseModelTableRefetch;
  columnActions?: BaseModelTableColumnActionsInput;
  density: "compact" | "comfortable" | "spacious";
  cellPadding: string;
  cellTextSize: string;
  cellTextClass: string;
  fieldLookup: Map<string, FieldSchema>;
  resolveValue: (row: Record<string, unknown>, accessor: string) => unknown;
  formatFallbackValue: (value: unknown) => string;
  resolveStatsRelation: (
    accessor: string,
    fieldMeta?: FieldSchema,
  ) => StatsRelationMeta | null;
  resolveStatsOverride: (accessor: string, relationName: string) => unknown;
  primaryKey: string;
  modelName: string;
  whereType: string;
  queryManager?: string;
};

export function DataRow({
  row,
  rowIndex,
  data,
  visibleColumns,
  enableSelection,
  rowSelection,
  handleRowSelect,
  refetch,
  columnActions,
  density,
  cellPadding,
  cellTextSize,
  cellTextClass,
  fieldLookup,
  resolveValue,
  formatFallbackValue,
  resolveStatsRelation,
  resolveStatsOverride,
  primaryKey,
  modelName,
  whereType,
  queryManager,
}: DataRowProps) {
  const rowId = String(row.id);
  const isSelected = enableSelection && rowSelection[rowId];
  const rowPermissions = row.rowPermissions as RowMutationPermissions | undefined;
  const isEven = rowIndex % 2 === 0;

  return (
    <ShadcnTableRow
      key={rowId}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "group/row relative border-b border-border/20 transition-all duration-300 ease-out",
        isSelected && "bg-primary/10 hover:bg-primary/[0.15] z-[5] shadow-[0_0_20px_rgba(var(--primary),0.05)]",
        !isSelected && "hover:bg-muted/40 hover:translate-x-0.5",
        !isSelected && isEven && "bg-background",
        !isSelected && !isEven && "bg-muted/10",
        density === "compact" ? "h-9" : density === "spacious" ? "h-14" : "h-11",
      )}
    >
      {enableSelection ? (
        <TableCell
          className={cn(
            cellPadding,
            "w-[46px] text-center table-first-column border-r border-border/10",
            "transition-all duration-300",
            isSelected && "bg-primary/5",
          )}
        >
          <div className="flex h-full items-center justify-center">
            <Checkbox
              checked={!!rowSelection[rowId]}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                handleRowSelect(rowId, checked === true)
              }
              aria-label="Selectionner la ligne"
              className={cn(
                "h-4.5 w-4.5 rounded-md border-muted-foreground/30 data-[state=checked]:border-primary",
                "transition-all duration-300 hover:scale-110 active:scale-95",
                "data-[state=checked]:shadow-md data-[state=checked]:shadow-primary/20",
              )}
            />
          </div>
        </TableCell>
      ) : null}

      {visibleColumns.map((field, colIndex) => {
        const isFirstDataCell = !enableSelection && colIndex === 0;
        
        if ("accessor" in field) {
          const value = resolveValue(row, field.accessor);
          const isSimpleAccessor = !field.accessor.includes(".");
          const metaField = isSimpleAccessor
            ? fieldLookup.get(field.accessor)
            : undefined;
          const statsRelation = resolveStatsRelation(field.accessor, metaField);
          const statsOverride = statsRelation
            ? resolveStatsOverride(field.accessor, statsRelation.relationName)
            : undefined;

          const renderedValue = field.render
            ? field.render(value, row, {
                accessor: field.accessor,
                columnId: field.id,
                data,
                refetch,
              })
            : metaField
              ? formatCellValue(value, metaField)
              : formatFallbackValue(value);

          return (
            <TableCell
              key={field.id}
              className={cn(
                cellPadding,
                cellTextSize,
                "text-foreground/70 border-r border-border/10 last:border-0",
                "group-hover/row:text-foreground transition-all duration-300",
                isFirstDataCell && "font-semibold text-foreground/90",
                isSelected && "text-foreground",
              )}
            >
              <div className={cn(cellTextClass, "flex items-center h-full gap-2")}>
                {statsRelation ? (
                  <RelationStatsHover
                    row={row}
                    primaryKey={primaryKey}
                    model={modelName}
                    whereType={whereType}
                    relation={statsRelation}
                    queryManager={queryManager}
                    overrideRenderer={statsOverride}
                  >
                    <span className="cursor-pointer hover:text-primary transition-colors underline-offset-4 decoration-primary/30 hover:underline">
                      {renderedValue}
                    </span>
                  </RelationStatsHover>
                ) : (
                  renderedValue
                )}
              </div>
            </TableCell>
          );
        }

        const statsRelation = resolveStatsRelation(field.name || field.fieldName, field);
        const statsOverride = statsRelation
          ? resolveStatsOverride(field.name || field.fieldName, statsRelation.relationName)
          : undefined;
        const renderedValue = formatCellValue(resolveFieldValue(row, field), field);

        return (
          <TableCell
            key={field.name}
            className={cn(
              cellPadding,
              cellTextSize,
              "text-foreground/70 border-r border-border/10 last:border-0",
              "group-hover/row:text-foreground transition-all duration-300",
              isFirstDataCell && "font-semibold text-foreground/90",
              isSelected && "text-foreground",
            )}
          >
            <div className={cn(cellTextClass, "flex items-center h-full gap-2")}>
              {statsRelation ? (
                <RelationStatsHover
                  row={row}
                  primaryKey={primaryKey}
                  model={modelName}
                  whereType={whereType}
                  relation={statsRelation}
                  queryManager={queryManager}
                  overrideRenderer={statsOverride}
                >
                  <span className="cursor-pointer hover:text-primary transition-colors underline-offset-4 decoration-primary/30 hover:underline">
                    {renderedValue}
                  </span>
                </RelationStatsHover>
              ) : (
                renderedValue
              )}
            </div>
          </TableCell>
        );
      })}

      <TableCell
        className={cn(
          cellPadding,
          "w-[70px] shrink-0 px-3 text-right",
          "sticky right-0 z-10",
          "table-last-column table-sticky-cell",
          "bg-background/90 backdrop-blur-md border-l border-border/20",
          "shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.05)]",
          "group-hover/row:bg-muted/60 transition-colors",
        )}
      >
        <RowActions
          row={row}
          data={data}
          refetch={refetch}
          permissions={rowPermissions}
          columnActions={columnActions}
        />
      </TableCell>
    </ShadcnTableRow>
  );
}
