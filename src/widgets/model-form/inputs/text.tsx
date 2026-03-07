/**
 * Text-based form inputs: text, email, password, color, textarea, file, json.
 *
 * Renders the appropriate input variant based on `config.type`, using
 * the shared FieldWrapper for consistent label/error presentation.
 *
 * @module form/inputs/text
 */
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type {
  FieldComponentProps,
  FileFieldConfig,
  TextFieldConfig,
} from "./types";
import { Textarea } from "@/shared/ui/kit/textarea";
import { File, X, FileJson, Upload } from "lucide-react";

type Props = FieldComponentProps<TextFieldConfig | FileFieldConfig>;

/**
 * Safely narrows an unknown value to `React.ComponentProps<typeof Input>`.
 * Returns `undefined` when the value is not a plain object.
 */
function asSafeInputProps(
  value: unknown,
): React.ComponentProps<typeof Input> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as React.ComponentProps<typeof Input>;
}

/** Renders a text-based input (text | email | password | color | textarea | file | json). */
const TextInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(form.store, (state) => {
    const formState = state as {
      submissionAttempts?: number;
      submitCount?: number;
    };
    return formState.submissionAttempts ?? formState.submitCount ?? 0;
  });
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error =
    fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const fieldId = field.name;

  // ── Textarea ─────────────────────────────────────────────────────────
  if (config.type === "textarea") {
    const value = (field.state.value as string) ?? "";
    return (
      <FieldWrapper
        config={config}
        fieldId={fieldId}
        error={error}
        dirty={dirty}
      >
        <Textarea
          id={fieldId}
          data-slot="textarea"
          className={cn(
            "min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200",
            "hover:border-border",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-0",
            config.readOnly && "cursor-default bg-muted/40 text-muted-foreground",
            config.disabled && "cursor-not-allowed opacity-50",
          )}
          rows={config.rows ?? 4}
          placeholder={config.placeholder}
          value={value}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          readOnly={config.readOnly}
          disabled={config.disabled}
        />
      </FieldWrapper>
    );
  }

  // ── File upload ──────────────────────────────────────────────────────
  if (config.type === "file") {
    const files = (field.state.value as File[] | File | null) ?? null;
    const fileList = Array.isArray(files) ? files : files ? [files] : [];

    return (
      <FieldWrapper
        config={config}
        fieldId={fieldId}
        error={error}
        dirty={dirty}
      >
        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Input
              id={fieldId}
              data-slot="input"
              type="file"
              accept={config.accept}
              multiple={Boolean(config.multiple)}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center rounded-md border border-input bg-background p-0 text-sm transition-all duration-200",
                "hover:border-border hover:bg-accent/30",
                "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                "file:h-full file:border-0 file:border-r file:border-input file:bg-muted/50 file:px-3 file:py-0 file:text-xs file:font-medium file:text-foreground/70 file:hover:bg-muted file:transition-colors file:mr-3",
              )}
              onChange={(event) => {
                const list = event.target.files;
                if (!list) {
                  field.handleChange(config.multiple ? [] : null);
                  return;
                }
                field.handleChange(
                  config.multiple ? Array.from(list) : (list[0] ?? null),
                );
              }}
              onBlur={field.handleBlur}
              disabled={config.disabled}
            />
          </div>

          {fileList.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
              {fileList.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="relative flex items-center gap-2 rounded-lg border border-border/60 bg-accent/30 py-1.5 pl-2.5 pr-8 transition-all hover:bg-accent/50"
                >
                  <File className="size-3.5 text-primary/70" />
                  <span className="max-w-[150px] truncate text-xs font-medium text-foreground/80">
                    {file.name}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  {!config.disabled && !config.readOnly && (
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 flex w-7 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => {
                        if (config.multiple) {
                          field.handleChange(
                            fileList.filter((_, i) => i !== idx),
                          );
                        } else {
                          field.handleChange(null);
                        }
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }

  // ── JSON editor ──────────────────────────────────────────────────────
  if (config.type === "json") {
    const value =
      typeof field.state.value === "string"
        ? field.state.value
        : JSON.stringify(field.state.value ?? {}, null, 2);
    return (
      <FieldWrapper
        config={config}
        fieldId={fieldId}
        error={error}
        dirty={dirty}
      >
        <div className="overflow-hidden rounded-lg border border-input transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <FileJson className="size-3.5" />
              Éditeur JSON
            </div>
          </div>
          <textarea
            id={fieldId}
            data-slot="textarea"
            className="font-mono min-h-32 w-full resize-y bg-background p-4 text-[13px] leading-relaxed outline-none transition-colors focus:bg-background"
            value={value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            readOnly={config.readOnly}
            disabled={config.disabled}
            spellCheck={false}
          />
        </div>
      </FieldWrapper>
    );
  }

  // ── Standard text/email/password/color inputs ────────────────────────
  const inputType: React.HTMLInputTypeAttribute =
    config.type === "color"
      ? "color"
      : config.type === "password"
        ? "password"
        : config.type === "email"
          ? "email"
          : "text";

  const value = (field.state.value as string) ?? "";
  const safeInputProps = asSafeInputProps(config.inputProps);

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <Input
        id={fieldId}
        data-slot="input"
        type={inputType}
        placeholder={config.placeholder}
        value={value}
        minLength={config.minLength}
        maxLength={config.maxLength}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        readOnly={config.readOnly}
        disabled={config.disabled}
        className={cn(
          "h-10 rounded-md border border-input bg-background px-3 text-sm transition-all duration-200",
          "hover:border-border",
          "focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-0",
          safeInputProps?.className,
        )}
        {...safeInputProps}
      />
    </FieldWrapper>
  );
};

export default TextInput;
