/**
 * ScalarFilterInput - Type-specific input for filter values
 * 
 * Features:
 * - Auto-selects widget based on field type
 * - Support for all operators (single, list, range)
 * - Choice/enum fields with search
 * - Date/DateTime pickers
 * - Number inputs with min/max/step
 * - Tag input for "in" operators
 */

import React, { useState, useCallback } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, X, Plus, Search } from "lucide-react";
import { cn } from "@/shared/utils";

import { Input } from "@/shared/ui/kit/input";
import { Button } from "@/shared/ui/kit/button";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Badge } from "@/shared/ui/kit/badge";
import { Calendar } from "@/shared/ui/kit/calendar";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/kit/select";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/shared/ui/kit/popover";
import {
 Command,
 CommandEmpty,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
} from "@/shared/ui/kit/command";
import { Textarea } from "@/shared/ui/kit/textarea";
import { useForm } from "@tanstack/react-form";

import type { FilterableField, FilterOperator, FilterChoice } from "../types";
import type { QueryChoiceFieldConfig } from "@/widgets/model-form/inputs/types";
import QueryChoiceInput from "@/widgets/model-form/inputs/query";

export interface ScalarFilterInputProps {
 field: FilterableField;
 operator: FilterOperator;
 value: any;
 onChange: (value: any) => void;
 disabled?: boolean;
 autoFocus?: boolean;
 ariaLabel?: string;
}

