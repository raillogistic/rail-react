import React from "react";
import { gql, useQuery } from "@apollo/client";
import { QuickFilter, QuickFilterOption } from "./QuickFilter";
import { FilterFieldType } from "../types";

interface QuickFilterLoaderProps {
  fieldKey: string;
  filterMeta: FilterFieldType;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  title?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
}

export function QuickFilterLoader({
  fieldKey,
  filterMeta,
  selectedValues,
  onChange,
  title,
  icon,
  searchable,
}: QuickFilterLoaderProps) {
  // 1. If choices exist in metadata, use them directly
  let options: QuickFilterOption[] = [];
  if (filterMeta.choices && filterMeta.choices.length > 0) {
    options = filterMeta.choices;
  } else {
    // Check options array for choices
    const optionWithChoices = filterMeta.options?.find(
      (opt) => opt.choices && opt.choices.length > 0
    );
    if (optionWithChoices && optionWithChoices.choices) {
      options = optionWithChoices.choices;
    }
  }

  // 2. If no choices found but we have a related model, try to fetch them
  const relatedModelRaw = filterMeta.related_model;
  const relatedModel = relatedModelRaw
    ? relatedModelRaw.split(".").pop()?.toLowerCase()
    : undefined;
  const shouldFetch =
    options.length === 0 && !!relatedModel && !filterMeta.is_custom;

  // Construct query name: e.g. EquipmentCategory -> equipmentcategorys
  const queryName = relatedModel ? `${relatedModel}s` : "noop";
  
  const OPTIONS_QUERY = gql`
    query GetQuickFilterOptions {
      items: ${queryName} {
        id
        desc
      }
    }
  `;

  const { data, loading, error } = useQuery(OPTIONS_QUERY, {
    skip: !shouldFetch,
    fetchPolicy: "cache-first",
  });

  if (shouldFetch) {
    if (loading) return null; // Or a loading spinner
    if (error) {
      console.error(`Error fetching options for ${fieldKey}:`, error);
      return null;
    }
    if (data?.items) {
      options = data.items.map((item: any) => ({
        value: item.id,
        label: item.desc || item.name || item.code || item.id,
      }));
    }
  }

  if (options.length === 0) return null;

  return (
    <QuickFilter
      title={title || filterMeta.field_label || filterMeta.field_name}
      options={options}
      selectedValues={selectedValues}
      onChange={onChange}
      icon={icon}
      searchable={searchable}
    />
  );
}
