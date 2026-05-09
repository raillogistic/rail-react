export const ROUTES = {
  HOME: "/finance",
  ASSET_LIST: "/finance/asset",
  ASSET_CREATE: "/finance/asset/create",
  ASSET_EDIT: "/finance/asset/:id/edit",
  ASSET_DETAIL: "/finance/asset/:id",
  ASSET_FINANCIAL_PROFILE_LIST: "/finance/asset-financial-profile",
  ASSET_FINANCIAL_PROFILE_CREATE: "/finance/asset-financial-profile/create",
  ASSET_FINANCIAL_PROFILE_EDIT: "/finance/asset-financial-profile/:id/edit",
  ASSET_FINANCIAL_PROFILE_DETAIL: "/finance/asset-financial-profile/:id",
} as const;
