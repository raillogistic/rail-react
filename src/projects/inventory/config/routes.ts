export const ROUTES = {
  HOME: "/inventory",
  INVENTORY_CAMPAIGN_LIST: "/inventory/inventory-campaign",
  INVENTORY_CAMPAIGN_CREATE: "/inventory/inventory-campaign/create",
  INVENTORY_CAMPAIGN_EDIT: "/inventory/inventory-campaign/:id/edit",
  INVENTORY_CAMPAIGN_DETAIL: "/inventory/inventory-campaign/:id",
  INVENTORY_LINE_LIST: "/inventory/inventory-line",
  INVENTORY_LINE_CREATE: "/inventory/inventory-line/create",
  INVENTORY_LINE_EDIT: "/inventory/inventory-line/:id/edit",
  INVENTORY_LINE_DETAIL: "/inventory/inventory-line/:id",
  GAP_REPORT: "/inventory/gap-report",
} as const;
