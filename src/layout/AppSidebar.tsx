import { Link } from "react-router-dom";
import { NavMain } from "@/lib/components/nav-main";
import { NavUser } from "@/lib/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/lib/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import LogoMark from "@/assets/logos/logo.png";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarCollapseMode, layout } = useTheme();
  const collapsibleMode = sidebarCollapseMode ?? "offcanvas";

  return (
    <Sidebar
      variant="sidebar"
      collapsible={collapsibleMode}
      {...props}
      className={cn(
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        layout === "mixed" && "top-[3.5rem] h-[calc(100svh-3.5rem)]"
      )}
    >
      <SidebarHeader>
        <Link
          to="/"
          className={cn(
            "group flex items-center shadow-sm gap-3 rounded-xl border border-sidebar-border/70 bg-card/95 px-3 py-2 text-card-foreground transition hover:border-sidebar-ring hover:shadow-lg",
            "group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl p-1 transition-[border-radius] duration-200 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:bg-transparent">
            <img
              width={64}
              height={64}
              src={LogoMark}
              alt="RAIL LOGISTIC"
              className="h-full w-full rounded-lg object-contain transition-[border-radius] duration-200 group-data-[collapsible=icon]:rounded-full"
            />
          </span>
          <div
            className={cn(
              "flex flex-col text-left transition-all duration-200",
              "group-data-[collapsible=icon]:opacity-0",
              "group-data-[collapsible=icon]:pointer-events-none",
              "group-data-[collapsible=icon]:-translate-x-4"
            )}
          >
            <span className="text-sm font-semibold tracking-tight text-card-foreground">
              RAIL LOGISTIC
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Maintenance & Planning
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
