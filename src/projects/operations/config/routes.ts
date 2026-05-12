export const ROUTES = {
  HOME: "/operations",
  ASSET_ASSIGNMENT_LIST: "/operations/asset-assignment",
  ASSET_ASSIGNMENT_CREATE: "/operations/asset-assignment/create",
  ASSET_ASSIGNMENT_EDIT: "/operations/asset-assignment/:id/edit",
  ASSET_ASSIGNMENT_DETAIL: "/operations/asset-assignment/:id",
  RESTITUTION_LIST: "/operations/restitution",
  RESTITUTION_CREATE: "/operations/restitution/create",
  RESTITUTION_EDIT: "/operations/restitution/:id/edit",
  RESTITUTION_DETAIL: "/operations/restitution/:id",
} as const;
