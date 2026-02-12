import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type {
  FieldComponentProps,
  FileFieldConfig,
  TextFieldConfig,
} from "./types";
import { Textarea } from "@/lib/components/ui/textarea";
import { File, X, FileJson } from "lucide-react";
import { Button } from "@/lib/components/ui/button";

type Props = FieldComponentProps<TextFieldConfig | FileFieldConfig>;

const TextInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0
  );
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error = fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const fieldId = field.name;

  if (config.type === "textarea") {
    const value = (field.state.value as string) ?? "";
    return (
      <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
        <Textarea
          id={fieldId}
          data-slot="textarea"
          className={cn(
            "min-h-[100px] w-full resize-y rounded-lg border-border/60 bg-background/50 px-4 py-3 text-sm transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 focus-visible:ring-0",
            config.readOnly && "cursor-default bg-muted/50",
            config.disabled && "cursor-not-allowed opacity-50"
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
      <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Input
              id={fieldId}
              data-slot="input"
              type="file"
              accept={config.accept}
              multiple={Boolean(config.multiple)}
              className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/20"
              onChange={(event) => {
                const list = event.target.files;
                if (!list) {
                  field.handleChange(config.multiple ? [] : null);
                  return;
                }
                field.handleChange(
                  config.multiple ? Array.from(list) : list[0] ?? null
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
                  className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5 text-[11px] font-medium"
                >
                  <File className="size-3.5 text-primary" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  {!config.disabled && !config.readOnly && (
                    <button 
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        if (config.multiple) {
                          field.handleChange(fileList.filter((_, i) => i !== idx));
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
      <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
        <div className="group/json relative overflow-hidden rounded-lg border border-border/60 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
          <div className="flex items-center justify-between bg-muted/20 px-3 py-1.5 border-b border-border/30">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <FileJson className="size-3.5" />
              JSON Editor
            </div>
          </div>
          <textarea
            id={fieldId}
            data-slot="textarea"
            className="font-mono min-h-[160px] w-full resize-y bg-background/50 p-4 text-[13px] leading-relaxed outline-none transition-colors focus:bg-background"
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
          "h-10 rounded-lg border-border/60 bg-background/50 px-4 transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 focus-visible:ring-0",
          config.inputProps?.className
        )}
        {...config.inputProps}
      />
    </FieldWrapper>
  );
};

export default TextInput;