export const ScalarFilterInput: React.FC<ScalarFilterInputProps> = ({
 field,
 operator,
 value,
 onChange,
 disabled,
 autoFocus,
 ariaLabel,
}) => {
 const { baseType, uiHints, choices } = field;
 const { name: opName, isList } = operator;
 const isBooleanLike =
 baseType === "Boolean" ||
 String(field.filterInputType ?? "")
 .toLowerCase()
 .includes("boolean");

 // Dummy form for QueryChoiceInput
 const formOptions = React.useMemo(() => ({
 defaultValues: {},
 }), []);
 const dummyForm = useForm(formOptions);

 const hasQueryRelationship =
 baseType === "Relationship" && Boolean(field.relationConfig?.relatedModel);

 // Keep hooks at top-level so switching field types does not change hook order.
 const relationshipQueryConfig = React.useMemo<QueryChoiceFieldConfig | null>(() => {
 if (!hasQueryRelationship || !field.relationConfig) {
 return null;
 }

 const { relatedApp, relatedModel, searchFields } = field.relationConfig;
 const fullModel = relatedApp ?`${relatedApp}.${relatedModel}` : relatedModel;
 const modelName = relatedModel || field.fieldName;

 const simplePluralize = (name: string) => {
 const lower = name.toLowerCase();
 if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
 return name.slice(0, -1) + "ies";
 }
 if (lower.endsWith("s")) {
 return name + "es";
 }
 return name + "s";
 };

 const listFieldName = simplePluralize(modelName);

 const candidateLabel =
 searchFields?.find((f) =>
 ["name", "title", "label", "code", "slug"].includes(f)
 ) ??
 searchFields?.[0] ??
 "name";

 return {
 name: field.fieldName,
 type: "select-query",
 relatedModel: fullModel,
 multiple: isList,
 className:
 "py-0 [&>div:first-child]:hidden [&_[data-slot=button]]:min-h-8 [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:py-0",
 placeholder: uiHints?.placeholder ?? "Rechercher...",
 graphql: {
 listFieldName: listFieldName.toLowerCase(),
 valueField: "id",
 labelField: candidateLabel,
 extraFields: searchFields ?? [],
 },
 };
 }, [
 hasQueryRelationship,
 field.fieldName,
 field.relationConfig,
 isList,
 uiHints?.placeholder,
 ]);

 const relationshipMockField = React.useMemo(
 () => ({
 state: {
 value,
 meta: {
 isDirty: false,
 touchedErrors: [],
 errors: [],
 errorMap: {},
 isBlurred: false,
 },
 },
 handleChange: (val: any) => onChange(val),
 getValue: () => value,
 setValue: (val: any) => onChange(val),
 }),
 [value, onChange],
 );

 // isNull operator - simple checkbox
 if (opName === "isNull") {
 return (
 <div className="flex items-center gap-2 h-9">
 <Checkbox
 id={`${field.fieldName}-isNull`}
 checked={value === true}
 onCheckedChange={(checked) => onChange(checked === true ? true : undefined)}
 disabled={disabled}
 aria-label={ariaLabel}
 />
 <label
 htmlFor={`${field.fieldName}-isNull`}
 className="text-sm text-muted-foreground cursor-pointer"
 >
 Le champ est vide
 </label>
 </div>
 );
 }

 // Choice/Enum fields
 if (choices && choices.length > 0) {
 if (isList) {
 return (
 <MultiSelectChoices
 choices={choices}
 value={value ?? []}
 onChange={onChange}
 disabled={disabled}
 placeholder={uiHints?.placeholder ?? "Sélectionner des valeurs..."}
 />
 );
 }
 return (
 <SingleSelectChoices
 choices={choices}
 value={value}
 onChange={onChange}
 disabled={disabled}
 placeholder={uiHints?.placeholder ?? "Sélectionner..."}
 />
 );
 }

 // Relationship fields - use QueryChoiceInput
 if (hasQueryRelationship && relationshipQueryConfig) {
 if (process.env.NODE_ENV !== "production" && !relationshipQueryConfig.relatedModel) {
 console.warn(
`[ScalarFilterInput] relatedModel is missing for field ${field.fieldName}`,
 field.relationConfig
 );
 }

 return (
 <div className="w-full">
 <QueryChoiceInput
 config={relationshipQueryConfig}
 field={relationshipMockField as any}
 form={dummyForm as any}
 disabled={disabled}
 />
 </div>
 );
 }

 // Boolean fields
 if (isBooleanLike) {
 return (
 <Select
 value={value === undefined ? "__any__" : String(value)}
 onValueChange={(v) => {
 if (v === "__any__") onChange(undefined);
 else onChange(v === "true");
 }}
 disabled={disabled}
 >
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Tout" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="__any__">Toute valeur</SelectItem>
 <SelectItem value="true">Oui</SelectItem>
 <SelectItem value="false">Non</SelectItem>
 </SelectContent>
 </Select>
 );
 }

 // Date/DateTime fields
 if (baseType === "Date" || baseType === "DateTime") {
 // Range operators
 if (opName === "between") {
 return (
 <DateRangeInput
 value={value}
 onChange={onChange}
 disabled={disabled}
 includeTime={baseType === "DateTime"}
 />
 );
 }
 // Numeric date parts (year, month, day)
 if (["year", "month", "day", "weekDay", "hour"].includes(opName)) {
 const opLabels: Record<string, string> = {
 year: "l'année",
 month: "le mois",
 day: "le jour",
 weekDay: "le jour de la semaine",
 hour: "l'heure",
 };
 return (
 <Input
 type="number"
 value={value ?? ""}
 onChange={(e) => {
 const val = e.target.value;
 onChange(val === "" ? undefined : parseInt(val, 10));
 }}
 placeholder={`Entrer ${opLabels[opName] || opName}...`}
 disabled={disabled}
 autoFocus={autoFocus}
 aria-label={ariaLabel}
 min={opName === "month" ? 1 : opName === "day" ? 1 : undefined}
 max={opName === "month" ? 12 : opName === "day" ? 31 : undefined}
 />
 );
 }
 // Single date
 return (
 <DatePickerInput
 value={value}
 onChange={onChange}
 disabled={disabled}
 includeTime={baseType === "DateTime"}
 />
 );
 }

 // Number fields
 if (baseType === "Number") {
 // Range operators
 if (opName === "between") {
 return (
 <NumberRangeInput
 value={value}
 onChange={onChange}
 disabled={disabled}
 min={uiHints?.minValue}
 max={uiHints?.maxValue}
 step={uiHints?.step}
 />
 );
 }
 // List operators (in, notIn)
 if (isList) {
 return (
 <NumberTagInput
 value={value ?? []}
 onChange={onChange}
 disabled={disabled}
 min={uiHints?.minValue}
 max={uiHints?.maxValue}
 />
 );
 }
 // Single number
 return (
 <Input
 type="number"
 value={value ?? ""}
 onChange={(e) => {
 const val = e.target.value;
 onChange(val === "" ? undefined : parseFloat(val));
 }}
 placeholder={uiHints?.placeholder ?? "Entrer un nombre..."}
 disabled={disabled}
 autoFocus={autoFocus}
 aria-label={ariaLabel}
 min={uiHints?.minValue}
 max={uiHints?.maxValue}
 step={uiHints?.step}
 />
 );
 }

 // JSON fields
 if (baseType === "JSON") {
 if (opName === "hasKey" || opName === "hasKeys" || opName === "hasAnyKeys") {
 return (
 <StringTagInput
 value={Array.isArray(value) ? value : value ? [value] : []}
 onChange={(v) => onChange(isList ? v : v[0])}
 disabled={disabled}
 placeholder="Entrer les noms des clés..."
 singleValue={!isList && opName === "hasKey"}
 />
 );
 }
 return (
 <Textarea
 value={typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2)}
 onChange={(e) => {
 try {
 onChange(JSON.parse(e.target.value));
 } catch {
 onChange(e.target.value);
 }
 }}
 placeholder='{"clé": "valeur"}'
 disabled={disabled}
 aria-label={ariaLabel}
 rows={3}
 className="font-mono text-sm"
 />
 );
 }

 // String fields (default)
 if (isList) {
 return (
 <StringTagInput
 value={value ?? []}
 onChange={onChange}
 disabled={disabled}
 placeholder={uiHints?.placeholder ?? "Tapez et appuyez sur Entrée..."}
 />
 );
 }

 // Default: text input
 return (
 <Input
 type="text"
 value={value ?? ""}
 onChange={(e) => onChange(e.target.value || undefined)}
 placeholder={uiHints?.placeholder ?? "Entrer une valeur..."}
 disabled={disabled}
 autoFocus={autoFocus}
 aria-label={ariaLabel}
 />
 );
};

