/**
 * Manifeste du module Référentiels.
 *
 * Enregistre les routes et la navigation pour la gestion de toutes
 * les tables de référence : services, employés, catégories, familles,
 * fournisseurs, types de documents, états physiques et métadonnées.
 */
import { lazy, Suspense, type ReactNode } from "react";
import {
  Building2,
  Users,
  FolderTree,
  Layers,
  Truck,
  FileType,
  HeartPulse,
  Tags,
  BookOpen,
} from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/referentials/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);



const ServiceListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.ServiceListPage })),
);
const ServiceFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.ServiceFormPage })),
);
const ServiceDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.ServiceDetailPage })),
);

const EmployeeListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.EmployeeListPage })),
);
const EmployeeFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.EmployeeFormPage })),
);
const EmployeeDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.EmployeeDetailPage })),
);

const AssetCategoryListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetCategoryListPage })),
);
const AssetCategoryFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetCategoryFormPage })),
);
const AssetCategoryDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetCategoryDetailPage })),
);

const AssetFamilyListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetFamilyListPage })),
);
const AssetFamilyFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetFamilyFormPage })),
);
const AssetFamilyDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.AssetFamilyDetailPage })),
);

const SupplierListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.SupplierListPage })),
);
const SupplierFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.SupplierFormPage })),
);
const SupplierDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.SupplierDetailPage })),
);

const DocumentTypeListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.DocumentTypeListPage })),
);
const DocumentTypeFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.DocumentTypeFormPage })),
);
const DocumentTypeDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.DocumentTypeDetailPage })),
);

const PhysicalConditionListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.PhysicalConditionListPage })),
);
const PhysicalConditionFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.PhysicalConditionFormPage })),
);
const PhysicalConditionDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.PhysicalConditionDetailPage })),
);

const MetadataDefinitionListPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.MetadataDefinitionListPage })),
);
const MetadataDefinitionFormPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.MetadataDefinitionFormPage })),
);
const MetadataDefinitionDetailPage = lazy(() =>
  import("./pages/index").then((m) => ({ default: m.MetadataDefinitionDetailPage })),
);



