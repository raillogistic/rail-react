/**
 * @file AppSidebar.tsx
 * @description Barre latérale unique de l'application d'entreprise.
 * Intègre la marque, les actions de création, l'ensemble des groupes de navigation
 * et le menu utilisateur dans le pied de barre latérale.
 *
 * @module app/shell/AppSidebar
 */

import React from "react";
import { Link } from "react-router-dom";
import application from "@rail/application";
import { NavMain } from "@/widgets/navigation/nav-main";
import { NavUser } from "@/widgets/navigation/nav-user";
import { useRouteAccess } from "@/app/router/routeAccess";
import { findRouteByPath } from "@/app/router/manifestRegistry";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/shared/ui/kit/sidebar";
import { cn } from "@/shared/utils";
import { useAuthContext } from "@/features/auth/context";
import { BRANDING } from "@/shared/config/branding";

/**
 * Menu d'action de création configurable par l'application hôte.
 *
 * @param props Propriétés optionnelles de configuration compacte.
 * @returns {React.ReactElement | null}
 */
export function NewDocumentMenu(props: { compact?: boolean }): React.ReactElement | null {
  const Menu = application.slots?.NewDocumentMenu;
  return Menu ? <Menu {...props} /> : null;
}

/**
 * Barre latérale principale de l'application partagée.
 * Largeur fixe de 256px sur bureau, comportement off-canvas au masquage,
 * et tiroir mobile sous 768px.
 *
 * @param props Propriétés du composant Sidebar.
 * @returns {React.ReactElement}
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuthContext();
  const {
    defaultRoute,
    navigationLinks,
    canAccessRoute,
  } = useRouteAccess();

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className={cn(
        "w-64 border-r border-border/60 bg-sidebar text-sidebar-foreground transition-[width,left,right] duration-200 ease-linear",
        props.className,
      )}
    >
      <SidebarHeader className="h-14 border-b border-border/60 px-4 py-0 flex flex-row items-center justify-between">
        <Link
          to={defaultRoute || "/"}
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label={BRANDING.productName}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
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
            {BRANDING.subtitle ? (
              <span className="truncate text-xs text-muted-foreground">
                {BRANDING.subtitle}
              </span>
            ) : null}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 overflow-y-auto">
        {application.slots?.NewDocumentMenu && (
          <div className="px-1 pt-1 pb-2">
            <NewDocumentMenu />
          </div>
        )}
        <NavMain
          navigationLinks={navigationLinks}
          filterPath={(path) => {
            const route = findRouteByPath(path);
            return !route || canAccessRoute(route);
          }}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2.5">
        <div className="rounded-xl border border-sidebar-border bg-sidebar p-1">
          <NavUser user={user} onLogout={logout} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
