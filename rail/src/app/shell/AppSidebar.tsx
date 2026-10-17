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
  SidebarRail,
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
 * Barre latérale principale de l'application partagée, conforme au design épuré sidebar.jpg.
 * Dispose d'une silhouette flottante avec coins arrondis, d'un badge de marque rouge,
 * d'un en-tête et pied de page sans bordures brutes, et d'un basculement icon / expanded fluide.
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
      collapsible="icon"
      variant="floating"
      {...props}
      className={cn(
        "transition-[width,left,right] duration-200 ease-linear",
        props.className,
      )}
    >
      <SidebarHeader className="px-4 pt-5 pb-3 flex flex-row items-center border-b-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Link
          to={defaultRoute || "/"}
          className="flex items-center gap-3.5 min-w-0 group w-full group-data-[collapsible=icon]:justify-center"
          aria-label={BRANDING.productName}
        >
          {/* Logo marque avec carré arrondi rouge et symbole blanc arch/chevron */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F04438] text-white shadow-xs transition-transform group-hover:scale-[1.02]">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                d="M9.5 22.5L14.6 11.2C15.2 9.9 16.8 9.9 17.4 11.2L22.5 22.5"
                stroke="white"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0 flex flex-col justify-center group-data-[collapsible=icon]:hidden">
            <span className="truncate text-base font-bold text-foreground leading-tight">
              {BRANDING.productName}
            </span>
            <span className="truncate text-xs text-muted-foreground/75 font-normal mt-0.5">
              {BRANDING.subtitle || "v 1.0"}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2.5 overflow-y-auto overflow-x-hidden">
        {application.slots?.NewDocumentMenu && (
          <div className="px-1 pt-1 pb-2 group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="p-2.5 pt-1 border-t-0">
        <NavUser user={user} onLogout={logout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
