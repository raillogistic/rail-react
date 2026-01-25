import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient, useMutation, gql } from "@apollo/client";
import { toast } from "sonner";
import { PlusCircle, X, Download } from "lucide-react";

import { useGraphQLModelTable } from "./hooks";
import { CompositionTable } from "./CompositionTable";
import type {
  ModelTableType,
  MutationMetadata,
  MutationInputFieldMeta,
  TableFieldMetadataType,
  ComplexFilterInput,
} from "./types";
import { useModelAccess, ModelAccessContext } from "@/lib/security/modelAccess";
import { useUIConfig } from "./useUIConfig";
import { useModelTelemetry } from "@/lib/telemetry/useModelTelemetry";
import { useAuditableAction, buildAuditAttributes } from "@/lib/security/useAuditableAction";
import { useAuth } from "../../auth/hooks/useAuth";

// Components
import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/lib/components/ui/drawer";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/lib/components/ui/tabs";
import ModelForm, { type ModelFormProps } from "@/lib/form/backend/ModelForm";
import ModelHistoryPanel from "./ModelHistoryPanel";
import { QuickFilterLoader } from "./components/QuickFilterLoader";
import ModelTableExportDrawer, { ModelTableExportDrawerHandle } from "./components/exporting";
import {
  build_delete_mutation,
  build_method_mutation,
  type DeleteMutationResponse,
} from "@/lib/form/backend/types/mutations";
import { ColumnFiltersState } from "@tanstack/react-table";
import { useAdvancedFiltering, AdvancedFiltersTrigger, AdvancedFilterChips, AdvancedFiltersDialog } from "./components/filtering";
import type { FormFieldConfig, FormSchema } from "../form/inputs/types";

// Re-export types for consumers
export type { ModelTableProps, ModelTableOptions } from "./types";

// --- Types & Interfaces ---

// Duplicated minimal types to avoid strict circular dependencies if any, 
// or mostly just re-using what we have.
type ModelTableContextType<TData = any> = {
  // Config
  appName: string;
  modelName: string;
  
  // Data State
  meta: ModelTableType | null;
  fields: ReturnType<typeof useGraphQLModelTable>["fields"];
  table: ReturnType<typeof useGraphQLModelTable>["table"];
  items: TData[];
  pageInfo: ReturnType<typeof useGraphQLModelTable>["pageInfo"];
  state: ReturnType<typeof useGraphQLModelTable>["state"];
  payloads: ReturnType<typeof useGraphQLModelTable>["payloads"];
  setters: ReturnType<typeof useGraphQLModelTable>["setters"];
  loading: boolean;
  refetch: () => void;
  
  // Security & Telemetry
  modelAccess: any;
  permissions: any;
  logAction: (action: string, meta?: any) => void;
  
  // UI State
  activeTab: "model" | "history";
  setActiveTab: (tab: "model" | "history") => void;
  
  // Forms & Actions State
  isCreationOpen: boolean;
  setCreationOpen: (v: boolean) => void;
  isUpdateOpen: boolean;
  setUpdateOpen: (v: boolean) => void;
  updateRow: TData | null;
  setUpdateRow: (row: TData | null) => void;
  
  // Filter State
  quickFiltersState: Record<string, string[]>;
  setQuickFiltersState: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  dialogFilters: ComplexFilterInput<string> | null;
  setDialogFilters: (filters: ComplexFilterInput<string> | null) => void;
  
  // Config Objects (Passed from props)
  creationFormConfig: any;
  updateFormConfig: any;
  deleteConfig: any;
  
  // Handlers
  handleRowEdit: (row: TData) => void;
  requestDelete: (row: TData) => void;
  handleCreationSuccess: (payload: any) => void;
  handleUpdateSuccess: (payload: any) => void;
  openExportDrawer: () => void;
};

const ModelTableContext = createContext<ModelTableContextType | undefined>(undefined);

