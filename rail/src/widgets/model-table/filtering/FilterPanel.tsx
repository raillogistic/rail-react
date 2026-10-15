import React, {
 useCallback,
 useMemo,
 useRef,
 useState,
 useEffect,
} from "react";
import {
 AlertTriangle,
 Filter,
 Save,
 RotateCcw,
 Plus,
 ChevronRight,
 ListFilter,
 X,
 Layers,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Alert, AlertDescription } from "@/shared/ui/kit/alert";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/shared/ui/kit/popover";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";

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
 DefaultFilterSpec,
 FieldSelectorOptions,
} from "./types";
import { DEFAULT_NESTED_CONFIG } from "./types";
import type { UnifiedFilterSchema } from "./types";
import { createCondition, createGroup } from "./tree/operations";

/**
 * Interface pour les propriétés du composant FilterPanel.
 * Gère la configuration globale de l'interface de filtrage.
 */
export interface FilterPanelProps {
 /** Nom de l'application Django */
 app: string;
 /** Nom du modèle Django */
 model: string;
 /** Profondeur maximale des filtres imbriqués */
 maxDepth?: number;
 /** Callback appelé lors de l'application des filtres */
 onApply: (
 variables: FilterQueryVariables,
 state: FilterFormState,
 context?: { source: "manual" | "preset" },
 ) => void;
 /** Inclure les filtres sauvegardés */
 includeSavedFilters?: boolean;
 /** Afficher le sélecteur "Distinct On" */
 showDistinct?: boolean;
 /** Afficher les presets */
 showPresets?: boolean;
 /** Autoriser la sauvegarde de filtres */
 allowSaveFilter?: boolean;
 /** Disposition du composant */
 layout?: "panel" | "popover" | "inline" | "toolbar";
 /** État initial des filtres */
 initialState?: FilterFormState;
 /** Filtres par défaut à appliquer au chargement */
 defaultFilters?: DefaultFilterSpec[];
 /** Options du sélecteur de champs */
 fieldSelector?: FieldSelectorOptions;
 /** Configuration personnalisée pour les filtres imbriqués */
 config?: Partial<NestedFilterConfig>;
 /** Désactive l'édition */
 disabled?: boolean;
 /** Titre affiché */
 title?: string;
 /** Afficher les indices de raccourcis clavier */
 showKeyboardHints?: boolean;
 /** Clé pour la persistance locale */
 persistKey?: string;
}

