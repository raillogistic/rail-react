import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/shared/ui/kit/separator";
import { cn } from "@/shared/utils";
import { BRANDING } from "@/shared/config/branding";
import { useRouteAccess } from "@/app/router/routeAccess";
import {
  getActiveProjectNavigationPath,
  getProjectNavigationEntries,
  groupProjectNavigationEntries,
} from "@/app/shell/navigation-patterns";
import { IconPlus } from "@tabler/icons-react";
import application from '@rail/application';
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/kit/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { useSidebar } from "@/shared/ui/kit/sidebar";
import { NavUser } from "@/widgets/navigation/nav-user";
import { useAuthContext } from "@/features/auth/context";
import { NavNotifications } from "@/widgets/navigation/nav-notifications";
import { ModeToggle } from "@/shared/ui/kit/themeToggle";
import { useTheme } from "@/shared/ui/theme";

type AppRailListProps = {
  className?: string;
};

import { NewDocumentMenu } from "./AppSidebar";
export { NewDocumentMenu };

export function AppRailList({ className }: AppRailListProps) {
  const location = useLocation();
  const { isMobile } = useSidebar();
  const { navigationPattern } = useTheme();
  const { appRailItems, currentProjectId, navigationLinks } = useRouteAccess();
  const [openFlyoutProjectId, setOpenFlyoutProjectId] = useState<string | null>(
    null,
  );
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openFlyout = (projectId: string) => {
    clearCloseTimeout();
    setOpenFlyoutProjectId(projectId);
  };

  const scheduleCloseFlyout = (projectId: string) => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenFlyoutProjectId((current) =>
        current === projectId ? null : current,
      );
    }, 120);
  };

  useEffect(
    () => () => {
      clearCloseTimeout();
    },
    [],
  );

  useEffect(() => {
    setOpenFlyoutProjectId(null);
  }, [location.pathname]);

  return (
    <nav
      className={cn("flex w-full flex-col items-center gap-2 px-1", className)}
      aria-label="Applications"
    >
      {appRailItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.projectId === currentProjectId;
        const itemNavigationLinks = navigationLinks.filter(
          (section) => section.projectId === item.projectId,
        );
        const itemNavigationEntries =
          getProjectNavigationEntries(itemNavigationLinks);
        const navigationGroups = groupProjectNavigationEntries(
          itemNavigationEntries,
        );
        const activeNavigationPath = getActiveProjectNavigationPath(
          location.pathname,
          itemNavigationEntries,
        );
        const firstNavigationPath =
          itemNavigationEntries[0]?.path ?? item.defaultRoute;
        const shouldUseFlyout =
          navigationPattern === "rail-flyout" &&
          !isMobile &&
          itemNavigationEntries.length > 1;
        const itemBody = (
          <>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[0.85rem] font-normal transition-colors duration-200",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-transparent group-hover:bg-primary/10 group-hover:text-foreground text-muted-foreground",
              )}
            >
              {Icon ? (
                <Icon className="h-6 w-6 shrink-0" />
              ) : null}
            </div>
            <span className="w-full px-0.5 text-center text-xs font-bold leading-tight">
              {item.shortLabel ?? item.label}
            </span>
          </>
        );

        if (shouldUseFlyout) {
          return (
            <Popover
              key={item.projectId}
              open={openFlyoutProjectId === item.projectId}
              onOpenChange={(open) => {
                clearCloseTimeout();
                setOpenFlyoutProjectId(open ? item.projectId : null);
              }}
            >
              <PopoverTrigger asChild>
                <Link
                  to={firstNavigationPath}
                  className={cn(
                    "group flex w-full flex-col items-center justify-center gap-2 py-1 transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                  )}
                  onMouseEnter={() => openFlyout(item.projectId)}
                  onMouseLeave={() => scheduleCloseFlyout(item.projectId)}
                  onFocus={() => openFlyout(item.projectId)}
                  onBlur={() => scheduleCloseFlyout(item.projectId)}
                  onClick={() => {
                    clearCloseTimeout();
                    setOpenFlyoutProjectId(null);
                  }}
                >
                  {itemBody}
                </Link>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="right"
                sideOffset={12}
                className="w-64 p-1"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onMouseEnter={() => openFlyout(item.projectId)}
                onMouseLeave={() => scheduleCloseFlyout(item.projectId)}
              >
                {navigationGroups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <div className="-mx-1 my-1 h-px bg-border" />}
                    <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {group.label}
                    </div>
                    {group.entries.map((entry) => {
                      const EntryIcon = entry.icon;
                      return (
                        <Link
                          key={entry.path}
                          className={cn(
                            "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                            activeNavigationPath === entry.path
                              ? "bg-primary/5 text-primary"
                              : "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                          to={entry.path}
                          onClick={() => {
                            clearCloseTimeout();
                            setOpenFlyoutProjectId(null);
                          }}
                        >
                          {EntryIcon && (
                            <EntryIcon className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{entry.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Tooltip key={item.projectId}>
            <TooltipTrigger asChild>
              <Link
                to={item.defaultRoute}
                className={cn(
                  "group flex w-full flex-col items-center justify-center gap-2 py-1 transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {itemBody}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function AppRail() {
  const { currentProjectId } = useRouteAccess();
  const { user, logout } = useAuthContext();
  const shouldShowCreateMenu = true;

  return (
    <aside
      className="hidden h-full w-[var(--app-rail-width)] shrink-0 flex-col items-center bg-transparent md:sticky md:top-0 md:flex"
      aria-label="Navigation des applications"
    >
      {shouldShowCreateMenu && (
        <div className="flex w-full items-center justify-center pt-4 pb-2">
          <NewDocumentMenu compact={true} />
        </div>
      )}

      <div className="flex w-full flex-1 flex-col items-center overflow-y-auto py-4">
        <AppRailList />
      </div>

      <div className="mt-auto flex w-full flex-col items-center justify-center gap-3 py-4 pb-4">
        <NavNotifications />
        <ModeToggle />
        <NavUser user={user} onLogout={logout} isRail />
      </div>
    </aside>
  );
}
