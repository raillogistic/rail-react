import type { ModelFormOperationPermission } from "../types/generatedContract";

export type OperationPermissionMode = "CREATE" | "UPDATE" | "VIEW";

const DEFINITIVE_PERMISSION_REASON_PATTERNS = [
 /authentication required/i,
 /permission required/i,
];

function hasDefinitivePermissionReason(reason: string): boolean {
 return DEFINITIVE_PERMISSION_REASON_PATTERNS.some((pattern) =>
 pattern.test(reason),
 );
}

/**
 * Determine whether a denied operation permission should be strictly enforced.
 *
 * UPDATE contracts are usually extracted without an instance context. For
 * object-scoped guards this can produce provisional denies (e.g. "condition
 * not met") even when the targeted object is writable. In that case, avoid
 * forcing read-only in UI and let mutation-time authorization decide.
 */
export function shouldEnforceOperationDeny(
 permission: ModelFormOperationPermission | null | undefined,
 mode: OperationPermissionMode,
): boolean {
 if (!permission || permission.allowed !== false) {
 return false;
 }

 const requiredPermissions = Array.isArray(permission.requiredPermissions)
 ? permission.requiredPermissions.filter((value) => String(value ?? "").trim().length > 0)
 : [];
 if (requiredPermissions.length > 0) {
 return true;
 }

 const reason = String(permission.reason ?? "").trim();
 if (hasDefinitivePermissionReason(reason)) {
 return true;
 }

 if (mode === "UPDATE") {
 return false;
 }

 return true;
}
