import React from "react";
import type { ModelFormProps } from "../../types.model";
import {
 mergePathLists,
 normalizeNestedControls,
} from "./nestedSchema";
import { collectInitialDataNestedFields } from "./queryLifecycle";
import {
 EMPTY_PATHS,
} from "./modelFormUtils";

export function useModelFormConfig<TFormValues extends Record<string, unknown>>(
 props: Pick<ModelFormProps<TFormValues>, "nested" | "includeNested" | "onlyRelationships" | "excludeRelationships">
) {
 const { nested, includeNested, onlyRelationships, excludeRelationships } = props;

 const resolvedOnlyRelationshipsInput = onlyRelationships ?? EMPTY_PATHS;
 const resolvedExcludeRelationshipsInput = excludeRelationships ?? EMPTY_PATHS;

 const resolvedOnlyRelationships = React.useMemo(
 () => mergePathLists(resolvedOnlyRelationshipsInput),
 [resolvedOnlyRelationshipsInput],
 );
 const resolvedExcludeRelationships = React.useMemo(
 () => mergePathLists(resolvedExcludeRelationshipsInput),
 [resolvedExcludeRelationshipsInput],
 );

 const nestedControls = React.useMemo(
 () => normalizeNestedControls(nested),
 [nested],
 );

 const shouldIncludeNested =
 includeNested ??
 Boolean(
 nestedControls ||
 resolvedOnlyRelationships.length > 0 ||
 resolvedExcludeRelationships.length > 0,
 );

 const initialDataNestedFields = React.useMemo(() => {
 return collectInitialDataNestedFields(
 nestedControls,
 resolvedOnlyRelationships,
 resolvedExcludeRelationships,
 );
 }, [nestedControls, resolvedOnlyRelationships, resolvedExcludeRelationships]);

 return {
 nestedControls,
 shouldIncludeNested,
 initialDataNestedFields,
 resolvedOnlyRelationships,
 resolvedExcludeRelationships,
 };
}
