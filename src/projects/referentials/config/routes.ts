/**
 * Routes pour le module Référentiels.
 * Contient toutes les routes CRUD pour les tables de référence.
 */
export const ROUTES = {
  // Services
  SERVICE_LIST: "/referentials/service",
  SERVICE_CREATE: "/referentials/service/create",
  SERVICE_EDIT: "/referentials/service/:id/edit",
  SERVICE_DETAIL: "/referentials/service/:id",
  // Employés
  EMPLOYEE_LIST: "/referentials/employee",
  EMPLOYEE_CREATE: "/referentials/employee/create",
  EMPLOYEE_EDIT: "/referentials/employee/:id/edit",
  EMPLOYEE_DETAIL: "/referentials/employee/:id",
  // Catégories
  ASSET_CATEGORY_LIST: "/referentials/asset-category",
  ASSET_CATEGORY_CREATE: "/referentials/asset-category/create",
  ASSET_CATEGORY_EDIT: "/referentials/asset-category/:id/edit",
  ASSET_CATEGORY_DETAIL: "/referentials/asset-category/:id",
  // Familles
  ASSET_FAMILY_LIST: "/referentials/asset-family",
  ASSET_FAMILY_CREATE: "/referentials/asset-family/create",
  ASSET_FAMILY_EDIT: "/referentials/asset-family/:id/edit",
  ASSET_FAMILY_DETAIL: "/referentials/asset-family/:id",
  // Fournisseurs
  SUPPLIER_LIST: "/referentials/supplier",
  SUPPLIER_CREATE: "/referentials/supplier/create",
  SUPPLIER_EDIT: "/referentials/supplier/:id/edit",
  SUPPLIER_DETAIL: "/referentials/supplier/:id",
  // Types de documents
  DOCUMENT_TYPE_LIST: "/referentials/document-type",
  DOCUMENT_TYPE_CREATE: "/referentials/document-type/create",
  DOCUMENT_TYPE_EDIT: "/referentials/document-type/:id/edit",
  DOCUMENT_TYPE_DETAIL: "/referentials/document-type/:id",

  // Métadonnées
  METADATA_DEFINITION_LIST: "/referentials/metadata-definition",
  METADATA_DEFINITION_CREATE: "/referentials/metadata-definition/create",
  METADATA_DEFINITION_EDIT: "/referentials/metadata-definition/:id/edit",
  METADATA_DEFINITION_DETAIL: "/referentials/metadata-definition/:id",
} as const;
