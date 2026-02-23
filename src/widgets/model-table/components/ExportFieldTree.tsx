import { ReactNode, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/shared/ui/kit/badge";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import { 
  Loader2, 
  ChevronRight, 
  GripVertical, 
  Layers
} from "lucide-react";
import { cn } from "@/shared/utils";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import { GET_MODEL_SCHEMA } from "../queries";
import { mergeModelSchemaWithRelationships } from "../utils";
import type {
  FieldSchema,
  ModelSchema,
  RelationshipSchema,
} from "../types";

export type ExportFieldSelection = Record<string, string>;

export const isReadableField = (field: FieldSchema) =>
  field.readable && field.visibility !== "hidden";

type ExportFieldTreeProps = {
  metadata: ModelSchema;
  selected: ExportFieldSelection;
  onToggle: (accessor: string, label: string) => void;
  depth?: number;
  maxDepth: number;
  accessorPrefix?: string;
  labelPath?: string[];
  ancestry?: string[];
  fieldOrder?: string[];
  onFieldOrderChange?: (order: string[]) => void;
  searchFilter?: string;
};

const useRelatedModelMetadata = (
  app: string,
  model: string,
  enabled: boolean,
) => {
  const persisted = useMemo(
    () => readPersistedTableMetadata(app, model) as ModelSchema | null,
    [app, model],
  );

  const { data, loading, error } = useQuery(GET_MODEL_SCHEMA, {
    variables: { app, model },
    skip: !enabled || !app || !model,
    fetchPolicy: "cache-first",
    errorPolicy: "all",
  });

  useEffect(() => {
    if (data?.modelSchema) {
      persistTableMetadata(app, model, { modelSchema: data.modelSchema });
    }
  }, [app, model, data]);

  return {
    metadata: mergeModelSchemaWithRelationships(
      (data?.modelSchema ?? persisted) as ModelSchema | null,
    ),
    loading,
    error,
  };
};

type SortHandleProps = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>;

function SortHandleButton({
  attributes,
  listeners,
  setActivatorNodeRef,
}: SortHandleProps) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="rounded-lg p-1.5 text-muted-foreground/30 transition-all hover:text-primary hover:bg-primary/10 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      aria-label="Reordonner le champ"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

function SortableFieldItem({
  id,
  children,
}: {
  id: string;
  children: (handleProps: SortHandleProps) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-40 scale-[0.98] z-50 ring-2 ring-primary/20 bg-muted/50 rounded-xl"
      )}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

function FieldLeafRow({
  accessor,
  label,
  description,
  selected,
  onToggle,
  sortHandle,
}: {
  accessor: string;
  label: string;
  description?: string;
  selected: boolean;
  onToggle: (accessor: string, label: string) => void;
  sortHandle?: ReactNode;
}) {
  return (
    <div className={cn(
      "group/leaf relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-300",
      selected ? "bg-primary/[0.04] border-primary/10" : "hover:bg-muted/40",
    )}>
      {sortHandle}
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(accessor, label)}
          className="h-5 w-5 rounded-md border-muted-foreground/30 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex min-w-0 flex-col">
          <span className={cn(
            "truncate text-sm font-semibold transition-colors duration-300",
            selected ? "text-primary" : "text-foreground/80 group-hover/leaf:text-foreground"
          )}>{label}</span>
          {description ? (
            <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover/leaf:text-muted-foreground/60">
              {description}
            </span>
          ) : null}
        </div>
      </label>
    </div>
  );
}

