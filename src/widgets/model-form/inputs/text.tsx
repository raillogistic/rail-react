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
import { File, X, FileJson } from "lucide-react";

type Props = FieldComponentProps<TextFieldConfig | FileFieldConfig>;

function asSafeInputProps(
  value: unknown,
): React.ComponentProps<typeof Input> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as React.ComponentProps<typeof Input>;
}

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
            "min-h-24 w-full resize-y border-border/40 bg-muted/20 px-3 py-2 text-sm transition-all duration-300  ",
            "hover:bg-muted/40 hover:border-border/60",
            "focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 focus-visible:ring-0",
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
      </FieldWrapper>
    );
  }

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
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Input
              id={fieldId}
              data-slot="input"
              type="file"
              accept={config.accept}
              multiple={Boolean(config.multiple)}
              className={cn(
                "flex h-9 w-full cursor-pointer file:cursor-pointer items-center border-2 border-border bg-background p-0 text-sm transition-all duration-300",
                "hover:bg-muted/30 focus-within:border-primary",
                "file:h-full file:border-0 file:border-r-2 file:border-border file:bg-muted file:px-3 file:py-0 file:text-[11px] file:font-black file:uppercase file:tracking-widest file:text-foreground file:hover:bg-foreground file:hover:text-background file:transition-colors file:mr-3",
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
                  className="relative flex items-center gap-3 border-2 border-foreground bg-primary/10 pl-2 pr-8 py-1 transition-all hover:-translate-y-0.5 hover:translate-x-0.5"
                >
                  <File className="size-4 text-foreground" />
                  <span className="max-w-[150px] truncate text-xs font-black tracking-wide text-foreground">
                    {file.name}
                  </span>
                  <span className="flex items-center justify-center border-2 border-foreground bg-background px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  {!config.disabled && !config.readOnly && (
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 flex w-7 items-center justify-center border-l-2 border-foreground bg-destructive text-destructive-foreground hover:bg-red-600 transition-colors"
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
        <div className="group/json overflow-hidden border border-border/40 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10   hover:border-border/60">
          <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <FileJson className="size-3.5" />
              Éditeur JSON
            </div>
          </div>
          <textarea
            id={fieldId}
            data-slot="textarea"
            className="font-mono min-h-32 w-full resize-y bg-muted/10 p-5 text-[14px] leading-relaxed outline-none transition-colors focus:bg-background"
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
          "h-9 border-border/40 bg-muted/20 px-3 text-sm transition-all duration-300  ",
          "hover:bg-muted/40 hover:border-border/60",
          "focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 focus-visible:ring-0",
          safeInputProps?.className,
        )}
        {...safeInputProps}
      />
    </FieldWrapper>
  );
};

export default TextInput;