export function useModelTableContext<TData = any>() {
  const context = useContext(ModelTableContext);
  if (!context) {
    throw new Error("useModelTableContext must be used within a <ModelTable> provider.");
  }
  return context as ModelTableContextType<TData>;
}

// --- Root Component ---

export type ModelTableRootProps<TData> = {
  appName: string;
  modelName: string;
  children?: ReactNode;
  className?: string;
  
  // Hook Configuration
  hookOptions?: Partial<Parameters<typeof useGraphQLModelTable>[0]>;
  
  // Features
  showHistory?: boolean;
  title?: ReactNode;
  
  // Configurations
  creationForm?: any;
  updateForm?: any;
  deleteConfig?: any;
  exportOptions?: any;
  
  // Handlers
  onContextReady?: (ctx: any) => void;
  permissionStrategy?: any;
  
  // Options
  options?: any;
};

export function ModelTable<TData = Record<string, unknown>>({
  appName,
  modelName,
  hookOptions,
  children,
  className,
  showHistory = true,
  creationForm,
  updateForm,
  deleteConfig,
  exportOptions,
  onContextReady,
  permissionStrategy,
  options,
}: ModelTableRootProps<TData>) {
  // --- 1. State & Hooks ---
  const [activeTab, setActiveTab] = useState<"model" | "history">("model");
  const [isCreationOpen, setCreationOpen] = useState(false);
  const [isUpdateOpen, setUpdateOpen] = useState(false);
  const [updateRow, setUpdateRow] = useState<TData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TData | null>(null);
  
  const [quickFiltersState, setQuickFiltersState] = useState<Record<string, string[]>>({});
  const [dialogFilters, setDialogFilters] = useState<ComplexFilterInput<string> | null>(null);
  
  const { user } = useAuth();
  const componentId = `table:${appName}:${modelName}`;
  const { config, saveConfig } = useUIConfig(componentId, user?.sub);
  
  const exportDrawerRef = useRef<ModelTableExportDrawerHandle>(null);
  
  // Data Hook
  const hookResult = useGraphQLModelTable({
    appName,
    modelName,
    ...(hookOptions ?? {}),
  });
  
  const { table, meta, fields, pageInfo, items, loading, state, setters, refetch, payloads } = hookResult;
  const { columnFilters, quick } = state;
  const { setAdvancedFilters } = setters;

  // Combine dialog and quick filters and update table state
  useEffect(() => {
    const parts: ComplexFilterInput<string>[] = [];

    if (dialogFilters) {
      parts.push(dialogFilters);
    }

    Object.entries(quickFiltersState).forEach(([field, values]) => {
      if (values && values.length > 0) {
        parts.push({
          [`${field}__in`]: values,
        } as unknown as ComplexFilterInput<string>);
      }
    });

    let merged: ComplexFilterInput<string> | null = null;
    if (parts.length === 1) {
      merged = parts[0];
    } else if (parts.length > 1) {
      merged = { AND: parts } as ComplexFilterInput<string>;
    }

    setAdvancedFilters((prev: any) => {
      if (JSON.stringify(prev) !== JSON.stringify(merged)) {
        return merged;
      }
      return prev;
    });
  }, [dialogFilters, quickFiltersState, setAdvancedFilters]);

  // Security
  const modelAccess = useModelAccess({
    appName,
    modelName,
    tableMetaOverride: meta,
    loadFormMetadata: false,
  });
  
  const telemetry = useModelTelemetry({
    component: "ModelTable",
    appName,
    modelName,
    attributes: {
      "rail.permission.create": modelAccess.operations.canCreate ? 1 : 0,
      "rail.permission.update": modelAccess.operations.canUpdate ? 1 : 0,
    },
  });

  const logAction = useAuditableAction({
    appName,
    modelName,
    component: "ModelTable",
    logEvent: telemetry.logEvent,
  });

  // Permissions Strategy
  const basePermissions = modelAccess.operations;
  const permissions = useMemo(() => {
    if (permissionStrategy) {
      return { ...basePermissions, ...permissionStrategy(basePermissions, {}) };
    }
    return basePermissions;
  }, [basePermissions, permissionStrategy]);

  // --- 2. Configuration Resolvers ---
  
  const contextValueForConfig = useMemo(() => ({
    meta, fields, table, items, pageInfo, state, setters, refetch
  }), [meta, fields, table, items, pageInfo, state, setters, refetch]);

  const creationFormConfig = useMemo(() => 
    typeof creationForm === "function" ? creationForm(contextValueForConfig) : creationForm,
  [creationForm, contextValueForConfig]);

  const updateFormConfig = useMemo(() => 
    typeof updateForm === "function" ? updateForm(contextValueForConfig) : updateForm,
  [updateForm, contextValueForConfig]);

  // --- 3. Handlers ---

  const refreshTables = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreationSuccess = useCallback((payload: any) => {
    toast.success("Élément créé avec succès");
    refreshTables();
    if (creationFormConfig?.closeOnSuccess !== false) {
      setCreationOpen(false);
    }
    creationFormConfig?.onSuccess?.(payload, contextValueForConfig);
  }, [refreshTables, creationFormConfig, contextValueForConfig]);

  const handleUpdateSuccess = useCallback((payload: any) => {
    toast.success("Élément mis à jour avec succès");
    refreshTables();
    if (updateFormConfig?.closeOnSuccess !== false) {
        setUpdateOpen(false);
        setUpdateRow(null);
    }
    updateFormConfig?.onSuccess?.(payload, { ...contextValueForConfig, row: updateRow });
  }, [refreshTables, updateFormConfig, contextValueForConfig, updateRow]);

  const handleRowEdit = useCallback((row: TData) => {
     if (!permissions.canUpdate) {
        toast.error("Permission refusée");
        return;
     }
     setUpdateRow(row);
     setUpdateOpen(true);
  }, [permissions.canUpdate]);

  // Delete Logic
  const deleteDocument = useMemo(() => gql(build_delete_mutation(modelName, "")), [modelName]);
  const [executeDelete] = useMutation(deleteDocument);

  const requestDelete = useCallback((row: TData) => {
      if (!permissions.canDelete) {
          toast.error("Permission refusée");
          return;
      }
      setDeleteTarget(row);
  }, [permissions.canDelete]);

  const confirmDelete = useCallback(async () => {
     if (!deleteTarget) return;
     // resolve ID
     const record = deleteTarget as any;
     const id = deleteConfig?.getId?.(deleteTarget) ?? record.id ?? record.pk ?? record.uuid;
     
     try {
         const { data } = await executeDelete({ variables: { id: String(id) } });
         if (data?.response?.ok) {
             toast.success("Élément supprimé");
             refreshTables();
         } else {
             toast.error(data?.response?.errors?.[0]?.message ?? "Erreur lors de la suppression");
         }
     } catch(e: any) {
         toast.error(e.message);
     } finally {
         setDeleteTarget(null);
     }
  }, [deleteTarget, deleteConfig, executeDelete, refreshTables]);

  const openExportDrawer = useCallback(() => {
      exportDrawerRef.current?.open();
  }, []);

  // Sync UI config to table state
  React.useEffect(() => {
    if (!config || !table) return;

    // Sync Column Visibility
    if (config.columnVisibility) {
      const currentVis = table.getState().columnVisibility;
      const allColumns = table.getAllLeafColumns();
      const newVis: Record<string, boolean> = {};
      let hasChanges = false;

      allColumns.forEach((col) => {
        const isVisible = config.columnVisibility!.includes(col.id);
        newVis[col.id] = isVisible;
        if (
          currentVis[col.id] !== isVisible &&
          (currentVis[col.id] !== undefined || !isVisible)
        ) {
          if ((currentVis[col.id] ?? true) !== isVisible) {
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        table.setColumnVisibility(newVis);
      }
    }

    // Sync Column Order
    if (config.columnOrder) {
      const currentOrder = table.getState().columnOrder;
      const isDifferent =
        currentOrder.length !== config.columnOrder.length ||
        currentOrder.some((id, index) => id !== config.columnOrder![index]);

      if (isDifferent) {
        table.setColumnOrder(config.columnOrder);
      }
    }
  }, [config, table]);

  // --- 4. Context Provider ---
  
  const ctx: ModelTableContextType<TData> = useMemo(() => ({
    appName,
    modelName,
    meta,
    fields,
    table,
    items,
    pageInfo,
    state,
    setters,
    payloads,
    loading,
    refetch,
    modelAccess,
    permissions,
    logAction,
    activeTab,
    setActiveTab,
    isCreationOpen,
    setCreationOpen,
    isUpdateOpen,
    setUpdateOpen,
    updateRow,
    setUpdateRow,
    quickFiltersState,
    setQuickFiltersState,
    dialogFilters,
    setDialogFilters,
    creationFormConfig,
    updateFormConfig,
    deleteConfig,
    handleRowEdit,
    requestDelete,
    handleCreationSuccess,
    handleUpdateSuccess,
    openExportDrawer,
  }), [
    appName, modelName, meta, fields, table, items, pageInfo, state, setters, payloads, loading, refetch, modelAccess, permissions, logAction, activeTab, setActiveTab, isCreationOpen, isUpdateOpen, updateRow, quickFiltersState, dialogFilters, creationFormConfig, updateFormConfig, deleteConfig, handleRowEdit, requestDelete, handleCreationSuccess, handleUpdateSuccess, openExportDrawer
  ]);

  React.useEffect(() => {
    if (onContextReady) onContextReady(ctx);
  }, [ctx, onContextReady]);
  
  // --- 5. Render ---

  // Helper to render tabs if enabled
  const content = useMemo(() => {
      if (showHistory) {
          return (
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="model">Données</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="model" className="space-y-4">
                    {children}
                </TabsContent>
                <TabsContent value="history">
                    <ModelHistoryPanel 
                        appName={appName}
                        modelName={modelName}
                        meta={meta}
                        fields={fields as any[]}
                    />
                </TabsContent>
            </Tabs>
          );
      }
      return children;
  }, [showHistory, activeTab, children, appName, modelName, meta, fields]);

  // Export Logic Re-construction
  // We need to reconstruct the full filters payload for export, similar to the hook
  const exportFiltersPayload = useMemo(() => {
      // Logic duplicated from hook to ensure latest state availability for export
      // ... (simplified: use hooks.payloads.filters which should be sync'd)
      return payloads.filters;
  }, [payloads.filters]);

  return (
    <ModelTableContext.Provider value={ctx}>
      <ModelAccessContext.Provider value={modelAccess}>
        <CompositionTable 
            table={table} 
            loading={loading}
            // Map ModelTableOptions (partial) to TableOptions
            options={options as any}
            onColumnVisibilityChange={(vis) => {
                if (config?.columnVisibility && JSON.stringify(vis) === JSON.stringify(config.columnVisibility)) return;
                saveConfig({ ...config, columnVisibility: vis });
            }}
            onColumnOrderChange={(order) => {
                if (config?.columnOrder && JSON.stringify(order) === JSON.stringify(config.columnOrder)) return;
                saveConfig({ ...config, columnOrder: order });
            }}
            availableFilters={meta?.filters}
            onColumnFiltersChange={(filters) => {
                // Sync back to table state if needed or handle here
            }}
        >
            <div className={className}>
                {content}
            </div>
        </CompositionTable>

        {/* --- Global Dialogs (Forms) --- */}
        <ModelTableForms />
        
        {/* --- Delete Confirmation --- */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    Êtes-vous sûr de vouloir supprimer cet élément ?
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* --- Export Drawer --- */}
        <ModelTableExportDrawer
            ref={exportDrawerRef}
            meta={meta}
            fields={fields}
            pageInfo={pageInfo}
            columnFilters={columnFilters}
            filtersPayload={exportFiltersPayload}
            orderingPayload={payloads.ordering}
            quick={quick}
            columnStorageKey={config?.columnVisibility ? `table:${appName}:${modelName}` : undefined}
            additionalFilters={exportOptions?.additionalFilters}
        />

      </ModelAccessContext.Provider>
    </ModelTableContext.Provider>
  );
}

// ----------------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------------

// 1. Toolbar
function ModelTableToolbar({ children, className }: { children?: ReactNode; className?: string }) {
    const { creationFormConfig, setCreationOpen, permissions, openExportDrawer } = useModelTableContext();
    
    return (
        <CompositionTable.Toolbar className={className}>
            {children}
            <div className="flex items-center gap-2 ml-auto">
                {/* Export Button */}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={openExportDrawer} title="Exporter">
                    <Download className="h-4 w-4" />
                </Button>
                {/* Default Creation Button if config exists */}
                {creationFormConfig && permissions.canCreate && (
                     <Button onClick={() => setCreationOpen(true)}>
                         <PlusCircle className="mr-2 h-4 w-4" />
                         {creationFormConfig.triggerLabel ?? "Nouveau"}
                     </Button>
                )}
            </div>
        </CompositionTable.Toolbar>
    );
}

// 2. Title
function ModelTableTitle({ className }: { className?: string }) {
    const { meta, loading } = useModelTableContext();
    const title = meta?.verboseNamePlural ? `Liste des ${meta.verboseNamePlural}` : "Liste";
    
    if (loading && !meta) return <div className="h-8 w-48 bg-muted animate-pulse rounded" />;
    
    return (
        <CompositionTable.Title title={title} />
    );
}

// 3. Search & Filters
function ModelTableFilters() {
    const { state, setters, quickFiltersState, setQuickFiltersState, meta, setDialogFilters } = useModelTableContext();
    
    // Prepare advanced filtering hook
    const advancedFiltering = useAdvancedFiltering({
        filtersMeta: meta?.filters ?? [],
        onApply: (filters) => setDialogFilters(filters),
    });

    return (
        <div className="flex flex-wrap items-center gap-2">
            <CompositionTable.Search 
                value={state.quick} 
                onChange={(v) => setters.setQuick(v)} 
                onSearch={() => setters.refetch()} 
            />
            
            {/* Advanced Filters Trigger */}
            <AdvancedFiltersTrigger controller={advancedFiltering} variant="icon" />

            {/* Quick Filters */}
            {Object.entries(quickFiltersState).map(([field, values]) => {
                const filterMeta = meta?.filters?.find(f => f.field_name === field);
                if(!filterMeta) return null;
                return (
                    <QuickFilterLoader 
                        key={field}
                        fieldKey={field}
                        filterMeta={filterMeta}
                        selectedValues={values}
                        onChange={(vals) => setQuickFiltersState(prev => ({ ...prev, [field]: vals }))}
                    />
                );
            })}
             {Object.values(quickFiltersState).some((val) => val && val.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickFiltersState({})}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
            )}
            
            {/* Active Filter Chips */}
            <AdvancedFilterChips controller={advancedFiltering} clearLabel="Effacer" />

            <CompositionTable.ColumnToggle className="ml-auto" />
            
            {/* Advanced Dialog */}
            <AdvancedFiltersDialog controller={advancedFiltering} />
        </div>
    );
}

// 4. Content (Grid)
function ModelTableContent({ className, ...props }: React.ComponentProps<typeof CompositionTable.Content>) {
    const { handleRowEdit, requestDelete } = useModelTableContext();
    
    // Default Row Actions if not provided
    const defaultRowActions = {
        on_edit: handleRowEdit,
        on_delete: requestDelete,
        position: "end" as const,
    };

    return (
        <CompositionTable.Content 
            className={className}
            rowActions={props.rowActions ?? defaultRowActions}
        />
    );
}

// 5. Pagination
function ModelTablePagination({ className }: { className?: string }) {
    return <CompositionTable.Pagination className={className} />;
}

// 6. Tabs (History Switcher)
function ModelTableTabs({ children }: { children: ReactNode }) {
    const { activeTab, setActiveTab } = useModelTableContext();
    return (
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="model">Données</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>
            {children}
        </Tabs>
    );
}

function ModelTableDataTab({ children }: { children: ReactNode }) {
    return <TabsContent value="model" className="space-y-4">{children}</TabsContent>;
}

function ModelTableHistoryTab() {
    const { appName, modelName, meta, fields, activeTab } = useModelTableContext();
    // Only render if active to save resources
    if (activeTab !== "history") return null;

    return (
        <TabsContent value="history">
            <ModelHistoryPanel 
                appName={appName}
                modelName={modelName}
                meta={meta}
                fields={fields as any[]}
            />
        </TabsContent>
    );
}

// 7. Internal Forms Component (Rendered by Root automatically, but can be used manually)
function ModelTableForms() {
    const { 
        isCreationOpen, setCreationOpen, creationFormConfig, handleCreationSuccess,
        isUpdateOpen, setUpdateOpen, updateRow, updateFormConfig, handleUpdateSuccess,
        appName, modelName
    } = useModelTableContext();

    return (
        <>
            {/* Creation Form */}
            {creationFormConfig && isCreationOpen && (
                <Dialog open={isCreationOpen} onOpenChange={setCreationOpen}>
                    <DialogContent className={creationFormConfig.width ? "max-w-none" : "max-w-3xl"} style={{ width: creationFormConfig.width }}>
                        <DialogHeader>
                            <DialogTitle>{creationFormConfig.formProps?.title ?? "Nouveau"}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto">
                            <ModelForm 
                                appName={appName}
                                modelName={modelName}
                                onSuccessRedirect={handleCreationSuccess}
                                {...(creationFormConfig.formProps ?? {})}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Update Form */}
            {updateFormConfig && isUpdateOpen && updateRow && (
                <Dialog open={isUpdateOpen} onOpenChange={setUpdateOpen}>
                    <DialogContent className={updateFormConfig.width ? "max-w-none" : "max-w-3xl"} style={{ width: updateFormConfig.width }}>
                         <DialogHeader>
                            <DialogTitle>Modifier</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto">
                             <ModelForm 
                                appName={appName}
                                modelName={modelName}
                                mutationMode="update"
                                mutationId={(updateRow as any).id} // Simplified ID resolution
                                initialValues={updateRow as any}
                                onSuccessRedirect={handleUpdateSuccess}
                                {...(updateFormConfig.formProps ?? {})}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

// --- Standard Layout Component ---
// Useful for quick usage without composition
function StandardModelTable(props: ModelTableRootProps<any>) {
    return (
        <ModelTable {...props}>
             {/* CompositionTable is already in ModelTable root, just need subcomponents */}
             <ModelTable.Header>
                <ModelTable.Title />
                <div className="flex gap-2">
                    <ModelTable.Toolbar />
                </div>
             </ModelTable.Header>
             <ModelTable.Toolbar>
                    <ModelTable.Filters />
             </ModelTable.Toolbar>
             <ModelTable.Content />
             <ModelTable.Pagination />
        </ModelTable>
    );
}

// --- Exports ---

// Attach subcomponents to Root
export const ModelTableCompound = Object.assign(ModelTable, {
  Toolbar: ModelTableToolbar,
  Title: ModelTableTitle,
  Filters: ModelTableFilters,
  Content: ModelTableContent,
  Pagination: ModelTablePagination,
  Tabs: ModelTableTabs,
  DataTab: ModelTableDataTab,
  HistoryTab: ModelTableHistoryTab,
  Forms: ModelTableForms,
  Header: CompositionTable.Header, // Re-export for convenience
  Standard: StandardModelTable, // Easy mode
});

// Default export is the Compound Component
export default ModelTableCompound;