// ============================================================
// Helper Components
// ============================================================

interface SingleSelectChoicesProps {
 choices: FilterChoice[];
 value: string | undefined;
 onChange: (value: string | undefined) => void;
 disabled?: boolean;
 placeholder?: string;
}

const SingleSelectChoices: React.FC<SingleSelectChoicesProps> = ({
 choices,
 value,
 onChange,
 disabled,
 placeholder,
}) => {
 // Group choices if they have groups
 const hasGroups = choices.some((c) => c.group);
 const groupedChoices = hasGroups
 ? choices.reduce((acc, c) => {
 const group = c.group ?? "Other";
 if (!acc[group]) acc[group] = [];
 acc[group].push(c);
 return acc;
 }, {} as Record<string, FilterChoice[]>)
 : { "": choices };

 return (
 <Select
 value={value ?? "__none__"}
 onValueChange={(v) => onChange(v === "__none__" ? undefined : v)}
 disabled={disabled}
 >
 <SelectTrigger className="w-full">
 <SelectValue placeholder={placeholder} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="__none__">
 <span className="text-muted-foreground">-- Aucun --</span>
 </SelectItem>
 {Object.entries(groupedChoices).map(([group, items]) => (
 <SelectGroup key={group}>
 {group && <SelectLabel>{group}</SelectLabel>}
 {items.map((choice) => (
 <SelectItem key={choice.value} value={choice.value}>
 {choice.label}
 </SelectItem>
 ))}
 </SelectGroup>
 ))}
 </SelectContent>
 </Select>
 );
};

interface MultiSelectChoicesProps {
 choices: FilterChoice[];
 value: string[];
 onChange: (value: string[]) => void;
 disabled?: boolean;
 placeholder?: string;
}

