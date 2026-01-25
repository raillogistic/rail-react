import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./common";
import type {
  FieldComponentProps,
  FileFieldConfig,
  TextFieldConfig,
} from "./types";
import { Textarea } from "@/lib/components/ui/textarea";

type Props = FieldComponentProps<TextFieldConfig | FileFieldConfig>;

const TextInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const rawError = meta.touchedErrors?.[0] ?? meta.errors?.[0];
  const submitCount = useStore(form.store, (state) => state.submitCount);
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const error = showError ? rawError : undefined;

  if (config.type === "textarea") {
    const value = (field.state.value as string) ?? "";
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <Textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    const summary = Array.isArray(files)
      ? files.map((file) => file.name).join(", ")
      : files instanceof File
      ? files.name
      : "Aucun fichier";
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <Input
          type="file"
          accept={config.accept}
          multiple={Boolean(config.multiple)}
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
        <p className="text-xs text-muted-foreground">{summary}</p>
      </FieldWrapper>
    );
  }

  if (config.type === "json") {
    const value =
      typeof field.state.value === "string"
        ? field.state.value
        : JSON.stringify(field.state.value ?? {}, null, 2);
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <textarea
          className="font-mono min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={value}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          readOnly={config.readOnly}
          disabled={config.disabled}
        />
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
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Input
        type={inputType}
        placeholder={config.placeholder}
        value={value}
        minLength={config.minLength}
        maxLength={config.maxLength}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        readOnly={config.readOnly}
        disabled={config.disabled}
        className={cn(config.inputProps?.className)}
        {...config.inputProps}
      />
    </FieldWrapper>
  );
};

export default TextInput;
