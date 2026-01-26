/**
 * Dynamic Filters - Main Component
 * 
 * Entry point for the dynamic filter system.
 * 
 * Features:
 * - Complete filter UI with nested conditions
 * - AND/OR/NOT logical operators
 * - Filter presets (static, saved, shared)
 * - DISTINCT ON support
 * - Save/Edit filter dialogs
 * - Multiple layout modes (panel, popover, inline)
 * - Keyboard shortcuts
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { Separator } from "@/lib/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import {
  Filter,
  RotateCcw,
  Search,
  AlertTriangle,
  Save,
  Settings2,
  ChevronDown,
  Keyboard,
} from "lucide-react";
import { Badge } from "@/lib/components/ui/badge";

import { useFilterMetadata } from "./hooks/useFilterMetadata";
import { useNestedFilterForm } from "./hooks/useNestedFilterForm";
import { FilterErrorBoundary } from "./components/FilterErrorBoundary";
import { FilterGroupComponent } from "./components/FilterGroup";
import { PresetSelector } from "./components/PresetSelector";
import { DistinctOnSelector } from "./components/DistinctOnSelector";
import { SaveFilterDialog } from "./components/SaveFilterDialog";
import { buildQueryVariables } from "./queryBuilder";
import { applyPresetToFilterState } from "./presetApplicator";
import { countConditions } from "./state";
import type { 
  FilterFormState, 
  FilterQueryVariables, 
  NestedFilterConfig, 
  FilterPreset,
  FilterCondition,
  FilterGroup,
} from "./types";
import { DEFAULT_NESTED_CONFIG } from "./types";

export interface DynamicFilterFormProps {
  /** Django app name */
  app: string;
  /** Django model name */
  model: string;
  /** Maximum nesting depth for relation filters (default: 3) */
  maxDepth?: number;
  /** Callback when filters are applied */
  onApply: (variables: FilterQueryVariables) => void;
  /** Include user's saved filters */
  includeSavedFilters?: boolean;
  /** Show distinct field selector */
  showDistinct?: boolean;
  /** Show preset selector */
  showPresets?: boolean;
  /** Allow saving new filters */
  allowSaveFilter?: boolean;
  /** Layout mode */
  layout?: "panel" | "popover" | "inline";
  /** Initial filter state */
  initialState?: FilterFormState;
  /** Configuration overrides */
  config?: Partial<NestedFilterConfig>;
  /** Disable all inputs */
  disabled?: boolean;
  /** Custom title */
  title?: string;
  /** Show keyboard shortcuts hint */
  showKeyboardHints?: boolean;
}

