import type { JSX } from "react";
import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Input } from "@/shared/ui/kit/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Textarea } from "@/shared/ui/kit/textarea";
import type { ReportingFilterGroup, ReportingFilterLeaf, ReportingFilterNode } from "@/widgets/reporting/types";

/**
 * UI-only filter leaf node used by the editor (adds `id` and `kind`).
 * @property id - Stable identifier for React rendering.
 * @property kind - Node kind.
 * @property field - Filter field.
 * @property lookup - Filter lookup.
 * @property value - Filter value (string-based editor).
 * @property negate - Negate leaf condition.
 */
export type ReportingFilterUiLeaf = {
  id: string;
  kind: "leaf";
  field: string;
  lookup: string;
  value: string;
  negate: boolean;
};

/**
 * UI-only filter group node used by the editor (adds `id` and `kind`).
 * @property id - Stable identifier for React rendering.
 * @property kind - Node kind.
 * @property op - Group operator.
 * @property negate - Negate the entire group.
 * @property items - Child nodes.
 */
export type ReportingFilterUiGroup = {
  id: string;
  kind: "group";
  op: "and" | "or";
  negate: boolean;
  items: ReportingFilterUiNode[];
};

/**
 * Union of filter UI nodes.
 */
export type ReportingFilterUiNode = ReportingFilterUiLeaf | ReportingFilterUiGroup;

/**
 * Props for the filter tree editor.
 * @property value - Current filter value in backend format.
 * @property onChange - Called whenever the filter tree changes.
 * @property availableFields - Optional list of suggested fields.
 * @property allowedLookups - Optional list of allowed lookups.
 * @property title - Optional editor title.
 */
export type ReportingFilterTreeEditorProps = {
  value: ReportingFilterNode | ReportingFilterNode[] | null | undefined;
  onChange: (next: ReportingFilterNode | ReportingFilterNode[] | null) => void;
  availableFields?: string[];
  allowedLookups?: string[];
  title?: string;
};

/**
 * Create a new leaf UI node.
 *
 * @param seed - Optional seed values.
 * @returns UI node.
 */
function createLeaf(seed?: Partial<ReportingFilterUiLeaf>): ReportingFilterUiLeaf {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `leaf-${Date.now()}-${Math.random()}`,
    kind: "leaf",
    field: seed?.field ?? "",
    lookup: seed?.lookup ?? "exact",
    value: seed?.value ?? "",
    negate: seed?.negate ?? false,
  };
}

/**
 * Create a new group UI node.
 *
 * @param seed - Optional seed values.
 * @returns UI node.
 */
function createGroup(seed?: Partial<ReportingFilterUiGroup>): ReportingFilterUiGroup {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `group-${Date.now()}-${Math.random()}`,
    kind: "group",
    op: seed?.op ?? "and",
    negate: seed?.negate ?? false,
    items: seed?.items ?? [createLeaf()],
  };
}

/**
 * Convert backend filter nodes into UI nodes.
 *
 * @param value - Backend filter node(s).
 * @returns UI tree root.
 */
function toUiTree(
  value: ReportingFilterNode | ReportingFilterNode[] | null | undefined,
): ReportingFilterUiGroup {
  const normalize = (node: ReportingFilterNode): ReportingFilterUiNode => {
    if ("items" in node) {
      return createGroup({
        op: node.op,
        negate: !!node.negate,
        items: (node.items ?? []).map(normalize),
      });
    }
    return createLeaf({
      field: node.field,
      lookup: node.lookup ?? "exact",
      value: node.value === undefined || node.value === null ? "" : String(node.value),
      negate: !!node.negate,
    });
  };

  if (!value) {
    return createGroup({ items: [] });
  }
  if (Array.isArray(value)) {
    return createGroup({ op: "and", items: value.map(normalize) });
  }
  if ("items" in value) {
    return normalize(value) as ReportingFilterUiGroup;
  }
  return createGroup({ op: "and", items: [normalize(value)] });
}

/**
 * Convert UI tree into backend filter nodes.
 *
 * @param node - UI node.
 * @returns Backend node.
 */
function fromUiNode(node: ReportingFilterUiNode): ReportingFilterNode {
  if (node.kind === "group") {
    const group: ReportingFilterGroup = {
      op: node.op,
      items: node.items.map(fromUiNode),
      negate: node.negate || undefined,
    };
    return group;
  }
  const leaf: ReportingFilterLeaf = {
    field: node.field,
    lookup: node.lookup,
    value: node.value === "" ? null : node.value,
    negate: node.negate || undefined,
  };
  return leaf;
}

/**
 * Replace a node in a UI tree.
 *
 * @param root - Root node.
 * @param nodeId - Target node identifier.
 * @param updater - Function returning updated node.
 * @returns Updated root.
 */
function updateUiTree(
  root: ReportingFilterUiGroup,
  nodeId: string,
  updater: (node: ReportingFilterUiNode) => ReportingFilterUiNode,
): ReportingFilterUiGroup {
  const walk = (node: ReportingFilterUiNode): ReportingFilterUiNode => {
    if (node.id === nodeId) return updater(node);
    if (node.kind === "group") {
      return { ...node, items: node.items.map(walk) };
    }
    return node;
  };
  return walk(root) as ReportingFilterUiGroup;
}