const MultiSelectChoices: React.FC<MultiSelectChoicesProps> = ({
 choices,
 value,
 onChange,
 disabled,
 placeholder,
}) => {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState("");

 const filteredChoices = search
 ? choices.filter((c) =>
 c.label.toLowerCase().includes(search.toLowerCase())
 )
 : choices;

 const toggleChoice = (choiceValue: string) => {
 if (value.includes(choiceValue)) {
 onChange(value.filter((v) => v !== choiceValue));
 } else {
 onChange([...value, choiceValue]);
 }
 };

 const selectedLabels = value
 .map((v) => choices.find((c) => c.value === v)?.label ?? v)
 .slice(0, 3);

 return (
 <div className="space-y-2">
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 role="combobox"
 className="w-full justify-between font-normal"
 disabled={disabled}
 >
 {value.length === 0 ? (
 <span className="text-muted-foreground">{placeholder}</span>
 ) : (
 <span className="truncate">
 {selectedLabels.join(", ")}
 {value.length > 3 &&` +${value.length - 3} de plus`}
 </span>
 )}
 <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-[300px] p-0" align="start">
 <Command>
 <CommandInput
 placeholder="Rechercher..."
 value={search}
 onValueChange={setSearch}
 />
 <CommandList>
 <CommandEmpty>Aucune option trouvée.</CommandEmpty>
 <CommandGroup>
 {filteredChoices.map((choice) => (
 <CommandItem
 key={choice.value}
 value={choice.value}
 onSelect={() => toggleChoice(choice.value)}
 >
 <Checkbox
 checked={value.includes(choice.value)}
 className="mr-2"
 />
 {choice.label}
 </CommandItem>
 ))}
 </CommandGroup>
 </CommandList>
 </Command>
 </PopoverContent>
 </Popover>

 {value.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {value.map((v) => {
 const choice = choices.find((c) => c.value === v);
 return (
 <Badge key={v} variant="secondary" className="gap-1 pr-1">
 {choice?.label ?? v}
 <X
 className="h-3 w-3 cursor-pointer hover:text-destructive"
 onClick={() => toggleChoice(v)}
 />
 </Badge>
 );
 })}
 {value.length > 1 && (
 <Button
 variant="ghost"
 size="sm"
 className="h-6 px-2 text-xs"
 onClick={() => onChange([])}
 >
 Tout effacer
 </Button>
 )}
 </div>
 )}
 </div>
 );
};

