import type React from "react";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import type {
 ModelFormProps,
 ModelFormValueShape,
} from "@/widgets/model-form/types.model";
import type {
 BaseModelTableFieldsInput,
 DynamicModelTableRow,
 ModelSchema,
 TemplateInfo,
} from "../../types";
import type { ModelTableCreateDrawerDirection } from "../../config/types";

type ResolvedModelTableFormValues<TSource extends object> =
 ModelFormValueShape<TSource> extends Record<string, unknown>
 ? ModelFormValueShape<TSource>
 : Record<string, unknown>;

/**
 * Top-action item rendered in the content header action area.
 */
export type ModelTableContentTopAction<
 TSource extends object = Record<string, unknown>,
> = {
 /** Stable unique key. */
 key: string;
 /** Visible action label. */
 label: string;
 /** Optional icon node. */
 icon?: React.ReactNode;
 /** Loading flag for action-specific async/pending states. */
 loading?: boolean;
 /** Visual intent variant. */
 variant?: "default" | "outline" | "destructive";
 /** Optional button sizing token. */
 size?: "sm" | "md" | "lg" | "icon";
 /** Ordering priority (ascending). */
 order?: number;
 /** Visibility constraint based on selection state. */
 show_when?: "always" | "has_selection";
 /** Static disable flag. */
 disabled?: boolean;
 /** Disable reason for caller inspection. */
 disabledReason?: string;
 /** Optional data-* attributes. */
 dataAttributes?: Record<string, string | number | boolean | undefined>;
 /** Click callback with selection context. */
 on_click: (ctx: {
 selected_rows: DynamicModelTableRow<TSource>[];
 selection_state: Record<string, boolean>;
 }) => void;
};

/**
 * Shared view-model returned by the content controller hook.
 */
export type ModelTableContentControllerState<
 TSource extends object = Record<string, unknown>,
> = {
 /** Current app key. */
 app: string;
 /** Current model key. */
 model: string;
 /** Loaded metadata schema. */
 metadata?: ModelSchema;
 /** Whether capabilities metadata has finished resolving. */
 capabilitiesLoaded: boolean;
 /** True while template capabilities are still being resolved. */
 templateCapabilitiesPending: boolean;
 /** Toolbar filter panel configuration. */
 filterPanel?: unknown;
 /** Table-level labels/configuration object. */
 tableConfig?: unknown;
 /** Quick-search feature toggle. */
 quickSearch?: boolean;
 /** Field configuration for toolbar column selector. */
 fields?: BaseModelTableFieldsInput<TSource>;
 /** Enables reverse relationship fields in default table surfaces. */
 showReversed?: boolean;
 /** Enables synthetic count fields in default table surfaces. */
 showCount?: boolean;
 /** Data loading flag. */
 loading: boolean;
 /** Resolved display title. */
 resolvedTitle: string;
 /** Current total row count. */
 totalCount: number;
 /** Relative refresh timestamp text. */
 timeAgo: string;
 /** Current row selection map. */
 rowSelection: Record<string, boolean>;
 /** Selected rows extracted from table data. */
 selectedRows: DynamicModelTableRow<TSource>[];
 /** Selected row IDs as strings. */
 selectedRowIds: string[];
 /** Selected row count. */
 selectedCount: number;
 /** Whether at least one row is selected. */
 hasSelection: boolean;
 /** Resolved top action list after defaults + user actions. */
 resolvedTopActions: ModelTableContentTopAction<TSource>[];
 /** PDF template actions available on current model. */
 pdfTemplates: TemplateInfo[];
 /** Excel template actions available on current model. */
 excelTemplates: TemplateInfo[];
 /** Whether bulk delete is currently allowed. */
 canBulkDelete: boolean;
 /** Optional reason why bulk delete is unavailable. */
 bulkDeleteDisabledReason?: string;
 /** Whether bulk delete mutation is in flight. */
 bulkDeleteLoading: boolean;
 /** Whether bulk delete confirmation dialog is open. */
 bulkDeleteDialogOpen: boolean;
 /** Updates bulk delete dialog open state. */
 setBulkDeleteDialogOpen: (open: boolean) => void;
 /** Whether print/template parameter dialog is open. */
 printDialogOpen: boolean;
 /** Print/template dialog title. */
 printDialogTitle: string;
 /** Print/template dialog schema. */
 printDialogSchema: FormSchema;
 /** Print/template dialog submit label. */
 printDialogSubmitLabel: string;
 /** Whether create popup overlay is open. */
 createDialogOpen: boolean;
 /** Updates create popup open state. */
 setCreateDialogOpen: (open: boolean) => void;
 /** Create overlay mode for popup rendering. */
 createOverlayMode: "modal" | "drawer";
 /** Create overlay title. */
 createOverlayTitle: React.ReactNode;
 /** Optional create overlay width. */
 createOverlayWidth?: string;
 /** Optional create overlay height. */
 createOverlayHeight?: string;
 /** Drawer direction when create overlay is drawer. */
 createOverlayDrawerDirection: ModelTableCreateDrawerDirection;
 /** Resolved ModelForm props for create overlay. */
 createFormProps: ModelFormProps<ResolvedModelTableFormValues<TSource>, TSource> | null;
 /** Invokes one resolved top action. */
 handleTopActionClick: (action: ModelTableContentTopAction) => void;
 /** Triggers table data refresh. */
 triggerRefresh: () => void;
 /** Clears selected rows. */
 clearSelection: () => void;
 /** Runs template action for selected rows. */
 runTemplateForRows: (
 template: TemplateInfo,
 rows: DynamicModelTableRow<TSource>[],
 ) => void;
 /** Closes print/template dialog. */
 closePrintDialog: () => void;
 /** Submits print/template dialog values. */
 submitPrintDialog: (values: Record<string, unknown>) => void;
 /** Confirms bulk-delete action in current UI flow. */
 confirmBulkDelete: () => Promise<void>;
};

