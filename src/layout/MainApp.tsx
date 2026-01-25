import React, { useEffect } from "react";
import { OfflineAlert, useOfflineAlert } from "@/lib/components/OfflineAlert";
import { SidebarProvider } from "@/lib/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import AppContent, { AppRoutes } from "./AppContent";
import { useTheme } from "@/lib/theme";
import { AppNavbar } from "./AppNavbar";

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
  const { layout } = useTheme();

  useEffect(() => {
    const handleBackendOffline = (event: CustomEvent) => {
      showOfflineAlert(event.detail.message);
    };

    window.addEventListener(
      "backend-offline",
      handleBackendOffline as EventListener
    );

    return () => {
      window.removeEventListener(
        "backend-offline",
        handleBackendOffline as EventListener
      );
    };
  }, [showOfflineAlert]);

  if (layout === "horizontal") {
    return (
      <>
        <OfflineAlert
          isVisible={showAlert}
          onRetry={retryConnection}
          onDismiss={hideOfflineAlert}
          message={lastError || undefined}
        />
        <div className="flex min-h-screen flex-col w-full bg-background">
          <AppNavbar />
          <main className="flex-1">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-8">
              <div className="px-4 lg:px-6">
                <AppRoutes />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (layout === "mixed") {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 70)",
            "--header-height": "calc(var(--spacing) * 13)",
          } as React.CSSProperties
        }
      >
        <OfflineAlert
          isVisible={showAlert}
          onRetry={retryConnection}
          onDismiss={hideOfflineAlert}
          message={lastError || undefined}
        />
        <div className="flex min-h-screen flex-col w-full bg-background">
          <AppNavbar />
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-8">
                <div className="px-4 lg:px-6">
                  <AppRoutes />
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 70)",
          "--header-height": "calc(var(--spacing) * 13)",
        } as React.CSSProperties
      }
    >
      <OfflineAlert
        isVisible={showAlert}
        onRetry={retryConnection}
        onDismiss={hideOfflineAlert}
        message={lastError || undefined}
      />
      <AppSidebar />
      <AppContent />
    </SidebarProvider>
  );
};
