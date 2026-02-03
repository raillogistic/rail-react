import { ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/lib/components/ui/badge";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { Loader2, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
} from "@/lib/metadata/persisted-cache";
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
      className="mt-0.5 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-70")}
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
    <div className="flex items-start gap-2 rounded-md border px-2 py-2 text-sm transition-colors hover:bg-muted/40">
      {sortHandle}
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(accessor, label)}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{label}</span>
          {description ? (
            <span className="truncate text-xs text-muted-foreground">
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
}) {
  const [open, setOpen] = useState(false);
  const relationKey = relation
    ? `${relation.relatedApp}.${relation.relatedModel}`
    : "";
  const isCycle = !!relationKey && ancestry.includes(relationKey);
  const canExpand =
    !!relation &&
    depth < maxDepth &&
    !isCycle &&
    !!relation.relatedApp &&
    !!relation.relatedModel;

  const { metadata, loading, error } = useRelatedModelMetadata(
    relation?.relatedApp ?? "",
    relation?.relatedModel ?? "",
    open && canExpand,
  );
  const showError = !metadata && !!error;

  const relationLabel = labelPath.join(" / ") || field.verboseName || field.name;
  const relationMeta = relation?.relatedModelVerbose ?? relation?.relatedModel;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <div className="flex items-start gap-2 rounded-md border px-2 py-2">
        {sortHandle}
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(accessor, relationLabel)}
        />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "mt-0.5 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground",
              !canExpand && "pointer-events-none opacity-40",
            )}
            aria-label={open ? "Replier la relation" : "Deplier la relation"}
          >
            <ChevronRight
              className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
            />
          </button>
        </CollapsibleTrigger>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{relationLabel}</span>
            {relation?.isToMany ? (
              <Badge variant="outline">plusieurs</Badge>
            ) : null}
          </div>
          {relationMeta ? (
            <span className="truncate text-xs text-muted-foreground">
              {relationMeta}
            </span>
          ) : null}
        </div>
      </div>
      {canExpand ? (
        <CollapsibleContent className="ml-6 border-l pl-4">
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
            />
          ) : loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Chargement des champs lies...
            </div>
          ) : showError ? (
            <div className="text-xs text-destructive">
              Echec du chargement des metadonnees liees.
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Aucun champ lie disponible.
            </div>
          )}
        </CollapsibleContent>
      ) : null}
      {isCycle ? (
        <div className="ml-6 text-xs text-muted-foreground">
          Cycle detecte. Champs imbriques desactives.
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
}: ExportFieldTreeProps) {
  const relationLookup = useMemo(() => {
    const lookup = new Map<string, RelationshipSchema>();
    metadata.relationships.forEach((relation) => {
      if (relation.name) lookup.set(relation.name, relation);
      if (relation.fieldName) lookup.set(relation.fieldName, relation);
    });
    return lookup;
  }, [metadata.relationships]);

  const allowSorting = depth === 0 && !!onFieldOrderChange;
  const fields = useMemo(() => {
    const readableFields = metadata.fields.filter(isReadableField);
    if (!allowSorting) {
      return readableFields.sort((a, b) =>
        a.verboseName.localeCompare(b.verboseName),
      );
    }

    const fieldMap = new Map<string, FieldSchema>();
    readableFields.forEach((field) => fieldMap.set(field.name, field));

    const ordered: FieldSchema[] = [];
    (fieldOrder ?? []).forEach((fieldName) => {
      const field = fieldMap.get(fieldName);
      if (field) {
        ordered.push(field);
        fieldMap.delete(fieldName);
      }
    });

    if (fieldMap.size > 0) {
      ordered.push(
        ...Array.from(fieldMap.values()).sort((a, b) =>
          a.verboseName.localeCompare(b.verboseName),
        ),
      );
    }

    return ordered;
  }, [metadata.fields, allowSorting, fieldOrder]);

  const resolvedLabelPath = labelPath ?? [];
  const modelKey = `${metadata.app}.${metadata.model}`;
  const ancestryChain = ancestry?.length ? ancestry : [modelKey];
  const fieldIds = fields.map((field) => field.name);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowSorting || !onFieldOrderChange) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fieldIds.indexOf(String(active.id));
    const newIndex = fieldIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onFieldOrderChange(arrayMove(fieldIds, oldIndex, newIndex));
  };

  const rows = fields.map((field) => {
    const accessorSegment = field.fieldName || field.name;
    const accessor = accessorPrefix
      ? `${accessorPrefix}.${accessorSegment}`
      : accessorSegment;
    const nextLabelPath = [...resolvedLabelPath, field.verboseName];
    const label = nextLabelPath.join(" / ");
    const description =
      accessorPrefix && resolvedLabelPath.length
        ? resolvedLabelPath.join(" / ")
        : field.fieldName !== field.name
          ? field.fieldName
          : undefined;

    const renderRow = (sortHandle?: ReactNode) => {
      if (field.isRelation) {
        const relation =
          relationLookup.get(field.fieldName) ??
          relationLookup.get(field.name) ??
          null;
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

    if (!allowSorting) {
      return renderRow();
    }

    return (
      <SortableFieldItem key={accessor} id={field.name}>
        {(handleProps) =>
          renderRow(<SortHandleButton {...handleProps} />)
        }
      </SortableFieldItem>
    );
  });

  if (!allowSorting) {
    return <div className="space-y-2">{rows}</div>;
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={fieldIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">{rows}</div>
      </SortableContext>
    </DndContext>
  );
}
