/**
 * Renders a repeatable list field with add/remove/reorder controls.
 * Optimized for maximum space efficiency and ultra-modern aesthetics.
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
  const itemGridGapStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (config.itemGap === undefined) return undefined;
    return {
      gap: typeof config.itemGap === "number" ? `${config.itemGap}px` : config.itemGap,
    };
  }, [config.itemGap]);

  const itemGridClassName = React.useMemo(
    () => cn("grid", buildResponsiveGridClass(itemColumns), config.itemClassName),
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
    (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
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
  const canAdd = !config.maxItems || (Array.isArray(items) && items.length < config.maxItems);

  const isReadOnly = globalReadOnly || config.readOnly;
  const showAddButton = config.showAddButton ?? true;
  const sortingMode = config.sortingMode ?? "drag&drop";
  const isOrderingEnabled =
    (config.sortable ?? config.ordering?.activate ?? false) && !isReadOnly && !globalDisabled;
  const useDragAndDrop = isOrderingEnabled && sortingMode === "drag&drop";
  const useButtonsOrdering = isOrderingEnabled && sortingMode === "buttons";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
        const oldIndex = (items ?? []).findIndex((_: any, idx: number) => `item-${idx}` === active.id);
        const newIndex = (items ?? []).findIndex((_: any, idx: number) => `item-${idx}` === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          fieldApi.setValue(enforceOrdering(newItems));
        }
      }
    },
    [items, fieldApi, enforceOrdering]
  );

  const handleMove = React.useCallback(
    (index: number, direction: "up" | "down") => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= (items ?? []).length) return;
      fieldApi.setValue(enforceOrdering(arrayMove(items, index, nextIndex)));
    },
    [enforceOrdering, fieldApi, items],
  );

  return (
    <div
      className="group/list-container relative flex flex-col gap-3 rounded-2xl border border-border/40 bg-muted/5 p-1 transition-all duration-500"
      style={colSpan ? { gridColumn: `span ${colSpan} / span ${colSpan}` } : undefined}
    >
      {/* List Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold tracking-tight text-foreground">{config.label}</h4>
            {config.description && (
              <p className="text-[10px] font-medium text-muted-foreground/60">
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
            className="h-8 rounded-lg px-3 text-xs font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-1.5 size-3.5 stroke-[3px]" />
            {config.addLabel ?? "Ajouter"}
          </Button>
        )}
      </div>

      {listError && (
        <div className="mx-4 mb-1 flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-3.5" />
          <div className="flex flex-col">
            {Array.isArray(listError) ? listError.map((err, i) => <span key={i}>{err}</span>) : <span>{listError}</span>}
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="flex flex-col gap-1 px-1 pb-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-background/20 py-10 text-center">
            <Layers className="mb-2 size-6 text-muted-foreground/20" />
            <p className="text-[11px] font-bold text-muted-foreground/40">
              Liste vide
            </p>
            {!isReadOnly && showAddButton && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/5"
                onClick={handleAdd}
                disabled={!canAdd || globalDisabled}
              >
                Ajouter un élément
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
              <div className="space-y-2">
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
                    canMoveDown={useButtonsOrdering ? index < items.length - 1 : false}
                    onMoveUp={() => handleMove(index, "up")}
                    onMoveDown={() => handleMove(index, "down")}
                    onRemove={() => handleRemove(index)}
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
        isDragging && "scale-[1.01] shadow-xl"
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-all duration-300",
          "hover:border-border/80 hover:bg-card hover:shadow-sm",
          isDragging && "border-primary/50 ring-1 ring-primary/20 bg-card shadow-2xl"
        )}
      >
        {/* Item Minimal Header Bar */}
        <div className="flex items-center justify-between bg-muted/10 px-3 py-1.5 border-b border-border/5">
          <div className="flex items-center gap-2">
            {isOrderingEnabled && orderingMode === "drag&drop" && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab p-0.5 text-muted-foreground/30 transition-colors hover:text-primary active:cursor-grabbing"
              >
                <GripVertical className="size-3.5" />
              </button>
            )}
            <div className="flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-background px-1 font-mono text-[9px] font-black text-muted-foreground/60 shadow-xs">
              {String(index + 1).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {config.itemLabel ?? "Item"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
             {!isReadOnly && (
               <div className="flex items-center gap-1">
                 {orderingMode === "buttons" && (
                   <div className="mr-1 flex items-center gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-5 rounded-md hover:bg-background"
                        onClick={onMoveUp}
                        disabled={!canMoveUp || !!globalDisabled}
                      >
                        <ArrowUp className="size-2.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-5 rounded-md hover:bg-background"
                        onClick={onMoveDown}
                        disabled={!canMoveDown || !!globalDisabled}
                      >
                        <ArrowDown className="size-2.5" />
                      </Button>
                   </div>
                 )}
                 <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-5 rounded-md text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onRemove}
                    disabled={!!globalDisabled}
                  >
                    <Trash2 className="size-2.5" />
                  </Button>
               </div>
             )}
          </div>
        </div>

        {/* Compact Fields Area */}
        <div className={cn("p-3 sm:p-4 gap-x-4 gap-y-3", itemGridClassName)} style={itemGridGapStyle}>
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
  );
};
