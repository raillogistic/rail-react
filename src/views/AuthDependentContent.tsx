import React from "react";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { useAuthContext } from "@/auth/context";
import { RouteBuilder } from "@/views/routes/RouteBuilder";
import { Toaster } from "@/lib/components/ui/sonner";
import { ActivityTimeoutModal } from "@/auth/components/ActivityTimeoutModal";
import { useMetadataWarmup } from "@/lib/metadata/useMetadataWarmup";
import { MetadataWarmupIndicator } from "@/lib/metadata/MetadataWarmupIndicator";
import {
  ThemeKey,
  ThemeMode,
  Layout,
  SidebarCollapseMode,
  FontSize,
  FontFamily
} from "@/lib/theme";

export const AuthDependentContent: React.FC = () => {
  const { user, isAuthenticated } = useAuthContext();
  const storageKey = user ? `vite-ui-theme-${user.id}` : "vite-ui-theme";
  const userKey = user?.id ? String(user.id) : null;

  const { warming } = useMetadataWarmup({ enabled: isAuthenticated, userKey });

  // Extract settings with fallbacks
  const userSettings = user?.settings;

  return (
    <ThemeProvider
      defaultTheme={(userSettings?.theme as ThemeKey) || "default"}
      defaultMode={(userSettings?.mode as ThemeMode) || "light"}
      defaultLayout={(userSettings?.layout as Layout) || "vertical"}
      defaultSidebarCollapseMode={(userSettings?.sidebar_collapse_mode as SidebarCollapseMode) || "offcanvas"}
      defaultFontSize={(userSettings?.font_size as FontSize) || "md"}
      defaultFontFamily={(userSettings?.font_family as FontFamily) || "inter"}
      storageKey={storageKey}
    >
      <RouteBuilder />
      <Toaster />
      {isAuthenticated && <ActivityTimeoutModal />}
      <MetadataWarmupIndicator active={warming} />
    </ThemeProvider>
  );
};