export const DynamicFilterForm: React.FC<DynamicFilterFormProps> = ({
  app,
  model,
  maxDepth = 3,
  onApply,
  includeSavedFilters = true,
  showDistinct = true,
  showPresets = true,
  allowSaveFilter = true,
  layout = "panel",
  initialState,
  config: configOverrides,
  disabled,
  title = "Filters",
  showKeyboardHints = true,
}) => {
  // Merge config with defaults
  const config: NestedFilterConfig = useMemo(() => ({
    ...DEFAULT_NESTED_CONFIG,
    maxDepth,
    ...configOverrides,
  }), [maxDepth, configOverrides]);

  // Fetch combined metadata
  const {
    schema,
    loading,
    error,
    refetch,
    refetchSavedFilters,
  } = useFilterMetadata({
    app,
    model,
    maxDepth,
    includeSavedFilters,
  });

  // Filter form state
  const { state, actions } = useNestedFilterForm({
    schema,
    initialState,
  });

  // UI state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Count active filters
  const conditionCount = useMemo(() => countConditions(state.root), [state.root]);
  const presetCount = state.selectedPresets.length;
  const totalActiveCount = conditionCount + presetCount;

  // Apply filters
  const handleApply = useCallback(() => {
    if (!schema) return;

    const variables = buildQueryVariables({
      filterState: state.root,
      schema,
      selectedPresets: state.selectedPresets,
      distinctOn: state.distinctOn,
      orderBy: state.orderBy,
      maxDepth,
    });

    onApply(variables);
    
    if (layout === "popover") {
      setPopoverOpen(false);
    }
  }, [state, schema, maxDepth, onApply, layout]);

  // Reset filters
  const handleReset = useCallback(() => {
    actions.reset();
    onApply({});
  }, [actions, onApply]);

  // Apply preset
  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    if (!schema) return;
    const newRoot = applyPresetToFilterState(preset, state.root, schema, "replace");
    actions.setRoot(newRoot);
  }, [schema, state.root, actions]);

  // Edit preset
  const handleEditPreset = useCallback((preset: FilterPreset) => {
    setEditingPreset(preset);
    setSaveDialogOpen(true);
  }, []);

  // Delete preset
  const handleDeletePreset = useCallback(async (preset: FilterPreset) => {
    // This would call a delete mutation
    // For now, just refetch
    refetchSavedFilters();
  }, [refetchSavedFilters]);

  // Share preset
  const handleSharePreset = useCallback(async (preset: FilterPreset) => {
    // This would call an update mutation with isShared: true
    refetchSavedFilters();
  }, [refetchSavedFilters]);

  // Keyboard shortcuts
  useEffect(() => {
    if (disabled || layout === "popover") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to apply
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && allowSaveFilter && conditionCount > 0) {
        e.preventDefault();
        setSaveDialogOpen(true);
      }
      // Escape to reset
      if (e.key === "Escape" && e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, layout, handleApply, handleReset, allowSaveFilter, conditionCount]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !schema) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Filter Error</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Failed to load filter metadata"}
          <Button variant="link" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Main filter content
  const filterContent = (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar: Presets and Distinct */}
      {(showPresets || showDistinct) && (
        <div className="flex flex-wrap items-center gap-2">
          {showPresets && schema.presets.length > 0 && (
            <PresetSelector
              presets={schema.presets}
              selectedPresets={state.selectedPresets}
              onTogglePreset={actions.togglePreset}
              onApplyPreset={handleApplyPreset}
              onEditPreset={handleEditPreset}
              onDeletePreset={handleDeletePreset}
              onSharePreset={handleSharePreset}
              disabled={disabled}
            />
          )}

          {showDistinct && schema.distinctFields.length > 0 && (
            <DistinctOnSelector
              distinctFields={schema.distinctFields}
              selectedFields={state.distinctOn}
              orderBy={state.orderBy}
              onChange={actions.setDistinctOn}
              onOrderByRequired={actions.setOrderBy}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {(showPresets || showDistinct) && <Separator />}

      {/* Main filter area */}
      <ScrollArea className="flex-1 -mr-4 pr-4">
        <FilterGroupComponent
          group={state.root}
          schema={schema}
          config={config}
          onChange={(updates) => {
            const newRoot = { ...state.root, ...updates };
            actions.setRoot(newRoot);
          }}
          onAddCondition={actions.addCondition}
          onAddGroup={actions.addGroup}
          onUpdateCondition={actions.updateCondition}
          onRemoveItem={actions.removeItem}
          isRoot
          depth={0}
        />
      </ScrollArea>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          onClick={handleApply}
          disabled={disabled}
          className="flex-1"
        >
          <Search className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>

        {allowSaveFilter && conditionCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingPreset(null);
                    setSaveDialogOpen(true);
                  }}
                  disabled={disabled}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save filter (⌘S)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                disabled={disabled}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset filters (⇧Esc)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Keyboard hints */}
      {showKeyboardHints && !disabled && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            <kbd className="px-1 rounded bg-muted">⌘↵</kbd> Apply
          </span>
          {allowSaveFilter && conditionCount > 0 && (
            <span>
              <kbd className="px-1 rounded bg-muted">⌘S</kbd> Save
            </span>
          )}
          <span>
            <kbd className="px-1 rounded bg-muted">⇧Esc</kbd> Reset
          </span>
        </div>
      )}
    </div>
  );

  // Render based on layout mode
  if (layout === "popover") {
    return (
      <>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {title}
              {totalActiveCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {totalActiveCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-4" align="start">
            <FilterErrorBoundary onReset={handleReset}>
              <div className="max-h-[500px] overflow-hidden flex flex-col">
                {filterContent}
              </div>
            </FilterErrorBoundary>
          </PopoverContent>
        </Popover>

        <SaveFilterDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          modelName={model}
          filterState={state.root}
          schema={schema}
          maxDepth={maxDepth}
          existingFilter={editingPreset ?? undefined}
          onSaved={() => {
            refetchSavedFilters();
            setEditingPreset(null);
          }}
        />
      </>
    );
  }

  if (layout === "inline") {
    return (
      <FilterErrorBoundary onReset={handleReset}>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" />
            <span className="font-semibold">{title}</span>
            {totalActiveCount > 0 && (
              <Badge variant="secondary">{totalActiveCount}</Badge>
            )}
          </div>
          {filterContent}
        </div>

        <SaveFilterDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          modelName={model}
          filterState={state.root}
          schema={schema}
          maxDepth={maxDepth}
          existingFilter={editingPreset ?? undefined}
          onSaved={() => {
            refetchSavedFilters();
            setEditingPreset(null);
          }}
        />
      </FilterErrorBoundary>
    );
  }

  // Default: panel layout
  return (
    <FilterErrorBoundary onReset={handleReset}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <span>{title}</span>
              {totalActiveCount > 0 && (
                <Badge variant="secondary">{totalActiveCount}</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {filterContent}
        </CardContent>
      </Card>

      <SaveFilterDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        modelName={model}
        filterState={state.root}
        schema={schema}
        maxDepth={maxDepth}
        existingFilter={editingPreset ?? undefined}
        onSaved={() => {
          refetchSavedFilters();
          setEditingPreset(null);
        }}
      />
    </FilterErrorBoundary>
  );
};

export default DynamicFilterForm;
