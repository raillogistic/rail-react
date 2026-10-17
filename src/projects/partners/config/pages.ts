/** Partners models and unchanged access requirements. */
import { ClipboardCheck, Handshake, Layers, Users } from "lucide-react";
import { ROUTES } from "./routes";
import { MASTER_DATA_READ_ACCESS, SUPPLIER_MANAGE_ACCESS, SUPPLIER_INTAKE_READ_ACCESS, SUPPLIER_INTAKE_MANAGE_ACCESS, PROCUREMENT_CONFIGURATION_ACCESS } from "./access";
import type { PARTNERS_MASTER_DATA_VIEWS } from "./masterDataViews";
import type { RouteAccessRequirement } from "@/shared/routing/access";
export const PARTNER_PAGES: { key: keyof typeof PARTNERS_MASTER_DATA_VIEWS; app: string; model: string; title: string; formTitle: string; description: string; icon: typeof Handshake; routes: {LIST:string;CREATE:string;EDIT:string;DETAIL:string}; listAccess: RouteAccessRequirement; manageAccess: RouteAccessRequirement }[] = [
{ key: "procurement-lots", app: "catalog", model: "ProcurementLot",
    title: "Lots", formTitle: "lot d'activité", icon: Layers,
    description: "Activités des fournisseurs, suivi des besoins et appuis techniques associés.",
    routes: ROUTES.ADMIN.PROCUREMENT_LOTS,
    listAccess: { anyRoles: [...MASTER_DATA_READ_ACCESS.anyRoles!, ...PROCUREMENT_CONFIGURATION_ACCESS.anyRoles!] }, manageAccess: PROCUREMENT_CONFIGURATION_ACCESS },
{
    key: "suppliers",
    app: "suppliers",
    model: "Supplier",
    formTitle: "fournisseur",
    title: "Fournisseurs",
    description:
      "Maintenez le referentiel fournisseurs utilise par les bons de commande.",
    icon: Handshake,
    routes: ROUTES.ADMIN.SUPPLIERS,
    listAccess: MASTER_DATA_READ_ACCESS,
    manageAccess: SUPPLIER_MANAGE_ACCESS,
  },
{
    key: "supplier-contacts",
    app: "suppliers",
    model: "SupplierContact",
    formTitle: "contact fournisseur",
    title: "Contacts fournisseurs",
    description:
      "Centralisez les interlocuteurs operationnels et administratifs des fournisseurs.",
    icon: Users,
    routes: ROUTES.ADMIN.SUPPLIER_CONTACTS,
    listAccess: MASTER_DATA_READ_ACCESS,
    manageAccess: SUPPLIER_MANAGE_ACCESS,
  },
{
    key: "supplier-intake-batches",
    app: "suppliers",
    model: "SupplierIntakeBatch",
    formTitle: "liste d'insertion",
    title: "Listes d'insertion",
    description:
      "Gerez les listes d'insertion fournisseur soumises a approbation.",
    icon: ClipboardCheck,
    routes: ROUTES.ADMIN.SUPPLIER_INTAKE_BATCHES,
    listAccess: SUPPLIER_INTAKE_READ_ACCESS,
    manageAccess: SUPPLIER_INTAKE_MANAGE_ACCESS,
  },
{
    key: "supplier-intake-entries",
    app: "suppliers",
    model: "SupplierIntakeEntry",
    formTitle: "entree d'insertion",
    title: "Entrees d'insertion",
    description:
      "Consultez les fournisseurs proposes dans les listes d'insertion.",
    icon: Handshake,
    routes: ROUTES.ADMIN.SUPPLIER_INTAKE_ENTRIES,
    listAccess: SUPPLIER_INTAKE_READ_ACCESS,
    manageAccess: SUPPLIER_INTAKE_MANAGE_ACCESS,
  }
];
