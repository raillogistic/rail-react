import type { FilterSchema } from "../../types";
import type { FilterFormState } from "@/widgets/model-table/filtering/types";

export type RelationFunctionMode = "some" | "none" | "every" | "count" | "agg";

export type AggFunction = "sum" | "avg" | "min" | "max" | "count" | "countDistinct";

export type RelationFieldOption = {
  name: string;
  label: string;
  graphqlType: string;
};

export type RelationFunctionKeys = {
  some: string;
  none: string;
  every: string;
  count: string;
  agg: string;
};

export type RelationFilterDialogProps = {
  columnId: string;
  metadataFilters: FilterSchema[];
  relationBaseName: string;
  relationFunctionKeys: RelationFunctionKeys;
  advancedFilters: FilterFormState;
  setAdvancedFilters: (
    filters: FilterFormState,
    variables?: Record<string, unknown>,
  ) => void;
};
