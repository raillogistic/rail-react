import * as React from "react";
import { Input } from "@/lib/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useApolloClient } from "@apollo/client";
import { FilterFieldType, FilterOptionType } from "../../compat/types";
import { FilterCondition, FilterValue } from "./types";
import { registerRelatedValueLabel } from "./relatedValueLabelCache";
import {
  buildGraphQLRecipe,
  ChoiceOption,
  defaultMapRecord,
  resolveRecords,
} from "@/lib/form/inputs/query";

type Props = {
  condition: FilterCondition;
  field?: FilterFieldType;
  option?: FilterOptionType;
  onChange: (value: FilterValue) => void;
  placeholder?: string;
};

const asRangeValue = (value: FilterValue | undefined) =>
  (value as { start?: string; end?: string }) || { start: "", end: "" };

export const FilterValueInput: React.FC<Props> = ({
  condition,
  field,
  option,
  onChange,
  placeholder,
}) => {
  if (!option) {
    return <Input disabled placeholder="SÃ©lectionnez un champ" />;
  }
  const effectivePlaceholder =
    placeholder && placeholder.trim().length ? placeholder : undefined;
  const optionChoices = option.choices ?? [];
  const fieldChoices = field?.choices ?? [];
  const effectiveChoices =
    optionChoices.length > 0 ? optionChoices : fieldChoices;

  if (
    field?.related_model &&
    ["exact", "in"].includes(option.lookup_expr) &&
    field.field_name
  ) {
    return (
      <RelatedModelFilterInput
        fieldName={field.field_name}
        relatedModel={field.related_model}
        lookup={option.lookup_expr}
        value={condition.value}
        onChange={onChange}
        placeholder={effectivePlaceholder}
      />
    );
  }

  if (
    option.lookup_expr === "range" ||
    option.filter_type === "DateRangeFilter"
  ) {
    const rangeValue = asRangeValue(condition.value);
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder={effectivePlaceholder ?? "DÃ©but"}
          value={rangeValue.start ?? ""}
          onChange={(event) =>
            onChange({ start: event.target.value, end: rangeValue.end })
          }
          type={
            option.filter_type === "NumberFilter"
              ? "number"
              : option.filter_type === "DateRangeFilter"
              ? "date"
              : "text"
          }
        />
        <Input
          placeholder={effectivePlaceholder ?? "Fin"}
          value={rangeValue.end ?? ""}
          onChange={(event) =>
            onChange({ start: rangeValue.start, end: event.target.value })
          }
          type={
            option.filter_type === "NumberFilter"
              ? "number"
              : option.filter_type === "DateRangeFilter"
              ? "date"
              : "text"
          }
        />
      </div>
    );
  }

  if (option.filter_type === "BooleanFilter") {
    const current =
      typeof condition.value === "boolean" ? String(condition.value) : "";
    return (
      <Select
        value={current}
        onValueChange={(value) => onChange(value === "true")}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={effectivePlaceholder ?? "SÃ©lectionnez une valeur"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Vrai</SelectItem>
          <SelectItem value="false">Faux</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (option.filter_type === "MultipleChoiceFilter") {
    const availableChoices =
      optionChoices.length > 0 ? optionChoices : fieldChoices;
    if (!availableChoices.length) {
      return (
        <Input
          placeholder={
            effectivePlaceholder ?? "Valeurs sÃ©parÃ©es par des virgules"
          }
          value={
            Array.isArray(condition.value) ? condition.value.join(", ") : ""
          }
          onChange={(event) =>
            onChange(
              event.target.value
                .split(",")
                .map((value) => value.trim())
                .filter((value) => value.length > 0)
            )
          }
        />
      );
    }
    const selected = Array.isArray(condition.value)
      ? (condition.value as Array<string | number>)
      : [];

    const toggleValue = (value: string | number, checked: boolean) => {
      const next = checked
        ? [...selected, value]
        : selected.filter((item) => item !== value);
      onChange(next);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">
              {selected.length > 0
                ? `${selected.length} sÃ©lectionnÃ©e${
                    selected.length > 1 ? "s" : ""
                  }`
                : "SÃ©lectionner des valeurs"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2">
          {availableChoices.map((choice) => (
            <DropdownMenuItem key={choice.value} asChild>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(choice.value)}
                  onCheckedChange={(checked) =>
                    toggleValue(choice.value, !!checked)
                  }
                />
                <span>{choice.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (effectiveChoices.length > 0) {
    const scalar = (condition.value as string | number | undefined) ?? "";
    return (
      <Select value={String(scalar)} onValueChange={(value) => onChange(value)}>
        <SelectTrigger>
          <SelectValue
            placeholder={effectivePlaceholder ?? "SÃ©lectionnez une valeur"}
          />
        </SelectTrigger>
        <SelectContent>
          {effectiveChoices.map((choice) => (
            <SelectItem key={choice.value} value={String(choice.value)}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const inputType =
    option.filter_type === "NumberFilter"
      ? "number"
      : option.filter_type === "DateFilter" ||
        option.filter_type === "DateTimeFilter"
      ? "date"
      : "text";
  return (
    <Input
      type={inputType}
      placeholder={effectivePlaceholder ?? "Valeur"}
      value={
        typeof condition.value === "string" ||
        typeof condition.value === "number"
          ? condition.value
          : ""
      }
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

type RelatedModelFilterInputProps = {
  relatedModel: string;
  lookup: FilterOptionType["lookup_expr"];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  placeholder?: string;
  fieldName: string;
};

const RelatedModelFilterInput: React.FC<RelatedModelFilterInputProps> = ({
  relatedModel,
  lookup,
  value,
  onChange,
  placeholder,
  fieldName,
}) => {
  const isMulti = lookup === "in";
  const client = useApolloClient();
  const recipe = React.useMemo(
    () => buildGraphQLRecipe({ relatedModel }),
    [relatedModel]
  );
  const [options, setOptions] = React.useState<ChoiceOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const debouncedSearch = React.useMemo(() => search.trim(), [search]);

  const fetchOptions = React.useCallback(async () => {
    if (!recipe.document) return;
    setLoading(true);
    try {
      const variables: Record<string, any> = {};
      if (debouncedSearch && recipe.searchVariableName) {
        variables[recipe.searchVariableName] = debouncedSearch;
      }
      if (recipe.limitVariableName) {
        variables[recipe.limitVariableName] = 50;
      }
      const response = await client.query({
        query: recipe.document,
        variables,
        fetchPolicy: "network-only",
      });
      const records = resolveRecords(response.data, recipe.resultPath);
      const mapped = records
        .map((record) =>
          defaultMapRecord(
            record,
            recipe.valueKey,
            recipe.labelKey,
            recipe.descriptionKey
          )
        )
        .filter((option): option is ChoiceOption => Boolean(option));
      mapped.forEach((optionItem) => {
        registerRelatedValueLabel({
          fieldName,
          value: optionItem.value,
          label: optionItem.label,
        });
      });
      setOptions(mapped);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error(
          "[RelatedModelFilterInput] failed to load options",
          error
        );
      }
    } finally {
      setLoading(false);
    }
  }, [client, debouncedSearch, recipe]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchOptions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOptions, debouncedSearch]);

  const selectedValues = React.useMemo<Array<string | number>>(
    () =>
      isMulti
        ? (Array.isArray(value) ? value : []).filter(
            (item): item is string | number =>
              typeof item === "string" || typeof item === "number"
          )
        : typeof value === "string" || typeof value === "number"
        ? [value]
        : [],
    [value, isMulti]
  );

  const labelMap = React.useMemo(
    () =>
      new Map(
        options.map((opt) => [
          String(opt.value),
          opt.label ?? String(opt.value),
        ])
      ),
    [options]
  );

  const displayLabel = React.useMemo(() => {
    if (selectedValues.length === 0) {
      return (
        placeholder ??
        (isMulti ? "SÃ©lectionnez des valeurs" : "Choisir une valeur")
      );
    }
    const labels = selectedValues
      .map((val) => labelMap.get(String(val)) ?? String(val))
      .join(", ");
    return labels;
  }, [labelMap, selectedValues, placeholder, isMulti]);

  const toggleValue = React.useCallback(
    (valueToToggle: string | number) => {
      if (isMulti) {
        const next = selectedValues.includes(valueToToggle)
          ? selectedValues.filter((item) => item !== valueToToggle)
          : [...selectedValues, valueToToggle];
        onChange(next);
      } else {
        onChange(valueToToggle);
        setMenuOpen(false);
      }
    },
    [isMulti, onChange, selectedValues]
  );

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">{displayLabel}</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Rechercher..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
          />
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Chargement...</div>
        ) : options.length === 0 ? (
          <div className="text-xs text-muted-foreground">Aucune option</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-auto">
            {options.map((optionItem) => {
              const isSelected = selectedValues.includes(optionItem.value);
              return (
                <DropdownMenuItem
                  key={optionItem.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleValue(optionItem.value);
                  }}
                >
                  {isMulti && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleValue(optionItem.value)}
                      className="pointer-events-none"
                    />
                  )}
                  <div className="flex flex-col flex-1">
                    <span className="text-sm">{optionItem.label}</span>
                    {optionItem.description && (
                      <span className="text-xs text-muted-foreground">
                        {optionItem.description}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

