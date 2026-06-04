import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { NavMain } from "@/widgets/navigation/nav-main";
import { NavUser } from "@/widgets/navigation/nav-user";
import { useRouteAccess } from "@/app/router/routeAccess";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/shared/ui/kit/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import { useTheme } from "@/shared/ui/theme";
import { BRANDING, SYSTEM_STATUS } from "@/shared/config/branding";
import LogoMark from "@/shared/assets/legacy-assets/logos/logo.png";
import { Badge } from "@/shared/ui/kit/badge";
import { Zap } from "lucide-react";
import { useAuthContext } from "@/features/auth/context";

/**
 * Interface représentant les coordonnées de la position de la souris.
 */
interface mouse_position {
  x: number;
  y: number;
}

/**
 * @file AppSidebar.tsx
 * @description Composant de barre latérale principale pour l'application authentifiée.
 * Il affiche l'identité de la marque, l'arbre de navigation et les informations utilisateur en bas.
 * Intègre un effet visuel interactif réagissant aux mouvements de la souris.
 *
 * @param props Propriétés héritées du composant Sidebar de shadcn.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { layout } = useTheme();
  const { state } = useSidebar();
  const { user, logout } = useAuthContext();
  const { navigationLinks } = useRouteAccess();
  const is_collapsed = state === "collapsed";
  const sidebar_ref = useRef<HTMLDivElement>(null);
  const [mouse_pos, set_mouse_pos] = useState<mouse_position>({ x: 0, y: 0 });

  useEffect(() => {
    /**
     * Gère le déplacement de la souris pour calculer sa position relative par rapport à la barre latérale.
     * @param event Événement MouseEvent standard.
     */
    const handle_mouse_move = (event: MouseEvent) => {
      if (!sidebar_ref.current) {
        return;
      }
      const rect = sidebar_ref.current.getBoundingClientRect();
      set_mouse_pos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    window.addEventListener("mousemove", handle_mouse_move);
    return () => window.removeEventListener("mousemove", handle_mouse_move);
  }, []);

  return (
    <Sidebar
      ref={sidebar_ref}
      variant="sidebar"
      collapsible="offcanvas"
      {...props}
      className={cn(
        "overflow-hidden border-r border-neutral-200/20 dark:border-zinc-800/40 bg-sidebar text-sidebar-foreground transition-all duration-300",
        layout === "mixed" && "top-14 h-[calc(100svh-3.5rem)]",
      )}
      style={
        {
          ...props.style,
          "--sidebar-background": "var(--background)",
          "--sidebar-border": "var(--border)",
          "--foreground": "var(--sidebar-foreground)",
          "--muted-foreground": "var(--sidebar-foreground)",
        } as React.CSSProperties
      }
    >
      {/* Fond en verre dépoli et grille de points discrets */}
      <div className="absolute inset-0 z-0 bg-background/5 backdrop-blur-xl transition-all" />
      <div
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--sidebar-foreground) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 24px",
        }}
      />
      {/* Halo lumineux dynamique qui suit le curseur de la souris (sans ombres) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(350px circle at ${mouse_pos.x}px ${mouse_pos.y}px, rgba(var(--primary-rgb), 0.04), transparent 70%)`,
        }}
      />

      <SidebarHeader className="relative z-10 p-4 pb-2 border-b border-neutral-200/10 dark:border-zinc-800/30">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className={cn(
              "group flex items-center gap-3",
              is_collapsed ? "w-10 justify-center" : "w-full",
            )}
          >
            {/* Logo de l'application avec un style premium et micro-zoom au survol (pas d'ombre portée) */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-zinc-900 border border-neutral-200/50 dark:border-zinc-800/80 transition-all duration-300 group-hover:border-primary/50">
              <img
                src={LogoMark}
                alt={BRANDING.logoAlt}
                className="h-5 w-5 object-contain brightness-0 dark:brightness-100 dark:invert-0 dark:group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {!is_collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-foreground leading-none group-hover:text-primary transition-colors">
                    {BRANDING.productName}
                  </span>
                  <Badge className="h-4 px-1 py-0 text-[9px] font-extrabold uppercase bg-primary/10 text-primary border-none shadow-none">
                    {BRANDING.editionLabel}
                  </Badge>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">
                  {BRANDING.hubLabel || "LOGISTIQUE"}
                </span>
              </div>
            )}
          </Link>

          {!is_collapsed && (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {/* Indicateur de statut réseau interactif avec animation pulse soft, sans ombre */}
                    <div className="flex h-7 w-7 cursor-help items-center justify-center rounded-lg border border-neutral-200/40 bg-neutral-100/50 dark:border-zinc-800/40 dark:bg-zinc-800/50 hover:bg-neutral-200/50 dark:hover:bg-zinc-700/50 transition-colors duration-200">
                      <div className="relative h-2 w-2">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                        <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-sidebar border border-neutral-200/30 dark:border-zinc-800/50 shadow-none backdrop-blur-xl rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Zap className="size-4 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                          {SYSTEM_STATUS.connectedLabel}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {SYSTEM_STATUS.latencyRegionLabel || "Serveur Actif"}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 custom-scrollbar px-2 py-3 space-y-3">
        <NavMain navigationLinks={navigationLinks} />
      </SidebarContent>

      <SidebarFooter className="relative z-10 p-3 border-t border-neutral-200/10 dark:border-zinc-800/30">
        {/* Conteneur utilisateur à l'aspect verre poli sans ombres */}
        <div
          className={cn(
            "transition-all duration-300 rounded-xl",
            is_collapsed
              ? "p-0 bg-transparent"
              : "p-1.5 bg-neutral-100/30 dark:bg-zinc-800/20 border border-neutral-200/30 dark:border-zinc-800/40 backdrop-blur-md hover:bg-neutral-100/50 dark:hover:bg-zinc-800/35 hover:border-primary/25",
          )}
        >
          <NavUser user={user} onLogout={logout} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
