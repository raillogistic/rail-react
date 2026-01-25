import * as React from "react";
import { useFormMetadata } from "@/lib/form/backend/hooks";
import type { model_form_metadata } from "@/lib/form/backend/types/meta";
import { useModelTableMetadata } from "@/lib/tables/hooks";
import type { ModelTableType, FieldPermissionSnapshot } from "@/lib/tables/types";
import { useModelPermissions, type ModelPermissions } from "@/lib/auth/hooks/useModelPermissions";
import { normalizeFieldPermission, type NormalizedFieldPermission } from "@/lib/modelMetadata/types";

export interface ModelAccessSnapshot {
  appName: string;
  modelName: string;
  operations: ModelPermissions;
  tableFieldPermissions: Record<string, NormalizedFieldPermission>;
  formFieldPermissions: Record<string, NormalizedFieldPermission>;
  tableMetadata: ModelTableType | null;
  formMetadata: model_form_metadata | null;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<void>;
}

export const ModelAccessContext = React.createContext<ModelAccessSnapshot | null>(null);

export interface ModelAccessProviderProps {
  appName: string;
  modelName: string;
  children: React.ReactNode;
  tableMeta?: ModelTableType | null;
  formMeta?: model_form_metadata | null;
  loadTableMetadata?: boolean;
  loadFormMetadata?: boolean;
}

function buildFieldPermissionMap(
  source: Array<{ name: string; permissions?: FieldPermissionSnapshot | null }> | undefined
) {
  if (!source) return {};
  return source.reduce<Record<string, NormalizedFieldPermission>>((acc, field) => {
    acc[field.name] = normalizeFieldPermission(field.permissions);
    return acc;
  }, {});
}

function buildFormFieldPermissionMap(metadata: model_form_metadata | null) {
  if (!metadata) return {};
  const entries: Record<string, NormalizedFieldPermission> = {};
  metadata.fields?.forEach((field) => {
    entries[field.name] = normalizeFieldPermission(field.permissions);
  });
  metadata.relationships?.forEach((rel) => {
    entries[rel.name] = normalizeFieldPermission(rel.permissions);
  });
  return entries;
}

export function useModelAccess(options: {
  appName: string;
  modelName: string;
  tableMetaOverride?: ModelTableType | null;
  formMetaOverride?: model_form_metadata | null;
  loadTableMetadata?: boolean;
  loadFormMetadata?: boolean;
}): ModelAccessSnapshot {
  const {
    appName,
    modelName,
    tableMetaOverride,
    formMetaOverride,
    loadTableMetadata = true,
    loadFormMetadata = true,
  } = options;

  const shouldLoadTable = loadTableMetadata && !tableMetaOverride;
  const {
    metadata: tableMetadata,
    loading: tableLoading,
    error: tableError,
    refetch: refetchTable,
  } = useModelTableMetadata(appName, modelName, undefined, {
    skip: !shouldLoadTable,
  });

  const {
    metadata: formMetadata,
    loading: formLoading,
    error: formError,
    refetch: refetchForm,
  } = useFormMetadata({
    appName,
    modelName,
    skip: !loadFormMetadata || Boolean(formMetaOverride),
  });

  const resolvedTableMetadata = tableMetaOverride ?? tableMetadata ?? null;
  const resolvedFormMetadata = formMetaOverride ?? formMetadata ?? null;

  const permissionSnapshot = useModelPermissions(`${appName}.${modelName}`);

  const operations = React.useMemo<ModelPermissions>(() => {
    const metadataPermissions =
      resolvedTableMetadata?.permissions ?? resolvedFormMetadata?.permissions ?? null;
    if (!metadataPermissions) {
      return permissionSnapshot;
    }
    return {
      canCreate: metadataPermissions.can_create ?? permissionSnapshot.canCreate,
      canRead: metadataPermissions.can_read ?? permissionSnapshot.canRead,
      canUpdate: metadataPermissions.can_update ?? permissionSnapshot.canUpdate,
      canDelete: metadataPermissions.can_delete ?? permissionSnapshot.canDelete,
      canList: metadataPermissions.can_list ?? permissionSnapshot.canList,
      canHistory: metadataPermissions.can_history ?? permissionSnapshot.canHistory,
      loading: permissionSnapshot.loading,
    };
  }, [permissionSnapshot, resolvedFormMetadata?.permissions, resolvedTableMetadata?.permissions]);

  const tableFieldPermissions = React.useMemo(
    () => buildFieldPermissionMap(resolvedTableMetadata?.fields),
    [resolvedTableMetadata?.fields]
  );
  const formFieldPermissions = React.useMemo(
    () => buildFormFieldPermissionMap(resolvedFormMetadata),
    [resolvedFormMetadata]
  );

  const error = React.useMemo(() => {
    if (tableError) return tableError;
    if (formError) return formError;
    return undefined;
  }, [tableError, formError]);

  const loading = tableLoading || formLoading || permissionSnapshot.loading;

  const refetch = React.useCallback(async () => {
    await Promise.all([refetchTable(), refetchForm()]);
  }, [refetchTable, refetchForm]);

  return {
    appName,
    modelName,
    operations,
    tableFieldPermissions,
    formFieldPermissions,
    tableMetadata: resolvedTableMetadata,
    formMetadata: resolvedFormMetadata,
    loading,
    error,
    refetch,
  };
}

export const ModelAccessProvider = ({
  appName,
  modelName,
  children,
  tableMeta,
  formMeta,
  loadTableMetadata = true,
  loadFormMetadata = true,
}: ModelAccessProviderProps) => {
  const value = useModelAccess({
    appName,
    modelName,
    tableMetaOverride: tableMeta,
    formMetaOverride: formMeta,
    loadTableMetadata,
    loadFormMetadata,
  });
  return <ModelAccessContext.Provider value={value}>{children}</ModelAccessContext.Provider>;
};

export function useModelAccessContext(): ModelAccessSnapshot {
  const ctx = React.useContext(ModelAccessContext);
  if (!ctx) {
    throw new Error("useModelAccessContext must be used within a ModelAccessProvider");
  }
  return ctx;
}
