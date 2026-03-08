import React from "react";
import { TableToolbar } from "../TableToolbar";
import type {
 ModelTableFilterPanelProps,
 ModelTableV2TableConfig,
} from "../../config/types";
import type { ModelTableToolbarSlotProps } from "./types";

/**
 * Props for the default toolbar slot.
 */
type ModelTableToolbarSectionProps = ModelTableToolbarSlotProps;

/**
 * Renders the default toolbar with quick search and filter controls.
 */
export function ModelTableToolbarSection({
 controller,
}: ModelTableToolbarSectionProps) {
 return (
 <TableToolbar
 filterPanel={controller.filterPanel as ModelTableFilterPanelProps | undefined}
 tableConfig={controller.tableConfig as ModelTableV2TableConfig | undefined}
 quickSearch={controller.quickSearch}
 fields={controller.fields}
 showReversed={controller.showReversed}
 showCount={controller.showCount}
 />
 );
}
