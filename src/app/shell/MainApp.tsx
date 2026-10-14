/**
 * @file MainApp.tsx
 * @description Layout principal de l'application.
 * Modifié pour supprimer la surcharge de --sidebar-width afin d'utiliser la valeur globale définie dans sidebar.tsx.
 *
 * @module app/shell/MainApp
 */
import React, { useEffect } from "react";
import {
  OfflineAlert,
  useOfflineAlert,
} from "@/widgets/components/OfflineAlert";
import { SidebarProvider } from "@/shared/ui/kit/sidebar";
import { AppSidebar } from "./AppSidebar";
import AppContent from "./AppContent";
import { AppRail } from "./AppRail";
import { useLocation } from "react-router-dom";
import { findNavigationByPath } from "@/app/router/navigation";
import { useRouteAccess } from "@/app/router/routeAccess";
import { useTheme } from "@/shared/ui/theme";
import { cn } from "@/shared/utils";

/**
 * Shell layout used for all authenticated screens.
 *
 * Hosts the sidebar, header, and the main content outlet. Also wires the
 * offline banner to backend connectivity events.
 */
export const MainApp: React.FC = () => {
  const {
    showAlert,
    lastError,
    showOfflineAlert,
    hideOfflineAlert,
    retryConnection,
  } = useOfflineAlert();

  const location = useLocation();
  const { sidebarMode } = useTheme();
  const { defaultRoute, navigationLinks, projectNavigationLinks } =
    useRouteAccess();
  const currentNavigation = findNavigationByPath(location.pathname, navigationLinks);
  const title = currentNavigation?.page.title ?? "Navigation";
  const sectionLabel = currentNavigation?.section.label;

  useEffect(() => {
    const handleBackendOffline = (event: CustomEvent) => {
      showOfflineAlert(event.detail.message);
    };

    window.addEventListener(
      "backend-offline",
      handleBackendOffline as EventListener,
    );

    return () => {
      window.removeEventListener(
        "backend-offline",
        handleBackendOffline as EventListener,
      );
    };
  }, [showOfflineAlert]);

  const sidebarProviderStyle = {
    "--header-height": "calc(var(--spacing) * 13)",
    "--app-rail-width": "4.5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider
      style={sidebarProviderStyle}
      className="flex-col h-svh overflow-hidden bg-muted dark:bg-[#09090b]"
    >
      <OfflineAlert
        isVisible={showAlert}
        onRetry={retryConnection}
        onDismiss={hideOfflineAlert}
        message={lastError || undefined}
      />
      <div className="flex flex-1 min-h-0 min-w-0 py-6">
        {sidebarMode === "icons" && <AppRail />}
        <div
          data-slot="shell-card"
          className={cn(
            "flex flex-1 min-h-0 min-w-0 overflow-hidden bg-background border border-border/60 rounded-2xl shadow-md",
            sidebarMode === "icons" ? "mr-6" : "mx-6",
          )}
        >
          <AppSidebar />
          <AppContent />
        </div>
      </div>
    </SidebarProvider>
  );
};
