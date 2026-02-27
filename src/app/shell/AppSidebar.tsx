import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { NavMain } from "@/widgets/navigation/nav-main";
import { NavUser } from "@/widgets/navigation/nav-user";
import { NAVIGATION_LINKS } from "@/app/router/navigation";
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
import { BRANDING, SYSTEM_STATUS } from "@/projects/branding";
import LogoMark from "@/shared/assets/legacy-assets/logos/logo.png";
import { Badge } from "@/shared/ui/kit/badge";
import { Zap } from "lucide-react";
import { useAuthContext } from "@/features/auth/context";

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Authenticated app sidebar.
 * Hosts brand identity, navigation tree, and account footer.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { layout } = useTheme();
  const { state } = useSidebar();
  const { user, logout } = useAuthContext();
  const isCollapsed = state === "collapsed";
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!sidebarRef.current) {
        return;
      }
      const rect = sidebarRef.current.getBoundingClientRect();
      setMousePos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Sidebar
      ref={sidebarRef}
      variant="sidebar"
      collapsible="offcanvas"
      {...props}
      className={cn(
        "overflow-hidden border-r border-sidebar-border/40 bg-sidebar text-sidebar-foreground transition-all duration-500",
        layout === "mixed" && "top-14 h-[calc(100svh-3.5rem)]",
      )}
      style={
        {
          ...props.style,
          "--foreground": "var(--sidebar-foreground)",
          "--muted-foreground": "var(--sidebar-foreground)",
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 z-0 bg-background/10 backdrop-blur-xl" />
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--sidebar-foreground) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.05), transparent 60%)`,
        }}
      />

      <SidebarHeader className="relative z-10 p-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className={cn(
              "group flex items-center gap-3 rounded-2xl transition-all duration-500",
              isCollapsed ? "w-10 justify-center" : "w-full",
            )}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2 shadow-2xl ring-1 ring-primary/10 transition-all duration-500 group-hover:scale-110 group-hover:shadow-primary/20 group-hover:ring-primary/30 group-active:scale-95">
              <img
                src={LogoMark}
                alt={BRANDING.logoAlt}
                className="h-full w-full object-contain transition-transform duration-700 group-hover:rotate-[15deg]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col transition-all duration-500 group-hover:translate-x-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tighter text-foreground leading-none">
                    {BRANDING.productName}
                  </span>
                  <Badge className="h-3.5 px-1 py-0 text-[8px] font-black uppercase bg-primary/10 text-primary border-none">
                    {BRANDING.editionLabel}
                  </Badge>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
                  {BRANDING.hubLabel}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-700">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex h-8 w-8 cursor-help items-center justify-center rounded-xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm transition-all hover:bg-background/80 hover:border-primary/20 group/status">
                      <div className="relative h-2 w-2">
                        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40 opacity-75" />
                        <div className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-all group-hover/status:scale-125" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-background/95 backdrop-blur-2xl border-border/40 shadow-2xl p-3 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Zap className="size-4 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          {SYSTEM_STATUS.connectedLabel}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {SYSTEM_STATUS.latencyRegionLabel}
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

      <SidebarContent className="relative z-10 custom-scrollbar px-3 py-2 space-y-6">
        <NavMain navigationLinks={NAVIGATION_LINKS} />
      </SidebarContent>

      <SidebarFooter className="relative z-10 p-4">
        <div
          className={cn(
            "rounded-[1.25rem] transition-all duration-500",
            isCollapsed
              ? "p-0 bg-transparent"
              : "p-1 bg-muted/30 border border-border/20 backdrop-blur-md shadow-lg hover:shadow-xl hover:bg-muted/40 hover:border-primary/10",
          )}
        >
          <NavUser user={user} onLogout={logout} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