// ── Manifest ────────────────────────────────────────────────────
export const REFERENTIALS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "referentials",
  moduleId: "core",
  order: 15,
  defaultRoute: ROUTES.SERVICE_LIST,
  routes: [
    // ── Service ──
    protectedRoute("referentials", { id: "referentials:service:list", path: ROUTES.SERVICE_LIST, title: "Services", icon: Building2, element: withRouteSuspense(<ServiceListPage />) }),
    protectedRoute("referentials", { id: "referentials:service:create", path: ROUTES.SERVICE_CREATE, title: "Créer un Service", icon: Building2, element: withRouteSuspense(<ServiceFormPage />) }),
    protectedRoute("referentials", { id: "referentials:service:edit", path: ROUTES.SERVICE_EDIT, title: "Modifier un Service", icon: Building2, element: withRouteSuspense(<ServiceFormPage />) }),
    protectedRoute("referentials", { id: "referentials:service:detail", path: ROUTES.SERVICE_DETAIL, title: "Détail Service", icon: Building2, element: withRouteSuspense(<ServiceDetailPage />) }),
    // ── Employee ──
    protectedRoute("referentials", { id: "referentials:employee:list", path: ROUTES.EMPLOYEE_LIST, title: "Employés", icon: Users, element: withRouteSuspense(<EmployeeListPage />) }),
    protectedRoute("referentials", { id: "referentials:employee:create", path: ROUTES.EMPLOYEE_CREATE, title: "Créer un Employé", icon: Users, element: withRouteSuspense(<EmployeeFormPage />) }),
    protectedRoute("referentials", { id: "referentials:employee:edit", path: ROUTES.EMPLOYEE_EDIT, title: "Modifier un Employé", icon: Users, element: withRouteSuspense(<EmployeeFormPage />) }),
    protectedRoute("referentials", { id: "referentials:employee:detail", path: ROUTES.EMPLOYEE_DETAIL, title: "Détail Employé", icon: Users, element: withRouteSuspense(<EmployeeDetailPage />) }),
    // ── AssetCategory ──
    protectedRoute("referentials", { id: "referentials:category:list", path: ROUTES.ASSET_CATEGORY_LIST, title: "Catégories", icon: FolderTree, element: withRouteSuspense(<AssetCategoryListPage />) }),
    protectedRoute("referentials", { id: "referentials:category:create", path: ROUTES.ASSET_CATEGORY_CREATE, title: "Créer une Catégorie", icon: FolderTree, element: withRouteSuspense(<AssetCategoryFormPage />) }),
    protectedRoute("referentials", { id: "referentials:category:edit", path: ROUTES.ASSET_CATEGORY_EDIT, title: "Modifier une Catégorie", icon: FolderTree, element: withRouteSuspense(<AssetCategoryFormPage />) }),
    protectedRoute("referentials", { id: "referentials:category:detail", path: ROUTES.ASSET_CATEGORY_DETAIL, title: "Détail Catégorie", icon: FolderTree, element: withRouteSuspense(<AssetCategoryDetailPage />) }),
    // ── AssetFamily ──
    protectedRoute("referentials", { id: "referentials:family:list", path: ROUTES.ASSET_FAMILY_LIST, title: "Familles", icon: Layers, element: withRouteSuspense(<AssetFamilyListPage />) }),
    protectedRoute("referentials", { id: "referentials:family:create", path: ROUTES.ASSET_FAMILY_CREATE, title: "Créer une Famille", icon: Layers, element: withRouteSuspense(<AssetFamilyFormPage />) }),
    protectedRoute("referentials", { id: "referentials:family:edit", path: ROUTES.ASSET_FAMILY_EDIT, title: "Modifier une Famille", icon: Layers, element: withRouteSuspense(<AssetFamilyFormPage />) }),
    protectedRoute("referentials", { id: "referentials:family:detail", path: ROUTES.ASSET_FAMILY_DETAIL, title: "Détail Famille", icon: Layers, element: withRouteSuspense(<AssetFamilyDetailPage />) }),
    // ── Supplier ──
    protectedRoute("referentials", { id: "referentials:supplier:list", path: ROUTES.SUPPLIER_LIST, title: "Fournisseurs", icon: Truck, element: withRouteSuspense(<SupplierListPage />) }),
    protectedRoute("referentials", { id: "referentials:supplier:create", path: ROUTES.SUPPLIER_CREATE, title: "Créer un Fournisseur", icon: Truck, element: withRouteSuspense(<SupplierFormPage />) }),
    protectedRoute("referentials", { id: "referentials:supplier:edit", path: ROUTES.SUPPLIER_EDIT, title: "Modifier un Fournisseur", icon: Truck, element: withRouteSuspense(<SupplierFormPage />) }),
    protectedRoute("referentials", { id: "referentials:supplier:detail", path: ROUTES.SUPPLIER_DETAIL, title: "Détail Fournisseur", icon: Truck, element: withRouteSuspense(<SupplierDetailPage />) }),
    // ── DocumentType ──
    protectedRoute("referentials", { id: "referentials:doctype:list", path: ROUTES.DOCUMENT_TYPE_LIST, title: "Types de documents", icon: FileType, element: withRouteSuspense(<DocumentTypeListPage />) }),
    protectedRoute("referentials", { id: "referentials:doctype:create", path: ROUTES.DOCUMENT_TYPE_CREATE, title: "Créer un Type", icon: FileType, element: withRouteSuspense(<DocumentTypeFormPage />) }),
    protectedRoute("referentials", { id: "referentials:doctype:edit", path: ROUTES.DOCUMENT_TYPE_EDIT, title: "Modifier un Type", icon: FileType, element: withRouteSuspense(<DocumentTypeFormPage />) }),
    protectedRoute("referentials", { id: "referentials:doctype:detail", path: ROUTES.DOCUMENT_TYPE_DETAIL, title: "Détail Type", icon: FileType, element: withRouteSuspense(<DocumentTypeDetailPage />) }),
    // ── PhysicalCondition ──
    protectedRoute("referentials", { id: "referentials:condition:list", path: ROUTES.PHYSICAL_CONDITION_LIST, title: "États physiques", icon: HeartPulse, element: withRouteSuspense(<PhysicalConditionListPage />) }),
    protectedRoute("referentials", { id: "referentials:condition:create", path: ROUTES.PHYSICAL_CONDITION_CREATE, title: "Créer un État physique", icon: HeartPulse, element: withRouteSuspense(<PhysicalConditionFormPage />) }),
    protectedRoute("referentials", { id: "referentials:condition:edit", path: ROUTES.PHYSICAL_CONDITION_EDIT, title: "Modifier un État physique", icon: HeartPulse, element: withRouteSuspense(<PhysicalConditionFormPage />) }),
    protectedRoute("referentials", { id: "referentials:condition:detail", path: ROUTES.PHYSICAL_CONDITION_DETAIL, title: "Détail État physique", icon: HeartPulse, element: withRouteSuspense(<PhysicalConditionDetailPage />) }),
    // ── MetadataDefinition ──
    protectedRoute("referentials", { id: "referentials:metadata:list", path: ROUTES.METADATA_DEFINITION_LIST, title: "Métadonnées", icon: Tags, element: withRouteSuspense(<MetadataDefinitionListPage />) }),
    protectedRoute("referentials", { id: "referentials:metadata:create", path: ROUTES.METADATA_DEFINITION_CREATE, title: "Créer une Définition", icon: Tags, element: withRouteSuspense(<MetadataDefinitionFormPage />) }),
    protectedRoute("referentials", { id: "referentials:metadata:edit", path: ROUTES.METADATA_DEFINITION_EDIT, title: "Modifier une Définition", icon: Tags, element: withRouteSuspense(<MetadataDefinitionFormPage />) }),
    protectedRoute("referentials", { id: "referentials:metadata:detail", path: ROUTES.METADATA_DEFINITION_DETAIL, title: "Détail Définition", icon: Tags, element: withRouteSuspense(<MetadataDefinitionDetailPage />) }),
  ],
  navigation: [
    navGroup("referentials", {
      id: "referentials",
      label: "Référentiels",
      order: 15,
      entries: [
        { id: "referentials:service:list", routeId: "referentials:service:list", title: "Services", path: ROUTES.SERVICE_LIST, guard: "protected", icon: Building2 },
        { id: "referentials:employee:list", routeId: "referentials:employee:list", title: "Employés", path: ROUTES.EMPLOYEE_LIST, guard: "protected", icon: Users },
        { id: "referentials:category:list", routeId: "referentials:category:list", title: "Catégories", path: ROUTES.ASSET_CATEGORY_LIST, guard: "protected", icon: FolderTree },
        { id: "referentials:family:list", routeId: "referentials:family:list", title: "Familles", path: ROUTES.ASSET_FAMILY_LIST, guard: "protected", icon: Layers },
        { id: "referentials:supplier:list", routeId: "referentials:supplier:list", title: "Fournisseurs", path: ROUTES.SUPPLIER_LIST, guard: "protected", icon: Truck },
        { id: "referentials:doctype:list", routeId: "referentials:doctype:list", title: "Types de documents", path: ROUTES.DOCUMENT_TYPE_LIST, guard: "protected", icon: FileType },
        { id: "referentials:condition:list", routeId: "referentials:condition:list", title: "États physiques", path: ROUTES.PHYSICAL_CONDITION_LIST, guard: "protected", icon: HeartPulse },
        { id: "referentials:metadata:list", routeId: "referentials:metadata:list", title: "Métadonnées", path: ROUTES.METADATA_DEFINITION_LIST, guard: "protected", icon: Tags },
      ],
    }),
  ],
});

export default REFERENTIALS_MANIFEST;