/**
 * Props passed to top-actions slot components.
 */
export type ModelTableTopActionsSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
};

/**
 * Props passed to header slot components.
 */
export type ModelTableHeaderSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
 /** Slot component used to render top actions in the header. */
 TopActionsComponent: React.ComponentType<ModelTableTopActionsSlotProps<TSource>>;
};

/**
 * Props passed to toolbar slot components.
 */
export type ModelTableToolbarSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
};

/**
 * Props passed to bulk-actions bar slot components.
 */
export type ModelTableBulkActionsBarSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
};

/**
 * Props passed to footer slot components.
 */
export type ModelTableFooterSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
};

/**
 * Props passed to dialog slot components.
 */
export type ModelTableDialogsSlotProps<
 TSource extends object = Record<string, unknown>,
> = {
 /** Resolved controller state and handlers. */
 controller: ModelTableContentControllerState<TSource>;
};

/**
 * Slot overrides for content composition.
 */
export type ModelTableContentSlots<
 TSource extends object = Record<string, unknown>,
> = {
 /** Optional custom header slot. */
 Header?: React.ComponentType<ModelTableHeaderSlotProps<TSource>>;
 /** Optional custom top-actions slot. */
 TopActions?: React.ComponentType<ModelTableTopActionsSlotProps<TSource>>;
 /** Optional custom toolbar slot. */
 Toolbar?: React.ComponentType<ModelTableToolbarSlotProps<TSource>>;
 /** Optional custom floating bulk-actions bar slot. */
 BulkActionsBar?: React.ComponentType<ModelTableBulkActionsBarSlotProps<TSource>>;
 /** Optional custom footer slot. */
 Footer?: React.ComponentType<ModelTableFooterSlotProps<TSource>>;
 /** Optional custom dialog layer slot. */
 Dialogs?: React.ComponentType<ModelTableDialogsSlotProps<TSource>>;
};

/**
 * Per-section visibility toggles for content composition.
 */
export type ModelTableContentSectionVisibility = {
 /** Shows or hides header section. */
 header?: boolean;
 /** Shows or hides top actions when header is hidden. */
 topActions?: boolean;
 /** Shows or hides toolbar section. */
 toolbar?: boolean;
 /** Shows or hides floating bulk-actions bar. */
 bulkActionsBar?: boolean;
 /** Shows or hides footer section. */
 footer?: boolean;
 /** Shows or hides dialogs layer. */
 dialogs?: boolean;
};

/**
 * Content-level composition configuration.
 */
export type ModelTableContentConfig<
 TSource extends object = Record<string, unknown>,
> = {
 /** Optional section visibility configuration. */
 show?: ModelTableContentSectionVisibility;
 /** Optional slot-component overrides. */
 slots?: ModelTableContentSlots<TSource>;
};
