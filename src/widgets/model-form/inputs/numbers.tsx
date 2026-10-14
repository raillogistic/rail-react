/**
 * @file numbers.tsx
 * @description Entrées de formulaire numériques : nombre, curseur (slider) et plage.
 * Modifié pour supprimer toutes les ombres (shadow-none), utiliser des styles thématiques arrondis,
 * et utiliser des coins arrondis rounded-xl.
 *
 * @module form/inputs/numbers
 */
import React, { useRef, useCallback } from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { cn } from "@/shared/utils";
import { Binary } from "lucide-react";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { FieldComponentProps, NumberFieldConfig } from "./types";

type Props = FieldComponentProps<NumberFieldConfig, number | string>;

const formatNumber = (val: number | string): string => {
  if (val === "" || val === undefined || val === null) return "";
  const num = typeof val === "string" ? parseInt(val, 10) : val;
  if (Number.isNaN(num)) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/** Renders a numeric input with optional formatting badge. */
const NumberInput: React.FC<Props> = ({ config, field, form }) => {
  const inputRef = useRef<HTMLInputElement>(null);
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
  const value = field.state.value ?? "";

  const typeAttr =
    config.type === "slider" || config.type === "range" ? "range" : "number";
  const isNumeric = typeAttr === "number";

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const cursor = input.selectionStart ?? 0;
      const raw = input.value.replace(/\s/g, "");

      if (raw === "" || raw === "-") {
        field.handleChange("");
        return;
      }
      const parsed = parseInt(raw, 10);
      if (Number.isNaN(parsed)) return;
      field.handleChange(parsed);

      if (!isNumeric) return;

      // restore cursor after reformatting
      const oldSpaces = (input.value.slice(0, cursor).match(/\s/g) || [])
        .length;
      const digitIdx = cursor - oldSpaces;
      requestAnimationFrame(() => {
        const formatted = formatNumber(parsed);
        let pos = 0;
        let d = 0;
        while (d < digitIdx && pos < formatted.length) {
          if (formatted[pos] !== " ") d++;
          pos++;
        }
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [field, isNumeric],
  );

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div className="relative group/number">
        <div className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-muted-foreground/35 transition-all duration-300 group-focus-within/number:text-primary group-focus-within/number:scale-110">
          <Binary className="size-4.5" />
        </div>
        <Input
          ref={inputRef}
          id={fieldId}
          data-slot="input"
          type={typeAttr}
          value={isNumeric ? (formatNumber(value) as any) : (value as any)}
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          onChange={handleChange}
          onBlur={field.handleBlur}
          disabled={config.disabled}
          className={cn(
            "h-9 w-full rounded-xl border border-transparent bg-muted/50 pl-11 pr-4 text-[13.5px] font-medium transition-all duration-300 ease-out shadow-sm",
            "hover:border-primary/40 hover:bg-muted/60",
            "focus:border-primary focus:ring-4 focus:ring-primary/10 focus-visible:ring-0 focus-visible:outline-none",
            (config.type === "slider" || config.type === "range") &&
              "h-8 px-0 border-none bg-transparent focus:ring-0 shadow-none",
            config.disabled && "cursor-not-allowed opacity-60 grayscale-[0.5]",
          )}
        />

        {config.format && typeof value === "number" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-2 duration-500 ease-out">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary shadow-none">
              {config.format(value)}
            </span>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export default NumberInput;
