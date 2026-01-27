/**
 * Dynamic Filters - useNestedFilterForm Hook
 * 
 * Manages filter form state with TanStack Form and Zod validation.
 */

import { useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import type { 
  FilterFormState, 
  FilterGroup, 
  FilterCondition, 
  UnifiedFilterSchema 
} from "../types";
import { createInitialFilterState, generateId } from "../state";

/**
 * Zod schema for filter state validation
 */
const filterConditionSchema = z.object({
  id: z.string(),
  type: z.literal("condition"),
  fieldPath: z.array(z.string()),
  fieldName: z.string(),
  operator: z.string(),
  value: z.any(),
  relationOperator: z.string().optional(),
});

const filterGroupSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: z.literal("group"),
  logic: z.enum(["AND", "OR"]),
  conditions: z.array(z.union([filterConditionSchema, filterGroupSchema])),
  negated: z.boolean(),
}));

const filterFormSchema = z.object({
  root: filterGroupSchema,
  selectedPresets: z.array(z.string()),
  distinctOn: z.array(z.string()),
  orderBy: z.array(z.string()),
});

export interface UseNestedFilterFormOptions {
  schema: UnifiedFilterSchema | null;
  initialState?: FilterFormState;
}

// Create static validator adapter instance to prevent re-renders
const validatorAdapter = zodValidator();

export function useNestedFilterForm({
  schema,
  initialState,
}: UseNestedFilterFormOptions) {
  const defaultValues = useMemo(() => initialState ?? createInitialFilterState(), [initialState]);

  const formOptions = useMemo(() => ({
    defaultValues,
    // validatorAdapter,
    // validators: {
    //   onChange: filterFormSchema,
    // },
  }), [defaultValues]);

  // Debug check for options stability
  /*
  const prevOptions = React.useRef(formOptions);
  React.useEffect(() => {
    if (prevOptions.current !== formOptions) {
      console.log('Form options changed', {
        defaultValuesChanged: prevOptions.current.defaultValues !== formOptions.defaultValues,
        validatorsChanged: prevOptions.current.validators !== formOptions.validators,
      });
      prevOptions.current = formOptions;
    }
  });
  */

  const form = useForm(formOptions);

  /*
  useEffect(() => {
    console.log("useNestedFilterForm: form instance changed", form);
  }, [form]);
  */

  // Use useStore to make state reactive in the component
  const state = useStore(form.store, (s) => s.values);

  return {
    form,
    state,
    actions: {
      reset: () => form.reset(),
      
      setRoot: (root: FilterGroup) => form.setFieldValue("root", root),
      
      addCondition: (parentId: string, fieldPath: string[], fieldName: string, operator: string) => {
        const condition: FilterCondition = {
          id: generateId(),
          type: "condition",
          fieldPath,
          fieldName,
          operator,
          value: undefined,
        };
        // Update root by finding parent and adding condition
        const currentRoot = form.getFieldValue("root");
        form.setFieldValue("root", addConditionToGroup(currentRoot, parentId, condition));
      },

      addGroup: (parentId: string, logic: "AND" | "OR" = "OR") => {
        const group: FilterGroup = {
          id: generateId(),
          type: "group",
          logic,
          conditions: [],
          negated: false,
        };
        const currentRoot = form.getFieldValue("root");
        form.setFieldValue("root", addGroupToGroup(currentRoot, parentId, group));
      },

      updateCondition: (id: string, updates: Partial<FilterCondition>) => {
        const currentRoot = form.getFieldValue("root");
        form.setFieldValue("root", updateItemInGroup(currentRoot, id, updates));
      },

      updateGroup: (id: string, updates: Partial<FilterGroup>) => {
        const currentRoot = form.getFieldValue("root");
        form.setFieldValue("root", updateItemInGroup(currentRoot, id, updates));
      },

      removeItem: (id: string) => {
        const currentRoot = form.getFieldValue("root");
        form.setFieldValue("root", removeItemFromGroup(currentRoot, id));
      },

      togglePreset: (presetId: string) => {
        const current = form.getFieldValue("selectedPresets");
        form.setFieldValue("selectedPresets",
          current.includes(presetId)
            ? current.filter((id: string) => id !== presetId)
            : [...current, presetId]
        );
      },

      setDistinctOn: (fields: string[]) => form.setFieldValue("distinctOn", fields),

      setOrderBy: (fields: string[]) => form.setFieldValue("orderBy", fields),
    },
  };
}

// Helper functions for immutable tree updates
function addConditionToGroup(group: FilterGroup, parentId: string, condition: FilterCondition): FilterGroup {
  if (group.id === parentId) {
    return { ...group, conditions: [...group.conditions, condition] };
  }
  return {
    ...group,
    conditions: group.conditions.map((item) =>
      item.type === "group" ? addConditionToGroup(item, parentId, condition) : item
    ),
  };
}

function addGroupToGroup(group: FilterGroup, parentId: string, newGroup: FilterGroup): FilterGroup {
  if (group.id === parentId) {
    return { ...group, conditions: [...group.conditions, newGroup] };
  }
  return {
    ...group,
    conditions: group.conditions.map((item) =>
      item.type === "group" ? addGroupToGroup(item, parentId, newGroup) : item
    ),
  };
}

function updateItemInGroup(group: FilterGroup, id: string, updates: Partial<FilterCondition | FilterGroup>): FilterGroup {
  if (group.id === id) {
    return { ...group, ...updates };
  }
  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      if (item.type === "group") {
        return updateItemInGroup(item, id, updates);
      }
      return item;
    }),
  };
}

function removeItemFromGroup(group: FilterGroup, id: string): FilterGroup {
  return {
    ...group,
    conditions: group.conditions
      .filter((item) => item.id !== id)
      .map((item) => (item.type === "group" ? removeItemFromGroup(item, id) : item)),
  };
}
