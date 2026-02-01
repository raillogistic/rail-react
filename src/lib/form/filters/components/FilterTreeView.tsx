/**
 * FilterTreeView - Improved tree visualization for nested filters.
 *
 * Features:
 * - Visual tree lines/connectors
 * - Depth indicators
 * - Animated collapse/expand
 * - Keyboard navigation support
 * - Integration with FilterTreeContext
 * - Inline operator and value editing
 */

import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  GripVertical,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import { Switch } from "@/lib/components/ui/switch";
import { Badge } from "@/lib/components/ui/badge";
import { cn } from "@/lib/utils";

import { useFilterTree } from "../context/FilterTreeContext";
import { CompactOperatorSelect } from "./CompactOperatorSelect";
import { SmartValueInput } from "./SmartValueInput";
import type { FilterCondition, FilterGroup as FilterGroupType, FilterableField, FilterOperator } from "../types";
import type { TreePath } from "../tree/types";

// ============================================================================
// Types
// ============================================================================

export interface FilterTreeViewProps {
  /** Whether to show tree connector lines */
  showConnectors?: boolean;
  /** Whether to show depth badges */
  showDepthBadges?: boolean;
  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;
  /** Whether to show keyboard hints */
  showKeyboardHints?: boolean;
  /** Custom class name */
  className?: string;
  /** Render prop for condition content */
  renderCondition?: (
    condition: FilterCondition,
    path: TreePath,
    onUpdate: (updates: Partial<FilterCondition>) => void,
    onRemove: () => void
  ) => React.ReactNode;
  /** Render prop for add condition trigger */
  renderAddTrigger?: (onClick: () => void, groupPath: TreePath) => React.ReactNode;
  /** Called when a field should be selected */
  onSelectField?: (groupPath: TreePath) => void;
}

interface TreeNodeProps {
  node: FilterCondition | FilterGroupType;
  path: TreePath;
  depth: number;
  isLast: boolean;
  parentConnectors: boolean[];
  showConnectors: boolean;
  showDepthBadges: boolean;
  enableDragDrop: boolean;
  renderCondition?: FilterTreeViewProps["renderCondition"];
  renderAddTrigger?: FilterTreeViewProps["renderAddTrigger"];
  onSelectField?: FilterTreeViewProps["onSelectField"];
}

// ============================================================================
// Tree Connector Component
// ============================================================================

interface TreeConnectorsProps {
  depth: number;
  isLast: boolean;
  parentConnectors: boolean[];
  hasChildren?: boolean;
  isExpanded?: boolean;
}

function TreeConnectors({
  depth,
  isLast,
  parentConnectors,
  hasChildren = false,
  isExpanded = true,
}: TreeConnectorsProps) {
  if (depth === 0) return null;

  return (
    <div className="flex shrink-0" aria-hidden="true">
      {/* Parent level connectors */}
      {parentConnectors.map((hasLine, index) => (
        <div
          key={index}
          className="w-4 h-full relative"
        >
          {hasLine && (
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
          )}
        </div>
      ))}

      {/* Current level connector */}
      <div className="w-4 h-full relative">
        {/* Vertical line */}
        <div
          className={cn(
            "absolute left-2 w-px bg-border",
            isLast ? "top-0 h-3" : "top-0 bottom-0"
          )}
        />
        {/* Horizontal line */}
        <div className="absolute left-2 top-3 w-2 h-px bg-border" />
      </div>
    </div>
  );
}

// ============================================================================
// Tree Group Component
// ============================================================================

interface TreeGroupProps extends Omit<TreeNodeProps, "node"> {
  group: FilterGroupType;
}

