import * as React from "react";
import { gql, useQuery } from "@apollo/client";
import type {
  ModelTableType,
  TableFieldMetadataType,
} from "../table/compat/types";
import { useFormMetadata } from "../form/backend/hooks";
import { useModelTableMetadata } from "../table/compat/hooks";

export type ModelMetadataRelationship = Record<string, any>;

function buildDetailSelection(fields: TableFieldMetadataType[]) {
  const parts: string[] = ["id", "desc"];
  fields.forEach((f) => {
    if (f.is_related) {
      parts.push(`${f.name} { id desc }`);
    } else {
      parts.push(f.name);
    }
  });
  return parts.join("\n");
}

function buildSingleItemQuery(modelName: string, fields: TableFieldMetadataType[], extraFields: string[] = []) {
  const selectionParts = [buildDetailSelection(fields), ...extraFields.filter(Boolean)];
  const selection = selectionParts.filter(Boolean).join("\n");
  const qname = modelName.toLowerCase();
  return gql`
    query ${modelName}Detail($id: ID!) {
      response: ${qname}(id: $id) {
        ${selection}
      }
    }
  `;
}


export function useGraphQLModelDetail(appName: string, modelName: string, id: string | number) {
  const formMeta = useFormMetadata({ appName, modelName });

  const tableMeta = useModelTableMetadata(appName, modelName);
  const tableFields = tableMeta.metadata?.fields;
  const fields = React.useMemo(() => tableFields ?? [], [tableFields]);
  const relationshipCountFields = React.useMemo(() => {
    const relationships = formMeta.metadata?.relationships ?? [];
    return relationships
      .filter((rel) => rel.relationType === "ManyToOneRel")
      .map((rel) => `${rel.name}_count`);
  }, [formMeta.metadata?.relationships]);
  const dataQuery = React.useMemo(() => {
    if (!fields.length) return null;
    return buildSingleItemQuery(modelName, fields, relationshipCountFields);
  }, [fields, modelName, relationshipCountFields]);

  const dataQ = useQuery<{ response: Record<string, unknown> }>(dataQuery ?? gql`query { __typename }`, {
    skip: !dataQuery,
    variables: { id: String(id) },
    fetchPolicy: "cache-first",
  });

  const item: Record<string, unknown> | null = dataQ.data?.response ?? null;

  return {
    metadata: formMeta.metadata,
    tableMeta: (tableMeta.metadata as ModelTableType | null) ?? null,
    item,
    loading: formMeta.loading || tableMeta.loading || dataQ.loading,
    error: formMeta.error || tableMeta.error || dataQ.error,
    refetch: () => Promise.all([formMeta.refetch(), tableMeta.refetch(), dataQ.refetch()]),
  };
}

export function useLazyRelatedTable(
  relatedApp: string,
  relatedModel: string,
  parentModel: string,
  parentId: string | number,
  accessorOrFk?: string,
) {
  const fkGuess = accessorOrFk ?? `${parentModel.toLowerCase()}__id`;
  const normalizedValue = React.useMemo(() => {
    if (typeof parentId === "number") return parentId;
    const numeric = Number(parentId);
    return Number.isNaN(numeric) ? String(parentId) : numeric;
  }, [parentId]);
  const filters = React.useMemo(
    () => ({ [fkGuess]: normalizedValue }),
    [fkGuess, normalizedValue],
  );
  const vars = React.useMemo(() => ({ filters, page: 1, per_page: 10 }), [filters]);
  return { relatedApp, relatedModel, initVariables: vars };
}

