import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ApolloError, gql, useApolloClient, useMutation } from "@apollo/client";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
  Check,
  Download,
  Filter,
  Info,
  MoreHorizontal,
  PanelTop,
  Printer,
  Pencil,
  PlusCircle,
  Rows3,
  Search,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import ModelForm, { type ModelFormProps } from "@/lib/form/backend/ModelForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import ModelDetail from "@/lib/details/ModelDetail";
import type { ModelDetailProps } from "@/lib/details/types";

import { useGraphQLModelTable } from "./hooks";
import type {
  ComplexFilterInput,
  ModelTableType,
  ModelPdfTemplateMetadata,
  MutationMetadata,
  MutationInputFieldMeta,
  TableFieldMetadataType,
} from "./types";
import { BaseTable } from "./BaseTable";
import ModelTableExportDrawer, {
  ModelTableExportDrawerHandle,
  ModelTableExportDrawerProps,
} from "./components/exporting";
import ModelHistoryPanel from "./ModelHistoryPanel";
import {
  ModelBiPanel,
  type ModelBiPanelHandle,
} from "../reporting/ModelBiPanel";
import { ModelBiVisualizationPanel } from "../reporting/ModelBiVisualizationPanel";
import { toast } from "sonner";
import {
  build_method_mutation,
  type DeleteMutationResponse,
} from "@/lib/form/backend/types/mutations";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUIConfig } from "./useUIConfig";
import { useModelAccess, ModelAccessContext } from "@/lib/security/modelAccess";
import { useModelTelemetry } from "@/lib/telemetry/useModelTelemetry";
import {
  useAuditableAction,
  buildAuditAttributes,
} from "@/lib/security/useAuditableAction";
import type { useModelPermissions } from "../auth/hooks/useModelPermissions";
import type { FormFieldConfig, FormSchema } from "../form/inputs/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import {
  getAuthorizationHeader,
  getSecureHeaders,
} from "@/auth/utils/token-storage";
import { useModelGrouping, type ModelTableGrouping } from "./components/useModelGrouping";
import {
  ActionDialog,
  DeleteConfirmationDialog,
  FormOverlay,
  PrintDialog,
} from "./components/ModelTableOverlays";
import { FilterPanel } from "@/lib/form/filters/FilterPanel";
import type {
  FilterFormState,
  FilterQueryVariables,
} from "@/lib/form/filters/types";

type UseGraphQLModelTableOptions = Partial<
  Omit<Parameters<typeof useGraphQLModelTable>[0], "appName" | "modelName">
>;

type ModelTableSelectionConfig<TData> = {
  on_selection_change?: (
    selected_rows: TData[],
    selection_state: Record<string, boolean>,
  ) => void;
  enabled?: boolean;
  position?: "start" | "end";
  header_title?: string;
};

type ModelTableTopAction<TData> = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  order?: number;
  show_when?: "always" | "has_selection";
  dataAttributes?: Record<string, string | number | boolean | undefined>;
  on_click: (ctx: {
    selected_rows: TData[];
    selection_state: Record<string, boolean>;
  }) => void;
};

type ModelTableRowActions<TData> = {
  on_edit?: (row: TData) => void;
  on_delete?: (row: TData) => void;
  menu_items?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
    on_click: (row: TData) => void;
  }>;
  render_cell?: (row: TData) => React.ReactNode;
  header_title?: string;
  position?: "start" | "end";
};

type ModelTablePrinterConfig<TData> = {
  enabled?: boolean;
  filterTemplate?: (
    template: ModelPdfTemplateMetadata,
    ctx: ModelTableContext<TData>,
  ) => boolean;
  isActionVisible?: (
    row: TData,
    template: ModelPdfTemplateMetadata,
    ctx: ModelTableContext<TData>,
  ) => boolean;
  getFilename?: (
    row: TData,
    template: ModelPdfTemplateMetadata,
    ctx: ModelTableContext<TData>,
  ) => string | undefined;
  getId?: (row: TData) => string | number | null | undefined;
  onBeforePrint?: (
    row: TData,
    template: ModelPdfTemplateMetadata,
    ctx: ModelTableContext<TData>,
  ) => Promise<void> | void;
  buildUrl?: (
    row: TData,
    template: ModelPdfTemplateMetadata,
    ctx: ModelTableContext<TData>,
  ) => string;
  /**
   * Provide a schema to collect client data before sending to backend templates.
   * When omitted and the backend requires data, a minimal date+note schema is generated.
   */
  clientDataSchema?: FormSchema;
  /**
   * Transform submitted form values into query params sent to the backend.
   */
  serializeClientData?: (
    values: Record<string, unknown>,
    template: ModelPdfTemplateMetadata,
    row: TData,
    ctx: ModelTableContext<TData>,
  ) => Record<string, string>;
};

export type { ModelTableGrouping };

const isPromiseLike = (value: unknown): value is Promise<unknown> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Promise<unknown>).then === "function";

const resolveMutationErrorMessage = (errors: unknown): string | undefined => {
  const extract = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.message === "string") {
        return record.message;
      }
      const stringValue = Object.values(record).find(
        (entry) => typeof entry === "string",
      );
      return stringValue as string | undefined;
    }
    return undefined;
  };
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      const message = extract(entry);
      if (message) return message;
    }
    return undefined;
  }
  return extract(errors);
};

export type ModelTableCreationFormProps<
  TFormValues extends Record<string, unknown>,
> = Partial<Omit<ModelFormProps<TFormValues>, "appName" | "modelName">> & {
  appName?: string;
  modelName?: string;
  showSuccessToast?: boolean;
};

export type ModelTableOptions = {
  compact?: boolean;
  enable_multi_sort?: boolean;
  multi_sort_on_plain_click?: boolean;
  show_sort_index?: boolean;
  sort_hint_text?: string;
  pagination?: boolean;
  enable_column_drag?: boolean;
};

export type ColumnFiltersConfig = {
  mode?: "devextreme" | "ag-grid";
  debounce_ms?: number;
};

type ModelTableContext<TData> = {
  meta: ModelTableType | null;
  fields: ReturnType<typeof useGraphQLModelTable>["fields"];
  table: ReturnType<typeof useGraphQLModelTable>["table"];
  items: TData[];
  pageInfo: ReturnType<typeof useGraphQLModelTable>["pageInfo"];
  state: ReturnType<typeof useGraphQLModelTable>["state"];
  payloads: ReturnType<typeof useGraphQLModelTable>["payloads"];
  setters: ReturnType<typeof useGraphQLModelTable>["setters"];
  refetch: ReturnType<typeof useGraphQLModelTable>["refetch"];
};

type ModelTableExportOptions<TData> = {
  enabled?: boolean;
  additionalFilters?: ModelTableExportDrawerProps["additionalFilters"];
  columnStorageKey?: string | ((ctx: ModelTableContext<TData>) => string);
  trigger?:
    | React.ReactNode
    | ((
        ctx: ModelTableContext<TData> & { openDrawer: () => void },
      ) => React.ReactNode);
};

type ToolbarRenderer<TData> =
  | React.ReactNode
  | ((ctx: ModelTableContext<TData>) => React.ReactNode);

type CreationFormMode = "page" | "modal" | "drawer";

type PageCreationForm = {
  mode: "page";
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  path: string;
};

type ModalDrawerCreationForm<TFormValues extends Record<string, unknown>> = {
  mode: "modal" | "drawer";
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  formProps?: ModelTableCreationFormProps<TFormValues>;
  onSuccess?: (payload: unknown, ctx: ModelTableContext<TData>) => void;
  closeOnSuccess?: boolean;
  successMessage?:
    | string
    | ((ctx: { payload: unknown; mode: "create" | "update" }) => string);
};

type ModelTableCreationForm<TFormValues extends Record<string, unknown>> =
  | PageCreationForm
  | ModalDrawerCreationForm<TFormValues>;

type UpdateFormMode = "modal" | "drawer";

/**
 * Declarative options that control the update form rendering tied to row actions.
 */
export type ModelTableUpdateFormConfig<
  TData,
  TFormValues extends Record<string, unknown>,
> = {
  /** Disable the built-in update form trigger when false. */
  enabled?: boolean;
  /** Layout variant used for the update form. */
  mode?: UpdateFormMode;
  /** Explicit width applied to the modal or drawer. */
  width?: string;
  /** Explicit height applied to the modal or drawer. */
  height?: string;
  /** Drawer opening direction when `mode` equals `drawer`. */
  drawerDirection?: "left" | "right" | "top" | "bottom";
  /** Overrides passed down to the underlying `ModelForm`. */
  formProps?: ModelTableCreationFormProps<TFormValues>;
  /**
   * Allows customizing the initial values loaded from the selected row.
   * When omitted, the row object is used verbatim.
   */
  getInitialValues?: (
    row: TData,
    ctx: ModelTableContext<TData>,
  ) => Record<string, unknown>;
  /** Extracts the identifier used by the mutation when updating. */
  getId?: (row: TData) => string | number | null | undefined;
  /** Callback invoked after a successful update mutation. */
  onSuccess?: (
    payload: unknown,
    ctx: ModelTableContext<TData> & { row: TData },
  ) => void;
  /** Automatically close the update form after a successful mutation. */
  closeOnSuccess?: boolean;
  /** Custom toast message displayed on success. */
  successMessage?: string | ((ctx: { payload: unknown; row: TData }) => string);
};

type DetailViewConfig<TData> = {
  mode: "modal" | "drawer" | "link";
  icon?: React.ReactNode;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  width?: string;
  height?: string;
  linkBuilder?: (row: TData) => string;
  getId?: (row: TData) => string | number;
  relatedTableConfigs?: ModelDetailProps["relatedTableConfigs"];
};

