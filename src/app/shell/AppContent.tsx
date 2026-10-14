import application from '@rail/application';
/**
 * @file AppContent.tsx
 * @description Zone de contenu principale de l'application avec en-tête, fil d'Ariane,
 * onglets contextuels conditionnels (si mode icônes) et routes protégées.
 *
 * @module app/shell/AppContent
 */

import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { findNavigationByPath } from "@/app/router/navigation";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { useRouteAccess } from "@/app/router/routeAccess";
import { getAllRoutes } from "@/app/router/manifestRegistry";
import {
  getActiveProjectNavigationPath,
  getProjectNavigationEntries,
  splitProjectNavigationEntries,
  groupProjectNavigationEntries,
} from "@/app/shell/navigation-patterns";
import { SidebarInset, SidebarTrigger } from "@/shared/ui/kit/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/kit/breadcrumb";
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
import { useTheme } from "@/shared/ui/theme";
import { cn } from "@/shared/utils";
import { ChevronRight, ChevronDown, Loader2, LogIn, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/features/auth/context";
import { Badge } from "@/shared/ui/kit/badge";
import { BRANDING } from "@/shared/config/branding";
import { CommandMenu } from "@/widgets/navigation/command-menu";
import { UserNav } from "@/widgets/navigation/nav-user-menu";
import { NavNotifications } from "@/widgets/navigation/nav-notifications";
import { Separator } from "@/shared/ui/kit/separator";
import { ModeToggle } from "@/shared/ui/kit/themeToggle";
import type { NavigationSection } from "@/shared/routing/navigation";

export interface SiteHeaderProps {
  title: string;
  description?: string;
  sectionLabel?: string;
  navigationLinks?: NavigationSection[];
  projectNavigationLinks?: NavigationSection[];
  defaultPath?: string;
}

const QUICK_SWITCH_PASSWORD = application.quickLogin?.password ?? '';

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

export function SiteHeader({
  title,
  sectionLabel,
  navigationLinks,
  projectNavigationLinks,
  defaultPath,
}: SiteHeaderProps) {
  const location = useLocation();
  const { navigationPattern, sidebarMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);
  const { clearError, login, logout, user } = useAuthContext();
  const quickSwitchUsers = getQuickSwitchUsers();
  const currentUsername = user?.username?.trim().toLowerCase() ?? "";
  const projectNavigationEntries = getProjectNavigationEntries(
    projectNavigationLinks ?? [],
  );
  const navigationGroups = groupProjectNavigationEntries(
    projectNavigationEntries,
  );
  const activeNavigationPath = getActiveProjectNavigationPath(
    location.pathname,
    projectNavigationEntries,
  );
  const activeNavigationEntry =
    projectNavigationEntries.find(
      (entry) => entry.path === activeNavigationPath,
    ) ?? projectNavigationEntries[0];
  const showHeaderDropdown =
    sidebarMode === "icons" &&
    navigationPattern === "header-dropdown" &&
    projectNavigationEntries.length > 1;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleQuickUserLogin = async (username: string) => {
    setSwitchingUser(username);
    clearError();

    const currentUrl = window.location.href;

    try {
      await logout({ reason: "forced_logout", silent: true });
      await login({
        username,
        password: username == "admin" ? "admin" : QUICK_SWITCH_PASSWORD,
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
    <header
      className={cn(
        "sticky top-0 z-40 w-full shrink-0 transition-all duration-300 bg-transparent border-b border-border/40",
        scrolled ? "h-12" : "h-14",
      )}
    >
      <div className="flex h-full items-center gap-4 px-2 sm:px-4">
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <SidebarTrigger className="md:hidden h-9 w-9" />

          <Link to="/" className="flex items-center gap-2 group mr-2 lg:mr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20 shrink-0">
              <img
                src={BRANDING.logo}
                alt={BRANDING.logoAlt}
                className="h-5 w-5 object-contain"
              />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="font-black tracking-tighter text-sm leading-none flex items-center gap-1">
                {BRANDING.productName}
                <Badge
                  variant="secondary"
                  className="text-[8px] h-3 px-1 py-0 bg-primary/10 text-primary border-none uppercase tracking-wider"
                >
                  {BRANDING.editionLabel}
                </Badge>
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                {BRANDING.platformLabel}
              </span>
            </div>
          </Link>

          <div className="lg:hidden flex flex-col justify-center">
            <h1 className="text-sm font-bold leading-none tracking-tight">
              {title}
            </h1>
            {sectionLabel && (
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-0.5 opacity-70">
                {sectionLabel}
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {showHeaderDropdown && activeNavigationEntry && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto min-w-[240px] items-center justify-between rounded-2xl border-border/60 bg-background/80 px-3 py-2 text-left shadow-sm"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[0.625rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {activeNavigationEntry.sectionLabel}
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {activeNavigationEntry.title}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {navigationGroups.map((group, index) => (
                    <div key={group.label}>
                      {index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {group.label}
                      </DropdownMenuLabel>
                      {group.entries.map((entry) => (
                        <DropdownMenuItem
                          key={entry.path}
                          asChild
                          className={cn(
                            "cursor-pointer",
                            activeNavigationPath === entry.path &&
                              "text-primary",
                          )}
                        >
                          <Link to={entry.path}>{entry.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <CommandMenu
              navigationLinks={navigationLinks}
              defaultPath={defaultPath}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-2">
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
                        <LogIn className="h-4 w-4" />
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
          </div>
        </div>
      </div>
    </header>
  );
}

export const AppRoutes = () => {
  const { defaultRoute, isLoading } = useRouteAccess();
  const routes = getAllRoutes().filter((route) => !!route.element);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border/40 bg-card/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-b-2 border-primary" />
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

export default function AppContent() {
  const location = useLocation();
  const { navigationPattern, sidebarMode } = useTheme();
  const {
    defaultRoute,
    navigationLinks,
    appRailItems,
    currentProjectId,
    projectNavigationLinks,
  } = useRouteAccess();
  const currentNavigation = findNavigationByPath(
    location.pathname,
    navigationLinks,
  );
  const currentProject = appRailItems.find(
    (item) => item.projectId === currentProjectId,
  );
  const currentProjectNavigationLinks =
    projectNavigationLinks ||
    navigationLinks.filter((section) => section.projectId === currentProjectId);
  const projectNavigationEntries = getProjectNavigationEntries(
    currentProjectNavigationLinks,
  );
  const activeNavigationPath = getActiveProjectNavigationPath(
    location.pathname,
    projectNavigationEntries,
  );
  const { primaryEntries, overflowEntries } = splitProjectNavigationEntries(
    projectNavigationEntries,
  );

  const title = currentNavigation?.page.title ?? "Navigation";
  const sectionLabel = currentNavigation?.section.label;

  return (
    <SidebarInset className="bg-transparent overflow-hidden">
      <SiteHeader
        title={title}
        description={currentNavigation?.page.description}
        sectionLabel={sectionLabel}
        navigationLinks={navigationLinks}
        projectNavigationLinks={currentProjectNavigationLinks}
        defaultPath={defaultRoute}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="@container/main flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-8">
            <div className="min-w-0 px-4 lg:px-6">
              {sidebarMode === "icons" &&
                navigationPattern === "contextual-tabs" &&
                projectNavigationEntries.length > 1 && (
                  <div className="mb-5 hidden lg:flex items-center gap-2 overflow-x-auto pb-1">
                    {primaryEntries.map((entry) => (
                      <Link
                        key={entry.path}
                        to={entry.path}
                        className={cn(
                          "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                          activeNavigationPath === entry.path
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/20 hover:text-foreground",
                        )}
                      >
                        {entry.title}
                      </Link>
                    ))}
                    {overflowEntries.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-10 rounded-full px-4",
                              overflowEntries.some(
                                (entry) => entry.path === activeNavigationPath,
                              ) &&
                                "border-primary/30 bg-primary/10 text-primary",
                            )}
                          >
                            Plus
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          {overflowEntries.map((entry) => (
                            <DropdownMenuItem
                              key={entry.path}
                              asChild
                              className="cursor-pointer"
                            >
                              <Link to={entry.path}>{entry.title}</Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}

              <div className="hidden lg:block mb-4.5">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={currentProject?.defaultRoute ?? defaultRoute}
                        className="hover:text-primary font-medium"
                      >
                        {currentProject?.label ?? "Dashboard"}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {sectionLabel && (
                      <>
                        <BreadcrumbSeparator>
                          <ChevronRight className="size-3.5 opacity-40" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          <BreadcrumbLink className="hover:text-primary font-medium">
                            {sectionLabel}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </>
                    )}
                    <BreadcrumbSeparator>
                      <ChevronRight className="size-3.5 opacity-40" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-bold text-foreground tracking-tight">
                        {title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <AppRoutes />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
