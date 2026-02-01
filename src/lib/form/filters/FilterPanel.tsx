import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { Alert, AlertDescription } from "@/lib/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { cn } from "@/lib/utils";

import { useFilterMetadata } from "./hooks/useFilterMetadata";
import { useFilterPanel } from "./hooks/useFilterPanel";
import { useFilterKeyboard } from "./hooks/useFilterKeyboard";
import { FilterGroupComponent } from "./components/FilterGroup";
import { ActiveFiltersBar } from "./components/ActiveFiltersBar";
import { PresetManager } from "./components/PresetManager";
import { DistinctOnSelector } from "./components/DistinctOnSelector";
import { SaveFilterDialog } from "./components/SaveFilterDialog";
import { applyPresetToFilterState } from "./presetApplicator";
import { buildQueryVariables } from "./queryBuilder";
import type {
  FilterFormState,
  FilterPreset,
  FilterQueryVariables,
  NestedFilterConfig,
} from "./types";
import { DEFAULT_NESTED_CONFIG } from "./types";
import type { UnifiedFilterSchema } from "./types";

// ============================================================================
// FilterPanel Props
// ============================================================================

export interface FilterPanelProps {
  app: string;
  model: string;
  maxDepth?: number;
  onApply: (variables: FilterQueryVariables, state: FilterFormState) => void;
  includeSavedFilters?: boolean;
  showDistinct?: boolean;
  showPresets?: boolean;
  allowSaveFilter?: boolean;
  layout?: "panel" | "popover" | "inline" | "toolbar";
  initialState?: FilterFormState;
  config?: Partial<NestedFilterConfig>;
  disabled?: boolean;
  title?: string;
  showKeyboardHints?: boolean;
  persistKey?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  app,
  model,
  maxDepth = 3,
  onApply,
  includeSavedFilters = true,
  showDistinct = false,
  showPresets = true,
  allowSaveFilter = true,
  layout = "panel",
  initialState,
  config: configOverrides,
  disabled,
  title = "Filters",
  showKeyboardHints = false,
  persistKey,
}) => {
  const config: NestedFilterConfig = useMemo(
    () => ({
      ...DEFAULT_NESTED_CONFIG,
      maxDepth,
      ...configOverrides,
    }),
    [maxDepth, configOverrides],
  );

  const {
    schema,
    loading,
    error,
    refetch,
    refetchSavedFilters,
    loadSchemaForRelation,
    getSchemaForRelation,
  } = useFilterMetadata({
    app,
    model,
    maxDepth,
    includeSavedFilters,
  });

  const {
    state,
    setRoot,
    addCondition,
    updateCondition,
    removeCondition,
    addGroup,
    togglePreset,
    setDistinctOn,
    setOrderBy,
    clearAll,
    recentFields,
    favoriteFields,
    activeCount,
  } = useFilterPanel({
    schema,
    initialState,
    persistKey,
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    onApply(variables, state);
  }, [schema, state, maxDepth, onApply]);

  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => {
      if (!schema) return;
      const newRoot = applyPresetToFilterState(
        preset,
        state.root,
        schema,
        "replace",
      );
      setRoot(newRoot);
      onApply(
        buildQueryVariables({
          filterState: newRoot,
          schema,
          selectedPresets: state.selectedPresets,
          distinctOn: state.distinctOn,
          orderBy: state.orderBy,
          maxDepth,
        }),
        { ...state, root: newRoot },
      );
    },
    [schema, state, setRoot, onApply, maxDepth],
  );

  const handleEditPreset = useCallback((preset: FilterPreset) => {
    setEditingPreset(preset);
    setSaveDialogOpen(true);
  }, []);

  const handleDeletePreset = useCallback(
    async (_preset: FilterPreset) => {
      refetchSavedFilters();
    },
    [refetchSavedFilters],
  );

  const handleSharePreset = useCallback(
    async (_preset: FilterPreset) => {
      refetchSavedFilters();
    },
    [refetchSavedFilters],
  );

  useFilterKeyboard({
    onApply: handleApply,
    onCancel: clearAll,
    disabled,
  });

  if (loading) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !schema) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error?.message ?? "Failed to load"}</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => refetch()}
            className="h-auto p-0"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const filterContent = (
    <div className="flex flex-col gap-4 h-full">
      <div className="sr-only" aria-live="polite">
        {activeCount} active filter{activeCount !== 1 ? "s" : ""}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {activeCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {activeCount} active
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8"
          onClick={clearAll}
          disabled={disabled || activeCount === 0}
        >
          Clear all
        </Button>
      </div>

      {showDistinct && schema.distinctFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <DistinctOnSelector
            distinctFields={schema.distinctFields}
            selectedFields={state.distinctOn}
            orderBy={state.orderBy}
            onChange={setDistinctOn}
            onOrderByRequired={setOrderBy}
            disabled={disabled}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex-1 overflow-auto pr-1">
          <FilterGroupComponent
            group={state.root}
            schema={schema}
            config={config}
            onChange={(updates) => setRoot({ ...state.root, ...updates })}
            onAddCondition={(groupId, fieldPath, fieldName, operator) =>
              addCondition(fieldPath, fieldName, operator, groupId)
            }
            onAddGroup={addGroup}
            onUpdateCondition={updateCondition}
            onRemoveItem={removeCondition}
            isRoot
            depth={0}
            recentFields={recentFields}
            favoriteFields={favoriteFields}
            onLoadRelationSchema={loadSchemaForRelation}
            getRelationSchema={getSchemaForRelation}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
        <div className="flex flex-wrap items-center gap-2">
          {showPresets && schema.presets.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">Saved:</span>
              <PresetManager
                presets={schema.presets}
                selectedPresets={state.selectedPresets}
                onTogglePreset={togglePreset}
                onApplyPreset={handleApplyPreset}
                onEditPreset={handleEditPreset}
                onDeletePreset={handleDeletePreset}
                onSharePreset={handleSharePreset}
                disabled={disabled}
                label="My Filters"
              />
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {allowSaveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPreset(null);
                setSaveDialogOpen(true);
              }}
              disabled={disabled}
            >
              Save current
            </Button>
          )}
          <Button onClick={handleApply} disabled={disabled} className="h-9">
            Apply
          </Button>
        </div>
      </div>

      {showKeyboardHints && !disabled && (
        <div className="text-[10px] text-muted-foreground">
          Ctrl+Enter Apply | Ctrl+N Add filter | Esc Clear
        </div>
      )}
    </div>
  );

  return (
    <>
      {layout === "toolbar" ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <div className="space-y-3">
            <ActiveFiltersBar
              state={state}
              schema={schema}
              onRemoveCondition={removeCondition}
              onClearAll={clearAll}
              onAddFilter={() => setPopoverOpen(true)}
            />
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {title}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[480px] p-4" align="start">
              {filterContent}
            </PopoverContent>
          </div>
        </Popover>
      ) : null}

      {layout === "popover" ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-1.5 h-8", activeCount > 0 && "border-primary")}
            >
              {title}
              {activeCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[480px] p-4" align="start">
            {filterContent}
          </PopoverContent>
        </Popover>
      ) : null}

      {layout === "inline" ? (
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="p-4">{filterContent}</div>
        </div>
      ) : null}

      {layout === "panel" ? (
        <Card className="h-full flex flex-col border shadow-none">
          <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
            {filterContent}
          </CardContent>
        </Card>
      ) : null}

      <SaveFilterDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        modelName={model}
        filterState={state.root}
        schema={schema}
        maxDepth={maxDepth}
        existingFilter={editingPreset ?? undefined}
        existingNames={schema.presets.map((preset) => preset.name)}
        canShare
        onSaved={() => {
          refetchSavedFilters();
          setEditingPreset(null);
        }}
      />
    </>
  );
};

export default FilterPanel;