type DeleteActionConfig<TData> = {
  confirmTitle?: string | ((row: TData) => string);
  confirmMessage?: string | ((row: TData) => string);
  successMessage?: string | ((row: TData) => string);
  errorMessage?: string | ((error: unknown, row: TData) => string);
  getId?: (row: TData) => string | number | null | undefined;
};

export type QuickFilterConfig = {
  field: string;
  title?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
};

export type ModelTableProps<TData = Record<string, unknown>> = {
  appName: string;
  modelName: string;
  hookOptions?: UseGraphQLModelTableOptions;
  className?: string;
  /** When true, renders a secondary History tab showing audit records. */
  showHistory?: boolean;
  title?:
    | React.ReactNode
    | ((ctx: ModelTableContext<TData>) => React.ReactNode);
  enableQuickSearch?: boolean;
  onQuickSearch?: (value: string, ctx: ModelTableContext<TData>) => void;
  toolbarActions?: ToolbarRenderer<TData>;
  topActions?:
    | ModelTableTopAction<TData>[]
    | ((
        ctx: ModelTableContext<TData>,
      ) => ModelTableTopAction<TData>[] | undefined);
  rowActions?: ModelTableRowActions<TData>;
  deleteConfig?: DeleteActionConfig<TData>;
  selection?: ModelTableSelectionConfig<TData>;
  options?: ModelTableOptions;

  /**
   * FilterPanel configuration - unified filter system
   * Replaces columnFiltersProp, onAdvancedFiltersApply, and quickFilters
   */
  filterConfig?: {
    /** Layout mode for filter UI */
    layout?: "panel" | "popover" | "inline";
    /** Show preset selector (static + saved filters) */
    showPresets?: boolean;
    /** Show distinct field selector */
    showDistinct?: boolean;
    /** Allow saving new filters */
    allowSaveFilter?: boolean;
    /** Maximum nesting depth for relation filters */
    maxDepth?: number;
    /** Enable inline relation filter expansion */
    enableInlineRelationFilters?: boolean;
    /** Custom title for filter panel */
    title?: string;
    /** Show keyboard shortcuts hint */
    showKeyboardHints?: boolean;
  };

  columnVisibilityKey?: string | ((ctx: ModelTableContext<TData>) => string);
  exportOptions?: ModelTableExportOptions<TData>;
  creationForm?:
    | ModelTableCreationForm<Record<string, unknown>>
    | ((
        ctx: ModelTableContext<TData>,
      ) => ModelTableCreationForm<Record<string, unknown>> | undefined);
  updateForm?:
    | ModelTableUpdateFormConfig<TData, Record<string, unknown>>
    | ((
        ctx: ModelTableContext<TData>,
      ) =>
        | ModelTableUpdateFormConfig<TData, Record<string, unknown>>
        | undefined);
  onContextReady?: (ctx: ModelTableContext<TData>) => void;
  detailView?: DetailViewConfig<TData>;
  /**
   * Optional custom permission strategy.
   * If provided, it allows overriding or extending the default permission logic.
   */
  permissionStrategy?: (
    permissions: ReturnType<typeof useModelPermissions>,
    ctx: ModelTableContext<TData>,
  ) => Partial<ReturnType<typeof useModelPermissions>>;
  expandable?: {
    render: (row: TData) => React.ReactNode;
    position?: "start" | "end";
  };
  /**
   * Optional client-side grouping applied on the current page of results.
   * Groups are rendered with headers and optional collapse toggles.
   */
  grouping?: ModelTableGrouping<TData>;
  /**
   * When true (default), renders a toolbar control to let users choose a grouping field.
   */
  enableGroupingSelector?: boolean;
  printerConfig?: ModelTablePrinterConfig<TData>;
};

const DEV_SERVER_PORTS = new Set(["5173", "5174", "5175", "5176"]);

const resolveTemplateApiOrigin = (): string => {
  const envValue =
    (import.meta.env?.VITE_API_TEMPLATES as string | undefined) ?? "";
  const defaultOrigin =
    typeof window !== "undefined"
      ? DEV_SERVER_PORTS.has(window.location.port)
        ? "http://localhost:8000"
        : window.location.origin
      : "http://localhost:8000";

  if (!envValue) {
    return defaultOrigin.replace(/\/$/, "");
  }

  try {
    const parsed = new URL(envValue, defaultOrigin);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return defaultOrigin.replace(/\/$/, "");
  }
};

const isAbsoluteUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value) || value.startsWith("//");

const QUICK_SEARCH_DEBOUNCE_MS = 250;

function defaultColumnKey(
  meta: ModelTableType | null,
  fallback: string,
): string {
  const rawId =
    meta?.app && meta?.model
      ? `${meta.app}:${meta.model}`
      : fallback.toLowerCase().replace(/\s+/g, "_");
  return `table_columns:${rawId}`;
}

