import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { Alert, AlertDescription } from "@/lib/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Filter,
  X,
  Search,
  AlertTriangle,
  Save,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { useFilterMetadata } from "./hooks/useFilterMetadata";
import { useNestedFilterForm } from "./hooks/useNestedFilterForm";
import { FilterErrorBoundary } from "./components/FilterErrorBoundary";
import { FilterGroupComponent } from "./components/FilterGroup";
import { PresetSelector } from "./components/PresetSelector";
import { DistinctOnSelector } from "./components/DistinctOnSelector";
import { SaveFilterDialog } from "./components/SaveFilterDialog";
import { FilterPanel } from "./FilterPanel";
import { buildQueryVariables } from "./queryBuilder";
import { applyPresetToFilterState } from "./presetApplicator";
import { countConditions } from "./state";
import type {
  FilterFormState,
  FilterQueryVariables,
  NestedFilterConfig,
  FilterPreset,
} from "./types";
import { DEFAULT_NESTED_CONFIG } from "./types";
import { cn } from "@/lib/utils";

export interface DynamicFilterFormProps {
  /** Django app name */
  app: string;
  /** Django model name */
  model: string;
  /** Maximum nesting depth for relation filters (default: 3) */
  maxDepth?: number;
  /** Callback when filters are applied */
  onApply: (variables: FilterQueryVariables, state: FilterFormState) => void;
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
  /** Feature flag for new filter UI */
  useNewFilterUI?: boolean;
  /** Persist filter state */
  persistKey?: string;
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
  title = "Filtres",
  showKeyboardHints = false,
  useNewFilterUI = false,
  persistKey,
}) => {
  if (useNewFilterUI) {
    return (
      <FilterPanel
        app={app}
        model={model}
        maxDepth={maxDepth}
        onApply={onApply}
        includeSavedFilters={includeSavedFilters}
        showDistinct={showDistinct}
        showPresets={showPresets}
        allowSaveFilter={allowSaveFilter}
        layout={layout}
        initialState={initialState}
        config={configOverrides}
        disabled={disabled}
        title={title}
        showKeyboardHints={showKeyboardHints}
        persistKey={persistKey}
      />
    );
  }
  const config: NestedFilterConfig = useMemo(
    () => ({
      ...DEFAULT_NESTED_CONFIG,
      maxDepth,
      ...configOverrides,
    }),
    [maxDepth, configOverrides],
  );

  const { schema, loading, error, refetch, refetchSavedFilters } =
    useFilterMetadata({
      app,
      model,
      maxDepth,
      includeSavedFilters,
    });

  const { state, actions } = useNestedFilterForm({
    schema,
    initialState,
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showPresetsList, setShowPresetsList] = useState(false);

  const conditionCount = useMemo(
    () => countConditions(state.root),
    [state.root],
  );
  const presetCount = state.selectedPresets.length;
  const totalActiveCount = conditionCount + presetCount;
  const hasActiveFilters = totalActiveCount > 0;

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

    if (layout === "popover") {
      setPopoverOpen(false);
    }
  }, [state, schema, maxDepth, onApply, layout]);

  const handleReset = useCallback(() => {
    actions.reset();
    const emptyState: FilterFormState = {
      root: {
        id: "root",
        type: "group",
        logic: "AND",
        conditions: [],
        negated: false,
      },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    };
    onApply({}, emptyState);
  }, [actions, onApply]);

  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => {
      if (!schema) return;
      const newRoot = applyPresetToFilterState(
        preset,
        state.root,
        schema,
        "replace",
      );
      actions.setRoot(newRoot);
      handleApply();
    },
    [schema, state.root, actions, handleApply],
  );

  const handleEditPreset = useCallback((preset: FilterPreset) => {
    setEditingPreset(preset);
    setSaveDialogOpen(true);
  }, []);

  const handleDeletePreset = useCallback(
    async (preset: FilterPreset) => {
      refetchSavedFilters();
    },
    [refetchSavedFilters],
  );

  const handleSharePreset = useCallback(
    async (preset: FilterPreset) => {
      refetchSavedFilters();
    },
    [refetchSavedFilters],
  );

  const handleRemovePreset = useCallback(
    (presetId: string) => {
      actions.togglePreset(presetId);
    },
    [actions],
  );

  const handleRemoveCondition = useCallback(
    (id: string) => {
      actions.removeItem(id);
    },
    [actions],
  );

  useEffect(() => {
    if (disabled || layout === "popover") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "s" &&
        allowSaveFilter &&
        conditionCount > 0
      ) {
        e.preventDefault();
        setSaveDialogOpen(true);
      }
      if (e.key === "Escape" && e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    disabled,
    layout,
    handleApply,
    handleReset,
    allowSaveFilter,
    conditionCount,
  ]);

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
          <span>{error?.message ?? "Échec du chargement"}</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => refetch()}
            className="h-auto p-0"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const filterContent = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
        {hasActiveFilters && (
          <span className="ml-auto text-xs text-muted-foreground">
            {totalActiveCount} actif{totalActiveCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showPresets && schema.presets.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowPresetsList(!showPresetsList)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Presets
          </Button>
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

      {showPresetsList && schema.presets.length > 0 && (
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

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex-1 overflow-auto">
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
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          onClick={handleApply}
          disabled={disabled}
          className="flex-1 h-9"
        >
          <Search className="mr-2 h-4 w-4" />
          Appliquer
        </Button>

        {allowSaveFilter && conditionCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              setEditingPreset(null);
              setSaveDialogOpen(true);
            }}
            disabled={disabled}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Enregistrer
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={handleReset}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {showKeyboardHints && !disabled && (
        <div className="text-center text-[10px] text-muted-foreground">
          ⌘↵ Appliquer • ⌘S Enregistrer • ⇧Esc Réinitialiser
        </div>
      )}
    </div>
  );

  if (layout === "popover") {
    return (
      <>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 h-8",
                hasActiveFilters && "border-primary",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {title}
              {hasActiveFilters && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {totalActiveCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-4" align="start">
            <FilterErrorBoundary onReset={handleReset}>
              <div className="max-h-[480px] overflow-hidden flex flex-col">
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
          existingNames={schema.presets.map((preset) => preset.name)}
          canShare
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
        <div className="border rounded-xl bg-card overflow-hidden">
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
          existingNames={schema.presets.map((preset) => preset.name)}
          canShare
          onSaved={() => {
            refetchSavedFilters();
            setEditingPreset(null);
          }}
        />
      </FilterErrorBoundary>
    );
  }

  return (
    <FilterErrorBoundary onReset={handleReset}>
      <Card className="h-full flex flex-col border-0 shadow-none">
        <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
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
