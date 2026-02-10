/**
 * Dynamic Filters - Distinct On Selector
 * 
 * UI for selecting DISTINCT ON fields (PostgreSQL).
 */

import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/components/ui/command";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import { Alert, AlertDescription } from "@/lib/components/ui/alert";
import { Check, ChevronDown, Layers, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DistinctField } from "../types";

interface DistinctOnSelectorProps {
  /** Available fields for DISTINCT ON */
  distinctFields: DistinctField[];
  /** Currently selected distinct fields */
  selectedFields: string[];
  /** Current orderBy fields (for validation) */
  orderBy: string[];
  /** Callback when selection changes */
  onChange: (fields: string[]) => void;
  /** Callback to update orderBy to match distinct */
  onOrderByRequired?: (fields: string[]) => void;
  disabled?: boolean;
}

export const DistinctOnSelector: React.FC<DistinctOnSelectorProps> = ({
  distinctFields,
  selectedFields,
  orderBy,
  onChange,
  onOrderByRequired,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter fields by search
  const filteredFields = useMemo(() => {
    if (!search) return distinctFields;
    const lower = search.toLowerCase();
    return distinctFields.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.fieldLabel.toLowerCase().includes(lower)
    );
  }, [distinctFields, search]);

  // Validate: DISTINCT ON fields must be prefix of ORDER BY
  const validationError = useMemo(() => {
    if (selectedFields.length === 0) return null;

    // Check if selected fields are prefix of orderBy
    for (let i = 0; i < selectedFields.length; i++) {
      const distinctField = selectedFields[i];
      const orderByField = orderBy[i];

      if (!orderByField) {
        return `ORDER BY doit inclure "${distinctField}" à la position ${i + 1}`;
      }

      // Handle descending order prefix
      const normalizedOrderBy = orderByField.replace(/^-/, "");
      if (normalizedOrderBy !== distinctField) {
        return `ORDER BY[${i}] doit être "${distinctField}" (reçu "${normalizedOrderBy}")`;
      }
    }

    return null;
  }, [selectedFields, orderBy]);

  const handleToggleField = (fieldName: string) => {
    let newSelection: string[];
    if (selectedFields.includes(fieldName)) {
      // Remove field and all fields after it
      const index = selectedFields.indexOf(fieldName);
      newSelection = selectedFields.slice(0, index);
    } else {
      // Add field
      newSelection = [...selectedFields, fieldName];
    }
    onChange(newSelection);

    // Optionally trigger orderBy update
    if (onOrderByRequired && newSelection.length > 0) {
      // Ensure orderBy starts with distinct fields
      const requiredOrderBy = [...newSelection];
      const existingOrderBy = orderBy.filter(
        (ob) => !newSelection.includes(ob.replace(/^-/, ""))
      );
      onOrderByRequired([...requiredOrderBy, ...existingOrderBy]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Champs distincts"
            aria-expanded={open}
            className="justify-between gap-2"
            disabled={disabled || distinctFields.length === 0}
          >
            <Layers className="h-4 w-4" />
            <span>Distinct</span>
            {selectedFields.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedFields.length}
              </Badge>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher des champs..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Aucun champ disponible.</CommandEmpty>
              <CommandGroup heading="Distinct par">
                {filteredFields.map((field) => {
                  const isSelected = selectedFields.includes(field.fieldName);
                  const position = selectedFields.indexOf(field.fieldName);

                  return (
                    <CommandItem
                      key={field.fieldName}
                      value={field.fieldName}
                      onSelect={() => handleToggleField(field.fieldName)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <span>{field.fieldLabel}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {field.fieldType}
                        </span>
                      </div>
                      {isSelected && (
                        <Badge variant="outline" className="ml-2">
                          #{position + 1}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected fields display */}
      {selectedFields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedFields.map((fieldName, index) => {
            const field = distinctFields.find((f) => f.fieldName === fieldName);
            return (
              <Badge key={fieldName} variant="secondary" className="gap-1">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                {field?.fieldLabel ?? fieldName}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleToggleField(fieldName)}
                />
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClear}
          >
            Tout effacer
          </Button>
        </div>
      )}

      {/* Validation warning */}
      {validationError && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {validationError}
            {onOrderByRequired && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => onOrderByRequired(selectedFields)}
              >
                Corriger ORDER BY
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Help text */}
      {distinctFields.length > 0 && selectedFields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sélectionnez des champs pour obtenir une ligne par combinaison unique.
          Nécessite PostgreSQL.
        </p>
      )}
    </div>
  );
};