interface DatePickerInputProps {
 value?: string;
 onChange: (value: string | undefined) => void;
 disabled?: boolean;
 includeTime?: boolean;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
 value,
 onChange,
 disabled,
 includeTime,
}) => {
 const [open, setOpen] = useState(false);
 const parsedDate = value ? parseISO(value) : undefined;
 const isValidDate = parsedDate && isValid(parsedDate);

 const formatStr = includeTime ? "PPP 'à' p" : "PPP";

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 className={cn(
 "w-full justify-start text-left font-normal",
 !value && "text-muted-foreground"
 )}
 disabled={disabled}
 >
 <CalendarIcon className="mr-2 h-4 w-4" />
 {isValidDate ? format(parsedDate!, formatStr) : "Choisir une date"}
 {value && (
 <X
 className="ml-auto h-4 w-4 hover:text-destructive"
 onClick={(e) => {
 e.stopPropagation();
 onChange(undefined);
 }}
 />
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start">
 <Calendar
 mode="single"
 selected={isValidDate ? parsedDate : undefined}
 onSelect={(date) => {
 if (date) {
 const formatted = includeTime
 ? format(date, "yyyy-MM-dd'T'HH:mm:ss")
 : format(date, "yyyy-MM-dd");
 onChange(formatted);
 } else {
 onChange(undefined);
 }
 setOpen(false);
 }}
 initialFocus
 />
 {includeTime && isValidDate && (
 <div className="border-t p-3">
 <Input
 type="time"
 value={format(parsedDate!, "HH:mm")}
 onChange={(e) => {
 const [hours, minutes] = e.target.value.split(":");
 const newDate = new Date(parsedDate!);
 newDate.setHours(parseInt(hours), parseInt(minutes));
 onChange(format(newDate, "yyyy-MM-dd'T'HH:mm:ss"));
 }}
 />
 </div>
 )}
 </PopoverContent>
 </Popover>
 );
};

interface DateRangeInputProps {
 value?: [string?, string?];
 onChange: (value: [string?, string?]) => void;
 disabled?: boolean;
 includeTime?: boolean;
}

const DateRangeInput: React.FC<DateRangeInputProps> = ({
 value,
 onChange,
 disabled,
 includeTime,
}) => {
 const [start, end] = value ?? [undefined, undefined];

 return (
 <div className="flex items-center gap-2">
 <div className="flex-1">
 <DatePickerInput
 value={start}
 onChange={(v) => onChange([v, end])}
 disabled={disabled}
 includeTime={includeTime}
 />
 </div>
 <span className="text-muted-foreground text-sm">au</span>
 <div className="flex-1">
 <DatePickerInput
 value={end}
 onChange={(v) => onChange([start, v])}
 disabled={disabled}
 includeTime={includeTime}
 />
 </div>
 </div>
 );
};

interface NumberRangeInputProps {
 value?: [number?, number?];
 onChange: (value: [number?, number?]) => void;
 disabled?: boolean;
 min?: number;
 max?: number;
 step?: number;
}

const NumberRangeInput: React.FC<NumberRangeInputProps> = ({
 value,
 onChange,
 disabled,
 min,
 max,
 step,
}) => {
 const [minVal, maxVal] = value ?? [undefined, undefined];

 return (
 <div className="flex items-center gap-2">
 <Input
 type="number"
 value={minVal ?? ""}
 onChange={(e) => {
 const val = e.target.value;
 onChange([val === "" ? undefined : parseFloat(val), maxVal]);
 }}
 placeholder="Min"
 disabled={disabled}
 min={min}
 max={max}
 step={step}
 className="w-24"
 />
 <span className="text-muted-foreground text-sm">au</span>
 <Input
 type="number"
 value={maxVal ?? ""}
 onChange={(e) => {
 const val = e.target.value;
 onChange([minVal, val === "" ? undefined : parseFloat(val)]);
 }}
 placeholder="Max"
 disabled={disabled}
 min={min}
 max={max}
 step={step}
 className="w-24"
 />
 </div>
 );
};

interface StringTagInputProps {
 value: string[];
 onChange: (value: string[]) => void;
 disabled?: boolean;
 placeholder?: string;
 singleValue?: boolean;
}

const StringTagInput: React.FC<StringTagInputProps> = ({
 value,
 onChange,
 disabled,
 placeholder,
 singleValue,
}) => {
 const [input, setInput] = useState("");

 const addTag = useCallback(() => {
 const trimmed = input.trim();
 if (trimmed && !value.includes(trimmed)) {
 if (singleValue) {
 onChange([trimmed]);
 } else {
 onChange([...value, trimmed]);
 }
 setInput("");
 }
 }, [input, value, onChange, singleValue]);

 const removeTag = (tag: string) => {
 onChange(value.filter((v) => v !== tag));
 };

 return (
 <div className="space-y-2">
 <div className="flex gap-2">
 <Input
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 addTag();
 }
 }}
 placeholder={placeholder}
 disabled={disabled}
 className="flex-1"
 />
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={addTag}
 disabled={disabled || !input.trim()}
 >
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 {value.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {value.map((tag) => (
 <Badge key={tag} variant="secondary" className="gap-1 pr-1">
 {tag}
 <X
 className="h-3 w-3 cursor-pointer hover:text-destructive"
 onClick={() => removeTag(tag)}
 />
 </Badge>
 ))}
 </div>
 )}
 </div>
 );
};

interface NumberTagInputProps {
 value: number[];
 onChange: (value: number[]) => void;
 disabled?: boolean;
 min?: number;
 max?: number;
}

const NumberTagInput: React.FC<NumberTagInputProps> = ({
 value,
 onChange,
 disabled,
 min,
 max,
}) => {
 const [input, setInput] = useState("");

 const addNumber = useCallback(() => {
 const num = parseFloat(input);
 if (!isNaN(num) && !value.includes(num)) {
 onChange([...value, num]);
 setInput("");
 }
 }, [input, value, onChange]);

 const removeNumber = (num: number) => {
 onChange(value.filter((v) => v !== num));
 };

 return (
 <div className="space-y-2">
 <div className="flex gap-2">
 <Input
 type="number"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 addNumber();
 }
 }}
 placeholder="Ajouter un nombre..."
 disabled={disabled}
 min={min}
 max={max}
 className="flex-1"
 />
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={addNumber}
 disabled={disabled || !input || isNaN(parseFloat(input))}
 >
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 {value.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {value.map((num) => (
 <Badge key={num} variant="secondary" className="gap-1 pr-1">
 {num}
 <X
 className="h-3 w-3 cursor-pointer hover:text-destructive"
 onClick={() => removeNumber(num)}
 />
 </Badge>
 ))}
 </div>
 )}
 </div>
 );
};

export default ScalarFilterInput;
