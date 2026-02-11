/**
 * Debug panel for DynamicForm developer tools.
 *
 * Displays current form values, change log, and submit diagnostics.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import type { ChangeRecord } from "../types/schema";
import type { FormDevtoolsConfig } from "../types/props";

export type DebugPanelProps<TValues> = {
  form: UseFormReturn<TValues>;
  formValues: TValues;
  changeLog: ChangeRecord[];
  config?: FormDevtoolsConfig<TValues>;
  isLoading?: boolean;
};

export const DebugPanel = <TValues extends Record<string, any>>({
  form,
  formValues,
  changeLog,
  config,
  isLoading,
}: DebugPanelProps<TValues>) => {
  if (!config?.enabled) return null;

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const fieldMeta = useStore(
    form.store,
    (state) => (state as any).fieldMeta ?? {},
  );

  const displayValues = config.transformValues
    ? config.transformValues(formValues)
    : formValues;

  const diagnostics = React.useMemo(() => {
    if (!config.showDiagnostics) return null;
    const entries = Object.entries(fieldMeta as Record<string, any>);
    const hasServerErrors = entries.some(([, meta]) =>
      Boolean((meta as any)?.errorMap?.onSubmit),
    );
    const hasUserInteraction = entries.some(([, meta]) =>
      Boolean(meta?.isBlurred || meta?.isDirty),
    );
    const shouldSurface = hasServerErrors || hasUserInteraction;
    if (!shouldSurface) return null;

    const invalid = entries
      .filter(
        ([, meta]) =>
          meta &&
          meta.isValid === false &&
          (meta.isBlurred ||
            meta.isDirty ||
            (meta as any)?.errorMap?.onSubmit),
      )
      .map(([name, meta]) => ({
        name,
        errors: (meta as any)?.errors ?? [],
      }));

    const reasons: string[] = [];
    if (shouldSurface && !canSubmit) reasons.push("form invalid or untouched");
    if (isSubmitting) reasons.push("form is submitting");
    if (isLoading) reasons.push("external loading flag");

    return { reasons, invalid };
  }, [fieldMeta, canSubmit, isSubmitting, isLoading, config.showDiagnostics]);

  return (
    <Card className="p-4 space-y-2">
      <pre className="text-xs">
        {JSON.stringify(displayValues, null, 2)}
      </pre>
      {config.showFieldMeta ? (
        <pre className="text-[11px] text-muted-foreground">
          {JSON.stringify(fieldMeta, null, 2)}
        </pre>
      ) : null}
      <pre className="text-[11px] text-muted-foreground">
        {JSON.stringify(changeLog.slice(-5), null, 2)}
      </pre>
      {diagnostics && diagnostics.reasons.length ? (
        <div className="text-xs text-destructive space-y-1">
          <p>Submit blocked: {diagnostics.reasons.join(", ")}</p>
          {diagnostics.invalid.length ? (
            <div>
              <p>Invalid fields:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {diagnostics.invalid.map(({ name, errors }) => (
                  <li key={name}>
                    {name}
                    {errors?.length ? ` (${errors.join(", ")})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};
