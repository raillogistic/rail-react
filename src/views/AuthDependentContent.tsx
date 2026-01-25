import React from "react";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { useAuthContext } from "@/views/providers/AuthProvider";
import { RouteBuilder } from "@/views/routes/RouteBuilder";
import { Toaster } from "@/lib/components/ui/sonner";
import { 
  ThemeKey, 
  ThemeMode, 
  Layout, 
  SidebarCollapseMode, 
  FontSize, 
  FontFamily 
} from "@/lib/theme";

export const AuthDependentContent: React.FC = () => {
  const { user } = useAuthContext();
  const storageKey = user ? `vite-ui-theme-${user.id}` : "vite-ui-theme";

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
    </ThemeProvider>
  );
};
