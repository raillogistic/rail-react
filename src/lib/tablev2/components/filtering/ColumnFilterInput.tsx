import * as React from "react";
import { Button } from "@/lib/components/ui/button";
import { X } from "lucide-react";
import { FilterFieldType, FilterOptionType } from "../../compat/types";
import { FilterCondition, FilterValue } from "./types";
import { FilterValueInput } from "./FilterValueInput";
import { translateLookup } from "./FilterConditionRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";

export type ColumnFilterValue = {
  optionName: string;
  value?: FilterValue;
};

type Props = {
  columnId: string;
  meta: FilterFieldType;
  value?: ColumnFilterValue;
  onChange: (value: ColumnFilterValue | undefined, immediate?: boolean) => void;
};

export const isColumnFilterValueFilled = (
  value: FilterValue | undefined
): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const range = value as { start?: string; end?: string };
    return !!(
      (range.start && range.start.trim().length > 0) ||
      (range.end && range.end.trim().length > 0)
    );
  }
  return true;
};

const LOOKUP_SYMBOLS: Partial<Record<FilterOptionType["lookup_expr"], string>> =
  {
    exact: "=",
    contains: "âˆ‹",
    icontains: "â‰ˆ",
    startswith: "âª¡",
    endswith: "âª¢",
    lt: "<",
    lte: "â‰¤",
    gt: ">",
    gte: "â‰¥",
    range: "â†”",
    in: "âˆˆ",
  };

export const ColumnFilterInput: React.FC<Props> = ({
  columnId,
  meta,
  value,
  onChange,
}) => {
  const option = React.useMemo(() => {
    const explicit = value?.optionName
      ? meta.options?.find((opt) => opt.name === value.optionName)
      : undefined;
    return explicit ?? meta.options?.[0];
  }, [meta.options, value?.optionName]);

  if (!option) return null;

  const handleOperatorChange = (optionName: string) => {
    const nextOption = meta.options?.find((opt) => opt.name === optionName);
    if (!nextOption) return;
    onChange({ optionName: nextOption.name, value: undefined }, true);
  };

  const operatorSymbol =
    LOOKUP_SYMBOLS[option.lookup_expr] ?? option.lookup_expr.toUpperCase();

  const condition: FilterCondition = {
    id: columnId,
    field_name: meta.field_name,
    option_name: option.name,
    value: value?.value,
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Choisir l'opÃ©rateur"
          >
            <span className="text-[11px] font-semibold">{operatorSymbol}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 p-1">
          {(meta.options ?? []).map((opt) => (
            <DropdownMenuItem
              key={opt.name}
              onSelect={() => handleOperatorChange(opt.name)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm">
                  {translateLookup(opt.lookup_expr)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {LOOKUP_SYMBOLS[opt.lookup_expr] ??
                    opt.lookup_expr.toUpperCase()}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1">
        <FilterValueInput
          condition={condition}
          field={meta}
          option={option}
          onChange={(nextValue) =>
            onChange({ optionName: option.name, value: nextValue })
          }
        />
        {isColumnFilterValueFilled(value?.value) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Effacer le filtre"
            onClick={() => onChange(undefined, true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

