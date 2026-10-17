/** Self-contained Partners manifest; route IDs and access rules remain stable. */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { BarChart2, Handshake } from "lucide-react";
import { defineSharedApp } from "@raillogistic/shared-apps/runtime";
import { defineProjectManifest, navGroup, protectedRoute } from "@/app/router/manifestFactory";
import type { NavigationEntry } from "@/app/router/contracts";
import { MASTER_DATA_READ_ACCESS, SUPPLIER_REPORTING_ACCESS } from "./config/access";
import { PARTNER_PAGES } from "./config/pages";
import { PARTNERS_MASTER_DATA_VIEWS } from "./config/masterDataViews";
import { ROUTES } from "./config/routes";
import { PartnerRoutesContext } from "./routeSelection";
import { AchatModelListPage } from "./pages/AchatModelListPage";
import { AchatModelFormPage } from "./pages/AchatModelFormPage";
import { AchatModelDetailPage } from "./pages/AchatModelDetailPage";
import { SupplierDetailPage } from "./pages/suppliers/SupplierDetailPage";
import { SupplierIntakeBatchFormPage } from "./pages/suppliers/SupplierIntakeBatchFormPage";
import { ReportingReportPage } from "./components/reporting/runtime/ReportingReportPage";

export const createAppManifest = defineSharedApp((context) => {
  const wrap = (page: ReactNode) => <PartnerRoutesContext.Provider value={context}>{page}</PartnerRoutesContext.Provider>;
  const enabledPath = (id: string, path: string) => context.isRouteEnabled(id) ? path : undefined;
  const dashboardPath = "/achat/rapports/achat_supplier_bi_overview";
  const crudRoutes = PARTNER_PAGES.flatMap(config => {
    const id = `achat:${config.key}`;
    const view = PARTNERS_MASTER_DATA_VIEWS[config.key];
    const intake = config.key === "supplier-intake-batches";
    return [
      protectedRoute("partners", {
        id: `${id}:list`, path: config.routes.LIST, title: config.title,
        description: config.description, icon: config.icon, access: config.listAccess,
        element: wrap(<AchatModelListPage app={config.app} model={config.model} title={config.title}
          description={config.description} fields={view.tableFields}
          createPath={enabledPath(`${id}:create`, config.routes.CREATE)}
          editPath={enabledPath(`${id}:edit`, config.routes.EDIT)}
          detailPath={enabledPath(`${id}:detail`, config.routes.DETAIL)} />),
      }),
      ...(["create", "edit"] as const).map(action => protectedRoute("partners", {
        id: `${id}:${action}`, path: config.routes[action === "create" ? "CREATE" : "EDIT"],
        title: `${action === "create" ? "Creer" : "Modifier"} ${config.formTitle}`,
        hidden: true, icon: config.icon, access: intake ? undefined : config.manageAccess,
        element: wrap(intake ? <SupplierIntakeBatchFormPage /> : <AchatModelFormPage
          app={config.app} model={config.model} title={config.formTitle} description={config.description}
          onlyFields={view.formOnlyFields} generatedSections={view.formSections}
          fieldOverrides={view.formFieldOverrides} nested={view.formNested} />),
      })),
      protectedRoute("partners", {
        id: `${id}:detail`, path: config.routes.DETAIL, title: config.formTitle,
        hidden: true, icon: config.icon, access: intake ? undefined : config.listAccess,
        element: wrap(intake ? <SupplierIntakeBatchFormPage /> : config.key === "suppliers"
          ? <SupplierDetailPage /> : <AchatModelDetailPage app={config.app} model={config.model}
            title={config.formTitle} description={config.description} detailConfig={view.detailConfig} />),
      }),
    ];
  });
  return defineProjectManifest({
    projectId: "partners", label: "Partenaires", shortLabel: "Part.", icon: Handshake, order: 60,
    defaultRoute: ROUTES.ADMIN.SUPPLIERS.LIST,
    routes: [
      protectedRoute("partners", {
        id: "achat:reports:supplier-dashboard", path: dashboardPath, title: "Tableau de bord Partenaires",
        hidden: true, icon: BarChart2, access: SUPPLIER_REPORTING_ACCESS,
        element: wrap(<ReportingReportPage reportCode="achat_supplier_bi_overview"
          backPath={enabledPath("achat:suppliers:list", ROUTES.ADMIN.SUPPLIERS.LIST)} />),
      }),
      protectedRoute("partners", {
        id: "achat:legacy-business-sectors", path: `${ROUTES.ADMIN.BUSINESS_SECTORS.LIST}/*`,
        title: "Lots", hidden: true, access: MASTER_DATA_READ_ACCESS,
        element: context.isRouteEnabled("achat:procurement-lots:list")
          ? <Navigate to={ROUTES.ADMIN.PROCUREMENT_LOTS.LIST} replace /> : <p>Cette page n'est pas activée.</p>,
      }),
      ...crudRoutes,
    ],
    navigation: [navGroup("partners", {
      id: "achat-partenaires", label: "Partenaires", order: 70, access: MASTER_DATA_READ_ACCESS,
      entries: [
        { id: "achat:partenaires:dashboard", routeId: "achat:reports:supplier-dashboard", title: "Tableau de bord",
          path: dashboardPath, guard: "protected", icon: BarChart2,
          description: "Ouvrir le tableau de bord adapte a cette section.", access: SUPPLIER_REPORTING_ACCESS },
        ...PARTNER_PAGES.filter(config => config.key !== "supplier-intake-entries").map(config => ({
          id: `achat:${config.key}:list`, routeId: `achat:${config.key}:list`, title: config.title,
          path: config.routes.LIST, guard: "protected" as const, icon: config.icon,
          description: config.description, access: config.listAccess,
          children: (["create", "edit", "detail"] as const).map(action => ({
            id: `achat:${config.key}:${action}`, routeId: `achat:${config.key}:${action}`,
            title: `${action === "create" ? "Creer" : action === "edit" ? "Modifier" : "Detail"} ${config.formTitle}`,
            path: config.routes[action === "create" ? "CREATE" : action === "edit" ? "EDIT" : "DETAIL"],
            guard: "protected", hidden: true, access: config.key === "supplier-intake-batches"
              ? undefined : action === "detail" ? config.listAccess : config.manageAccess,
          } satisfies NavigationEntry)),
        })),
      ],
    })],
  });
});

export const PARTNERS_MANIFEST = createAppManifest();
export default PARTNERS_MANIFEST;
