import React, { useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Separator } from "@/lib/components/ui/separator";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { useTable } from "../context/TableContext";
import { FieldSchema } from "../types";
import { ScalarFilterInput } from "../../filters/components/ScalarFilterInput";
import type { FilterableField, FilterOperator, FilterBaseType } from "../../filters/types";
import { cn } from "@/lib/utils";
import { translateLookupLabelFr } from "./filtering/operatorLabels";

interface ColumnFilterProps {
  columnId: string;
  field?: FieldSchema;
  hideTrigger?: boolean;
}

export function ColumnFilter({ columnId, field, hideTrigger = false }: ColumnFilterProps) {
  const { metadata } = useMetadata();
  const metadataFilters = metadata?.filters ?? [];
  const { activeColumnFilter, setActiveColumnFilter } = useTable();
  const { addFilterCondition, advancedFilters, removeFilterCondition } = useTableFilters();
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

  // 1. Resolve Filter Schema from Metadata
  const filterMeta = useMemo(() => {
    if (!metadata) return null;
    return metadataFilters.find(
      (f) =>
        f.fieldName === resolvedField?.fieldName ||
        f.name === resolvedField?.name ||
        f.fieldName === columnId ||
        f.name === columnId,
    );
  }, [metadata, metadataFilters, resolvedField, columnId]);

  const filterFieldName = useMemo(
    () =>
      filterMeta?.name ||
      resolvedField?.name ||
      resolvedField?.fieldName ||
      columnId,
    [filterMeta?.name, resolvedField?.name, resolvedField?.fieldName, columnId],
  );

  // 2. Map to FilterableField for ScalarFilterInput
  const filterableField = useMemo<FilterableField | null>(() => {
    if (!resolvedField || !filterMeta) return null;

    // Map base type
    let baseType: FilterBaseType = "String";
    if (resolvedField.isNumeric) baseType = "Number";
    else if (resolvedField.isDate) baseType = "Date";
    else if (resolvedField.isDatetime) baseType = "DateTime";
    else if (resolvedField.isBoolean) baseType = "Boolean";
    else if (resolvedField.isJson) baseType = "JSON";
    else if (resolvedField.isRelation) baseType = "Relationship";

    // Map operators
    const operators: FilterOperator[] = filterMeta.options.map((opt) => ({
      name: opt.lookup || opt.name,
      label: translateLookupLabelFr(opt.lookup || opt.name, opt.label),
      helpText: opt.helpText,
      graphqlType: opt.graphqlType || "String",
      isList: opt.isList || false,
      choices: opt.choices,
    }));

    return {
      name: resolvedField.name,
      fieldName: resolvedField.fieldName,
      fieldLabel: resolvedField.verboseName,
      helpText: resolvedField.helpText,
      baseType,
      graphqlType: resolvedField.graphqlType,
      filterInputType: filterMeta.filterInputType || "String",
      operators,
      defaultOperator: operators[0]?.name || "exact",
      choices: resolvedField.choices, // Pass field choices
      isRelation: resolvedField.isRelation,
      relationConfig: resolvedField.isRelation ? {
          relatedApp: "", // Need to fetch from relation schema if needed, usually scalar input handles choice based
          relatedModel: "", 
          lookupField: "id", 
          searchFields: ["name"]
      } : undefined,
      uiHints: {
        widget: "text", // Default, ScalarFilterInput auto-detects better
      }
    };
  }, [resolvedField, filterMeta]);

  // 3. Current Filter State
  const activeCondition = useMemo(() => {
    // Traverse root group to find condition for this field
    // Simplified: Find first condition matching fieldName
    const findCondition = (group: any): any => {
      for (const cond of group.conditions) {
        if (cond.type === "condition" && cond.fieldName === filterFieldName) {
          return cond;
        }
        if (cond.type === "group") {
          const found = findCondition(cond);
          if (found) return found;
        }
      }
      return null;
    };
    return findCondition(advancedFilters.root);
  }, [advancedFilters.root, filterFieldName]);

  const [operator, setOperator] = useState<string>(activeCondition?.operator || filterableField?.defaultOperator || "exact");
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

  const currentOperator = filterableField.operators.find(op => op.name === operator) || filterableField.operators[0];

  const handleApply = () => {
    addFilterCondition({
      field: filterFieldName,
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
        >
          <Filter className={cn("h-3.5 w-3.5", isActive && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start" side="bottom">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-foreground">
              Filtrer: {resolvedField.verboseName}
            </h4>
            {isActive && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={handleClear}>
                    Effacer
                </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Opérateur</label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="h-8 text-xs">
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
             <label className="text-xs text-muted-foreground font-medium">Valeur</label>
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

          <Separator />
          
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                openedFromMenuRef.current = false;
                setOpen(false);
              }}
              className="h-7 text-xs"
            >
                Annuler
            </Button>
            <Button size="sm" onClick={handleApply} className="h-7 text-xs">
                Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
