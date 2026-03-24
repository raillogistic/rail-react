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
import { File, X, FileJson, CloudUpload, Type, Mail, Lock, Palette, AlignLeft } from "lucide-react";

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

  const Icon = React.useMemo(() => {
    switch (config.type) {
      case "email":
        return Mail;
      case "password":
        return Lock;
      case "color":
        return Palette;
      case "textarea":
        return AlignLeft;
      default:
        return Type;
    }
  }, [config.type]);

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
        <div className="relative group/text">
          <div className="pointer-events-none absolute left-4 top-4 text-muted-foreground/30 transition-all duration-300 group-focus-within/text:text-primary/50 group-focus-within/text:scale-110">
            <Icon className="size-4.5 stroke-[2.5]" />
          </div>
          <Textarea
            id={fieldId}
            data-slot="textarea"
            className={cn(
              "flex min-h-32 w-full resize-y rounded-md border border-input bg-background pl-11 pr-4 py-3 text-sm shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              config.readOnly && "cursor-default bg-muted/50",
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
        </div>
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
        <div className="flex flex-col gap-4">
          <div className="group relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <CloudUpload className="size-6 text-primary/40 animate-bounce" />
            </div>
            <Input
              id={fieldId}
              data-slot="input"
              type="file"
              accept={config.accept}
              multiple={Boolean(config.multiple)}
              className={cn(
                "flex h-12 w-full cursor-pointer items-center rounded-md border-2 border-dashed border-input bg-background p-0 text-sm transition-colors",
                "hover:border-foreground/20 hover:bg-muted/10",
                "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
                "file:h-full file:border-0 file:border-r file:border-dashed file:border-input file:bg-muted/20 file:px-6 file:py-0 file:text-xs file:font-semibold file:text-foreground/70 file:hover:bg-muted/30 file:transition-all file:mr-4",
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
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-500 ease-out">
              {fileList.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="group/file-item relative flex items-center gap-3 rounded-md border border-input bg-background p-2.5 transition-colors hover:border-foreground/20 hover:bg-muted/5 shadow-sm"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted/30 text-muted-foreground transition-colors group-hover/file-item:text-foreground">
                    <File className="size-4.5" />
                  </div>
                  <div className="flex flex-col pr-8">
                    <span className="max-w-45 truncate text-[12.5px] font-bold text-foreground/80">
                      {file.name}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-tighter">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {!config.disabled && !config.readOnly && (
                    <button
                      type="button"
                      className="absolute right-1 top-1 bottom-1 flex w-8 items-center justify-center rounded-lg text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
                      <X className="size-4" />
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
        <div className="group/json overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring hover:border-foreground/20">
          <div className="flex items-center justify-between border-b border-input bg-muted/20 px-4 py-2">
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 group-focus-within/json:text-primary/70 transition-colors">
              <FileJson className="size-4" />
              Éditeur JSON
            </div>
          </div>
          <textarea
            id={fieldId}
            data-slot="textarea"
            className="font-mono min-h-48 w-full resize-y bg-background p-4 text-sm outline-none transition-colors"
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
      <div className="relative group/text">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-all duration-300 group-focus-within/text:text-primary/50 group-focus-within/text:scale-110">
          <Icon className="size-4.5 stroke-[2.5]" />
        </div>
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
            "flex h-9 w-full rounded-md border border-input bg-background pl-11 pr-4 py-2 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            inputType === "color" && "pl-11 h-12 cursor-pointer border-2",
            config.disabled && "cursor-not-allowed opacity-50",
            safeInputProps?.className,
          )}
          {...safeInputProps}
        />
      </div>
    </FieldWrapper>
  );
};

export default TextInput;
