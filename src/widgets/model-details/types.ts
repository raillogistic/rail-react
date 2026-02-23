import type React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { FilterFieldType } from "../table/compat/types";
import type {
  UnitFieldDensity,
  UnitFieldInput,
  UnitFieldMode,
} from "./units/unitFieldTypes";

export type DetailFieldConfig = {
  name: string;
  label?: string;
  description?: string;
  render?: (value: unknown, data: Record<string, unknown>) => React.ReactNode;
  colSpan?: number;
  type?: "text" | "table" | "unit";
  unitField?: UnitFieldInput;
  unitMode?: UnitFieldMode;
  unitDensity?: UnitFieldDensity;
  unitDefaultLocale?: string;
  unitDefaultTimezone?: string;
  table?: {
    columns: ColumnDef<unknown>[];
    rows?: unknown[];
    dataPath?: string;
    title?: string;
    available_filters?: FilterFieldType[];
    enable_quick_search?: boolean;
    enable_sorting?: boolean;
    selection?: {
      on_selection_change?: (
        selected_rows: unknown[],
        selection_state: Record<string, boolean>,
      ) => void;
      enabled?: boolean;
      position?: "start" | "end";
      header_title?: string;
    };
    row_actions?: {
      on_edit?: (row: unknown) => void;
      on_delete?: (row: unknown) => void;
      menu_items?: Array<{
        key: string;
        label: string;
        icon?: React.ReactNode;
        variant?: "default" | "destructive";
        on_click: (row: unknown) => void;
      }>;
      render_cell?: (row: unknown) => React.ReactNode;
      header_title?: string;
      position?: "start" | "end";
    };
    top_actions?: Array<{
      key: string;
      label: string;
      icon?: React.ReactNode;
      variant?: "default" | "outline" | "destructive";
      size?: "sm" | "md" | "lg" | "icon";
      order?: number;
      show_when?: "always" | "has_selection";
      on_click: (ctx: {
        selected_rows: unknown[];
        selection_state: Record<string, boolean>;
      }) => void;
    }>;
    initial_page_size?: number;
    page_size_options?: number[];
  };
};

export type DetailSectionConfig = {
  id?: string;
  title?: string;
  description?: string;
  columns?: number;
  fields: DetailFieldConfig[];
};

export type DetailPanelConfig = {
  id?: string;
  title?: string;
  sections: DetailSectionConfig[];
  actions?: Array<{
    key: string;
    label: string;
    on_click: (ctx: { data: Record<string, unknown> }) => void;
  }>;
};
