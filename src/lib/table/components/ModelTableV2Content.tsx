import React from "react";
import { TooltipProvider } from "@/lib/components/ui/tooltip";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
  ModelTableV2TopActionsInput,
} from "../config/types";
import type { BaseModelTableFieldsInput } from "../types";
import { ModelTableBulkActionsBar } from "./content/ModelTableBulkActionsBar";
import { ModelTableDialogs } from "./content/ModelTableDialogs";
import { ModelTableFooter } from "./content/ModelTableFooter";
import { ModelTableHeader } from "./content/ModelTableHeader";
import { ModelTableToolbarSection } from "./content/ModelTableToolbarSection";
import { ModelTableTopActions } from "./content/ModelTableTopActions";
import type {
  ModelTableContentConfig,
  ModelTableContentSectionVisibility,
  ModelTableTopActionsSlotProps,
} from "./content/types";
import {
  useModelTableContentController,
  type UseModelTableContentControllerInput,
} from "./content/useModelTableContentController";

/**
 * Public props for the composed ModelTableV2 content shell.
 */
export type ModelTableV2ContentProps = {
  /** Optional filter-panel configuration forwarded to the toolbar slot. */
  filterPanel?: ModelTableFilterPanelProps;
  /** Optional table labels and display configuration. */
  tableConfig?: ModelTableV2TableConfig;
  /** Enables quick-search control in toolbar slot. */
  quickSearch?: boolean;
  /** Optional field configuration for toolbar column controls. */
  fields?: BaseModelTableFieldsInput;
  /** Optional caller-provided top actions source. */
  topActions?: ModelTableV2TopActionsInput;
  /** Optional content-slot composition overrides. */
  content?: ModelTableContentConfig;
};

/**
 * Default section visibility used when callers do not provide content.show.
 */
const DEFAULT_VISIBILITY: Required<ModelTableContentSectionVisibility> = {
  header: true,
  topActions: true,
  toolbar: true,
  bulkActionsBar: true,
  footer: false,
  dialogs: true,
};

/**
 * Merges default visibility and caller-provided section visibility.
 */
function resolveVisibility(
  visibility?: ModelTableContentSectionVisibility,
): Required<ModelTableContentSectionVisibility> {
  return {
    ...DEFAULT_VISIBILITY,
    ...(visibility ?? {}),
  };
}

/**
 * Hidden top-actions placeholder used when topActions visibility is disabled.
 */
function EmptyTopActions({}: ModelTableTopActionsSlotProps) {
  return null;
}

/**
 * Composed content shell used by model table implementations.
 */
export function ModelTableV2Content({
  filterPanel,
  tableConfig,
  quickSearch,
  fields,
  topActions,
  content,
}: ModelTableV2ContentProps) {
  const controllerInput: UseModelTableContentControllerInput = {
    filterPanel,
    tableConfig,
    quickSearch,
    fields,
    topActions,
  };
  const controller = useModelTableContentController(controllerInput);

  if (!controller.metadata) {
    return null;
  }

  const visibility = resolveVisibility(content?.show);

  const HeaderSlot = content?.slots?.Header ?? ModelTableHeader;
  const TopActionsSlot = content?.slots?.TopActions ?? ModelTableTopActions;
  const ToolbarSlot = content?.slots?.Toolbar ?? ModelTableToolbarSection;
  const BulkActionsBarSlot =
    content?.slots?.BulkActionsBar ?? ModelTableBulkActionsBar;
  const FooterSlot = content?.slots?.Footer ?? ModelTableFooter;
  const DialogsSlot = content?.slots?.Dialogs ?? ModelTableDialogs;

  const headerTopActionsSlot = visibility.topActions
    ? TopActionsSlot
    : EmptyTopActions;
  const showStandaloneTopActions = !visibility.header && visibility.topActions;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
        {visibility.header && (
          <HeaderSlot
            controller={controller}
            TopActionsComponent={headerTopActionsSlot}
          />
        )}

        {showStandaloneTopActions && (
          <div className="flex w-full justify-end px-1">
            <TopActionsSlot controller={controller} />
          </div>
        )}

        {visibility.toolbar && <ToolbarSlot controller={controller} />}
        {visibility.bulkActionsBar && (
          <BulkActionsBarSlot controller={controller} />
        )}
        {visibility.footer && <FooterSlot controller={controller} />}
      </div>

      {visibility.dialogs && <DialogsSlot controller={controller} />}
    </TooltipProvider>
  );
}
