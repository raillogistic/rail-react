import React from "react";
import { useStore } from "@tanstack/react-form";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Button } from "@/lib/components/ui/button";
import { FieldWrapper } from "./common";
import type { BooleanFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<BooleanFieldConfig, boolean>;

const BooleanInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const rawError = meta.touchedErrors?.[0] ?? meta.errors?.[0];
  const submitCount = useStore(form.store, (state) => state.submitCount);
  const isSubmitted = submitCount > 0;
  const showError = dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const error = showError ? rawError : undefined;
  const value = Boolean(field.state.value);

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <div className="flex items-center gap-3">
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
          onBlur={field.handleBlur}
          disabled={config.disabled}
        />
        <span className="text-sm text-muted-foreground">
          {value ? config.trueLabel ?? "Oui" : config.falseLabel ?? "Non"}
        </span>
        {config.type === "switch" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => field.handleChange(!value)}
            type="button"
          >
            {value ? "Désactiver" : "Activer"}
          </Button>
        ) : null}
      </div>
    </FieldWrapper>
  );
};

export default BooleanInput;
