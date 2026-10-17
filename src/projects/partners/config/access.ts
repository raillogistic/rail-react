/** Partners access rules; backend permission identifiers remain authoritative. */
import type { RouteAccessRequirement } from "@/shared/routing/access";
export const MASTER_DATA_READ_ACCESS: RouteAccessRequirement = {
  anyRoles: [
    "achat_viewer",
    "organization_manager",
    "supplier_manager",
    "catalog_manager",
    "admin_system",
    "superadmin",
  ],
};

export const SUPPLIER_REPORTING_ACCESS: RouteAccessRequirement = {
  anyRoles: [
    "report_manager",
    "supplier_manager",
    "bc_supervisor",
    "da_manager",
    "da_supervisor",
    "dfc_manager",
    "dp_supervisor",
    "admin_system",
    "superadmin",
  ],
};

export const SUPPLIER_MANAGE_ACCESS: RouteAccessRequirement = {
  anyRoles: ["supplier_manager", "admin_system", "superadmin"],
};

export const SUPPLIER_INTAKE_READ_ACCESS: RouteAccessRequirement = {
  anyRoles: ["supplier_manager", "copeo", "admin_system", "superadmin"],
};

export const SUPPLIER_INTAKE_MANAGE_ACCESS: RouteAccessRequirement = {
  anyRoles: ["supplier_manager", "admin_system", "superadmin", "copeo"],
};
export const PROCUREMENT_CONFIGURATION_ACCESS = {
  anyRoles: ["procurement_head", "organization_manager", "admin_system", "superadmin"],
};
