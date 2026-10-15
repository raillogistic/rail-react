/**
 * @file MainApp.tsx
 * @description Fenêtre principale partagée de l'application (Main Window Redesign).
 * Remplace la boîte arrondie par un shell plein écran de bout en bout,
 * intégrant la barre latérale complète et la zone de contenu principale.
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
 * Héberge la barre latérale complète, l'en-tête et la zone de contenu.
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
