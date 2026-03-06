import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
 findNavigationByPath,
} from "@/app/router/navigation";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { useRouteAccess } from "@/app/router/routeAccess";
import { getAllRoutes } from "@/app/router/manifestRegistry";
import { SiteHeader } from "@/widgets/components/site-header";
import { SidebarInset } from "@/shared/ui/kit/sidebar";

/**
 * Maps navigation definitions into <Route /> elements.
 */
export const AppRoutes = () => {
 const { defaultRoute, isLoading } = useRouteAccess();
 const routes = getAllRoutes().filter((route) => !!route.element);

 if (isLoading) {
 return (
 <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border/40 bg-card/40">
 <div className="flex flex-col items-center gap-3">
 <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
 <p className="text-sm text-muted-foreground">
 Chargement des acces...
 </p>
 </div>
 </div>
 );
 }

 return (
 <Routes>
 <Route path="/" element={<Navigate to={defaultRoute} replace />} />
 {routes.map((route) => (
 <Route
 key={route.id}
 path={route.path}
 element={
 route.guard === "protected" ? (
 <ProtectedRoute route={route}>
 {route.element}
 </ProtectedRoute>
 ) : (
 route.element
 )
 }
 />
 ))}
 <Route path="*" element={<Navigate to={defaultRoute} replace />} />
 </Routes>
 );
};

/**
 * Main content area that renders the dynamic header and active route content.
 */
export default function AppContent() {
 const location = useLocation();
 const { defaultRoute, navigationLinks } = useRouteAccess();
 const currentNavigation = findNavigationByPath(location.pathname, navigationLinks);

 return (
 <SidebarInset className="bg-background md:!m-0 md:!ml-0 md:! md:!shadow-none">
 <SiteHeader
 title={currentNavigation?.page.title ?? "Navigation"}
 description={currentNavigation?.page.description}
 sectionLabel={currentNavigation?.section.label}
 navigationLinks={navigationLinks}
 defaultPath={defaultRoute}
 />
 <div className="flex min-w-0 flex-1 flex-col">
 <div className="@container/main flex min-w-0 flex-1 flex-col gap-3">
 <div className="flex min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-8">
 <div className="min-w-0 px-4 lg:px-6">
 <AppRoutes />
 </div>
 </div>
 </div>
 </div>
 </SidebarInset>
 );
}
