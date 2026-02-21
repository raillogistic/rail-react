import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteHeader } from "@/lib/components/site-header";
import { SidebarInset } from "@/lib/components/ui/sidebar";
import { useNavigation } from "@/core/context/NavigationContext";
import { NavigationItem, NavigationPage, NavigationSection } from "@/core/types/module";

/**
 * Helper to find navigation item by path within the provided sections
 */
const findNavigationByPath = (
  pathname: string,
  sections: NavigationSection[]
):
  | {
      section: NavigationSection;
      item: NavigationItem;
      page: NavigationPage;
    }
  | undefined => {
  const normalized = pathname.endsWith("/")
    ? pathname.slice(0, -1) || "/"
    : pathname;

  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === normalized && item.component) {
        return { section, item, page: { ...item, component: item.component } as NavigationPage };
      }

      const match = item.children?.find((child) => child.path === normalized);
      if (match) {
        // We need to construct a page object from the child match
        // The child itself is a NavigationPage, so we use it directly
        // However, findNavigationByPath expects to return section/item context
        return { section, item, page: match };
      }
    }
  }

  return undefined;
};

/**
 * Maps navigation definitions into <Route /> elements.
 */
export const AppRoutes = () => {
  const { flattenedPages, defaultRoute } = useNavigation();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      {flattenedPages.map((page) => (
        <Route key={page.path} path={page.path} element={page.component} />
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
  const { sections } = useNavigation();
  const currentNavigation = findNavigationByPath(location.pathname, sections);

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
