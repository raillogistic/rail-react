/**
 * @file MainApp.tsx
 * @description Fenêtre principale partagée de l'application (Global Layout Redesign).
 * Établit une distinction visuelle nette entre la barre latérale flottante (navigation)
 * et l'espace de travail principal (main content card) reposant sur un canevas neutre épuré.
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

/**
 * Shell principal de l'application partagée pour les écrans authentifiés.
 * Fournit le canevas de fond unifié et héberge la barre latérale flottante
 * ainsi que le panneau de contenu principal distinct.
 *
 * @returns {React.ReactElement}
 */
export const MainApp: React.FC = () => {
  const {
    showAlert,
    lastError,
    showOfflineAlert,
    hideOfflineAlert,
    retryConnection,
  } = useOfflineAlert();

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

  return (
    <SidebarProvider
      defaultOpen={true}
      className="h-svh w-full flex-col overflow-hidden bg-background text-foreground"
    >
      <OfflineAlert
        isVisible={showAlert}
        onRetry={retryConnection}
        onDismiss={hideOfflineAlert}
        message={lastError || undefined}
      />
      <div className="flex flex-1 min-h-0 min-w-0 w-full overflow-hidden">
        <AppSidebar />
        <AppContent />
      </div>
    </SidebarProvider>
  );
};

export default MainApp;
