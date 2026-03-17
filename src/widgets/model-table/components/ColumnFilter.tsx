import React, { useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/kit/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { Separator } from "@/shared/ui/kit/separator";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { useTable } from "../context/TableContext";
import { FieldSchema } from "../types";
import { ScalarFilterInput } from "@/widgets/model-table/filtering/components/ScalarFilterInput";
import { cn } from "@/shared/utils";
import {
  findModelTableFilterCondition,
  resolveModelTableFilterField,
} from "./filterFieldResolver";

interface ColumnFilterProps {
  columnId: string;
  field?: FieldSchema;
  hideTrigger?: boolean;
}

export function ColumnFilter({
  columnId,
  field,
  hideTrigger = false,
}: ColumnFilterProps) {
  const { metadata } = useMetadata();
  const { activeColumnFilter, setActiveColumnFilter } = useTable();
  const { addFilterCondition, advancedFilters, removeFilterCondition } =
    useTableFilters();
  const [open, setOpen] = useState(false);
  const openedAtRef = useRef(0);
  const openedFromMenuRef = useRef(false);
  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) => f.name === columnId || f.fieldName === columnId,
    );
  }, [field, metadata, columnId]);

  const resolvedFilterField = useMemo(
    () =>
      resolveModelTableFilterField(
        metadata,
        resolvedField?.fieldName || resolvedField?.name || columnId,
      ),
    [columnId, metadata, resolvedField?.fieldName, resolvedField?.name],
  );
  const filterMeta = resolvedFilterField?.filterMeta ?? null;
  const filterFieldName =
    resolvedFilterField?.filterMeta.name ||
    resolvedField?.name ||
    resolvedField?.fieldName ||
    columnId;
  const filterFieldPath = resolvedFilterField?.fieldPath ?? [filterFieldName];
  const filterableField = resolvedFilterField?.filterableField ?? null;

  // 3. Current Filter State
  const activeCondition = useMemo(
    () => findModelTableFilterCondition(advancedFilters.root, filterFieldPath),
    [advancedFilters.root, filterFieldPath],
  );

  const [operator, setOperator] = useState<string>(
    activeCondition?.operator || filterableField?.defaultOperator || "exact",
  );
  const [value, setValue] = useState<any>(activeCondition?.value);

  // Sync state when opening
  React.useEffect(() => {
    if (open && activeCondition) {
      setOperator(activeCondition.operator);
      setValue(activeCondition.value);
    } else if (open && !activeCondition && filterableField) {
      setOperator(filterableField.defaultOperator);
      setValue(undefined);
    }
  }, [open, activeCondition, filterableField]);

  React.useEffect(() => {
    if (activeColumnFilter === columnId) {
      setActiveColumnFilter(null);
      window.setTimeout(() => {
        openedAtRef.current = Date.now();
        openedFromMenuRef.current = true;
        setOpen(true);
      }, 0);
    }
  }, [activeColumnFilter, columnId, setActiveColumnFilter]);

  if (!resolvedField || !filterMeta || !filterableField) return null;

  const currentOperator =
    filterableField.operators.find((op) => op.name === operator) ||
    filterableField.operators[0];

  const handleApply = () => {
    addFilterCondition({
      field: filterFieldName,
      fieldPath: filterFieldPath,
      fieldName: filterFieldPath[filterFieldPath.length - 1] || filterFieldName,
      operator,
      value,
    });
    openedFromMenuRef.current = false;
    setOpen(false);
  };

  const handleClear = () => {
    if (activeCondition) {
      // We need the ID to remove it cleanly, or we remove by field name?
      // useTableFilters might not expose remove by field.
      // Let's assume we can remove by ID if we have it.
      removeFilterCondition(activeCondition.id);
    }
    setValue(undefined);
    openedFromMenuRef.current = false;
    setOpen(false);
  };

  const isActive = !!activeCondition;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && openedFromMenuRef.current) {
          return;
        }
        if (!nextOpen && Date.now() - openedAtRef.current < 150) {
          return;
        }
        setOpen(nextOpen);
        if (!nextOpen) setActiveColumnFilter(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            openedFromMenuRef.current = false;
          }}
          className={cn(
            hideTrigger
              ? "sr-only h-0 w-0 p-0 m-0 border-0"
              : "h-8 w-8 p-0 ml-1 data-[state=open]:bg-accent",
            !hideTrigger &&
              (isActive
                ? "text-primary hover:text-primary"
                : "text-muted-foreground/50 hover:text-foreground"),
          )}
          tabIndex={hideTrigger ? -1 : 0}
          aria-hidden={hideTrigger}
          aria-label={`Filter ${resolvedField.verboseName}`}
        >
          <Filter className={cn("h-3.5 w-3.5", isActive && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border-border/30 p-3 shadow-xl backdrop-blur-xl bg-background/95"
        align="start"
        side="bottom"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-foreground">
              Filtrer: {resolvedField.verboseName}
            </h4>
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 "
                onClick={handleClear}
              >
                Effacer
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
              Opérateur
            </label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="h-8 text-xs border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterableField.operators.map((op) => (
                  <SelectItem key={op.name} value={op.name} className="text-xs">
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
              Valeur
            </label>
            <div className="min-h-[32px]">
              <ScalarFilterInput
                field={filterableField}
                operator={currentOperator}
                value={value}
                onChange={setValue}
                autoFocus
              />
            </div>
          </div>

          <Separator className="bg-border/20" />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                openedFromMenuRef.current = false;
                setOpen(false);
              }}
              className="h-7 text-xs "
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleApply} className="h-7 text-xs ">
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