export default function ModelTable<TData = Record<string, unknown>>({
  appName,
  modelName,
  hookOptions,
  className,
  showHistory = true,
  title,
  enableQuickSearch = true,
  onQuickSearch,
  toolbarActions,
  topActions,
  rowActions,
  selection,
  options,
  columnVisibilityKey,
  exportOptions,
  creationForm,
  updateForm,
  onContextReady,
  detailView,
  deleteConfig,
  permissionStrategy,
  filterConfig,
  expandable,
  grouping,
  enableGroupingSelector = true,
  printerConfig,
}: ModelTableProps<TData>) {
  const exportDrawerRef = useRef<ModelTableExportDrawerHandle>(null);
  const [isCreationOpen, setCreationOpen] = useState(false);
  const [isUpdateOpen, setUpdateOpen] = useState(false);
  const [updateRow, setUpdateRow] = useState<TData | null>(null);
  const updateRowRef = useRef<TData | null>(null);
  const [detailRow, setDetailRow] = useState<TData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TData | null>(null);
  const [activeAction, setActiveAction] = useState<{
    meta: MutationMetadata;
    row: TData;
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"model" | "bi" | "history">(
    "model",
  );
  const [biTabEnabled, setBiTabEnabled] = useState(false);
  const [biActiveTab, setBiActiveTab] = useState<"datasets" | "visualization">(
    "datasets",
  );
  const biPanelRef = useRef<ModelBiPanelHandle>(null);
  const historyRefetchRef = useRef<(() => void) | null>(null);
  const registerHistoryRefetch = useCallback((handler: (() => void) | null) => {
    historyRefetchRef.current = handler;
  }, []);
  const [pendingPrintTemplate, setPendingPrintTemplate] =
    useState<ModelPdfTemplateMetadata | null>(null);
  const [pendingPrintRow, setPendingPrintRow] = useState<TData | null>(null);
  const [pendingPrintData, setPendingPrintData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const apolloClient = useApolloClient();
  const componentId = `table:${appName}:${modelName}`;
  const { config, saveConfig } = useUIConfig(componentId, user?.sub);
  const historyComponentId = `${componentId}:history`;

  const hookResult = useGraphQLModelTable({
    appName,
    modelName,
    ...(hookOptions ?? {}),
  });

  const {
    table,
    meta,
    fields,
    pageInfo,
    items,
    loading,
    error,
    state,
    payloads,
    setters,
    refetch,
    supportsQuickSearch,
    metadataLoading,
  } = hookResult;
  const metadataLoadingState = metadataLoading ?? {
    base: false,
    filters: false,
    mutations: false,
    pdfTemplates: false,
  };
  const {
    columnFilters: stateColumnFilters,
    quick,
    pageIndex,
    pageSize,
  } = state;
  const activeColumnFilters = stateColumnFilters as ColumnFiltersState;
  const { filters: filtersPayload, ordering: orderingPayload } = payloads;

  const modelAccess = useModelAccess({
    appName,
    modelName,
    tableMetaOverride: meta,
    loadFormMetadata: false,
  });

  // Show history only when prop allows it and permissions include the history operation
  const [historyBlocked, setHistoryBlocked] = useState(false);
  const baseHistoryAllowed = modelAccess.operations.canHistory ?? false;

  useEffect(() => {
    if (!showHistory || !baseHistoryAllowed) {
      setHistoryBlocked(false);
    }
  }, [showHistory, baseHistoryAllowed]);

  const showHistoryEnabled = Boolean(
    showHistory && baseHistoryAllowed && !historyBlocked,
  );
  const userQueryOptions = hookOptions?.queryOptions ?? {};

  const context: ModelTableContext<TData> = useMemo(
    () => ({
      meta,
      fields,
      table,
      items,
      pageInfo,
      state,
      payloads,
      setters,
      refetch,
    }),
    [meta, fields, table, items, pageInfo, state, payloads, setters, refetch],
  );

  const telemetry = useModelTelemetry({
    component: "ModelTable",
    appName,
    modelName,
    attributes: {
      "rail.permission.create": modelAccess.operations.canCreate ? 1 : 0,
      "rail.permission.update": modelAccess.operations.canUpdate ? 1 : 0,
      "rail.permission.delete": modelAccess.operations.canDelete ? 1 : 0,
    },
  });

  const {
    selectedGroupingField,
    setSelectedGroupingField,
    groupingBuckets,
    groupingLoading,
    setGroupingRequested,
    clearGroupingBuckets,
    groupableFields,
    setGroupCollapsed,
    groupingPayload,
  } = useModelGrouping<TData>({
    grouping,
    fields: fields ?? [],
    modelName,
    apolloClient,
    filtersPayload,
    pageInfo: pageInfo ?? null,
    pageSize,
    setters: {
      setPageIndex: setters.setPageIndex,
      setPageSize: setters.setPageSize,
    },
    table,
  });

  const normalizeClientDataSchema = useCallback(
    (rawSchema: unknown): Array<{ name: string; type?: string | null }> => {
      if (!Array.isArray(rawSchema)) return [];
      return rawSchema
        .map((entry) => {
          if (!entry) return null;
          if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (!trimmed) return null;
            if (
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              trimmed.includes(":")
            ) {
              try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === "object") {
                  const parsedName =
                    typeof (parsed as any).name === "string"
                      ? (parsed as any).name.trim()
                      : "";
                  const parsedType =
                    typeof (parsed as any).type === "string"
                      ? (parsed as any).type
                      : undefined;
                  if (parsedName) {
                    return { name: parsedName, type: parsedType };
                  }
                }
              } catch {
                // Ignore parsing errors and fallback below.
              }
            }
            return { name: trimmed, type: "string" };
          }
          if (typeof entry === "object") {
            const record = entry as Record<string, unknown>;
            const name =
              typeof record.name === "string" ? record.name.trim() : "";
            if (!name) return null;
            const type =
              typeof record.type === "string"
                ? record.type
                : (record as any)?.field_type;
            return { name, type };
          }
          return null;
        })
        .filter(
          (
            item,
          ): item is {
            name: string;
            type?: string | null;
          } => Boolean(item?.name),
        );
    },
    [],
  );

  const buildDefaultPrintSchema = useCallback(
    (template?: ModelPdfTemplateMetadata | null): FormSchema => {
      const rawClientSchema =
        template?.clientDataSchema ??
        (template as any)?.client_data_schema ??
        [];
      const normalizedClientSchema = normalizeClientDataSchema(rawClientSchema);
      const clientFields =
        template?.clientDataFields ??
        (template as any)?.client_data_fields ??
        [];

      const allowClientFlag =
        template?.allowClientData ??
        (template as any)?.allow_client_data ??
        ((clientFields?.length ?? 0) > 0 || normalizedClientSchema.length > 0);

      const schemaFromFields = clientFields
        .filter((name: unknown): name is string => typeof name === "string")
        .map((name) => ({ name: name.trim(), type: "string" }))
        .filter((entry) => entry.name.length > 0)
        .filter(
          (entry) =>
            !normalizedClientSchema.some(
              (schemaEntry) => schemaEntry.name === entry.name,
            ),
        );

      let effectiveSchema = [...normalizedClientSchema, ...schemaFromFields];

      if (!effectiveSchema.length && allowClientFlag) {
        effectiveSchema = [
          { name: "date", type: "date" },
          { name: "printed_by", type: "string" },
          { name: "note", type: "string" },
        ];
      }

      const knownFieldMap: Record<string, Omit<FormFieldConfig, "name">> = {
        date: {
          label: "Date d'édition",
          type: "date",
          placeholder: "JJ/MM/AAAA",
        },
        printed_by: {
          label: "Édité par",
          type: "text",
          placeholder: "Nom complet",
        },
        note: {
          label: "Note externe",
          type: "textarea",
          placeholder: "Mention spéciale à afficher sur le PDF",
        },
        external_reference: {
          label: "Référence externe",
          type: "text",
          placeholder: "EX-12345",
        },
      };

      const resolveFieldType = (
        rawType?: string | null,
      ): FormFieldConfig["type"] => {
        const normalized = (rawType ?? "").toString().toLowerCase();
        if (normalized === "date") return "date";
        if (normalized === "datetime" || normalized === "datetime-local") {
          return "datetime-local";
        }
        if (normalized === "time") return "time";
        if (normalized === "textarea") return "textarea";
        if (["decimal", "float"].includes(normalized)) return "decimal";
        if (["number", "integer", "int"].includes(normalized)) return "number";
        return "text";
      };

      const fields: FormFieldConfig[] = (effectiveSchema || [])
        .map((entry) => {
          const normalizedName = entry.name?.trim() ?? "";
          if (!normalizedName) return null as unknown as FormFieldConfig;
          const known = knownFieldMap[normalizedName];
          const inferredType = resolveFieldType(entry.type ?? "string");
          return {
            name: normalizedName,
            label:
              known?.label ??
              normalizedName
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            type: known?.type ?? inferredType ?? "text",
            placeholder:
              known?.placeholder ?? "Valeur à transmettre au document",
          };
        })
        .filter(Boolean) as FormFieldConfig[];

      return {
        title: "Paramètres d'impression",
        sections: [
          {
            key: "metadata",
            title: "Informations complémentaires",
            fields,
          },
        ],
      };
    },
    [normalizeClientDataSchema],
  );

  const logAction = useAuditableAction({
    appName,
    modelName,
    component: "ModelTable",
    logEvent: telemetry.logEvent,
  });

  const refreshTables = useCallback(() => {
    const basePromise = refetch();
    historyRefetchRef.current?.();
    return basePromise;
  }, [refetch]);

  const basePermissions = modelAccess.operations;

  useEffect(() => {
    if (error) {
      telemetry.recordError(error);
    }
  }, [error, telemetry]);

  // History errors are handled inside the dedicated history panel component.

  // Apply custom permission strategy if provided
  const permissions = useMemo(() => {
    if (permissionStrategy) {
      const overrides = permissionStrategy(basePermissions, context);
      return { ...basePermissions, ...overrides };
    }
    return basePermissions;
  }, [basePermissions, permissionStrategy, context]);

  const templateApiOrigin = useMemo(() => resolveTemplateApiOrigin(), []);

  const printerTemplates = useMemo<ModelPdfTemplateMetadata[]>(() => {
    if (printerConfig?.enabled === false) {
      return [];
    }
    const templates = meta?.pdfTemplates ?? [];
    if (!templates.length || !permissions.canRead) {
      return [];
    }
    return templates.filter((template) => {
      if (template.allowed === false) return false;
      if (printerConfig?.filterTemplate) {
        return printerConfig.filterTemplate(template, context) !== false;
      }
      return true;
    });
  }, [printerConfig, meta?.pdfTemplates, permissions.canRead, context]);

  React.useEffect(() => {
    onContextReady?.(context);
  }, [context, onContextReady]);

  // --- FilterPanel State Management ---
  const [filterVariables, setFilterVariables] =
    useState<FilterQueryVariables | null>(null);
  const [historyBaseFilters, setHistoryBaseFilters] =
    useState<ComplexFilterInput<string> | null>(null);

  // Sync filter variables to query
  const { setAdvancedFilters, setPresets, setDistinctOn, setPageIndex } =
    setters;

  const handleFilterApply = useCallback(
    (variables: FilterQueryVariables, _state: FilterFormState) => {
      setFilterVariables(variables);
      setPageIndex(0);
    },
    [setPageIndex],
  );

  React.useEffect(() => {
    if (!filterVariables || Object.keys(filterVariables).length === 0) {
      setAdvancedFilters(() => null);
      setHistoryBaseFilters(null);
      setPresets([]);
      setDistinctOn([]);
      return;
    }

    setAdvancedFilters(() => filterVariables.where ?? null);
    setHistoryBaseFilters(filterVariables.where ?? null);

    // Sync presets and distinctOn from filter variables
    setPresets(filterVariables.presets ?? []);
    setDistinctOn(filterVariables.distinctOn ?? []);
  }, [
    filterVariables,
    setAdvancedFilters,
    setHistoryBaseFilters,
    setPresets,
    setDistinctOn,
  ]);

  useEffect(() => {
    if (!showHistoryEnabled) {
      historyRefetchRef.current = null;
    }
  }, [showHistoryEnabled]);

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
          // If undefined, it defaults to true. So if isVisible is false, it's a change.
          // If defined, check equality.
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
      // Simple check: if lengths differ or elements differ
      const isDifferent =
        currentOrder.length !== config.columnOrder.length ||
        currentOrder.some((id, index) => id !== config.columnOrder![index]);

      if (isDifferent) {
        table.setColumnOrder(config.columnOrder);
      }
    }
  }, [config, table]);

  const computedTitle =
    typeof title === "function"
      ? title(context)
      : (title ??
        (meta?.verboseNamePlural
          ? `Liste des ${meta.verboseNamePlural}`
          : meta?.verboseName
            ? `Liste des ${meta.verboseName}`
            : "Liste"));
  const historyTitle = meta?.verboseNamePlural
    ? `Historique des ${meta.verboseNamePlural}`
    : meta?.verboseName
      ? `Historique de ${meta.verboseName}`
      : "Historique";

  const resolvedColumnKey =
    typeof columnVisibilityKey === "function"
      ? columnVisibilityKey(context)
      : (columnVisibilityKey ?? defaultColumnKey(meta, `${modelName}_default`));
  const historyColumnKey = `${resolvedColumnKey}:history`;
  const columnFiltersConfig = {
    mode: "ag-grid",
    debounce_ms: 1,
  };
  const resolvedSelection: ModelTableSelectionConfig<TData> = selection ?? {
    enabled: true,
    position: "start",
    header_title: "#",
  };

  const rawCreationFormConfig = useMemo(
    () =>
      typeof creationForm === "function" ? creationForm(context) : creationForm,
    [creationForm, context],
  );
  const creationFormConfig = rawCreationFormConfig;
  const rawUpdateFormConfig = useMemo(
    () => (typeof updateForm === "function" ? updateForm(context) : updateForm),
    [updateForm, context],
  );
  const updateFormConfig =
    rawUpdateFormConfig && rawUpdateFormConfig.enabled === false
      ? null
      : (rawUpdateFormConfig ?? null);

  const fallbackTopActions: ModelTableTopAction<TData>[] | undefined =
    useMemo(() => {
      if (creationFormConfig || !meta?.verboseName) return undefined;
      // Check permission
      if (!permissions.canCreate) return undefined;

      return [
        {
          key: "add",
          label: `Ajouter un ${meta.verboseName}`,
          icon: <PlusCircle className="mr-1 h-4 w-4" />,
          variant: "outline",
          order: 0,
          show_when: "always",
          dataAttributes: buildAuditAttributes(
            appName,
            modelName,
            "table.fallback_create",
            "ModelTable",
          ),
          on_click: () => {
            logAction("table.fallback_create", {
              metadata: { model: meta.verboseName },
            });
            console.info("add item");
          },
        },
      ];
    }, [
      appName,
      creationFormConfig,
      logAction,
      meta?.verboseName,
      modelName,
      permissions.canCreate,
    ]);

  const resolvedTopActions = useMemo(() => {
    const userActions =
      typeof topActions === "function" ? topActions(context) : topActions;
    let actions = userActions ?? fallbackTopActions ?? [];
    if (creationFormConfig && permissions.canCreate) {
      const defaultLabel =
        creationFormConfig.mode !== "page" &&
        creationFormConfig.formProps?.title
          ? `Créer ${creationFormConfig.formProps.title}`
          : meta?.verboseName
            ? `Ajouter un ${meta.verboseName}`
            : "Ajouter";
      const label = creationFormConfig.triggerLabel ?? defaultLabel;
      const icon = creationFormConfig.triggerIcon ?? (
        <PlusCircle className="mr-1 h-4 w-4" />
      );
      actions = [
        ...actions,
        {
          key: "creation-form",
          label,
          icon,
          variant: "default",
          show_when: "always",
          dataAttributes: buildAuditAttributes(
            appName,
            modelName,
            "table.creation_trigger",
            "ModelTable",
          ),
          on_click: () => {
            logAction("table.creation_trigger", {
              metadata: { mode: creationFormConfig.mode ?? "modal" },
            });
            if (creationFormConfig.mode === "page") {
              if (creationFormConfig.path) {
                navigate(creationFormConfig.path);
              } else {
                console.warn(
                  "ModelTable creationForm in page mode requires a path.",
                );
              }
              return;
            }
            setCreationOpen(true);
          },
        },
      ];
    }
    return actions.length ? actions : undefined;
  }, [
    topActions,
    fallbackTopActions,
    creationFormConfig,
    context,
    appName,
    logAction,
    navigate,
    permissions.canCreate,
    modelName,
  ]);

  const getCreationFormCloseOnSuccess = useCallback(() => {
    if (creationFormConfig?.mode === "page") return;
    return creationFormConfig?.closeOnSuccess ?? true;
  }, [creationFormConfig]);

  const resolveSuccessMessage = useCallback(
    (payload: any, mode: "create" | "update", row?: TData) => {
      if (
        mode === "create" &&
        creationFormConfig &&
        creationFormConfig.mode !== "page"
      ) {
        if (typeof creationFormConfig.successMessage === "function") {
          return creationFormConfig.successMessage({ payload, mode });
        }
        return creationFormConfig.successMessage;
      }
      if (mode === "update" && updateFormConfig) {
        if (typeof updateFormConfig.successMessage === "function") {
          // @ts-ignore
          return updateFormConfig.successMessage({ payload, row });
        }
        return updateFormConfig.successMessage;
      }
      return undefined;
    },
    [creationFormConfig, updateFormConfig],
  );

  const handleCreationSuccess = useCallback(
    (payload: unknown) => {
      if (!payload || !(payload as { ok?: boolean }).ok) return;
      const shouldClose = getCreationFormCloseOnSuccess();
      const configuredMessage =
        resolveSuccessMessage(payload, "create") ??
        (creationFormConfig?.mode !== "page"
          ? creationFormConfig?.formProps?.successMessage
          : undefined);

      const message =
        typeof configuredMessage === "function"
          ? configuredMessage({ payload, mode: "create" })
          : (configuredMessage ??
            (meta?.verboseName
              ? `${meta.verboseName} créé(e) avec succès.`
              : "Création effectuée avec succès."));

      toast.success(message);
      logAction("table.creation_success", {
        metadata: {
          payload,
        },
      });

      if (creationFormConfig && creationFormConfig.mode !== "page") {
        creationFormConfig.onSuccess?.(payload, context);
      }

      refreshTables();

      if (shouldClose) {
        setCreationOpen(false);
      }
    },
    [
      creationFormConfig,
      context,
      meta?.verboseName,
      refetch,
      getCreationFormCloseOnSuccess,
      resolveSuccessMessage,
      logAction,
    ],
  );

  const creationFormProps = useMemo(() => {
    if (!creationFormConfig || creationFormConfig.mode === "page") return null;
    const userProps = creationFormConfig.formProps ?? {};
    const handleRedirect = (payload: unknown) => {
      userProps.onSuccessRedirect?.(payload);
      handleCreationSuccess(payload);
    };
    return {
      ...userProps,
      appName: userProps.appName ?? appName,
      modelName: userProps.modelName ?? modelName,
      showSuccessToast: userProps.showSuccessToast ?? false,
      onSuccessRedirect: handleRedirect,
    } satisfies ModelFormProps<Record<string, unknown>>;
  }, [appName, creationFormConfig, handleCreationSuccess, modelName]);

  const handleOpenUpdateForm = useCallback(
    (row: TData) => {
      if (!updateFormConfig) return;
      updateRowRef.current = row;
      setUpdateRow(row);
      setUpdateOpen(true);
    },
    [updateFormConfig],
  );

  const handleRowEdit = useCallback(
    (row: TData) => {
      if (!permissions.canUpdate) {
        toast.error("Vous n'avez pas la permission de modifier cet élément.");
        return;
      }
      if (updateFormConfig) {
        handleOpenUpdateForm(row);
      } else if (!rowActions?.on_edit) {
        console.info("edit row", row);
      }
      rowActions?.on_edit?.(row);
    },
    [handleOpenUpdateForm, rowActions, updateFormConfig, permissions.canUpdate],
  );

  const resolveUpdateInitialValues = useCallback(
    (row: TData) => {
      if (!row) return {};
      const source =
        updateFormConfig?.getInitialValues?.(row, context) ??
        (row as Record<string, unknown>) ??
        {};
      if (!source || typeof source !== "object") return {};
      const sanitized: Record<string, unknown> = {};
      Object.entries(source as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (key === "__typename") return;
          // Exclude description fields (e.g. reading_type_desc) as they pollute the form
          // and prevent the actual choice field (e.g. reading_type) from being set correctly
          if (key.endsWith("_desc")) return;

          // Simplify related objects to their ID for update forms
          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            (value as any).id
          ) {
            sanitized[key] = (value as any).id;
            return;
          }

          // Format Date/DateTime fields for input compatibility
          const fieldMeta = context.fields.find((f) => f.name === key);
          if (fieldMeta && value) {
            const valStr = String(value);
            if (fieldMeta.field_type === "DateField") {
              // Ensure YYYY-MM-DD
              sanitized[key] = valStr.split("T")[0];
              return;
            }
            if (fieldMeta.field_type === "DateTimeField") {
              // Ensure YYYY-MM-DDThh:mm (datetime-local expects this)
              // If backend sends ISO with Z or offset, slice to first 16 chars for simple local input
              // or convert properly if needed. Usually slicing ISO string works for uncontrolled inputs.
              const dateObj = new Date(valStr);
              if (!isNaN(dateObj.getTime())) {
                // Format to local ISO string for input
                const localIso = new Date(
                  dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16);
                sanitized[key] = localIso;
                return;
              }
            }
          }

          sanitized[key] = value;
        },
      );
      return sanitized;
    },
    [context, updateFormConfig],
  );

  const resolveUpdateMutationId = useCallback(
    (
      row: TData | null,
      initialValues?: Record<string, unknown>,
      explicitId?: string | number | null | undefined,
    ) => {
      if (explicitId !== undefined && explicitId !== null) {
        return String(explicitId);
      }
      if (!row) return undefined;
      if (updateFormConfig?.getId) {
        const custom = updateFormConfig.getId(row);
        if (custom !== undefined && custom !== null) {
          return String(custom);
        }
      }
      const candidates = [initialValues, row as Record<string, unknown>];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const record = candidate as Record<string, unknown>;
        const value =
          (record["id"] as string | number | undefined) ??
          (record["pk"] as string | number | undefined) ??
          (record["uuid"] as string | number | undefined);
        if (value !== undefined && value !== null) {
          return String(value);
        }
      }
      return undefined;
    },
    [updateFormConfig],
  );

  const handleUpdateSuccess = useCallback(
    (payload: unknown) => {
      if (!payload || !(payload as { ok?: boolean }).ok) return;
      const currentRow = updateRowRef.current ?? updateRow;
      const shouldClose = updateFormConfig?.closeOnSuccess ?? true;

      const message =
        resolveSuccessMessage(payload, "update", currentRow ?? ({} as TData)) ??
        (meta?.verboseName
          ? `${meta.verboseName} mis à jour avec succès.`
          : "Mise à jour effectuée avec succès.");

      toast.success(message);

      if (updateFormConfig) {
        updateFormConfig.onSuccess?.(payload, { ...context, row: currentRow! });
      }
      refreshTables();
      if (shouldClose) {
        setUpdateOpen(false);
        setUpdateRow(null);
        updateRowRef.current = null;
      }
    },
    [
      updateFormConfig,
      context,
      meta?.verboseName,
      refetch,
      updateRow,
      resolveSuccessMessage,
    ],
  );

  const updateFormProps = useMemo(() => {
    if (!updateFormConfig || !updateRow) return null;
    const userProps = updateFormConfig.formProps ?? {};
    const {
      onSuccessRedirect: userOnSuccessRedirect,
      showSuccessToast: userShowSuccessToast,
      initialValues: userInitialValues,
      mutationId: userMutationId,
      ...restUserProps
    } = userProps;
    const baseInitialValues = resolveUpdateInitialValues(updateRow);
    const mergedInitialValues = {
      ...baseInitialValues,
      ...((userInitialValues as Record<string, unknown>) ?? {}),
    };
    const resolvedMutationId = resolveUpdateMutationId(
      updateRow,
      mergedInitialValues,
      userMutationId as string | number | null | undefined,
    );
    const onSuccessRedirect = (payload: unknown) => {
      userOnSuccessRedirect?.(payload);
      handleUpdateSuccess(payload);
    };
    const props: ModelFormProps<Record<string, unknown>> = {
      ...restUserProps,
      appName: restUserProps.appName ?? appName,
      modelName: restUserProps.modelName ?? modelName,
      showSuccessToast: userShowSuccessToast ?? false,
      onSuccessRedirect,
      mutationMode: "update",
      initialValues: mergedInitialValues,
    };
    if (resolvedMutationId) {
      props.mutationId = resolvedMutationId;
    } else {
      console.warn(
        "ModelTable updateForm requires an identifier (id/pk/uuid) to run update mutations.",
      );
    }

    if (fields.length < 7 && !props.sectionsControl) {
      props.sectionsControl = {
        sections: [
          {
            fields: "all",
            columns: 1,
          },
        ],
      };
    }

    return props;
  }, [
    appName,
    fields.length,
    handleUpdateSuccess,
    modelName,
    resolveUpdateInitialValues,
    resolveUpdateMutationId,
    updateFormConfig,
    updateRow,
  ]);

  const detailConfig = detailView ?? null;
  const deleteDocument = useMemo(
    () =>
      gql(`
      mutation Delete${modelName}($id: ID!) {
        response: delete${modelName}(id: $id) {
          ok
          errors {
            field
            message
          }
        }
      }
    `),
    [modelName],
  );
  const [executeDeleteMutation, deleteMutationState] = useMutation<
    {
      response: DeleteMutationResponse<Record<string, unknown>>;
    },
    { id: string }
  >(deleteDocument);

  const extractBaseRowId = useCallback((row: TData | null) => {
    if (!row) return null;
    const record = row as Record<string, any>;
    return record.id ?? record.pk ?? record.uuid ?? record.code ?? null;
  }, []);

  const resolveDeleteId = useCallback(
    (row: TData | null) => {
      if (!row) return null;
      if (deleteConfig?.getId) {
        const custom = deleteConfig.getId(row);
        return custom ?? null;
      }
      return extractBaseRowId(row);
    },
    [deleteConfig, extractBaseRowId],
  );

  const resolvePrinterId = useCallback(
    (row: TData | null) => {
      if (!row) return null;
      if (printerConfig?.getId) {
        const custom = printerConfig.getId(row);
        return custom ?? null;
      }
      return extractBaseRowId(row);
    },
    [printerConfig, extractBaseRowId],
  );

  const requestDelete = useCallback(
    (row: TData) => {
      if (!permissions.canDelete) {
        toast.error("Vous n'avez pas la permission de supprimer cet élément.");
        return;
      }
      setDeleteTarget(row);
    },
    [permissions.canDelete],
  );

  const resolveDeleteSuccessMessage = useCallback(
    (row: TData) => {
      if (deleteConfig?.successMessage) {
        return typeof deleteConfig.successMessage === "function"
          ? deleteConfig.successMessage(row)
          : deleteConfig.successMessage;
      }
      return "L'élément a été supprimé avec succès.";
    },
    [deleteConfig],
  );

  const resolveErrorMessage = useCallback(
    (error: unknown, row: TData) => {
      if (deleteConfig?.errorMessage) {
        return typeof deleteConfig.errorMessage === "function"
          ? deleteConfig.errorMessage(error, row)
          : deleteConfig.errorMessage;
      }
      const entityLabel = meta?.verboseName ?? "cet élément";
      const fallbackMessage = `Impossible de supprimer ${entityLabel}. Merci de réessayer ultérieurement.`;
      const getErrorMessage = (err: unknown) => {
        if (err instanceof ApolloError && err.message) {
          console.error("GraphQL delete error", err);
          return err.message;
        }
        if (err instanceof Error && err.message) {
          console.error("Delete error", err);
          return err.message;
        }
        return null;
      };
      const rawMessage = getErrorMessage(error);
      if (rawMessage) {
        const normalized = rawMessage.toLowerCase();
        if (
          normalized.includes("atomic") ||
          normalized.includes("transaction") ||
          normalized.includes("transactionnel")
        ) {
          return `Impossible de supprimer ${entityLabel} : une transaction est en cours côté serveur, merci de réessayer d'ici quelques instants.`;
        }
      }
      return fallbackMessage;
    },
    [deleteConfig, meta?.verboseName],
  );

  const mutationActions = useMemo(
    () =>
      (meta?.mutations ?? [])
        .filter((mutation) => Boolean(mutation.action))
        .map((mutation) => {
          let parsedAction: Record<string, unknown> | null = null;
          if (typeof mutation.action === "string") {
            try {
              parsedAction = JSON.parse(mutation.action);
            } catch {
              parsedAction = null;
            }
          } else if (mutation.action) {
            parsedAction = mutation.action as Record<string, unknown>;
          }
          const enrichedMeta: MutationMetadata = {
            ...mutation,
            action: parsedAction ?? undefined,
          };
          return {
            key: mutation.name,
            label:
              (parsedAction?.title as string | undefined) ??
              (parsedAction?.label as string | undefined) ??
              (mutation.action?.title as string | undefined) ??
              mutation.name,
            variant:
              (parsedAction?.severity as string | undefined) === "destructive"
                ? "destructive"
                : "default",
            meta: enrichedMeta,
          };
        }),
    [meta?.mutations],
  );

  const deriveMethodName = useCallback(
    (mutation: MutationMetadata) => {
      if (mutation.method_name) return mutation.method_name;
      const prefix = `${modelName.toLowerCase()}_`;
      if (mutation.name?.startsWith(prefix)) {
        return mutation.name.slice(prefix.length);
      }
      return mutation.name;
    },
    [modelName],
  );

  const buildDefaultsFromMutation = useCallback(
    (mutation: MutationMetadata) => {
      const defaults: Record<string, any> = {};
      (mutation.input_fields || []).forEach((field) => {
        const raw = field.default_value;
        let normalized = raw;
        const isDateLike =
          field.field_type?.toLowerCase().includes("date") ||
          field.field_type?.toLowerCase().includes("time") ||
          field.widget_type === "date" ||
          field.widget_type === "datetime-local" ||
          field.widget_type === "time";
        if (raw === "" && isDateLike) {
          normalized = undefined;
        }
        if (normalized !== undefined) {
          defaults[field.name] = normalized;
        }
      });
      return defaults;
    },
    [],
  );

  const mapInputFieldToConfig = useCallback(
    (field: MutationInputFieldMeta): FormFieldConfig => {
      const widget = (field.widget_type || "").toLowerCase();
      const baseType = (field.field_type || "").toLowerCase();
      const isQuerySelect =
        widget === "select-query" ||
        widget === "select_query" ||
        widget === "query" ||
        Boolean(field.related_model);
      let type: FormFieldConfig["type"] = "text";
      if (isQuerySelect) {
        type = "select-query";
      } else if (widget === "checkbox" || baseType.includes("bool")) {
        type = "checkbox";
      } else if (widget === "textarea") {
        type = "textarea";
      } else if (widget === "datetime-local" || baseType.includes("datetime")) {
        type = "datetime-local";
      } else if (widget === "date" || baseType === "date") {
        type = "date";
      } else if (widget === "select" || baseType.includes("choice")) {
        type = "select";
      } else if (
        widget === "number" ||
        baseType === "int" ||
        baseType === "float"
      ) {
        type = "number";
      }
      let normalizedChoices: any[] | undefined;
      if (Array.isArray(field.choices)) {
        normalizedChoices = field.choices as any[];
      } else if (typeof field.choices === "string") {
        try {
          const parsed = JSON.parse(field.choices);
          normalizedChoices = Array.isArray(parsed) ? parsed : undefined;
        } catch {
          normalizedChoices = undefined;
        }
      }
      const options =
        normalizedChoices?.map((choice) => ({
          label:
            (choice as any)?.label ?? String((choice as any)?.value ?? choice),
          value: (choice as any)?.value ?? choice,
        })) ?? undefined;

      const baseConfig: any = {
        name: field.name,
        type,
        label: (field.description as string | undefined) ?? field.name,
        required: field.required,
        helpText: field.help_text as string | undefined,
        placeholder: field.placeholder as string | undefined,
        defaultValue: field.default_value,
        options,
        inputProps: field.multiple ? { multiple: true } : undefined,
      };
      if (isQuerySelect) {
        baseConfig.relatedModel = field.related_model || undefined;
      }
      return baseConfig as FormFieldConfig;
    },
    [],
  );

  const buildActionSchema = useCallback(
    (mutation: MutationMetadata): FormSchema => {
      const overrideOrder =
        (mutation.action?.ordering as string[] | undefined) ?? [];
      const fields = (mutation.input_fields || []).map(mapInputFieldToConfig);
      const orderedFields =
        overrideOrder.length > 0
          ? [
              ...fields
                .filter((f) => overrideOrder.includes(f.name))
                .sort(
                  (a, b) =>
                    overrideOrder.indexOf(a.name) -
                    overrideOrder.indexOf(b.name),
                ),
              ...fields.filter((f) => !overrideOrder.includes(f.name)),
            ]
          : fields;
      const sectionConfig =
        (mutation.action?.section as Record<string, any>) || {};
      const sectionColumns =
        typeof sectionConfig.columns === "number" && sectionConfig.columns > 0
          ? sectionConfig.columns
          : 1;
      return {
        id: mutation.name,
        sections: [
          {
            id: "action",
            columns: sectionColumns,
            title:
              (sectionConfig.title as string | undefined) ??
              (mutation.action?.title as string | undefined) ??
              (mutation.description as string | undefined) ??
              mutation.name,
            description:
              (sectionConfig.description as string | undefined) ??
              (mutation.action?.description as string | undefined) ??
              (mutation.action?.message as string | undefined) ??
              (mutation.description as string | undefined) ??
              undefined,
            fields: orderedFields,
          },
        ],
      };
    },
    [mapInputFieldToConfig],
  );

  const executeRowAction = useCallback(
    async (inputValues?: Record<string, any>) => {
      if (!activeAction) return;
      const { meta, row } = activeAction;
      const rowId = resolveDeleteId(row);
      if (!rowId) {
        toast.error("Identifiant de l'élément introuvable.");
        return;
      }
      const includeInput = (meta.input_fields?.length ?? 0) > 0;
      const methodName = deriveMethodName(meta);
      const mutationDoc = gql(
        build_method_mutation(modelName, methodName, {
          include_input: includeInput,
          input_type_name: meta.input_type ?? undefined,
          field_name: meta.name,
        }),
      );
      setActionSubmitting(true);
      try {
        const variables = includeInput
          ? { id: rowId, input: inputValues ?? {} }
          : { id: rowId };
        const result = await apolloClient.mutate({
          mutation: mutationDoc,
          variables,
        });
        const response = result.data?.response;
        if (!response?.ok) {
          const errMsg =
            resolveMutationErrorMessage(response?.errors) ??
            meta.error_messages?.default ??
            "Action impossible.";
          toast.error(errMsg);
          return;
        }
        const successMsg =
          meta.success_message ??
          (meta.action?.success_message as string | undefined) ??
          "Action exécutée avec succès.";
        toast.success(successMsg);
        setActiveAction(null);
        await refreshTables();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'exécution de l'action.",
        );
      } finally {
        setActionSubmitting(false);
      }
    },
    [
      activeAction,
      apolloClient,
      deriveMethodName,
      modelName,
      refetch,
      resolveDeleteId,
    ],
  );

  const closeDeleteDialog = useCallback(() => {
    if (deleteMutationState.loading) return;
    setDeleteTarget(null);
  }, [deleteMutationState.loading]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const rowId = resolveDeleteId(deleteTarget);
    if (!rowId) {
      toast.error("Identifiant de l'élément introuvable.");
      return;
    }
    try {
      const result = await executeDeleteMutation({
        variables: { id: String(rowId) },
      });
      const payload = result.data?.response;
      if (!payload?.ok) {
        const errorMsg =
          payload?.errors?.[0]?.message ??
          resolveErrorMessage("MutationError", deleteTarget);
        toast.error(errorMsg);
        return;
      }
      const msg = resolveDeleteSuccessMessage(deleteTarget);
      toast.success(msg);
      refreshTables();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(resolveErrorMessage(err, deleteTarget));
    }
  }, [
    deleteTarget,
    resolveDeleteId,
    executeDeleteMutation,
    resolveErrorMessage,
    resolveDeleteSuccessMessage,
    refetch,
  ]);
  const getDetailId = useCallback(
    (row: TData) => {
      if (!detailConfig?.getId) {
        const record = row as Record<string, any>;
        return record.id ?? record.pk ?? record.uuid ?? "";
      }
      return detailConfig.getId(row);
    },
    [detailConfig],
  );

  const handleDetailClick = useCallback(
    (row: TData) => {
      if (!detailConfig) return;
      if (detailConfig.mode === "link") {
        const target =
          detailConfig.linkBuilder?.(row) ??
          `/${appName}/${modelName.toLowerCase()}/${String(getDetailId(row))}`;
        navigate(target);
        return;
      }
      setDetailRow(row);
      setDetailOpen(true);
    },
    [detailConfig, appName, modelName, getDetailId, navigate],
  );

  const handlePrinterAction = useCallback(
    async (
      row: TData,
      template: ModelPdfTemplateMetadata,
      clientDataOverride?: Record<string, string> | null,
    ) => {
      const normalizedClientSchema = normalizeClientDataSchema(
        template?.clientDataSchema ??
          (template as any)?.client_data_schema ??
          [],
      );
      const requiresClientData =
        template.allowClientData ??
        (template as any)?.allow_client_data ??
        ((template.clientDataFields?.length ?? 0) > 0 ||
          ((template as any)?.client_data_fields?.length ?? 0) > 0 ||
          normalizedClientSchema.length > 0);

      // If backend expects client data, capture via form first.
      const resolvedClientData = clientDataOverride ?? pendingPrintData ?? null;
      if (requiresClientData && resolvedClientData == null) {
        setPendingPrintTemplate(template);
        setPendingPrintRow(row);
        setPendingPrintData(null);
        return;
      }
      const rowId = resolvePrinterId(row);
      if (!rowId) {
        toast.error("Identifiant de l'enregistrement introuvable.");
        return;
      }
      const baseEndpoint =
        printerConfig?.buildUrl?.(row, template, context) ?? template.endpoint;
      if (!baseEndpoint) {
        toast.error("Aucun endpoint d'impression défini pour ce modèle.");
        return;
      }
      try {
        await printerConfig?.onBeforePrint?.(row, template, context);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erreur lors de la préparation de l'impression.",
        );
        return;
      }
      const sanitizedBase = baseEndpoint.replace(/\/+$/, "");
      const relativeTarget = `${sanitizedBase}/${encodeURIComponent(
        String(rowId),
      )}/`;

      const resolvedTarget = (() => {
        if (isAbsoluteUrl(relativeTarget)) {
          return relativeTarget.startsWith("//")
            ? `${window.location.protocol}${relativeTarget}`
            : relativeTarget;
        }
        const origin = templateApiOrigin.replace(/\/$/, "");
        if (relativeTarget.startsWith("/")) {
          return `${origin}${relativeTarget}`;
        }
        return `${origin}/${relativeTarget}`;
      })();

      try {
        const paramsObject = resolvedClientData ?? {};
        const params =
          Object.keys(paramsObject).length > 0
            ? new URLSearchParams(paramsObject)
            : null;

        const headers: Record<string, string> = {
          ...getSecureHeaders(),
        };
        const authHeader = getAuthorizationHeader();
        if (authHeader) {
          headers.Authorization = authHeader;
        }

        const response = await fetch(
          params ? `${resolvedTarget}?${params.toString()}` : resolvedTarget,
          {
            method: "GET",
            headers,
          },
        );
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "Impossible de générer le document.");
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);

        const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
          // Popup blocked, fallback to anchor without download attribute to display inline
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.target = "_blank";
          anchor.rel = "noopener";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        }

        setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 1000);

        toast.success(
          `Document "${template.title}" ouvert dans un nouvel onglet.`,
        );
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erreur lors de la génération du document.",
        );
      }
    },
    [
      resolvePrinterId,
      printerConfig,
      context,
      templateApiOrigin,
      pendingPrintData,
      normalizeClientDataSchema,
    ],
  );

  const handleSubmitPrintData = useCallback(
    async (values: Record<string, unknown>) => {
      if (!pendingPrintTemplate || !pendingPrintRow) return;
      const schemaEntries = normalizeClientDataSchema(
        pendingPrintTemplate.clientDataSchema ??
          (pendingPrintTemplate as any)?.client_data_schema ??
          [],
      );
      const serializer =
        printerConfig?.serializeClientData ??
        ((formValues: Record<string, unknown>) => {
          const cleaned: Record<string, string> = {};
          const allowed = new Set<string>();
          schemaEntries.forEach((entry) => allowed.add(entry.name));
          (pendingPrintTemplate.clientDataFields || []).forEach((name) =>
            allowed.add(String(name)),
          );
          ((pendingPrintTemplate as any)?.client_data_fields || []).forEach(
            (name: unknown) => allowed.add(String(name)),
          );
          const hasAllowed = allowed.size > 0;
          Object.entries(formValues).forEach(([key, val]) => {
            if (val === undefined || val === null) return;
            if (hasAllowed && !allowed.has(key)) return;
            cleaned[key] = String(val);
          });
          return cleaned;
        });
      const serialized =
        serializer(values, pendingPrintTemplate, pendingPrintRow, context) ||
        {};
      setPendingPrintData(serialized);
      // Trigger fetch now that data is captured
      await handlePrinterAction(
        pendingPrintRow,
        pendingPrintTemplate,
        serialized,
      );
      setPendingPrintTemplate(null);
      setPendingPrintRow(null);
      setPendingPrintData(null);
    },
    [
      pendingPrintTemplate,
      pendingPrintRow,
      printerConfig,
      context,
      handlePrinterAction,
      normalizeClientDataSchema,
    ],
  );

  const handleCancelPrintData = useCallback(() => {
    setPendingPrintTemplate(null);
    setPendingPrintRow(null);
    setPendingPrintData(null);
  }, []);

  const resolvedRowActions: ModelTableRowActions<TData> = useMemo(() => {
    const base: ModelTableRowActions<TData> = rowActions
      ? {
          ...rowActions,
          on_edit: handleRowEdit,
          on_delete: rowActions.on_delete ?? requestDelete,
        }
      : {
          on_edit: handleRowEdit,
          on_delete: requestDelete,
          header_title: "Actions",
          position: "end",
        };
    const baseMenuItems =
      (base.menu_items ?? []).map((item) => {
        if (!item?.on_click) return item;
        return {
          ...item,
          on_click: (row: TData) => {
            const result = item.on_click?.(row);
            if (isPromiseLike(result)) {
              return result.finally(() => {
                void refreshTables();
              });
            }
            void refreshTables();
            return result;
          },
        };
      }) ?? [];
    const autoMenuItems =
      mutationActions?.map((action) => ({
        key: action.key,
        label: action.label,
        variant: action.variant as "default" | "destructive" | undefined,
        on_click: (row: TData) => setActiveAction({ meta: action.meta, row }),
      })) ?? [];
    const mergedMenu = [...baseMenuItems, ...autoMenuItems].reduce<
      ModelTableRowActions<TData>["menu_items"]
    >((acc, item) => {
      if (!item) return acc;
      if (acc?.some((existing) => existing.key === item.key)) return acc;
      return acc ? [...acc, item] : [item];
    }, base.menu_items ?? []);
    const baseWithMenu: ModelTableRowActions<TData> = {
      ...base,
      menu_items: mergedMenu ?? undefined,
    };

    const renderWithPrinters = (
      row: TData,
      extraNode?: React.ReactNode,
      includeCrudButtons = true,
    ) => {
      const visiblePrinterTemplates = printerTemplates.filter((template) => {
        if (!printerConfig?.isActionVisible) {
          return true;
        }
        return printerConfig.isActionVisible(row, template, context) !== false;
      });

      const printerDropdown =
        visiblePrinterTemplates.length > 0 ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Imprimer">
                <Printer className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {visiblePrinterTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.key}
                  onClick={() => handlePrinterAction(row, template)}
                >
                  <span>{template.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null;

      return (
        <div className="flex items-center justify-end gap-1 ">
          {extraNode}
          {includeCrudButtons && baseWithMenu.on_edit ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit"
              onClick={() => baseWithMenu.on_edit?.(row)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
          {includeCrudButtons && baseWithMenu.on_delete ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => baseWithMenu.on_delete?.(row)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          ) : null}
          {printerDropdown}
          {includeCrudButtons &&
          baseWithMenu.menu_items &&
          baseWithMenu.menu_items.length ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Plus d'actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {baseWithMenu.menu_items.map((mi) => (
                  <DropdownMenuItem
                    key={mi.key}
                    onClick={() => mi.on_click(row)}
                    variant={mi.variant}
                  >
                    {mi.icon}
                    <span>{mi.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      );
    };

    if (!detailConfig) {
      if (baseWithMenu.render_cell) {
        return {
          ...baseWithMenu,
          render_cell: (row) =>
            renderWithPrinters(row, baseWithMenu.render_cell?.(row), false),
        };
      }
      return {
        ...baseWithMenu,
        render_cell: (row) => renderWithPrinters(row),
      };
    }

    return {
      ...baseWithMenu,
      render_cell: (row) => (
        <div className="flex items-center justify-end gap-1 ">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voir les détails"
            title="Voir les détails"
            onClick={() => handleDetailClick(row)}
          >
            {detailConfig.icon ?? <Info className="h-4 w-4" />}
          </Button>
          {baseWithMenu.render_cell
            ? renderWithPrinters(row, baseWithMenu.render_cell(row), false)
            : renderWithPrinters(row)}
        </div>
      ),
    };
  }, [
    rowActions,
    detailConfig,
    handleDetailClick,
    requestDelete,
    handleRowEdit,
    mutationActions,
    refetch,
    printerTemplates,
    printerConfig,
    context,
    handlePrinterAction,
  ]);

  const actionSchema = useMemo(
    () => (activeAction ? buildActionSchema(activeAction.meta) : null),
    [activeAction, buildActionSchema],
  );
  const actionDefaults = useMemo(
    () =>
      activeAction ? buildDefaultsFromMutation(activeAction.meta) : undefined,
    [activeAction, buildDefaultsFromMutation],
  );
  const actionMode = activeAction
    ? ((activeAction.meta.action?.mode as string | undefined) ??
      ((activeAction.meta.input_fields?.length ?? 0) > 0 ? "form" : "confirm"))
    : null;

  const resolvedToolbarActions = useMemo(() => {
    const userToolbar =
      typeof toolbarActions === "function"
        ? toolbarActions(context)
        : toolbarActions;
    const biBuilderTrigger = (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        title="Créer un élément BI pour ce modèle"
        onClick={() => {
          setActiveTab("bi");
          setBiTabEnabled(true);
          biPanelRef.current?.openBuilder();
        }}
      >
        <PanelTop className="h-4 w-4" />
      </Button>
    );

    const groupingTrigger =
      enableGroupingSelector !== false ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Regrouper les lignes"
              onClick={() => setGroupingRequested(true)}
              disabled={
                groupingLoading ||
                (groupableFields?.length ?? 0) === 0 ||
                metadataLoadingState.base
              }
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Regrouper par
            </div>
            <DropdownMenuItem
              onClick={() => {
                setSelectedGroupingField(null);
                clearGroupingBuckets();
                setGroupingRequested(false);
              }}
            >
              <div className="flex items-center gap-2">
                {selectedGroupingField === null ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="inline-block h-3.5 w-3.5" />
                )}
                <span>Aucun regroupement</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {groupableFields.map((field) => (
              <DropdownMenuItem
                key={field.value}
                onClick={() => setSelectedGroupingField(field.value)}
              >
                <div className="flex items-center gap-2">
                  {selectedGroupingField === field.value ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="inline-block h-3.5 w-3.5" />
                  )}
                  <span>{field.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGroupCollapsed((prev) => {
                    const next: Record<string, boolean> = {};
                    (groupingBuckets ?? []).forEach((g) => {
                      next[g.key] = false;
                    });
                    return next;
                  });
                }}
              >
                Tout ouvrir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  (groupingBuckets ?? []).forEach((g) => {
                    next[g.key] = true;
                  });
                  setGroupCollapsed(next);
                }}
              >
                Tout fermer
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null;

    const exportConfig: ModelTableExportOptions<TData> = {
      enabled: true,
      ...exportOptions,
    };

    const exportTrigger =
      exportConfig.enabled !== false
        ? typeof exportConfig.trigger === "function"
          ? exportConfig.trigger({
              ...context,
              openDrawer: () => exportDrawerRef.current?.open(),
            })
          : (exportConfig.trigger ?? (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Exporter les données"
                onClick={() => exportDrawerRef.current?.open()}
              >
                <Download className="h-4 w-4" />
              </Button>
            ))
        : null;

    const toolbarItems = [
      biBuilderTrigger,
      groupingTrigger,
      userToolbar,
      exportTrigger,
    ].filter(Boolean);

    if (toolbarItems.length === 0) return undefined;

    return (
      <div className="flex items-center gap-2">
        {toolbarItems.map((node, idx) => (
          <React.Fragment key={idx}>{node}</React.Fragment>
        ))}
      </div>
    );
  }, [
    toolbarActions,
    exportOptions,
    context,
    enableGroupingSelector,
    groupableFields,
    groupingLoading,
    metadataLoadingState.base,
    selectedGroupingField,
  ]);

  const quickSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const contextRef = useRef(context);
  React.useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const handleQuickSearch =
    enableQuickSearch && supportsQuickSearch
      ? (search: string) => {
          if (quickSearchTimeoutRef.current) {
            clearTimeout(quickSearchTimeoutRef.current);
          }
          quickSearchTimeoutRef.current = setTimeout(() => {
            setters.setQuick(search);
            onQuickSearch?.(search, contextRef.current);
          }, QUICK_SEARCH_DEBOUNCE_MS);
        }
      : undefined;

  const exportFiltersPayload = filtersPayload ?? null;

  const exportConfig: ModelTableExportOptions<TData> = {
    enabled: true,
    ...exportOptions,
  };
  const exportColumnKey =
    typeof exportConfig.columnStorageKey === "function"
      ? exportConfig.columnStorageKey(context)
      : (exportConfig.columnStorageKey ?? resolvedColumnKey);

  const deleteDialogTitle =
    deleteTarget && deleteConfig?.confirmTitle
      ? typeof deleteConfig.confirmTitle === "function"
        ? deleteConfig.confirmTitle(deleteTarget)
        : deleteConfig.confirmTitle
      : "Confirmer la suppression";
  const deleteDialogMessage =
    deleteTarget && deleteConfig?.confirmMessage
      ? typeof deleteConfig.confirmMessage === "function"
        ? deleteConfig.confirmMessage(deleteTarget)
        : deleteConfig.confirmMessage
      : "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.";

  const historyPanel = showHistoryEnabled ? (
    <ModelHistoryPanel
      appName={appName}
      modelName={modelName}
      meta={meta}
      fields={fields as TableFieldMetadataType[]}
      title={historyTitle}
      hookOptions={hookOptions}
      enableQuickSearch={enableQuickSearch}
      columnFilters={columnFiltersConfig}
      options={options}
      columnKey={historyColumnKey}
      componentId={historyComponentId}
      userId={user?.sub}
      baseFilters={historyBaseFilters}
      onPermissionRevoked={() => setHistoryBlocked(true)}
      onError={(err) => telemetry.recordError(err)}
      onRefetchChange={registerHistoryRefetch}
    />
  ) : null;

  const {
    items: biItems,
    loading: biLoading,
    error: biError,
    refetch: refetchBi,
  } = useGraphQLModelTable({
    appName: "rail_django_graphql",
    modelName: "ReportingDataset",
    initVariables: {
      filters: {
        source_app_label: appName,
        source_model: modelName,
      },
      per_page: 50,
    },
    additionalSelectionFields: [
      "dimensions",
      "metrics",
      "computed_fields",
      "default_filters",
      "ordering",
      "source_app_label",
      "source_model",
      "metadata",
    ],
    queryOptions: { includeQuickArgument: false },
    skip: !biTabEnabled,
  });

  useEffect(() => {
    if (activeTab === "bi") {
      setBiTabEnabled(true);
    }
  }, [activeTab]);

  const biPanel = (
    <ModelBiPanel
      ref={biPanelRef}
      appName={appName}
      modelName={modelName}
      datasets={biItems ?? []}
      loading={biLoading}
      error={biError ? (biError as Error) : null}
      onEnable={() => setBiTabEnabled(true)}
      onRefresh={() => {
        setBiTabEnabled(true);
        void refetchBi();
      }}
      title="Datasets BI liés à ce modèle"
      description="Créez et ordonnez des jeux de données prêts pour tableaux, graphiques et exports."
    />
  );

  const biVisualizationPanel = (
    <ModelBiVisualizationPanel
      appName={appName}
      modelName={modelName}
      enabled={activeTab === "bi" && biActiveTab === "visualization"}
      datasets={biItems ?? []}
      loading={biLoading}
      error={biError ? (biError as Error) : null}
      onEnable={() => setBiTabEnabled(true)}
      onRefresh={() => {
        setBiTabEnabled(true);
        void refetchBi();
      }}
    />
  );

  const mainTableNode = (
    <BaseTable
      table={table}
      title={`${computedTitle}`}
      className="flex-1 min-h-0"
      loading={loading}
      empty_message="Liste vide"
      columnFilters={columnFiltersConfig}
      onQuickSearch={handleQuickSearch}
      available_filters={meta?.filters ?? []}
      toolbar_actions={
        <div className="flex items-center gap-2">
          <FilterPanel
            app={appName}
            model={modelName}
            maxDepth={filterConfig?.maxDepth ?? 3}
            onApply={handleFilterApply}
            includeSavedFilters={true}
            showDistinct={filterConfig?.showDistinct ?? true}
            showPresets={filterConfig?.showPresets ?? true}
            allowSaveFilter={filterConfig?.allowSaveFilter ?? true}
            layout={filterConfig?.layout ?? "popover"}
            config={{
              autoApply: true,
              autoApplyDelay: 300,
              enableLogicalOperators: true,
              enableNot: true,
              defaultM2MOperator: "_some",
              enableInlineRelationFilters:
                filterConfig?.enableInlineRelationFilters ?? true,
            }}
            disabled={!permissions.canRead}
            title={filterConfig?.title ?? "Filtres"}
            showKeyboardHints={filterConfig?.showKeyboardHints ?? true}
          />
          {resolvedToolbarActions}
        </div>
      }
      top_actions={resolvedTopActions}
      row_actions={resolvedRowActions}
      selection={resolvedSelection}
      options={{
        // compact: true,
        enable_column_drag: false,
        enable_multi_sort: true,
        multi_sort_on_plain_click: true,
        ...(options ?? {}),
      }}
      pagination_api={{
        first_page: setters.firstPage,
        last_page: setters.lastPage,
        previous_page: setters.previousPage,
        next_page: setters.nextPage,
        set_page_size: setters.setPageSize,
        page_index: pageIndex,
        page_count: pageInfo?.page_count ?? 0,
        page_size: pageSize,
        page_size_options: [10, 25, 50, 100],
      }}
      onColumnVisibilityChange={(vis) => {
        if (
          config?.columnVisibility &&
          JSON.stringify(vis) === JSON.stringify(config.columnVisibility)
        )
          return;
        saveConfig({ ...config, columnVisibility: vis });
      }}
      onColumnOrderChange={(order) => {
        if (
          config?.columnOrder &&
          JSON.stringify(order) === JSON.stringify(config.columnOrder)
        )
          return;
        saveConfig({ ...config, columnOrder: order });
      }}
      expandable={expandable}
      grouping={groupingPayload}
    />
  );

  return (
    <ModelAccessContext.Provider value={modelAccess}>
      <div
        className={["flex flex-col space-y-4", className]
          .filter(Boolean)
          .join(" ")}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "model" | "bi" | "history")
          }
          className="w-full"
        >
          <TabsList className="mb-2">
            <TabsTrigger value="model">Donn?es</TabsTrigger>
            <TabsTrigger value="bi">BI</TabsTrigger>
            {showHistoryEnabled ? (
              <TabsTrigger value="history">Historique</TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="model" className="mt-2">
            {mainTableNode}
          </TabsContent>
          <TabsContent value="bi" className="mt-2">
            <Tabs
              value={biActiveTab}
              onValueChange={(value) =>
                setBiActiveTab(value as "datasets" | "visualization")
              }
              className="w-full"
            >
              <TabsList className="mb-2">
                <TabsTrigger value="datasets">Datasets</TabsTrigger>
                <TabsTrigger value="visualization">Visualisation</TabsTrigger>
              </TabsList>
              <TabsContent value="datasets" className="mt-2">
                {biPanel}
              </TabsContent>
              <TabsContent value="visualization" className="mt-2">
                {biVisualizationPanel}
              </TabsContent>
            </Tabs>
          </TabsContent>
          {showHistoryEnabled ? (
            <TabsContent value="history" className="mt-2">
              {historyPanel}
            </TabsContent>
          ) : null}
        </Tabs>
        {creationFormConfig &&
        creationFormConfig.mode !== "page" &&
        creationFormProps ? (
          <FormOverlay
            mode={creationFormConfig.mode ?? "modal"}
            open={isCreationOpen}
            onOpenChange={setCreationOpen}
            title={
              creationFormConfig.formProps?.title ??
              creationFormConfig.triggerLabel ??
              meta?.verboseName ??
              "Nouveau"
            }
            width={creationFormConfig.width}
            height={creationFormConfig.height}
            drawerDirection={creationFormConfig.drawerDirection}
          >
            <ModelForm {...creationFormProps} />
          </FormOverlay>
        ) : null}
        {updateFormConfig && updateFormProps ? (
          <FormOverlay
            mode={updateFormConfig.mode ?? "modal"}
            open={isUpdateOpen}
            onOpenChange={(open) => {
              setUpdateOpen(open);
              if (!open) {
                setUpdateRow(null);
                updateRowRef.current = null;
              }
            }}
            title={
              updateFormConfig.formProps?.title ??
              (meta?.verboseName ? `Modifier ${meta.verboseName}` : "Modifier")
            }
            width={updateFormConfig.width}
            height={updateFormConfig.height}
            drawerDirection={updateFormConfig.drawerDirection}
          >
            <ModelForm {...updateFormProps} />
          </FormOverlay>
        ) : null}
        {detailConfig && detailRow && detailConfig.mode !== "link" ? (
          <FormOverlay
            mode={detailConfig.mode ?? "modal"}
            open={detailOpen}
            onOpenChange={(open) => {
              setDetailOpen(open);
              if (!open) setDetailRow(null);
            }}
            title="Détails"
            width={detailConfig.width}
            height={detailConfig.height}
            drawerDirection={detailConfig.drawerDirection}
          >
            <div className="max-h-[75vh] overflow-y-auto">
              {detailRow ? (
                <ModelDetail
                  appName={appName}
                  modelName={modelName}
                  id={getDetailId(detailRow)}
                  relatedTableConfigs={detailConfig.relatedTableConfigs}
                />
              ) : null}
            </div>
          </FormOverlay>
        ) : null}
        <ActionDialog
          open={Boolean(activeAction)}
          mode={actionMode}
          actionMeta={activeAction?.meta ?? null}
          schema={actionSchema}
          defaults={actionDefaults ?? undefined}
          submitting={actionSubmitting}
          onCancel={() => setActiveAction(null)}
          onExecute={(values) => {
            void executeRowAction(values);
          }}
        />
        {pendingPrintTemplate && pendingPrintRow ? (
          <PrintDialog
            open
            title={
              pendingPrintTemplate.title ??
              "Paramètres d'impression du document"
            }
            schema={
              printerConfig?.clientDataSchema ??
              buildDefaultPrintSchema(pendingPrintTemplate)
            }
            defaultValues={pendingPrintData ?? {}}
            onSubmit={(values) => {
              void handleSubmitPrintData(values);
            }}
            onCancel={handleCancelPrintData}
          />
        ) : null}
        <DeleteConfirmationDialog
          open={Boolean(deleteTarget)}
          title={deleteDialogTitle}
          message={deleteDialogMessage}
          loading={deleteMutationState.loading}
          onCancel={closeDeleteDialog}
          onConfirm={handleConfirmDelete}
        />
        {exportConfig.enabled !== false && (
          <ModelTableExportDrawer
            ref={exportDrawerRef}
            meta={meta}
            fields={fields}
            pageInfo={pageInfo}
            columnFilters={activeColumnFilters}
            filtersPayload={exportFiltersPayload ?? null}
            orderingPayload={orderingPayload}
            quick={quick}
            columnStorageKey={exportColumnKey}
            additionalFilters={exportConfig.additionalFilters ?? []}
          />
        )}
      </div>
    </ModelAccessContext.Provider>
  );
}