function RelationFieldRow({
  field,
  relation,
  accessor,
  labelPath,
  selected,
  onToggle,
  depth,
  maxDepth,
  ancestry,
  sortHandle,
  searchFilter,
}: {
  field: FieldSchema;
  relation: RelationshipSchema | null;
  accessor: string;
  labelPath: string[];
  selected: boolean;
  onToggle: (accessor: string, label: string) => void;
  depth: number;
  maxDepth: number;
  ancestry: string[];
  sortHandle?: ReactNode;
  searchFilter?: string;
}) {
  const isSearching = !!(searchFilter && searchFilter.length > 1);
  const relationKey = relation ? `${relation.relatedApp}.${relation.relatedModel}` : "";
  const isCycle = !!relationKey && ancestry.includes(relationKey);
  const canExpand = !!relation && depth < maxDepth && !isCycle && !!relation.relatedApp && !!relation.relatedModel;

  const { metadata, loading, error } = useRelatedModelMetadata(
    relation?.relatedApp ?? "",
    relation?.relatedModel ?? "",
    canExpand, // Always enable query for simplicity during tree traversal
  );
  const showError = !metadata && !!error;

  const relationLabel = labelPath.join(" / ") || field.verboseName || field.name;
  const relationMeta = relation?.relatedModelVerbose ?? relation?.relatedModel;

  return (
    <Collapsible defaultOpen={isSearching} className="group/relation w-full overflow-hidden">
      <div className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-300",
        selected ? "bg-primary/[0.04] border-primary/10" : "hover:bg-muted/40 hover:translate-x-0.5",
      )}>
        {sortHandle}
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(accessor, relationLabel)}
          className="h-5 w-5 rounded-md border-muted-foreground/30 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-lg p-1 text-muted-foreground/40 transition-all hover:bg-primary/10 hover:text-primary",
              !canExpand && "pointer-events-none opacity-20",
            )}
          >
            <ChevronRight
              className={cn("h-4 w-4 transition-transform duration-500 ease-out group-data-[state=open]/relation:rotate-90")}
            />
          </button>
        </CollapsibleTrigger>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "truncate text-sm font-black transition-colors duration-300",
              selected ? "text-primary" : "text-foreground/80 group-hover/relation:text-foreground"
            )}>{relationLabel}</span>
            <Badge variant="outline" className={cn(
              "h-5 px-1.5 text-[9px] font-black uppercase tracking-tighter",
              relation?.isToMany ? "border-primary/20 bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground"
            )}>
              {relation?.isToMany ? "1:N" : "1:1"}
            </Badge>
          </div>
          {relationMeta ? (
            <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover/relation:text-muted-foreground/60">
              {relationMeta}
            </span>
          ) : null}
        </div>
      </div>
      {canExpand ? (
        <CollapsibleContent className="ml-8 mt-1 space-y-1 relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="absolute left-0 top-0 bottom-4 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
          <div className="pl-4 pb-2">
            {metadata ? (
              <ExportFieldTree
                metadata={metadata}
                selected={selected}
                onToggle={onToggle}
                depth={depth + 1}
                maxDepth={maxDepth}
                accessorPrefix={accessor}
                labelPath={labelPath}
                ancestry={[...ancestry, relationKey]}
                searchFilter={searchFilter}
              />
            ) : loading ? (
              <div className="flex items-center gap-2.5 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60" />
                Chargement...
              </div>
            ) : showError ? (
              <div className="rounded-lg bg-red-50/50 px-3 py-2 text-[11px] font-bold text-red-500/80">
                Erreur de chargement.
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      ) : null}
      {isCycle ? (
        <div className="ml-8 mt-1 border-l border-dashed border-orange-200 pl-4 py-2 text-[10px] font-bold uppercase tracking-widest text-orange-400/60">
          Cycle dÃ©tectÃ© (rÃ©cursion bloquÃ©e)
        </div>
      ) : null}
    </Collapsible>
  );
}

