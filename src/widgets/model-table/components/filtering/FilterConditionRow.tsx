import * as React from "react";
import { Button } from "@/shared/ui/kit/button";
import { Label } from "@/shared/ui/kit/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  ListFilter,
  X,
  Equal,
  Search,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  ListChecks,
  Hash,
} from "lucide-react";
import { FilterFieldType, FilterOptionType } from "../../compat/types";
import { AdvancedFilteringController, FilterCondition } from "./types";
import { FilterValueInput } from "./FilterValueInput";
import { FilterFieldSelector } from "./FilterFieldSelector";
import { translateLookupLabelFr } from "./operatorLabels";

type Props = {
  controller: AdvancedFilteringController;
  groupId: string;
  condition: FilterCondition;
};

const useConditionMeta = (
  condition: FilterCondition,
  controller: AdvancedFilteringController
): {
  field?: FilterFieldType;
  option?: FilterOptionType;
} => {
  const field = controller.getFieldMeta(condition.field_name);
  const option = controller.getOptionMeta(condition.option_name)?.option;
  return { field, option };
};

const getDefaultOptionName = (field?: FilterFieldType) => {
  if (!field?.options?.length) return undefined;
  const inOption = field.options.find((opt) => opt.lookup_expr === "in");
  if (inOption) return inOption.name;
  const icontains = field.options.find(
    (opt) => opt.lookup_expr === "icontains"
  );
  return (icontains ?? field.options[0])?.name;
};

export const FilterConditionRow: React.FC<Props> = ({
  controller,
  groupId,
  condition,
}) => {
  const { updateCondition } = controller;
  const { field, option } = useConditionMeta(condition, controller);
  const LookupIcon = lookupIconFor(option?.lookup_expr);
  const defaultOptionName = getDefaultOptionName(field);

  React.useEffect(() => {
    if (!condition.option_name && defaultOptionName) {
      updateCondition(groupId, condition.id, {
        option_name: defaultOptionName,
        value: undefined,
      });
    }
  }, [
    condition.option_name,
    defaultOptionName,
    updateCondition,
    groupId,
    condition.id,
  ]);

  const handleFieldChange = (value: string) => {
    const nextField = controller.getFieldMeta(value);
    const defaultOptionName = getDefaultOptionName(nextField);
    updateCondition(groupId, condition.id, {
      field_name: value,
      option_name: defaultOptionName,
      value: undefined,
    });
  };

  const handleOptionChange = (value: string) => {
    updateCondition(groupId, condition.id, {
      option_name: value,
      value: undefined,
    });
  };

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_40px] items-start">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">
              Champ
            </Label>
            <FilterFieldSelector
              controller={controller}
              selectedFieldName={condition.field_name}
              onSelect={handleFieldChange}
            />
          </div>

          {/* <div > */}
          {/* <Label className="text-xs uppercase text-muted-foreground text-center ">Op</Label> */}
          <div className="flex items-center gap-3 self-end justify-self-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-dashed"
                  title={
                    option
                      ? `Operateur: ${translateLookupLabelFr(option.lookup_expr)}`
                      : "Choisir un operateur"
                  }
                >
                  <LookupIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                {(field?.options ?? []).map((opt) => (
                  <DropdownMenuItem
                    key={opt.name}
                    className="flex flex-col items-start gap-0.5"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleOptionChange(opt.name);
                    }}
                    >
                    <span className="text-sm font-medium">
                      {translateLookupLabelFr(opt.lookup_expr)}
                    </span>
                    {opt.help_text ? (
                      <span className="text-xs text-muted-foreground">
                        {opt.help_text}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
                {(field?.options ?? []).length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Aucun operateur disponible
                  </div>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <div className="text-sm font-medium text-foreground line-clamp-1 hidden md:block">
                {option ? translateLookup(option.lookup_expr) : "Choisir un operateur"}
              </div> */}
            {/* </div> */}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            Valeur
          </Label>
          <FilterValueInput
            condition={condition}
            field={field}
            option={option}
            placeholder={option?.help_text}
            onChange={(value) =>
              updateCondition(groupId, condition.id, { value })
            }
          />
        </div>

        <div className="flex items-end justify-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer la condition"
            onClick={() => controller.removeCondition(groupId, condition.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
const lookupIconFor = (lookup?: FilterOptionType["lookup_expr"]) => {
  switch (lookup) {
    case "exact":
      return Equal;
    case "contains":
    case "icontains":
    case "regex":
    case "iregex":
      return Search;
    case "startswith":
    case "istartswith":
      return ArrowRight;
    case "endswith":
    case "iendswith":
      return ArrowLeft;
    case "gt":
    case "gte":
      return ArrowUp;
    case "lt":
    case "lte":
      return ArrowDown;
    case "range":
      return ArrowLeftRight;
    case "in":
      return ListChecks;
    case "count":
    case "count_gt":
    case "count_gte":
    case "count_lt":
    case "count_lte":
      return Hash;
    default:
      return ListFilter;
  }
};


