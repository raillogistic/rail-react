/**
 * @file AppContent.tsx
 * @description Zone de contenu principale de l'application partagée.
 * Comprend l'en-tête fixe avec fil d'Ariane, déclencheur de recherche,
 * notifications et bascule de thème, ainsi que la zone de routage indépendamment défilable.
 *
 * @module app/shell/AppContent
 */

import React, { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import application from "@rail/application";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { useRouteAccess } from "@/app/router/routeAccess";
import { getAllRoutes } from "@/app/router/manifestRegistry";
import { SidebarInset, SidebarTrigger } from "@/shared/ui/kit/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { Loader2, LogIn, Users } from "lucide-react";
import { useAuthContext } from "@/features/auth/context";
import { BRANDING } from "@/shared/config/branding";
import { CommandMenu } from "@/widgets/navigation/command-menu";
import { NavNotifications } from "@/widgets/navigation/nav-notifications";
import { ModeToggle } from "@/shared/ui/kit/themeToggle";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import type { NavigationSection } from "@/shared/routing/navigation";

export interface SiteHeaderProps {
  title?: string;
  description?: string;
  sectionLabel?: string;
  navigationLinks?: NavigationSection[];
  projectNavigationLinks?: NavigationSection[];
  defaultPath?: string;
}

const QUICK_SWITCH_PASSWORD = application.quickLogin?.password ?? "";

const getQuickSwitchUsers = (): string[] => {
  const env = (
    import.meta as ImportMeta & {
      env: Record<string, string | boolean | undefined>;
    }
  ).env;
  const rawUsers =
    env.VITE_USERS ??
    (typeof process !== "undefined" ? process.env?.VITE_USERS : undefined) ??
    env.users ??
    (typeof process !== "undefined" ? process.env?.users : undefined);

  if (typeof rawUsers !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      rawUsers
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
};

/**
 * En-tête partagé de l'application (hauteur fixe 56px).
 * Affiche à gauche le basculeur de barre latérale, la marque sur mobile et le fil d'Ariane sur bureau.
 * Affiche à droite la palette de commande, la connexion rapide éventuelle, les notifications et le thème.
 *
 * @param {SiteHeaderProps} props Propriétés optionnelles de configuration.
 * @returns {React.ReactElement}
 */
export function SiteHeader({
  navigationLinks: propNavLinks,
  defaultPath: propDefaultPath,
}: Partial<SiteHeaderProps> = {}): React.ReactElement {
  const { defaultRoute, navigationLinks: accessNavLinks } = useRouteAccess();
  const navigationLinks = propNavLinks ?? accessNavLinks;
  const defaultPath = propDefaultPath ?? defaultRoute;
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);
  const { clearError, login, logout, user } = useAuthContext();
  const quickSwitchUsers = getQuickSwitchUsers();
  const currentUsername = user?.username?.trim().toLowerCase() ?? "";

  const handleQuickUserLogin = async (username: string) => {
    setSwitchingUser(username);
    clearError();

    const currentUrl = window.location.href;

    try {
      await logout({ reason: "forced_logout", silent: true });
      await login({
        username,
        password: username === "admin" ? "admin" : QUICK_SWITCH_PASSWORD,
        rememberMe: true,
      });
      window.history.replaceState(null, "", currentUrl);
      window.location.reload();
    } catch (error) {
      console.error("Erreur de connexion rapide", error);
      setSwitchingUser(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/60 bg-background px-4">
      {/* Gauche : déclencheur sidebar, marque mobile, fil d'Ariane bureau */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger
          aria-label="Basculer le menu"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
        />

        {/* Marque sur mobile uniquement */}
        <Link
          to={defaultPath || "/"}
          className="flex items-center gap-2 md:hidden min-w-0 group"
          aria-label={BRANDING.productName}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <img
              src={BRANDING.logo}
              alt={BRANDING.logoAlt}
              className="h-5 w-5 object-contain"
            />
          </div>
          <span className="truncate text-sm font-bold text-foreground">
            {BRANDING.productName}
          </span>
        </Link>

        {/* Fil d'Ariane dérivé sur bureau */}
        <div className="hidden md:flex items-center min-w-0">
          <AppBreadcrumbs />
        </div>
      </div>

      {/* Droite : recherche, connexion rapide, notifications, thème */}
      <div className="flex items-center gap-2 shrink-0">
        <CommandMenu
          navigationLinks={navigationLinks}
          defaultPath={defaultPath}
        />

        {quickSwitchUsers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={switchingUser !== null}
                aria-label="Connexion rapide"
              >
                {switchingUser ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Connexion rapide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickSwitchUsers.map((username) => {
                const isCurrentUser =
                  username.trim().toLowerCase() === currentUsername;

                return (
                  <DropdownMenuItem
                    key={username}
                    disabled={switchingUser !== null}
                    onSelect={() => {
                      void handleQuickUserLogin(username);
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>{username}</span>
                    {isCurrentUser && (
                      <DropdownMenuShortcut>Actif</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <NavNotifications />
        <ModeToggle />
      </div>
    </header>
  );
}

/**
 * Gestionnaire des routes de l'application partagée.
 *
 * @returns {React.ReactElement}
 */
export const AppRoutes = (): React.ReactElement => {
  const { defaultRoute, isLoading } = useRouteAccess();
  const routes = getAllRoutes().filter((route) => Boolean(route.element));

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border/40 bg-card/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Chargement des accès...
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
              <ProtectedRoute route={route}>{route.element}</ProtectedRoute>
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
 * Contenu principal encapsulé dans SidebarInset avec en-tête fixe et défilement indépendant.
 *
 * @returns {React.ReactElement}
 */
export default function AppContent(): React.ReactElement {
  return (
    <SidebarInset className="bg-background flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 min-w-0">
        <AppRoutes />
      </main>
    </SidebarInset>
  );
}
