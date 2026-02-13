/**
 * Renders a repeatable list field with add/remove/reorder controls.
 * Redesigned for maximum space efficiency and modern aesthetics.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { ListFieldConfig } from "../types/schema";
import { resolveFieldErrors, resolveRequiredError } from "../inputs/common";
import { FieldRenderer } from "./FieldRenderer";
import { buildResponsiveGridClass } from "./utils";
import { buildDefaultsFromFields } from "../hooks/useFormDefaults";
import { createValidators } from "./FieldRenderer";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
      cn("grid", buildResponsiveGridClass(itemColumns), config.itemClassName),
    [config.itemClassName, itemColumns],
  );

  return (
    <form.Field name={path as any} validators={validators}>
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
  const showAddButton = config.showAddButton ?? true;
  const sortingMode = config.sortingMode ?? "drag&drop";
  const isOrderingEnabled =
    (config.sortable ?? config.ordering?.activate ?? false) &&
    !isReadOnly &&
    !globalDisabled;
  const useDragAndDrop = isOrderingEnabled && sortingMode === "drag&drop";
  const useButtonsOrdering = isOrderingEnabled && sortingMode === "buttons";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = (items ?? []).findIndex(
          (_: any, idx: number) => `item-${idx}` === active.id,
        );
        const newIndex = (items ?? []).findIndex(
          (_: any, idx: number) => `item-${idx}` === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          fieldApi.setValue(enforceOrdering(newItems));
        }
      }
    },
    [items, fieldApi, enforceOrdering],
  );

  const handleMove = React.useCallback(
    (index: number, direction: "up" | "down") => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= (items ?? []).length)
        return;
      fieldApi.setValue(enforceOrdering(arrayMove(items, index, nextIndex)));
    },
    [enforceOrdering, fieldApi, items],
  );

  return (
    <div
      className="group/list-container relative flex flex-col gap-6 rounded-3xl border border-border/40 bg-muted/5 p-1 transition-all duration-500 hover:bg-muted/10"
      style={
        colSpan
          ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
          : undefined
      }
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Layers className="size-5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-base font-bold tracking-tight text-foreground">
              {config.label}
            </h4>
            {config.description && (
              <p className="text-xs font-medium text-muted-foreground/70">
                {config.description}
              </p>
            )}
          </div>
        </div>

        {!isReadOnly && showAddButton && (
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!canAdd || globalDisabled}
            className="h-9 rounded-xl px-4 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 size-4 stroke-[3px]" />
            {config.addLabel ?? "Ajouter"}
          </Button>
        )}
      </div>

      {listError && (
        <div className="mx-6 mb-2 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="size-4" />
          <div className="flex flex-col gap-0.5">
            {Array.isArray(listError) ? (
              listError.map((err, i) => <span key={i}>{err}</span>)
            ) : (
              <span>{listError}</span>
            )}
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="flex flex-col gap-1 px-2 pb-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border/40 bg-background/20 py-16 text-center transition-colors hover:border-border/60">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/30">
              <Layers className="size-8 text-muted-foreground/30" />
            </div>
            <p className="max-w-[200px] text-sm font-bold text-muted-foreground/40">
              Aucun élément n'a encore été ajouté à cette liste.
            </p>
            {!isReadOnly && showAddButton && (
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-xl border-dashed bg-transparent font-bold hover:bg-primary/5 hover:text-primary"
                onClick={handleAdd}
                disabled={!canAdd || globalDisabled}
              >
                Ajouter le premier élément
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((_: any, idx: number) => `item-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {items.map((_: unknown, index: number) => (
                  <SortableListItem
                    key={`item-${index}`}
                    id={`item-${index}`}
                    index={index}
                    config={config}
                    path={path}
                    form={form}
                    itemGridClassName={itemGridClassName}
                    itemGridGapStyle={itemGridGapStyle}
                    isReadOnly={isReadOnly}
                    globalDisabled={globalDisabled}
                    hiddenFields={hiddenFields}
                    isOrderingEnabled={useDragAndDrop}
                    orderingMode={sortingMode}
                    canMoveUp={useButtonsOrdering ? index > 0 : false}
                    canMoveDown={
                      useButtonsOrdering ? index < items.length - 1 : false
                    }
                    onMoveUp={() => handleMove(index, "up")}
                    onMoveDown={() => handleMove(index, "down")}
                    onRemove={() => handleRemove(index)}
                    totalItems={items.length}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

// ─── Sortable Item Component ────────────────────────────────────────────────

type SortableListItemProps<TValues> = {
  id: string;
  index: number;
  config: ListFieldConfig;
  path: string;
  form: UseFormReturn<TValues>;
  itemGridClassName: string;
  itemGridGapStyle?: React.CSSProperties;
  isReadOnly?: boolean;
  globalDisabled?: boolean;
  hiddenFields?: Set<string>;
  isOrderingEnabled?: boolean;
  orderingMode?: "drag&drop" | "buttons";
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  totalItems: number;
};

const SortableListItem = <TValues extends Record<string, any>>({
  id,
  index,
  config,
  path,
  form,
  itemGridClassName,
  itemGridGapStyle,
  isReadOnly,
  globalDisabled,
  hiddenFields,
  isOrderingEnabled,
  orderingMode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  totalItems,
}: SortableListItemProps<TValues>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/item relative transition-all duration-300",
        isDragging && "scale-[1.02] shadow-2xl",
      )}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-sm transition-all duration-300",
          "hover:border-border/80 hover:bg-card hover:shadow-md",
          isDragging &&
            "border-primary/50 ring-1 ring-primary/20 bg-card shadow-2xl",
        )}
      >
        <div className="flex w-full">
          {/* Sidebar Area: Drag Handle & Index */}
          <div
            className={cn(
              "flex w-10 flex-col items-center justify-between border-r border-border/30 bg-muted/30 py-4 transition-colors",
              isDragging ? "bg-primary/5" : "group-hover/item:bg-muted/50",
            )}
          >
            {isOrderingEnabled && orderingMode === "drag&drop" ? (
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab p-1 text-muted-foreground/30 transition-colors hover:text-primary active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </button>
            ) : (
              <div className="size-4" />
            )}

            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black tracking-tighter text-muted-foreground/20 uppercase [writing-mode:vertical-lr] rotate-180">
                {config.itemLabel ?? "Item"}
              </span>
              <div className="flex size-6 items-center justify-center rounded-lg bg-background font-mono text-[11px] font-bold text-muted-foreground shadow-xs">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="size-4" />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Inline Action Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/10 bg-muted/10 opacity-60 transition-opacity group-hover/item:opacity-100">
              <div className="flex items-center gap-2">
                <ChevronRight className="size-3 text-muted-foreground/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  {config.itemLabel ?? "Détails de l'élément"} #{index + 1}
                </span>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1.5">
                  {orderingMode === "buttons" && (
                    <div className="mr-2 flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6 rounded-md hover:bg-background"
                        onClick={onMoveUp}
                        disabled={!canMoveUp || !!globalDisabled}
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6 rounded-md hover:bg-background"
                        onClick={onMoveDown}
                        disabled={!canMoveDown || !!globalDisabled}
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6 rounded-md text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onRemove}
                    disabled={!!globalDisabled}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Fields Grid */}
            <div
              className={cn("p-4 gap-2 sm:p-6", itemGridClassName)}
              style={itemGridGapStyle}
            >
              {config.fields.map((child) => (
                <FieldRenderer
                  key={`${path}.${index}.${child.name}`}
                  config={child}
                  path={`${path}.${index}.${child.name}`}
                  form={form}
                  colSpan={child.colSpan ?? 1}
                  globalReadOnly={isReadOnly}
                  globalDisabled={globalDisabled}
                  hiddenFields={hiddenFields}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
