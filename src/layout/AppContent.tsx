import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  DEFAULT_APP_ROUTE,
  findNavigationByPath,
  flattenNavigationPages,
} from "@/routes/links";
import { SiteHeader } from "@/lib/components/site-header";
import { SidebarInset } from "@/lib/components/ui/sidebar";

/**
 * Maps navigation definitions into <Route /> elements.
 */
export const AppRoutes = () => {
  const pages = flattenNavigationPages();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={DEFAULT_APP_ROUTE} replace />} />
      {pages.map((page) => (
        <Route key={page.path} path={page.path} element={page.component} />
      ))}
      <Route path="*" element={<Navigate to={DEFAULT_APP_ROUTE} replace />} />
    </Routes>
  );
};

/**
 * Main content area that renders the dynamic header and active route content.
 */
export default function AppContent() {
  const location = useLocation();
  const currentNavigation = findNavigationByPath(location.pathname);

  return (
    <SidebarInset className="bg-background md:!m-0 md:!ml-0 md:!rounded-none md:!shadow-none">
      <SiteHeader
        title={currentNavigation?.page.title ?? "Navigation"}
        description={currentNavigation?.page.description}
        sectionLabel={currentNavigation?.section.label}
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