export function ExportFieldTree({
  metadata,
  selected,
  onToggle,
  depth = 0,
  maxDepth,
  accessorPrefix,
  labelPath,
  ancestry,
  fieldOrder,
  onFieldOrderChange,
  searchFilter,
}: ExportFieldTreeProps) {
  const isRoot = depth === 0;

  const relationLookup = useMemo(() => {
    const lookup = new Map<string, RelationshipSchema>();
    metadata.relationships.forEach((relation) => {
      if (relation.name) lookup.set(relation.name, relation);
      if (relation.fieldName) lookup.set(relation.fieldName, relation);
    });
    return lookup;
  }, [metadata.relationships]);

  const allowSorting = isRoot && !!onFieldOrderChange && !searchFilter;
  
  const filteredFields = useMemo(() => {
    const readableFields = metadata.fields.filter(isReadableField);
    
    let sorted: FieldSchema[];
    if (allowSorting) {
      const fieldMap = new Map<string, FieldSchema>();
      readableFields.forEach((f) => fieldMap.set(f.name, f));
      
      sorted = [];
      (fieldOrder ?? []).forEach((name) => {
        const field = fieldMap.get(name);
        if (field) {
          sorted.push(field);
          fieldMap.delete(name);
        }
      });
      
      if (fieldMap.size > 0) {
        sorted.push(...Array.from(fieldMap.values()).sort((a, b) => 
          a.verboseName.localeCompare(b.verboseName)
        ));
      }
    } else {
      sorted = readableFields.sort((a, b) => a.verboseName.localeCompare(b.verboseName));
    }

    if (!searchFilter || searchFilter.length < 2) return sorted;

    const query = searchFilter.toLowerCase();
    return sorted.filter(f => 
      f.verboseName.toLowerCase().includes(query) || 
      f.name.toLowerCase().includes(query) ||
      (f.fieldName && f.fieldName.toLowerCase().includes(query)) ||
      f.isRelation
    );
  }, [metadata.fields, allowSorting, fieldOrder, searchFilter]);

  const resolvedLabelPath = labelPath ?? [];
  const modelKey = `${metadata.app}.${metadata.model}`;
  const ancestryChain = ancestry?.length ? ancestry : [modelKey];
  const fieldIds = filteredFields.map((field) => field.name);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!allowSorting || !onFieldOrderChange) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fieldIds.indexOf(String(active.id));
    const newIndex = fieldIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onFieldOrderChange(arrayMove(fieldIds, oldIndex, newIndex));
  }, [allowSorting, onFieldOrderChange, fieldIds]);

  return (
    <div className="w-full">
      {filteredFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 mb-4">
            <Layers className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Aucun champ trouvÃ©</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {filteredFields.map((field) => {
                const accessorSegment = field.name || field.fieldName;
                const accessor = accessorPrefix
                  ? `${accessorPrefix}.${accessorSegment}`
                  : accessorSegment;
                const nextLabelPath = [...resolvedLabelPath, field.verboseName];
                const label = nextLabelPath.join(" / ");
                const description = accessorPrefix && resolvedLabelPath.length
                  ? resolvedLabelPath.join(" / ")
                  : field.fieldName !== field.name ? field.fieldName : undefined;

                const renderContent = (sortHandle?: ReactNode) => {
                  if (field.isRelation) {
                    const relation = relationLookup.get(field.fieldName) ?? relationLookup.get(field.name) ?? null;
                    return (
                      <RelationFieldRow
                        key={accessor}
                        field={field}
                        relation={relation}
                        accessor={accessor}
                        labelPath={nextLabelPath}
                        selected={!!selected[accessor]}
                        onToggle={onToggle}
                        depth={depth}
                        maxDepth={maxDepth}
                        ancestry={ancestryChain}
                        sortHandle={sortHandle}
                        searchFilter={searchFilter}
                      />
                    );
                  }

                  return (
                    <FieldLeafRow
                      key={accessor}
                      accessor={accessor}
                      label={label}
                      description={description}
                      selected={!!selected[accessor]}
                      onToggle={onToggle}
                      sortHandle={sortHandle}
                    />
                  );
                };

                if (!allowSorting) return renderContent();

                return (
                  <SortableFieldItem key={accessor} id={field.name}>
                    {(handleProps) => renderContent(<SortHandleButton {...handleProps} />)}
                  </SortableFieldItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

