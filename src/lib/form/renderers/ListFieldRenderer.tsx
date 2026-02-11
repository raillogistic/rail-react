/**
 * Renders a repeatable list field with add/remove/reorder controls.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  AlertCircle,
  Layers
} from "lucide-react";
import type { ListFieldConfig } from "../types/schema";
import { resolveFieldErrors, resolveRequiredError } from "../inputs/common";
import { FieldRenderer } from "./FieldRenderer";
import { buildResponsiveGridClass } from "./utils";
import { buildDefaultsFromFields } from "../hooks/useFormDefaults";
import { createValidators } from "./FieldRenderer";

export type ListFieldRendererProps<TValues> = {
  config: ListFieldConfig;
  form: UseFormReturn<TValues>;
  path: string;
  colSpan?: number;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
  hiddenFields?: Set<string>;
};

export const ListFieldRenderer = <TValues extends Record<string, any>>({
  config,
  form,
  path,
  colSpan,
  globalReadOnly,
  globalDisabled,
  hiddenFields,
}: ListFieldRendererProps<TValues>) => {
  const defaultValue = Array.isArray(config.defaultValue)
    ? config.defaultValue
    : [];
  const validators = React.useMemo(
    () => createValidators(config, form, path),
    [config, form, path],
  );
  const itemColumns = Math.max(config.columns ?? config.fields.length ?? 1, 1);
  const itemGridGapStyle = React.useMemo<
    React.CSSProperties | undefined
  >(() => {
    if (config.itemGap === undefined) return undefined;
    return {
      gap:
        typeof config.itemGap === "number"
          ? `${config.itemGap}px`
          : config.itemGap,
    };
  }, [config.itemGap]);
  const itemGridClassName = React.useMemo(
    () =>
      cn(
        "grid",
        buildResponsiveGridClass(itemColumns),
        config.itemClassName,
      ),
    [config.itemClassName, itemColumns],
  );

  return (
    <form.Field
      name={path as any}
      defaultValue={defaultValue}
      validators={validators}
    >
      {(fieldApi: any) => (
        <ListFieldItems
          config={config}
          form={form}
          fieldApi={fieldApi}
          path={path}
          colSpan={colSpan}
          itemGridClassName={itemGridClassName}
          itemGridGapStyle={itemGridGapStyle}
          globalReadOnly={globalReadOnly}
          globalDisabled={globalDisabled}
          hiddenFields={hiddenFields}
        />
      )}
    </form.Field>
  );
};

type ListFieldItemsProps<TValues extends Record<string, any>> = {
  config: ListFieldConfig;
  form: UseFormReturn<TValues>;
  fieldApi: any;
  path: string;
  colSpan?: number;
  itemGridClassName: string;
  itemGridGapStyle?: React.CSSProperties;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
  hiddenFields?: Set<string>;
};

const ListFieldItems = <TValues extends Record<string, any>>({
  config,
  fieldApi,
  path,
  colSpan,
  itemGridClassName,
  itemGridGapStyle,
  form,
  globalReadOnly,
  globalDisabled,
  hiddenFields,
}: ListFieldItemsProps<TValues>) => {
  const meta = fieldApi.state?.meta;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const showListError =
    Boolean(meta?.isDirty) ||
    Boolean(meta?.isBlurred) ||
    submitCount > 0 ||
    Boolean(meta?.errorMap?.onSubmit);
  const items = fieldApi.state.value ?? [];
  const fieldErrors = resolveFieldErrors(meta, showListError);
  const requiredError = resolveRequiredError(config, items, showListError);
  const listError = fieldErrors ?? requiredError;
  const canAdd =
    !config.maxItems ||
    (Array.isArray(items) && items.length < config.maxItems);

  const isReadOnly = globalReadOnly || config.readOnly;

  const enforceOrdering = React.useCallback(
    (entries: any[]) => {
      if (!config.ordering?.activate) return entries;
      const targetField = config.ordering.toField;
      if (!targetField) return entries;
      return entries.map((entry, index) => ({
        ...(entry ?? {}),
        [targetField]: index,
      }));
    },
    [config.ordering],
  );

  const handleAdd = React.useCallback(() => {
    const payload = buildDefaultsFromFields(config.fields);
    const nextPayload = config.ordering?.activate
      ? { ...payload, [config.ordering.toField]: items.length }
      : payload;
    fieldApi.setValue(enforceOrdering([...(items ?? []), nextPayload]));
  }, [config.fields, config.ordering, enforceOrdering, fieldApi, items]);

  const handleRemove = React.useCallback(
    (index: number) => {
      const next = (items ?? []).filter((_: any, idx: number) => idx !== index);
      fieldApi.setValue(enforceOrdering(next));
    },
    [enforceOrdering, fieldApi, items],
  );

  const handleMove = React.useCallback(
    (index: number, offset: number) => {
      if (!config.ordering?.activate) return;
      const next = [...(items ?? [])];
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= next.length) return;
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      fieldApi.setValue(enforceOrdering(next));
    },
    [config.ordering?.activate, enforceOrdering, fieldApi, items],
  );

  React.useEffect(() => {
    if (!config.ordering?.activate) return;
    const targetField = config.ordering.toField;
    if (!targetField) return;
    const needsOrdering = (items ?? []).some(
      (entry: Record<string, any>, index: number) =>
        entry?.[targetField] !== index,
    );
    if (!needsOrdering) return;
    fieldApi.setValue(enforceOrdering(items ?? []));
  }, [config.ordering, enforceOrdering, fieldApi, items]);

  return (
    <div
      className="group/list flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/5 p-5 transition-all duration-300 hover:border-border/80"
      style={
        colSpan
          ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
          : undefined
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-foreground">{config.label}</h4>
            {config.description ? (
              <p className="text-[11px] text-muted-foreground">
                {config.description}
              </p>
            ) : null}
          </div>
        </div>
        {!isReadOnly ? (
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!canAdd || globalDisabled}
            className="shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 size-4" />
            {config.addLabel ?? "Ajouter"}
          </Button>
        ) : null}
      </div>

      {listError ? (
        <div className="flex flex-col gap-1 rounded-lg bg-destructive/5 p-3 animate-in fade-in slide-in-from-top-2">
          {Array.isArray(listError) ? (
            listError.map((item, index) => (
              <div key={`${path}-error-${index}`} className="flex items-center gap-2 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive">
               <AlertCircle className="size-3.5" />
               <span>{listError}</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-10 px-4 text-center">
            <Layers className="mb-3 size-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground/60">
              Aucun élément pour le moment
            </p>
            {!isReadOnly && (
               <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4 text-primary hover:text-primary hover:bg-primary/5"
                onClick={handleAdd}
                disabled={!canAdd || globalDisabled}
               >
                 Commencer par ajouter un élément
               </Button>
            )}
          </div>
        ) : (
          items.map((_: unknown, index: number) => (
            <Card
              key={`${path}.${index}`}
              className="relative overflow-hidden border-border/40 bg-card/50 shadow-none transition-all duration-200 hover:border-border/80 hover:bg-card hover:shadow-md hover:shadow-black/5"
            >
              <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {config.itemLabel ?? "Élément"}
                  </span>
                </div>
                {!isReadOnly ? (
                  <div className="flex items-center gap-1">
                    {config.ordering?.activate ? (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0 || globalDisabled}
                          title="Déplacer vers le haut"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleMove(index, 1)}
                          disabled={
                            index === items.length - 1 || !!globalDisabled
                          }
                          title="Déplacer vers le bas"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(index)}
                      disabled={
                        (config.minItems
                          ? items.length <= config.minItems
                          : false) || !!globalDisabled
                      }
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className={cn("p-5", itemGridClassName)} style={itemGridGapStyle}>
                {config.fields.map((child) => (
                  <FieldRenderer
                    key={`${path}.${index}.${child.name}`}
                    config={child}
                    path={`${path}.${index}.${child.name}`}
                    form={form}
                    colSpan={child.colSpan ?? 1}
                    globalReadOnly={globalReadOnly}
                    globalDisabled={globalDisabled}
                    hiddenFields={hiddenFields}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
