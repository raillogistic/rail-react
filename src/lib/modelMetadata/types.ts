import type { ModelTableType, FieldPermissionSnapshot } from "@/lib/tables/types";
import type {
  model_form_metadata,
  field_permission_metadata,
} from "@/lib/form/backend/types/meta";

export type GraphQLModelMetadataResource =
  | { kind: "table"; metadata: ModelTableType }
  | { kind: "form"; metadata: model_form_metadata };

export type RawFieldPermission =
  | FieldPermissionSnapshot
  | field_permission_metadata
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
