import type React from "react";
import type { FormSchema } from "@/widgets/model-form/inputs/types";
import type {
  BaseModelTableFieldsInput,
  ModelSchema,
  TemplateInfo,
} from "../../types";

/**
 * Top-action item rendered in the content header action area.
 */
export type ModelTableContentTopAction = {
  /** Stable unique key. */
  key: string;
  /** Visible action label. */
  label: string;
  /** Optional icon node. */
  icon?: React.ReactNode;
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
    selected_rows: Record<string, unknown>[];
    selection_state: Record<string, boolean>;
  }) => void;
};

/**
 * Shared view-model returned by the content controller hook.
 */
export type ModelTableContentControllerState = {
  /** Current app key. */
  app: string;
  /** Current model key. */
  model: string;
  /** Loaded metadata schema. */
  metadata?: ModelSchema;
  /** Toolbar filter panel configuration. */
  filterPanel?: unknown;
  /** Table-level labels/configuration object. */
  tableConfig?: unknown;
  /** Quick-search feature toggle. */
  quickSearch?: boolean;
  /** Field configuration for toolbar column selector. */
  fields?: BaseModelTableFieldsInput;
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
  selectedRows: Record<string, unknown>[];
  /** Selected row IDs as strings. */
  selectedRowIds: string[];
  /** Selected row count. */
  selectedCount: number;
  /** Whether at least one row is selected. */
  hasSelection: boolean;
  /** Resolved top action list after defaults + user actions. */
  resolvedTopActions: ModelTableContentTopAction[];
  /** PDF template actions available on current model. */
  pdfTemplates: TemplateInfo[];
  /** Excel template actions available on current model. */
  excelTemplates: TemplateInfo[];
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
  /** Invokes one resolved top action. */
  handleTopActionClick: (action: ModelTableContentTopAction) => void;
  /** Triggers table data refresh. */
  triggerRefresh: () => void;
  /** Clears selected rows. */
  clearSelection: () => void;
  /** Runs template action for selected rows. */
  runTemplateForRows: (
    template: TemplateInfo,
    rows: Record<string, unknown>[],
  ) => void;
  /** Closes print/template dialog. */
  closePrintDialog: () => void;
  /** Submits print/template dialog values. */
  submitPrintDialog: (values: Record<string, unknown>) => void;
  /** Confirms bulk-delete action in current UI flow. */
  confirmBulkDelete: () => void;
};

/**
 * Props passed to top-actions slot components.
 */
export type ModelTableTopActionsSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
};

/**
 * Props passed to header slot components.
 */
export type ModelTableHeaderSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
  /** Slot component used to render top actions in the header. */
  TopActionsComponent: React.ComponentType<ModelTableTopActionsSlotProps>;
};

/**
 * Props passed to toolbar slot components.
 */
export type ModelTableToolbarSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
};

/**
 * Props passed to bulk-actions bar slot components.
 */
export type ModelTableBulkActionsBarSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
};

/**
 * Props passed to footer slot components.
 */
export type ModelTableFooterSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
};

/**
 * Props passed to dialog slot components.
 */
export type ModelTableDialogsSlotProps = {
  /** Resolved controller state and handlers. */
  controller: ModelTableContentControllerState;
};

/**
 * Slot overrides for content composition.
 */
export type ModelTableContentSlots = {
  /** Optional custom header slot. */
  Header?: React.ComponentType<ModelTableHeaderSlotProps>;
  /** Optional custom top-actions slot. */
  TopActions?: React.ComponentType<ModelTableTopActionsSlotProps>;
  /** Optional custom toolbar slot. */
  Toolbar?: React.ComponentType<ModelTableToolbarSlotProps>;
  /** Optional custom floating bulk-actions bar slot. */
  BulkActionsBar?: React.ComponentType<ModelTableBulkActionsBarSlotProps>;
  /** Optional custom footer slot. */
  Footer?: React.ComponentType<ModelTableFooterSlotProps>;
  /** Optional custom dialog layer slot. */
  Dialogs?: React.ComponentType<ModelTableDialogsSlotProps>;
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
export type ModelTableContentConfig = {
  /** Optional section visibility configuration. */
  show?: ModelTableContentSectionVisibility;
  /** Optional slot-component overrides. */
  slots?: ModelTableContentSlots;
};