/**
 * Remove a node from a UI tree.
 *
 * @param root - Root node.
 * @param nodeId - Target node identifier.
 * @returns Updated root.
 */
function removeFromUiTree(root: ReportingFilterUiGroup, nodeId: string): ReportingFilterUiGroup {
  const walk = (node: ReportingFilterUiNode): ReportingFilterUiNode | null => {
    if (node.id === nodeId) return null;
    if (node.kind === "group") {
      const nextItems = node.items.map(walk).filter(Boolean) as ReportingFilterUiNode[];
      return { ...node, items: nextItems };
    }
    return node;
  };
  return (walk(root) as ReportingFilterUiGroup) ?? createGroup({ items: [] });
}

/**
 * Render a filter tree editor for reporting queries.
 */
export function ReportingFilterTreeEditor({
  value,
  onChange,
  availableFields = [],
  allowedLookups = ["exact", "icontains", "gte", "lte", "in"],
  title = "Filtres",
}: ReportingFilterTreeEditorProps): JSX.Element {
  const uiTree = toUiTree(value);

  const emit = useCallback(
    (nextTree: ReportingFilterUiGroup) => {
      const backend = fromUiNode(nextTree);
      onChange(backend);
    },
    [onChange],
  );

  const updateNode = useCallback(
    (id: string, next: Partial<ReportingFilterUiLeaf | ReportingFilterUiGroup>) => {
      const nextTree = updateUiTree(uiTree, id, (node) => ({ ...node, ...next } as ReportingFilterUiNode));
      emit(nextTree);
    },
    [emit, uiTree],
  );

  const addLeafToGroup = useCallback(
    (groupId: string) => {
      const nextTree = updateUiTree(uiTree, groupId, (node) => {
        if (node.kind !== "group") return node;
        return { ...node, items: [...node.items, createLeaf()] };
      });
      emit(nextTree);
    },
    [emit, uiTree],
  );

  const addGroupToGroup = useCallback(
    (groupId: string) => {
      const nextTree = updateUiTree(uiTree, groupId, (node) => {
        if (node.kind !== "group") return node;
        return { ...node, items: [...node.items, createGroup()] };
      });
      emit(nextTree);
    },
    [emit, uiTree],
  );

  const removeNode = useCallback(
    (id: string) => {
      emit(removeFromUiTree(uiTree, id));
    },
    [emit, uiTree],
  );

  const renderNode = (node: ReportingFilterUiNode, depth: number): JSX.Element => {
    if (node.kind === "group") {
      return (
        <div
          key={node.id}
          className="space-y-2 rounded-md border bg-background p-3"
          style={{ marginLeft: depth * 10 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={node.op} onValueChange={(val) => updateNode(node.id, { op: val as "and" | "or" })}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Op" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">ET</SelectItem>
                  <SelectItem value="or">OU</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox checked={node.negate} onCheckedChange={() => updateNode(node.id, { negate: !node.negate })} />
                <span className="text-xs text-muted-foreground">NON</span>
              </div>
            </div>
            {depth > 0 ? (
              <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)} title="Supprimer le groupe">
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            {node.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune condition.</p>
            ) : (
              node.items.map((child) => renderNode(child, depth + 1))
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addLeafToGroup(node.id)}>
              <Plus className="mr-1 h-4 w-4" /> Condition
            </Button>
            <Button variant="outline" size="sm" onClick={() => addGroupToGroup(node.id)}>
              <Plus className="mr-1 h-4 w-4" /> Groupe
            </Button>
          </div>
        </div>
      );
    }

    const fieldChoices = availableFields.length > 0 ? availableFields : [];

    return (
      <div
        key={node.id}
        className="grid gap-2 rounded-md border bg-card p-3 md:grid-cols-12"
        style={{ marginLeft: depth * 10 }}
      >
        <div className="md:col-span-4">
          <label className="text-[11px] font-semibold text-muted-foreground">Champ</label>
          {fieldChoices.length > 0 ? (
            <Select value={node.field} onValueChange={(val) => updateNode(node.id, { field: val })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Champ..." />
              </SelectTrigger>
              <SelectContent>
                {fieldChoices.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={node.field} onChange={(e) => updateNode(node.id, { field: e.target.value })} />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] font-semibold text-muted-foreground">Lookup</label>
          <Select value={node.lookup} onValueChange={(val) => updateNode(node.id, { lookup: val })}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Lookup" />
            </SelectTrigger>
            <SelectContent>
              {allowedLookups.map((lookup) => (
                <SelectItem key={lookup} value={lookup}>
                  {lookup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-4">
          <label className="text-[11px] font-semibold text-muted-foreground">Valeur</label>
          <Textarea
            rows={1}
            className="h-8 resize-none py-1 text-xs"
            value={node.value}
            onChange={(e) => updateNode(node.id, { value: e.target.value })}
            placeholder="Valeur..."
          />
        </div>

        <div className="md:col-span-1">
          <label className="text-[11px] font-semibold text-muted-foreground">NON</label>
          <div className="flex h-8 items-center">
            <Checkbox checked={node.negate} onCheckedChange={() => updateNode(node.id, { negate: !node.negate })} />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)} title="Supprimer la condition">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={!value}
          title="Effacer"
        >
          Effacer
        </Button>
      </div>
      {renderNode(uiTree, 0)}
    </div>
  );
}
