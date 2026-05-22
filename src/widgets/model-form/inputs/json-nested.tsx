/**
 * JSON Nested form input.
 *
 * Renders a structured nested form for a JSON field based on dynamic section
 * and field definitions provided via config.
 *
 * @module form/inputs/json-nested
 */
import React, { useState, useImperativeHandle } from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Switch } from "@/shared/ui/kit/switch";
import { Badge } from "@/shared/ui/kit/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type {
  FieldComponentProps,
  JsonNestedFieldConfig,
  JsonNestedFieldDefinition,
  JsonNestedValidationHandle,
} from "../types";
import {
  ChevronDown,
  Info,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

type Props = FieldComponentProps<JsonNestedFieldConfig>;

const JsonNestedInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error =
    fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const fieldId = field.name;

  // Configuration locale
  const sections = config.sections ?? [];
  const hasFields = sections.some((s) => s.fields.length > 0);
  const loading = config.loading ?? false;

  // Valeur interne (JSON)
  const value = (field.state.value as Record<string, any>) || {};

  // Calculer les sous-erreurs à la volée si showError est vrai
  const localErrors = React.useMemo(() => {
    const newErrors: Record<string, string> = {};
    if (!showError) return newErrors;
    
    sections.forEach((section) => {
      section.fields.forEach((subField) => {
        if (subField.isRequired) {
          const val = value[subField.fieldKey];
          const isEmpty =
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0);

          if (isEmpty) {
            newErrors[subField.fieldKey] = "Ce champ est obligatoire";
          }
        }
      });
    });
    return newErrors;
  }, [sections, value, showError]);

  // API de validation exposée au parent (pour compatibilité)
  useImperativeHandle(
    config.validationRef,
    () => ({
      hasFields,
      validate: () => {
        return [];
      },
    }),
    [hasFields],
  );

  // Helper pour mettre à jour une valeur
  const updateValue = (key: string, newValue: any) => {
    const nextValue = { ...value };
    if (newValue === undefined || newValue === null || newValue === "") {
      delete nextValue[key];
    } else if (Array.isArray(newValue) && newValue.length === 0) {
      delete nextValue[key];
    } else {
      nextValue[key] = newValue;
    }

    field.handleChange(nextValue);
  };

  // --- Rendu des sous-champs ---

  const renderField = (def: JsonNestedFieldDefinition) => {
    const subValue = value[def.fieldKey];
    const subError = localErrors[def.fieldKey];

    const labelNode = (
      <div className="flex items-center gap-2 mb-1.5">
        <Label
          className={cn(
            "text-[13px] font-semibold text-foreground/80",
            subError && "text-destructive"
          )}
        >
          {def.label}
          {def.isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        {def.helpText && (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/40 hover:text-primary outline-none">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {def.helpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );

    const errorNode = subError && (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-destructive animate-in fade-in">
        <AlertCircle className="size-3" />
        <span>{subError}</span>
      </div>
    );

    // TEXT / NUMBER / DATE
    if (def.fieldType === "text" || def.fieldType === "number" || def.fieldType === "date") {
      const inputType = def.fieldType === "text" ? "text" : def.fieldType === "number" ? "number" : "date";
      return (
        <div key={def.fieldKey} className="flex flex-col">
          {labelNode}
          <Input
            type={inputType}
            placeholder={def.placeholder}
            value={subValue ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              updateValue(def.fieldKey, def.fieldType === "number" && val ? Number(val) : val);
            }}
            onBlur={field.handleBlur}
            disabled={config.disabled || config.readOnly}
            className={cn(
              "h-9 transition-colors shadow-sm",
              subError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errorNode}
        </div>
      );
    }

    // BOOLEAN
    if (def.fieldType === "boolean") {
      const isChecked = Boolean(subValue);
      return (
        <div key={def.fieldKey} className="flex flex-col">
          <div className="flex items-center gap-3 h-9">
            <Switch
              checked={isChecked}
              onCheckedChange={(checked) => {
                updateValue(def.fieldKey, checked);
                field.handleBlur();
              }}
              disabled={config.disabled || config.readOnly}
            />
            {labelNode}
          </div>
          {errorNode}
        </div>
      );
    }

    return null;
  };

  // --- Rendu du Wrapper ---

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div className={cn("flex flex-col gap-4 rounded-xl border bg-muted/5 p-4 transition-colors", 
        hasFields ? "border-input/60" : "border-dashed border-input/40"
      )}>
        {/* Header optionnel */}
        {(config.title || config.subtitle) && (
          <div className="flex flex-col gap-1 mb-2 border-b border-input/30 pb-3">
            {config.title && <h4 className="font-bold text-[14px] flex items-center gap-2">
              <Sparkles className="size-4 text-primary/60" />
              {config.title}
            </h4>}
            {config.subtitle && <p className="text-xs text-muted-foreground">{config.subtitle}</p>}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
            <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-sm font-medium animate-pulse">Chargement des champs...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasFields && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60 gap-2">
            <AlertTriangle className="size-8 opacity-20" />
            <span className="text-sm font-medium">{config.emptyMessage ?? "Aucun champ disponible."}</span>
          </div>
        )}

        {/* Render Sections */}
        {!loading && hasFields && (
          <div className="flex flex-col gap-6">
            {sections.map((section) => {
              if (section.fields.length === 0) return null;
              
              // Tri des champs par ordre
              const sortedFields = [...section.fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
              
              return (
                <div key={section.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">{section.name}</h5>
                    <Badge variant="outline" className="text-[10px] h-5 bg-background text-muted-foreground/70">
                      {section.fields.length} champ{section.fields.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 bg-background rounded-lg border border-input/40 p-4 shadow-sm">
                    {sortedFields.map(renderField)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export default JsonNestedInput;
