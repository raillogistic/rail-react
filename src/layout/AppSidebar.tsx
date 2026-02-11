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
  TooltipProvider,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/assets/logos/logo.png";
import { Badge } from "@/lib/components/ui/badge";
import { Sparkles, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";

interface MousePosition {
  x: number;
  y: number;
}

/**
 * High-fidelity App Sidebar with interactive effects and modern layout.
 * Anchors main navigation and system status.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { layout } = useTheme();
  const { state } = useSidebar();
  const collapsibleMode: React.ComponentProps<typeof Sidebar>["collapsible"] =
    "offcanvas";
  const isCollapsed = state === "collapsed";
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });

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
        "overflow-hidden border-r border-sidebar-border/40 bg-sidebar text-sidebar-foreground transition-all duration-500",
        layout === "mixed" && "top-14 h-[calc(100svh-3.5rem)]",
      )}
    >
      {/* Premium Glass & Mesh Background */}
      <div className="absolute inset-0 z-0 bg-background/50 backdrop-blur-xl" />
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--sidebar-foreground) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 24px",
        }}
      />

      {/* Interactive spotlight following the mouse */}
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
                alt="RAIL"
                className="h-full w-full object-contain transition-transform duration-700 group-hover:rotate-[15deg]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col transition-all duration-500 group-hover:translate-x-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tighter text-foreground leading-none">
                    RAIL LOGISTIC
                  </span>
                  <Badge className="h-3.5 px-1 py-0 text-[8px] font-black uppercase bg-primary/10 text-primary border-none">
                    PRO
                  </Badge>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
                  System Hub
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
                          Système Connecté
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          Latence: 24ms • Région: EU-WEST
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
        <NavMain />

        {!isCollapsed && (
          <div className="px-4 py-4 mt-10">
            <Card className="rounded-2xl border-none bg-primary/5 relative overflow-hidden group/card">
              <div className="absolute -right-2 -bottom-2 opacity-5 transition-transform duration-700 group-hover/card:scale-125 group-hover/card:rotate-12">
                <ShieldCheck className="size-20" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                    Support Prioritaire
                  </span>
                </div>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Besoin d'aide ? Nos experts sont disponibles 24/7 pour vous
                  accompagner.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary hover:no-underline flex items-center gap-1"
                >
                  Contacter l'aide <ArrowRight className="size-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
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
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
