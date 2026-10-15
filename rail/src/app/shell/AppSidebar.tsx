/**
 * @file AppSidebar.tsx
 * @description Barre latérale de l'application. Supporte le mode barre d'icônes (AppRail avec sous-navigation contextuelle)
 * et le mode barre latérale complète (affichant l'intégralité des menus et sous-menus sans menu déroulant).
 *
 * @module app/shell/AppSidebar
 */

import { NavMain } from "@/widgets/navigation/nav-main";
import { NavUser } from "@/widgets/navigation/nav-user";
import { NavNotifications } from "@/widgets/navigation/nav-notifications";
import { ModeToggle } from "@/shared/ui/kit/themeToggle";
import { useRouteAccess } from "@/app/router/routeAccess";
import { findRouteByPath } from "@/app/router/manifestRegistry";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/shared/ui/kit/sidebar";
import { cn } from "@/shared/utils";
import { useTheme } from "@/shared/ui/theme";
import { useAuthContext } from "@/features/auth/context";
import { AppRailList, NewDocumentMenu } from "./AppRail";
import { BRANDING } from "@/shared/config/branding";

/**
 * Barre latérale principale ou secondaire de l'application.
 *
 * @param props Propriétés passées au composant Sidebar
 * @returns {JSX.Element | null}
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarCollapseMode, navigationPattern, sidebarMode } = useTheme();
  const { state, isMobile } = useSidebar();
  const { user, logout } = useAuthContext();
  const {
    appRailItems,
    currentProjectId,
    navigationLinks,
    projectNavigationLinks,
    canAccessRoute,
  } = useRouteAccess();
  const isCollapsed = state === "collapsed";
  const currentProject = appRailItems.find(
    (item) => item.projectId === currentProjectId,
  );
  const shouldShowCreateMenu = true;

  const effectiveNavigationLinks =
    sidebarMode === "complete" ? navigationLinks : projectNavigationLinks;

  const totalVisibleItems =
    effectiveNavigationLinks?.reduce((count, section) => {
      return (
        count +
        section.items.reduce((itemCount, item) => {
          if (item.hidden) return itemCount;
          const route = findRouteByPath(item.path);
          return itemCount + (!route || canAccessRoute(route) ? 1 : 0);
        }, 0)
      );
    }, 0) ?? 0;

  if (!isMobile && sidebarMode === "icons") {
    if (navigationPattern !== "secondary-sidebar") {
      return null;
    }

    if (totalVisibleItems <= 1) {
      return null;
    }
  }

  return (
    <Sidebar
      variant="embedded"
      collapsible={sidebarCollapseMode}
      {...props}
      className={cn(
        "bg-transparent text-sidebar-foreground transition-[width] duration-200 ease-linear",
        sidebarMode === "complete" ? "border-r border-border/50" : "!border-r-0",
        props.className,
      )}
    >
      {isMobile ? (
        <>
          <SidebarHeader className="gap-4 border-b border-border/50 px-4 py-4">
            {sidebarMode === "icons" ? (
              <>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Applications
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Basculer d'un espace à l'autre.
                  </p>
                </div>
                <AppRailList className="grid grid-cols-3 gap-2" />
                <SidebarSeparator className="mx-0 w-full" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {currentProject?.label ?? "Navigation"}
                  </div>
                  {shouldShowCreateMenu && (
                    <div className="mt-3">
                      <NewDocumentMenu />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <img
                      src={BRANDING.logo}
                      alt={BRANDING.logoAlt}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="truncate text-sm font-bold text-foreground leading-tight">
                      {BRANDING.productName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {BRANDING.editionLabel}
                    </span>
                  </div>
                </div>
                {shouldShowCreateMenu && (
                  <div className="mt-1">
                    <NewDocumentMenu />
                  </div>
                )}
              </>
            )}
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <NavMain
              navigationLinks={effectiveNavigationLinks}
              filterPath={(path) => {
                const route = findRouteByPath(path);
                return !route || canAccessRoute(route);
              }}
            />
          </SidebarContent>
        </>
      ) : (
        <>
          <SidebarHeader className="h-14 border-b border-border/50 px-3 py-0 flex flex-row items-center justify-between">
            {sidebarMode === "complete" ? (
              <div
                className={cn("flex items-center gap-2.5", isCollapsed && "hidden")}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <img
                    src={BRANDING.logo}
                    alt={BRANDING.logoAlt}
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="truncate text-sm font-bold text-foreground leading-tight">
                    {BRANDING.productName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {BRANDING.editionLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className={cn("flex items-center gap-2", isCollapsed && "hidden")}
              >
                {currentProject?.icon && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.4rem] border bg-background shadow-sm">
                    <currentProject.icon
                      className="h-3.5 w-3.5 text-foreground"
                    />
                  </div>
                )}
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="truncate text-sm font-semibold text-foreground leading-tight">
                    {currentProject?.label ?? "Navigation"}
                  </span>
                </div>
              </div>
            )}
            <SidebarTrigger
              className={cn(
                "h-8 w-8 hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "mx-auto",
              )}
            />
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            {sidebarMode === "complete" && shouldShowCreateMenu && (
              <div className="mb-2 px-1">
                <NewDocumentMenu compact={isCollapsed} />
              </div>
            )}
            <NavMain
              navigationLinks={effectiveNavigationLinks}
              filterPath={(path) => {
                const route = findRouteByPath(path);
                return !route || canAccessRoute(route);
              }}
            />
          </SidebarContent>
        </>
      )}

      <SidebarFooter
        className={cn(
          "border-t border-border/50 p-2.5",
          !isMobile && sidebarMode === "icons" && "hidden",
        )}
      >
        <div className="flex flex-col gap-2">
          {sidebarMode === "complete" && !isMobile && (
            <div
              className={cn(
                "flex items-center justify-between px-1",
                isCollapsed && "flex-col gap-2 py-1",
              )}
            >
              <NavNotifications />
              <ModeToggle />
            </div>
          )}
          <div
            className={cn(
              "rounded-xl border border-border/50 bg-background/80 p-1",
              isCollapsed && !isMobile && "border-transparent bg-transparent p-0",
            )}
          >
            <NavUser user={user} onLogout={logout} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
