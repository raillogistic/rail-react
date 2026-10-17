/** Explicit fields for supplier purchase history. */
export const PURCHASE_ORDER_TABLE_FIELDS = [
  "draftReference",
  "orderNumber",
  "title",
  "department.name",
  "supplier.name",
  "status",
  "updatedAt",
  "totalTtc",
] as const;
