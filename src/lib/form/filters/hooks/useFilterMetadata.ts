/**
 * Dynamic Filters - useFilterMetadata Hook
 * 
 * Fetches and merges metadata from modelSchema, filterSchema, and savedFilters.
 */

import { useQuery, gql } from "@apollo/client";
import { useMemo, useCallback } from "react";
import { mergeFilterMetadata } from "../metadataMerger";
import type { UnifiedFilterSchema } from "../types";

const FILTER_METADATA_QUERY = gql`
  query FilterMetadata($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      verboseNamePlural
      fields {
        name
        fieldName
        verboseName
        helpText
        fieldType
        graphqlType
        required
        nullable
        choices { value label group }
        minValue
        maxValue
        isRelation
        isNumeric
        isDate
        isDatetime
        isBoolean
        isText
        isJson
        isIndexed
      }
      relationships {
        name
        fieldName
        verboseName
        relatedApp
        relatedModel
        relationType
        isToMany
        lookupField
        searchFields
      }
      filterConfig {
        style
        argumentName
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        supportsFts
        supportsAggregation
        presets {
          name
          presetName
          description
          filterJson
        }
        computedFilters {
          name
          fieldName
          filterType
          description
        }
      }
      relationFilters {
        name
        fieldName
        relationType
        supportsSome
        supportsEvery
        supportsNone
        supportsCount
        nestedFilterType
      }
      fieldGroups {
        key
        label
        description
        fields
      }
    }
    filterSchema(app: $app, model: $model) {
      name
      fieldName
      fieldLabel
      baseType
      isNested
      relatedModel
      filterInputType
      availableOperators
      options {
        name
        lookup
        label
        helpText
        choices { value label }
        graphqlType
        isList
      }
    }
  }
`;

const SAVED_FILTERS_QUERY = gql`
  query SavedFilters($modelName: String!) {
    savedFilters(
      where: { modelName: { eq: $modelName } }
      orderBy: ["-updatedAt"]
      limit: 50
    ) {
      id
      name
      description
      filterJson
      isShared
      createdBy { id username }
      useCount
      lastUsedAt
    }
  }
`;

export interface UseFilterMetadataOptions {
  app: string;
  model: string;
  maxDepth?: number;
  includeSavedFilters?: boolean;
  skip?: boolean;
}

export interface UseFilterMetadataResult {
  schema: UnifiedFilterSchema | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  refetchSavedFilters: () => void;
}

export function useFilterMetadata({
  app,
  model,
  maxDepth = 3,
  includeSavedFilters = true,
  skip = false,
}: UseFilterMetadataOptions): UseFilterMetadataResult {
  // Fetch model and filter schema
  const {
    data: metadataData,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata,
  } = useQuery(FILTER_METADATA_QUERY, {
    variables: { app, model },
    skip,
    fetchPolicy: "cache-first",
  });

  // Fetch saved filters
  const {
    data: savedFiltersData,
    loading: savedFiltersLoading,
    refetch: refetchSavedFilters,
  } = useQuery(SAVED_FILTERS_QUERY, {
    variables: { modelName: model },
    skip: skip || !includeSavedFilters,
    fetchPolicy: "cache-and-network",
  });

  // Merge all metadata sources
  const schema = useMemo(() => {
    if (!metadataData?.modelSchema || !metadataData?.filterSchema) {
      return null;
    }

    return mergeFilterMetadata(
      metadataData,
      metadataData,
      includeSavedFilters ? savedFiltersData : null,
      { maxDepth }
    );
  }, [metadataData, savedFiltersData, includeSavedFilters, maxDepth]);

  const refetch = useCallback(() => {
    refetchMetadata();
    if (includeSavedFilters) {
      refetchSavedFilters();
    }
  }, [refetchMetadata, refetchSavedFilters, includeSavedFilters]);

  return {
    schema,
    loading: metadataLoading || (includeSavedFilters && savedFiltersLoading),
    error: metadataError ?? null,
    refetch,
    refetchSavedFilters,
  };
}
