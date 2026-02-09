import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { NavMain } from "@/lib/components/nav-main";
import { NavUser } from "@/lib/components/nav-user";
import { CommandMenu } from "@/lib/components/command-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/lib/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/assets/logos/logo.png";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarCollapseMode, layout } = useTheme();
  const { state } = useSidebar();
  const collapsibleMode = sidebarCollapseMode ?? "offcanvas";
  const isCollapsed = state === "collapsed";
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Sidebar
      ref={sidebarRef}
      variant="sidebar"
      collapsible={collapsibleMode}
      {...props}
      className={cn(
        "relative overflow-hidden border-r border-sidebar-border/40 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl transition-all duration-300",
        layout === "mixed" && "top-[3.5rem] h-[calc(100svh-3.5rem)]",
      )}
    >
      {/* Interactive Spotlight Effect */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.03), transparent 40%)`
        }}
      />
      
      {/* Mesh Background Pattern */}
      <div className="absolute inset-0 z-[-1] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" 
           style={{ backgroundImage: 'radial-gradient(var(--sidebar-foreground) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      <SidebarHeader className="relative p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className={cn(
              "group flex items-center gap-3 rounded-2xl transition-all duration-300 ease-in-out",
              isCollapsed ? "w-10 justify-center" : "w-full",
            )}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-1.5 shadow-sm ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:ring-primary/20">
              <img
                src={LogoMark}
                alt="RAIL"
                className="h-full w-full object-contain transition-transform duration-500 group-hover:rotate-12"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col transition-all duration-300 group-hover:translate-x-0.5">
                <span className="text-sm font-bold tracking-tight text-foreground/90">
                  RAIL LOGISTIC
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
                  Maintenance & Planning
                </span>
              </div>
            )}
          </Link>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 shrink-0">
              <CommandMenu />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-8 w-8 cursor-help items-center justify-center rounded-full border border-sidebar-border/40 bg-background/50 backdrop-blur-sm shadow-xs transition-colors hover:bg-background/80">
                    <div className="relative h-2 w-2">
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/50 opacity-75" />
                      <div className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-sidebar/95 backdrop-blur-md">
                  <p className="text-[11px] font-semibold">Système en ligne</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-2 py-2">
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className={cn(
          "rounded-2xl border border-sidebar-border/40 bg-sidebar-accent/30 p-1 backdrop-blur-sm transition-all duration-300",
          isCollapsed ? "p-0 bg-transparent border-transparent" : "shadow-sm hover:shadow-md hover:bg-sidebar-accent/50"
        )}>
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
