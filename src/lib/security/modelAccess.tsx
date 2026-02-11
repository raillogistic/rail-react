import * as React from "react";
import { useModelTableMetadata } from "@/lib/table/compat/hooks";
import type { ModelTableType, FieldPermissionSnapshot } from "@/lib/table/compat/types";
import { useModelPermissions, type ModelPermissions } from "@/lib/auth/hooks/useModelPermissions";
import { normalizeFieldPermission, type NormalizedFieldPermission } from "@/lib/modelMetadata/types";
import { useMetadata } from "@/lib/metadata/gateway";
import type { ModelSchema } from "@/lib/table/types";

export interface ModelAccessSnapshot {
  appName: string;
  modelName: string;
  operations: ModelPermissions;
  tableFieldPermissions: Record<string, NormalizedFieldPermission>;
  formFieldPermissions: Record<string, NormalizedFieldPermission>;
  tableMetadata: ModelTableType | null;
  formMetadata: ModelSchema | null;
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
  formMeta?: ModelSchema | null;
  loadTableMetadata?: boolean;
  loadFormMetadata?: boolean;
}

type PermissionSource = {
  name: string;
  permissions?: FieldPermissionSnapshot | null;
  readable?: boolean;
  writable?: boolean;
  visibility?: string | null;
};

function resolveFieldPermission(source: PermissionSource) {
  if (source.permissions) {
    return normalizeFieldPermission(source.permissions);
  }
  if (
    typeof source.readable === "boolean" ||
    typeof source.writable === "boolean" ||
    source.visibility
  ) {
    return normalizeFieldPermission({
      can_read: Boolean(source.readable),
      can_write: Boolean(source.writable),
      visibility: source.visibility ?? "hidden",
      access_level: "default",
    });
  }
  return normalizeFieldPermission(null);
}

function buildFieldPermissionMap(source: PermissionSource[] | undefined) {
  if (!source) return {};
  return source.reduce<Record<string, NormalizedFieldPermission>>((acc, field) => {
    acc[field.name] = resolveFieldPermission(field);
    return acc;
  }, {});
}

function buildFormFieldPermissionMap(metadata: ModelSchema | null) {
  if (!metadata) return {};
  const entries: Record<string, NormalizedFieldPermission> = {};
  metadata.fields?.forEach((field) => {
    entries[field.name] = resolveFieldPermission(field);
  });
  metadata.relationships?.forEach((rel) => {
    entries[rel.name] = resolveFieldPermission(rel);
  });
  return entries;
}

export function useModelAccess(options: {
  appName: string;
  modelName: string;
  tableMetaOverride?: ModelTableType | null;
  formMetaOverride?: ModelSchema | null;
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
  } = useMetadata({
    app: appName,
    model: modelName,
    profile: "form",
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
    const canCreate =
      (metadataPermissions as any).can_create ??
      (metadataPermissions as any).canCreate ??
      permissionSnapshot.canCreate;
    const canRead =
      (metadataPermissions as any).can_read ??
      (metadataPermissions as any).canRetrieve ??
      (metadataPermissions as any).canRead ??
      permissionSnapshot.canRead;
    const canUpdate =
      (metadataPermissions as any).can_update ??
      (metadataPermissions as any).canUpdate ??
      permissionSnapshot.canUpdate;
    const canDelete =
      (metadataPermissions as any).can_delete ??
      (metadataPermissions as any).canDelete ??
      permissionSnapshot.canDelete;
    const canList =
      (metadataPermissions as any).can_list ??
      (metadataPermissions as any).canList ??
      permissionSnapshot.canList;
    const canHistory =
      (metadataPermissions as any).can_history ??
      (metadataPermissions as any).canHistory ??
      permissionSnapshot.canHistory;
    return {
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canList,
      canHistory,
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