function TreeGroup({
  group,
  path,
  depth,
  isLast,
  parentConnectors,
  showConnectors,
  showDepthBadges,
  enableDragDrop,
  renderCondition,
  renderAddTrigger,
  onSelectField,
}: TreeGroupProps) {
  const { config, dispatch, getStats } = useFilterTree();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  const canAddGroup = depth < config.maxDepth;
  const canAddMore = group.conditions.length < config.maxFiltersPerGroup;

  const handleLogicChange = useCallback(
    (logic: "AND" | "OR") => {
      dispatch({
        type: "SET_GROUP_LOGIC",
        payload: { path, logic },
      });
    },
    [dispatch, path]
  );

  const handleToggleNegation = useCallback(() => {
    dispatch({ type: "TOGGLE_GROUP_NEGATION", payload: path });
  }, [dispatch, path]);

  const handleRemove = useCallback(() => {
    if (path.length === 0) return; // Can't remove root
    dispatch({ type: "REMOVE_BY_PATH", payload: path });
  }, [dispatch, path]);

  const handleAddGroup = useCallback(
    (logic: "AND" | "OR") => {
      dispatch({ type: "ADD_GROUP", payload: { parentPath: path, logic } });
    },
    [dispatch, path]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        setIsExpanded((prev) => !prev);
        e.preventDefault();
      }
    },
    []
  );

  // Calculate child connectors for this level
  const childConnectors = showConnectors
    ? [...parentConnectors, !isLast]
    : [];

  return (
    <div
      ref={groupRef}
      className={cn(
        "relative",
        isFocused && "ring-2 ring-primary/20 rounded-lg"
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`Filter group: ${group.logic} ${group.negated ? "(negated)" : ""}`}
    >
      <div className="flex items-start">
        {/* Tree connectors */}
        {showConnectors && (
          <TreeConnectors
            depth={depth}
            isLast={isLast}
            parentConnectors={parentConnectors}
            hasChildren={group.conditions.length > 0}
            isExpanded={isExpanded}
          />
        )}

        <div
          className={cn(
            "flex-1 min-w-0",
            depth > 0 && "border rounded-lg bg-muted/30 p-3 my-1"
          )}
        >
          {/* Group header */}
          <div className="flex items-center gap-2 min-h-[32px]">
            {/* Expand/collapse button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={`group-content-${group.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Drag handle */}
            {enableDragDrop && depth > 0 && (
              <div
                className="cursor-grab shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}

            {/* Logic toggle */}
            <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">
              Match
            </span>
            <ToggleGroup
              type="single"
              size="sm"
              value={group.logic}
              onValueChange={(value) => value && handleLogicChange(value as "AND" | "OR")}
              aria-label="Group logic"
            >
              <ToggleGroupItem value="AND" aria-label="Match all" className="h-6 px-2 text-xs">
                ALL
              </ToggleGroupItem>
              <ToggleGroupItem value="OR" aria-label="Match any" className="h-6 px-2 text-xs">
                ANY
              </ToggleGroupItem>
            </ToggleGroup>

            {/* NOT toggle */}
            {config.enableNot && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-muted-foreground">NOT</span>
                <Switch
                  checked={group.negated}
                  onCheckedChange={handleToggleNegation}
                  aria-label="Toggle NOT"
                  className="h-4 w-7"
                />
              </div>
            )}

            {/* Depth badge */}
            {showDepthBadges && (
              <Badge variant="outline" className="ml-2 text-[10px] h-5 shrink-0">
                {depth}/{config.maxDepth}
              </Badge>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Remove button (not for root) */}
            {path.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                onClick={handleRemove}
                aria-label="Remove group"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Group content */}
          <div
            id={`group-content-${group.id}`}
            className={cn(
              "overflow-hidden transition-all duration-200",
              isExpanded ? "opacity-100" : "opacity-0 h-0"
            )}
          >
            {isExpanded && (
              <div className="mt-2 space-y-1">
                {/* Children */}
                {group.conditions.map((child, index) => (
                  <TreeNode
                    key={child.id}
                    node={child}
                    path={[...path, index]}
                    depth={depth + 1}
                    isLast={index === group.conditions.length - 1}
                    parentConnectors={childConnectors}
                    showConnectors={showConnectors}
                    showDepthBadges={showDepthBadges}
                    enableDragDrop={enableDragDrop}
                    renderCondition={renderCondition}
                    renderAddTrigger={renderAddTrigger}
                    onSelectField={onSelectField}
                  />
                ))}

                {/* Add buttons */}
                <div className="flex items-center gap-2 mt-2 pt-2">
                  {canAddMore && (
                    renderAddTrigger ? (
                      renderAddTrigger(() => onSelectField?.(path), path)
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => onSelectField?.(path)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add filter
                      </Button>
                    )
                  )}

                  {canAddGroup && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleAddGroup("OR")}
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      Add group
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tree Condition Component
// ============================================================================

interface TreeConditionProps extends Omit<TreeNodeProps, "node"> {
  condition: FilterCondition;
}

function TreeCondition({
  condition,
  path,
  depth,
  isLast,
  parentConnectors,
  showConnectors,
  enableDragDrop,
  renderCondition,
}: TreeConditionProps) {
  const { dispatch, schema, getSchemaContext } = useFilterTree();

  // Get field and operator info from schema context
  const { field, operators, currentOperator } = useMemo(() => {
    const context = getSchemaContext(condition.fieldPath);
    const fieldInfo = context?.field;

    // Get operators for this field
    const ops = fieldInfo?.operators ?? [];
    const currentOp = ops.find((op) => op.name === condition.operator) ?? ops[0];

    return {
      field: fieldInfo,
      operators: ops,
      currentOperator: currentOp,
    };
  }, [condition.fieldPath, condition.operator, getSchemaContext]);

  const handleUpdate = useCallback(
    (updates: Partial<FilterCondition>) => {
      dispatch({
        type: "UPDATE_BY_PATH",
        payload: {
          path,
          updater: (node) => ({ ...node, ...updates }),
        },
      });
    },
    [dispatch, path]
  );

  const handleOperatorChange = useCallback(
    (operatorName: string) => {
      handleUpdate({ operator: operatorName });
    },
    [handleUpdate]
  );

  const handleValueChange = useCallback(
    (value: unknown) => {
      handleUpdate({ value });
    },
    [handleUpdate]
  );

  const handleRemove = useCallback(() => {
    dispatch({ type: "REMOVE_BY_PATH", payload: path });
  }, [dispatch, path]);

  // Get field label for display
  const fieldLabel = useMemo(() => {
    if (condition.fieldPath.length === 1) {
      return field?.fieldLabel ?? condition.fieldName;
    }
    // For nested paths, show abbreviated path
    return condition.fieldPath
      .map((segment, idx) => {
        if (idx === condition.fieldPath.length - 1) {
          return field?.fieldLabel ?? segment;
        }
        return segment;
      })
      .join(" → ");
  }, [condition.fieldPath, condition.fieldName, field]);

  return (
    <div className="flex items-start">
      {/* Tree connectors */}
      {showConnectors && (
        <TreeConnectors
          depth={depth}
          isLast={isLast}
          parentConnectors={parentConnectors}
        />
      )}

      <div className="flex-1 min-w-0 flex items-center gap-2 py-1">
        {/* Drag handle */}
        {enableDragDrop && (
          <div
            className="cursor-grab shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Condition content */}
        <div className="flex-1 min-w-0">
          {renderCondition ? (
            renderCondition(condition, path, handleUpdate, handleRemove)
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Field label */}
              <span className="text-xs font-medium text-muted-foreground shrink-0 max-w-[120px] truncate" title={fieldLabel}>
                {fieldLabel}
              </span>

              {/* Operator selector */}
              {field && operators.length > 0 && (
                <CompactOperatorSelect
                  field={field}
                  value={condition.operator}
                  onChange={handleOperatorChange}
                />
              )}

              {/* Value input */}
              {field && currentOperator && (
                <div className="flex-1 min-w-[120px] max-w-[200px]">
                  <SmartValueInput
                    field={field}
                    operator={currentOperator}
                    value={condition.value}
                    onChange={handleValueChange}
                  />
                </div>
              )}

              {/* Fallback if no field info */}
              {!field && (
                <span className="text-xs text-muted-foreground italic">
                  Field not found
                </span>
              )}

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tree Node Dispatcher
// ============================================================================

function TreeNode(props: TreeNodeProps) {
  if (props.node.type === "group") {
    return <TreeGroup {...props} group={props.node as FilterGroupType} />;
  }
  return <TreeCondition {...props} condition={props.node as FilterCondition} />;
}

// ============================================================================
// Main Component
// ============================================================================

export function FilterTreeView({
  showConnectors = true,
  showDepthBadges = true,
  enableDragDrop = false,
  showKeyboardHints = false,
  className,
  renderCondition,
  renderAddTrigger,
  onSelectField,
}: FilterTreeViewProps) {
  const { state, canUndo, canRedo, undo, redo, getStats } = useFilterTree();

  const stats = useMemo(() => getStats(), [getStats]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header with undo/redo and stats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {stats.activeConditionCount} active filter
          {stats.activeConditionCount !== 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tree content */}
      <div role="tree" aria-label="Filter tree">
        <TreeNode
          node={state.root}
          path={[]}
          depth={0}
          isLast={true}
          parentConnectors={[]}
          showConnectors={showConnectors}
          showDepthBadges={showDepthBadges}
          enableDragDrop={enableDragDrop}
          renderCondition={renderCondition}
          renderAddTrigger={renderAddTrigger}
          onSelectField={onSelectField}
        />
      </div>

      {/* Keyboard hints */}
      {showKeyboardHints && (
        <div className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Keyboard:</span> Ctrl+Z Undo | Ctrl+Y Redo |
          Ctrl+Enter Toggle group
        </div>
      )}
    </div>
  );
}

export default FilterTreeView;
