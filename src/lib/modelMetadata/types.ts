import type { ModelTableType, FieldPermissionSnapshot } from "@/lib/tablev2/compat/types";
import type { FormMetadata } from "@/lib/form2/types";

export type GraphQLModelMetadataResource =
  | { kind: "table"; metadata: ModelTableType }
  | { kind: "form"; metadata: FormMetadata };

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
  permission: RawFieldPermission
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

