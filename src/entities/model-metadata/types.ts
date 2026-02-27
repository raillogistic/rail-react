export interface FieldPermissionSnapshot {
  can_read?: boolean;
  can_write?: boolean;
  visibility?: string | null;
  access_level?: string | null;
  mask_value?: string | null;
  reason?: string | null;
}

export interface ModelTableFieldMetadata {
  name: string;
  permissions?: FieldPermissionSnapshot | null;
  readable?: boolean;
  writable?: boolean;
  visibility?: string | null;
}

export interface ModelTableType {
  fields?: ModelTableFieldMetadata[];
  permissions?: unknown;
}

export interface ModelSchemaField {
  name: string;
  permissions?: FieldPermissionSnapshot | null;
  readable?: boolean;
  writable?: boolean;
  visibility?: string | null;
}

export interface ModelSchemaRelationship {
  name: string;
  permissions?: FieldPermissionSnapshot | null;
  readable?: boolean;
  writable?: boolean;
  visibility?: string | null;
}

export interface ModelSchema {
  fields?: ModelSchemaField[];
  relationships?: ModelSchemaRelationship[];
  permissions?: unknown;
}

export type GraphQLModelMetadataResource =
  | { kind: "table"; metadata: ModelTableType }
  | { kind: "form"; metadata: ModelSchema };

export type RawFieldPermission =
  | FieldPermissionSnapshot
  | {
      can_read?: boolean;
      can_write?: boolean;
      visibility?: string;
      access_level?: string;
      mask_value?: string | null;
      reason?: string | null;
    }
  | null
  | undefined;

export interface NormalizedFieldPermission {
  canRead: boolean;
  canWrite: boolean;
  visibility: string;
  accessLevel: string;
  maskValue?: string | null;
  reason?: string | null;
}

export const normalizeFieldPermission = (
  permission: RawFieldPermission,
): NormalizedFieldPermission => {
  if (!permission) {
    return {
      canRead: false,
      canWrite: false,
      visibility: "hidden",
      accessLevel: "none",
    };
  }
  return {
    canRead: Boolean(permission.can_read),
    canWrite: Boolean(permission.can_write),
    visibility: permission.visibility ?? "visible",
    accessLevel: permission.access_level ?? "default",
    maskValue: "mask_value" in permission ? permission.mask_value : undefined,
    reason: "reason" in permission ? permission.reason : undefined,
  };
};
