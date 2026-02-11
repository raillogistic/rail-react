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
        "group/row relative border-b border-border/50 transition-colors duration-75",
        isSelected && "bg-primary/5 hover:bg-primary/10",
        !isSelected && "hover:bg-muted/30",
        !isSelected && isEven && "bg-white dark:bg-card",
        !isSelected && !isEven && "bg-slate-50/50 dark:bg-muted/10",
        density === "compact" ? "h-8" : density === "spacious" ? "h-12" : "h-10",
      )}
    >
      {enableSelection ? (
        <TableCell
          className={cn(
            cellPadding,
            "w-[40px] text-center table-first-column border-r border-border/30",
            isSelected && "text-primary",
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
                "h-4 w-4 rounded-sm border-muted-foreground/40 data-[state=checked]:border-primary",
                "transition-all duration-200",
              )}
            />
          </div>
        </TableCell>
      ) : null}

      {visibleColumns.map((field) => {
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
                "text-foreground/80 border-r border-border/30 last:border-0",
                "group-hover/row:text-foreground transition-colors",
              )}
            >
              <div className={cn(cellTextClass, "flex items-center h-full")}>
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
                    {renderedValue}
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
              "text-foreground/80 border-r border-border/30 last:border-0",
              "group-hover/row:text-foreground transition-colors",
            )}
          >
            <div className={cn(cellTextClass, "flex items-center h-full")}>
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
                  {renderedValue}
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
          "w-[60px] shrink-0 px-2 text-right",
          "sticky right-0 z-10",
          "table-last-column table-sticky-cell",
          "bg-background border-l border-border/60",
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