/**
 * FilterPanel - Un panneau de filtrage complexe et moderne pour les applications ERP.
 * Permet de construire des requêtes GraphQL sophistiquées avec une interface intuitive.
 */
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
 defaultFilters,
 fieldSelector,
 config: configOverrides,
 disabled,
 title = "Filtres",
 showKeyboardHints = true,
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
 setSelectedPresets,
 setDistinctOn,
 setOrderBy,
 clearAll,
 recentFields,
 favoriteFields,
 activeCount,
 } = useFilterPanel({
 schema,
 config,
 initialState,
 persistKey,
 });

 const defaultsAppliedRef = useRef(false);

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
 relationFunctions: state.relationFunctions,
 maxDepth,
 });
 onApply(variables, state, { source: "manual" });
 if (layout === "popover" || layout === "toolbar") {
 setPopoverOpen(false);
 }
 }, [schema, state, maxDepth, onApply, layout]);

 const handleApplyPreset = useCallback(
 (preset: FilterPreset) => {
 if (!schema) return;
 const presetSelectionKey =
 preset.source === "static" ? preset.name : preset.id;
 const nextSelectedPresets = [presetSelectionKey];

 const newRoot = applyPresetToFilterState(
 preset,
 state.root,
 schema,
 "replace",
 );

 setSelectedPresets(nextSelectedPresets);
 setRoot(newRoot);
 const variables = buildQueryVariables({
 filterState: newRoot,
 schema,
 selectedPresets: nextSelectedPresets,
 distinctOn: state.distinctOn,
 orderBy: state.orderBy,
 relationFunctions: state.relationFunctions,
 maxDepth,
 });

 const presetWhere =
 preset.filterJson && typeof preset.filterJson === "object"
 ? (preset.filterJson as Record<string, unknown>)
 : null;

 // Apply the preset payload as the source of truth for table queries.
 // This keeps ModelTableV2 behavior consistent even when UI parsing is lossy.
 const nextVariables =
 preset.source !== "static" &&
 presetWhere &&
 Object.keys(presetWhere).length > 0
 ? { ...variables, where: presetWhere }
 : variables;

 onApply(
 nextVariables,
 { ...state, root: newRoot, selectedPresets: nextSelectedPresets },
 { source: "preset" },
 );
 },
 [schema, state, setRoot, setSelectedPresets, onApply, maxDepth],
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

 const resolveDefaultPath = useCallback(
 async (
 spec: DefaultFilterSpec,
 ): Promise<{
 path: string[];
 operator: string;
 value?: unknown;
 } | null> => {
 if (!schema) return null;
 const raw = typeof spec === "string" ? { name: spec } : spec;
 const path =
 raw.path ?? (raw.name.includes(".") ? raw.name.split(".") : [raw.name]);

 let currentSchema: UnifiedFilterSchema | null = schema;
 for (let i = 0; i < path.length; i++) {
 const segment = path[i];
 const isLast = i === path.length - 1;

 if (isLast) {
 const field = currentSchema?.fields.find(
 (f) => f.name === segment || f.fieldName === segment,
 );
 if (!field) return null;
 return {
 path: [...path.slice(0, -1), field.name],
 operator: raw.operator ?? field.defaultOperator ?? "eq",
 value: raw.value,
 };
 }

 const relation = currentSchema?.relationFilters.find(
 (r) => r.name === segment || r.fieldName === segment,
 );
 if (!relation) return null;

 let nestedSchema =
 relation.nestedSchema ?? getSchemaForRelation(relation);
 if (!nestedSchema) {
 nestedSchema = await loadSchemaForRelation(relation);
 }
 if (!nestedSchema) return null;
 currentSchema = nestedSchema;
 }

 return null;
 },
 [schema, getSchemaForRelation, loadSchemaForRelation],
 );

 useEffect(() => {
 if (!schema || defaultsAppliedRef.current) return;
 if (!defaultFilters || defaultFilters.length === 0) return;

 const hasStateData = (value: FilterFormState | undefined) => {
 if (!value) return false;
 return (
 value.root.conditions.length > 0 ||
 value.selectedPresets.length > 0 ||
 (value.relationFunctions?.length ?? 0) > 0 ||
 value.distinctOn.length > 0 ||
 value.orderBy.length > 0
 );
 };

 if (hasStateData(initialState) || hasStateData(state)) {
 defaultsAppliedRef.current = true;
 return;
 }

 const applyDefaults = async () => {
 const resolved = await Promise.all(
 defaultFilters.map((spec) => resolveDefaultPath(spec)),
 );
 const conditions = resolved
 .filter(Boolean)
 .map((item) =>
 createCondition(
 item!.path,
 item!.path[item!.path.length - 1],
 item!.operator,
 item!.value,
 ),
 );
 if (conditions.length === 0) {
 defaultsAppliedRef.current = true;
 return;
 }

 const root = createGroup();
 root.conditions = conditions;
 setRoot(root);
 defaultsAppliedRef.current = true;
 };

 void applyDefaults();
 }, [
 schema,
 defaultFilters,
 initialState,
 resolveDefaultPath,
 state.root.conditions.length,
 state.selectedPresets.length,
 state.relationFunctions?.length,
 state.distinctOn.length,
 state.orderBy.length,
 setRoot,
 ]);

 const handleAddFirstCondition = useCallback(() => {
 const firstField =
 schema?.fields.find((field) => !field.isRelation) ?? schema?.fields[0];
 if (!firstField) return;

 addCondition(
 [firstField.name],
 firstField.name,
 firstField.defaultOperator ?? "eq",
 );
 }, [schema, addCondition]);

 if (loading) {
 return (
 <Card className="border-muted shadow-sm overflow-hidden">
 <div className="p-4 border-b flex items-center justify-between bg-muted/30">
 <Skeleton className="h-5 w-32" />
 <Skeleton className="h-8 w-24 " />
 </div>
 <CardContent className="p-6 space-y-4">
 <div className="space-y-2">
 <Skeleton className="h-4 w-full opacity-60" />
 <Skeleton className="h-4 w-[90%] opacity-40" />
 </div>
 <div className="pt-4 space-y-3">
 <Skeleton className="h-12 w-full " />
 <Skeleton className="h-12 w-full opacity-80" />
 <Skeleton className="h-12 w-full opacity-60" />
 </div>
 </CardContent>
 </Card>
 );
 }

 if (error || !schema) {
 return (
 <Alert
 variant="destructive"
 className="border-destructive/20 bg-destructive/5"
 >
 <AlertTriangle className="h-4 w-4" />
 <AlertDescription className="flex items-center justify-between w-full">
 <span className="font-medium">
 {error?.message ?? "Échec du chargement du schéma de filtrage"}
 </span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => refetch()}
 className="h-8 hover:bg-destructive/10"
 >
 <RotateCcw className="mr-2 h-3.5 w-3.5" />
 Réessayer
 </Button>
 </AlertDescription>
 </Alert>
 );
 }

 const filterContent = (
 <div className="flex flex-col h-[520px] sm:h-[600px] overflow-hidden bg-background">
 {/* Dynamic Header */}
 <div className="flex flex-col border-b bg-muted/10">
 <div className="flex items-center justify-between px-4 py-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 bg-primary/10 text-primary">
 <Filter className="h-4 w-4" />
 </div>
 <div>
 <h3 className="font-semibold text-sm leading-none tracking-tight">
 {title}
 </h3>
 <p className="text-[11px] text-muted-foreground mt-1">
 {activeCount > 0 ? (
 <span className="flex items-center gap-1 text-primary animate-in fade-in slide-in-from-left-1">
 <Layers className="h-2.5 w-2.5" />
 {activeCount} filtre{activeCount !== 1 ? "s" : ""} actif
 {activeCount !== 1 ? "s" : ""}
 </span>
 ) : (
 "Configurer et appliquer des filtres"
 )}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 {showPresets && schema.presets.length > 0 && (
 <PresetManager
 presets={schema.presets}
 selectedPresets={state.selectedPresets}
 onTogglePreset={togglePreset}
 onApplyPreset={handleApplyPreset}
 onEditPreset={handleEditPreset}
 onDeletePreset={handleDeletePreset}
 onSharePreset={handleSharePreset}
 disabled={disabled}
 layout="list"
 label="Vues"
 />
 )}
 {activeCount > 0 && (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
 onClick={clearAll}
 disabled={disabled}
 >
 <RotateCcw className="h-4 w-4" />
 </Button>
 </TooltipTrigger>
 <TooltipContent side="bottom" align="end">
 <p className="text-xs">Réinitialiser tous les filtres</p>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 sm:hidden"
 onClick={() => setPopoverOpen(false)}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </div>

 {/* Main Body */}
 <div className="flex-1 overflow-hidden relative">
 <ScrollArea className="h-full px-4 pt-4 pb-6">
 <div className="space-y-6">
 {showDistinct && schema.distinctFields.length > 0 && (
 <div className="bg-muted/30 p-3 border border-border/50">
 <div className="flex items-center gap-2 mb-2">
 <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Optimisation
 </span>
 </div>
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

 <div className="pb-12">
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
 fieldSelector={fieldSelector}
 onLoadRelationSchema={loadSchemaForRelation}
 getRelationSchema={getSchemaForRelation}
 />

 {state.root.conditions.length === 0 && (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <div className="h-16 w-16 bg-muted/20 flex items-center justify-center mb-4 border-2 border-dashed border-muted">
 <Plus className="h-8 w-8 text-muted-foreground/40" />
 </div>
 <h4 className="text-sm font-medium text-foreground">
 Aucun filtre ajouté
 </h4>
 <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
 Ajoutez des conditions pour affiner vos résultats
 </p>
 <Button
 variant="outline"
 size="sm"
 className="mt-4 h-8 border-dashed"
 onClick={handleAddFirstCondition}
 >
 <Plus className="mr-2 h-3.5 w-3.5" />
 Ajouter le premier filtre
 </Button>
 </div>
 )}
 </div>
 </div>
 </ScrollArea>

 {/* Subtle Bottom Gradient */}
 <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
 </div>

 {/* Footer Actions */}
 <div className="border-t bg-muted/30 p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 {showKeyboardHints && !disabled && (
 <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground/70 font-medium">
 <span className="flex items-center gap-1">
 <kbd className="px-1 py-0.5 border bg-background text-[9px] font-sans">
 Ctrl
 </kbd>{" "}
 +{" "}
 <kbd className="px-1 py-0.5 border bg-background text-[9px] font-sans">
 Entrée
 </kbd>
 Appliquer
 </span>
 <span className="flex items-center gap-1">
 <kbd className="px-1 py-0.5 border bg-background text-[9px] font-sans">
 Esc
 </kbd>
 Effacer
 </span>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2">
 {allowSaveFilter && activeCount > 0 && (
 <Button
 variant="outline"
 size="sm"
 className="h-9 px-4 text-xs font-medium hover:bg-background transition-colors"
 onClick={() => {
 setEditingPreset(null);
 setSaveDialogOpen(true);
 }}
 disabled={disabled}
 >
 <Save className="mr-2 h-3.5 w-3.5 text-primary" />
 Enregistrer actuel
 </Button>
 )}
 <Button
 onClick={handleApply}
 disabled={disabled}
 className="h-9 px-6 text-xs font-semibold shadow-sm active:scale-95 transition-all"
 >
 Appliquer les filtres
 <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 );

 const containerStyles =
 "w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl p-0 border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200";

 return (
 <>
 {layout === "toolbar" ? (
 <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
 <div className="flex flex-col gap-2">
 <ActiveFiltersBar
 state={state}
 schema={schema}
 onRemoveCondition={removeCondition}
 onClearAll={clearAll}
 onAddFilter={() => setPopoverOpen(true)}
 />
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className={cn(
 "h-8 text-xs font-medium border-dashed px-3 hover:border-primary/50 hover:bg-primary/5 transition-all",
 activeCount > 0 &&
 "border-primary/30 bg-primary/5 text-primary",
 )}
 >
 <Plus className="mr-2 h-3.5 w-3.5" />
 Ajouter plus de filtres
 </Button>
 </PopoverTrigger>
 <PopoverContent
 className={containerStyles}
 align="start"
 sideOffset={8}
 >
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
 className={cn(
 "gap-2 h-9 px-4 font-medium transition-all duration-200",
 activeCount > 0
 ? "border-primary bg-primary/5 text-primary shadow-sm"
 : "hover:border-primary/30",
 )}
 >
 <Filter
 className={cn("h-4 w-4", activeCount > 0 && "fill-primary/20")}
 />
 {title}
 {activeCount > 0 && (
 <Badge
 variant="default"
 className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] font-bold"
 >
 {activeCount}
 </Badge>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent
 className={containerStyles}
 align="start"
 sideOffset={8}
 >
 {filterContent}
 </PopoverContent>
 </Popover>
 ) : null}

 {layout === "inline" ? (
 <div className="border bg-card shadow-lg shadow-primary/5 overflow-hidden transition-all hover:shadow-primary/10">
 {filterContent}
 </div>
 ) : null}

 {layout === "panel" ? (
 <Card className="h-full flex flex-col border shadow-none bg-background overflow-hidden">
 {filterContent}
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
