/** Stable Partners URLs, retained across consuming frontends. */
export const ROUTES = { ADMIN: {
PROCUREMENT_LOTS: {
      LIST: "/achat/administration/lots-achats",
      CREATE: "/achat/administration/lots-achats/creer",
      EDIT: "/achat/administration/lots-achats/:id/modifier",
      DETAIL: "/achat/administration/lots-achats/:id",
    },
SUPPLIERS: {
      LIST: "/achat/administration/fournisseurs",
      CREATE: "/achat/administration/fournisseurs/creer",
      EDIT: "/achat/administration/fournisseurs/:id/modifier",
      DETAIL: "/achat/administration/fournisseurs/:id",
    },
SUPPLIER_CONTACTS: {
      LIST: "/achat/administration/contacts-fournisseurs",
      CREATE: "/achat/administration/contacts-fournisseurs/creer",
      EDIT: "/achat/administration/contacts-fournisseurs/:id/modifier",
      DETAIL: "/achat/administration/contacts-fournisseurs/:id",
    },
BUSINESS_SECTORS: {
      LIST: "/achat/administration/secteurs-activite",
      CREATE: "/achat/administration/secteurs-activite/creer",
      EDIT: "/achat/administration/secteurs-activite/:id/modifier",
      DETAIL: "/achat/administration/secteurs-activite/:id",
    },
SUPPLIER_INTAKE_BATCHES: {
      LIST: "/achat/administration/listes-insertion",
      CREATE: "/achat/administration/listes-insertion/creer",
      EDIT: "/achat/administration/listes-insertion/:id/modifier",
      DETAIL: "/achat/administration/listes-insertion/:id",
    },
SUPPLIER_INTAKE_ENTRIES: {
      LIST: "/achat/administration/entrees-insertion",
      CREATE: "/achat/administration/entrees-insertion/creer",
      EDIT: "/achat/administration/entrees-insertion/:id/modifier",
      DETAIL: "/achat/administration/entrees-insertion/:id",
    }
} } as const;
